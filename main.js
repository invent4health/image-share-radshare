import { app, BrowserWindow, BrowserView, clipboard, dialog, globalShortcut, ipcMain, Menu, nativeImage, screen, shell } from 'electron';
import crypto from 'crypto';
import { exec, execFile } from 'child_process';
import fs from 'fs';
import http from 'http';
import https from 'https';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import QRCode from 'qrcode';
import { readMetadataFromZip } from './lib/dicom-metadata.js';
import { queryMwlWorklist } from './lib/findscu-mwl.js';
import { applyAssignedMetadataToDicomFiles } from './lib/dicom-modify.js';
import { downloadHdscStudyFromPreview, injectHdscSavePickerHook, isHdscPortalUrl } from './lib/hdsc-download.js';
import { downloadGoogleDriveToFile, resolveHdscFallbackDownload, resolvePortalFallbackDownload } from './lib/hdsc-fallback-sources.js';
import { downloadJivexStudyWithSeleniumInPreview } from './lib/jivex-selenium.js';
import { detectJivexPasswordFormat, isJivexPortalUrl } from './lib/jivex-download.js';
import {
    applyAppUpdate,
    checkForAppUpdate,
    isAppRootWritable,
    readLocalPackageVersion,
} from './lib/app-update.js';
import {
    daysSinceEpoch,
    formatMac,
    normalizeLicenseKey,
    validateLicenseKey,
} from './lib/license-crypto.js';

const APP_DISPLAY_NAME = 'Cognizance Health';

// Keep userData path stable across npm start / npm run dev / updates.
try { app.setName(APP_DISPLAY_NAME); } catch { }
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('remote-debugging-port', '9222');

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const CHROME_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HDSC_PARTITION = 'persist:radshare-hdsc';
const HDSC_VIEW_WIDTH = 1280;
const HDSC_VIEW_HEIGHT = 900;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

let mainWindow = null;
let previewView = null;
/** Dedicated warm HDSC browser — persistent cache/cookies like Chrome */
let hdscView = null;
let hdscViewIsVisible = false;
let overlaySuspended = false;
let hidePreviewForAutomation = false;
let webPreviewEnabled = false;
let appLanguage = 'en';

function getLanguageFilePath() {
    return path.join(app.getPath('userData'), 'app-language.json');
}

function loadAppLanguage() {
    try {
        const raw = fs.readFileSync(getLanguageFilePath(), 'utf8');
        const data = JSON.parse(raw);
        if (data?.lang === 'de' || data?.lang === 'en') appLanguage = data.lang;
    } catch { /* default en */ }
}

function saveAppLanguage(lang) {
    appLanguage = lang === 'de' ? 'de' : 'en';
    try {
        fs.writeFileSync(getLanguageFilePath(), JSON.stringify({ lang: appLanguage }), 'utf8');
    } catch (e) {
        console.error('Failed to save app language', e);
    }
}

/** Set COGNIZANCE_LICENSE_SECRET in production. Set COGNIZANCE_SKIP_LICENSE=1 to bypass. */

function getLicenseFilePath() {
    return path.join(app.getPath('userData'), 'license.json');
}

function getLegacyLicensePaths() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return [
        path.join(appData, 'automation-toolv2', 'license.json'),
        path.join(appData, APP_DISPLAY_NAME, 'license.json'),
    ];
}

function migrateLicenseRecordIfNeeded() {
    const target = getLicenseFilePath();
    try {
        if (fs.existsSync(target)) {
            const current = JSON.parse(fs.readFileSync(target, 'utf8'));
            if (current?.key) return;
        }
    } catch { /* fall through */ }

    for (const legacyPath of getLegacyLicensePaths()) {
        if (path.resolve(legacyPath) === path.resolve(target)) continue;
        try {
            if (!fs.existsSync(legacyPath)) continue;
            const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
            if (!legacy?.key) continue;
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, JSON.stringify(legacy, null, 2), 'utf8');
            return;
        } catch { /* try next legacy path */ }
    }
}

function isLicenseRequired() {
    if (process.env.COGNIZANCE_SKIP_LICENSE === '1') return false;
    return true;
}

const VIRTUAL_MAC_OUIS = new Set([
    '005056', // VMware
    '000C29', // VMware
    '001C14', // VMware
    '000569', // VMware
    '080027', // VirtualBox
    '00155D', // Hyper-V
    '525400', // QEMU/KVM
    '00163E', // Xen
]);

const VIRTUAL_IFACE_PATTERNS = /vmware|virtualbox|vbox|vethernet|hyper-v|virtual|loopback|wsl|docker|npcap|bluetooth|vpn|tap-/i;

function isVirtualMac(mac) {
    const hex = String(mac || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (hex.length !== 12) return true;
    if (hex === '000000000000') return true;
    return VIRTUAL_MAC_OUIS.has(hex.slice(0, 6));
}

function isVirtualInterfaceName(name) {
    return VIRTUAL_IFACE_PATTERNS.test(String(name || ''));
}

function collectPhysicalNetworkCandidates() {
    const nets = os.networkInterfaces();
    const candidates = [];
    for (const name of Object.keys(nets)) {
        if (isVirtualInterfaceName(name)) continue;
        for (const net of nets[name] || []) {
            if (!net?.mac || net.internal || net.mac === '00:00:00:00:00:00') continue;
            if (isVirtualMac(net.mac)) continue;
            const family = net.family;
            const isIpv4 = family === 'IPv4' || family === 4;
            const hasIpv4 = isIpv4 && net.address && !net.address.startsWith('169.254.');
            candidates.push({ mac: net.mac, name, hasIpv4 });
        }
    }
    return candidates;
}

function getAllMachineMacAddresses() {
    const seen = new Set();
    const macs = [];
    const sorted = collectPhysicalNetworkCandidates().sort((a, b) => {
        if (a.hasIpv4 !== b.hasIpv4) return Number(b.hasIpv4) - Number(a.hasIpv4);
        return a.name.localeCompare(b.name);
    });
    for (const candidate of sorted) {
        const key = candidate.mac.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        macs.push(candidate.mac);
    }
    return macs;
}

function getMachineMacAddress() {
    return getAllMachineMacAddresses()[0] || null;
}

function validateLicenseForMachine(rawKey, preferredMacHex) {
    const tried = new Set();
    const tryMac = (mac) => {
        const normalized = String(mac || '').toUpperCase();
        if (!normalized || tried.has(normalized)) return null;
        tried.add(normalized);
        const result = validateLicenseKey(rawKey, mac);
        if (result.valid) return { ...result, macAddress: mac };
        return null;
    };

    if (preferredMacHex) {
        const preferredMac = formatMac(preferredMacHex);
        const preferredHit = tryMac(preferredMac);
        if (preferredHit) return preferredHit;
    }

    const macs = getAllMachineMacAddresses();
    if (!macs.length) {
        return { ...validateLicenseKey(rawKey, ''), macAddress: null };
    }
    for (const mac of macs) {
        const hit = tryMac(mac);
        if (hit) return hit;
    }
    return { valid: false, reason: 'invalid_key', macAddress: getMachineMacAddress() };
}

function readLicenseRecord() {
    try {
        const raw = fs.readFileSync(getLicenseFilePath(), 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function writeLicenseRecord(record) {
    fs.writeFileSync(getLicenseFilePath(), JSON.stringify(record, null, 2), 'utf8');
}

function isClockRollback(lastSeenDay, today = daysSinceEpoch()) {
    const seen = Number(lastSeenDay);
    return Number.isFinite(seen) && today < seen;
}

function touchLastSeenDay(rec, today = daysSinceEpoch()) {
    if (!rec?.key) return rec;
    const prev = Number(rec.lastSeenDay);
    const next = Number.isFinite(prev) ? Math.max(prev, today) : today;
    if (next === prev) return rec;
    const updated = { ...rec, lastSeenDay: next };
    writeLicenseRecord(updated);
    return updated;
}

function getLicenseExpiresAtMs(rec, result) {
    if (rec?.expiresAt) {
        const ms = Date.parse(rec.expiresAt);
        if (Number.isFinite(ms)) return ms;
    }
    if (rec?.activatedAt && result?.expiryDay != null) {
        const activatedMs = Date.parse(rec.activatedAt);
        if (Number.isFinite(activatedMs)) {
            const activationDay = daysSinceEpoch(new Date(activatedMs));
            const daysValid = Math.max(1, result.expiryDay - activationDay);
            return activatedMs + daysValid * 86400000;
        }
    }
    return (result.expiryDay + 1) * 86400000;
}

function getLicenseTimeStatus(rec, result) {
    const expiresAtMs = getLicenseExpiresAtMs(rec, result);
    const msLeft = expiresAtMs - Date.now();
    const expired = msLeft <= 0;
    const hoursRemaining = expired ? 0 : Math.max(1, Math.ceil(msLeft / 3600000));
    const daysRemaining = expired ? 0 : Math.max(1, Math.ceil(msLeft / 86400000));
    return {
        expired,
        expiresAtMs,
        msLeft,
        hoursRemaining,
        daysRemaining,
        expiresAt: new Date(expiresAtMs).toISOString(),
    };
}

function buildActivatedLicenseState(rec, result, mac) {
    const timeStatus = getLicenseTimeStatus(rec, result);
    if (timeStatus.expired) {
        return {
            activated: false,
            expired: true,
            daysRemaining: 0,
            hoursRemaining: 0,
            expiryDay: result.expiryDay,
            expiryDate: result.expiryDate,
            expiresAt: timeStatus.expiresAt,
            macAddress: result.macAddress || mac,
            macHex: result.macHex,
        };
    }

    touchLastSeenDay(rec, daysSinceEpoch());

    return {
        activated: true,
        expired: false,
        daysRemaining: timeStatus.daysRemaining,
        hoursRemaining: timeStatus.hoursRemaining,
        expiryDay: result.expiryDay,
        expiryDate: result.expiryDate,
        expiresAt: timeStatus.expiresAt,
        macAddress: result.macAddress || mac,
        macHex: result.macHex,
    };
}

function licenseGuardResponse() {
    if (!isLicenseRequired()) return null;
    const state = evaluateLicenseRecord();
    if (state.activated && !state.expired && !state.clockTampered) return null;
    if (state.clockTampered) {
        return {
            ok: false,
            error: 'clock_tampered',
            reason: 'System clock tampering detected',
        };
    }
    return {
        ok: false,
        error: 'license_expired',
        reason: 'License has expired',
    };
}

function evaluateLicenseRecord(rec = readLicenseRecord()) {
    if (!rec?.key) {
        return {
            activated: false,
            expired: false,
            daysRemaining: 0,
            expiryDate: null,
            macAddress: getMachineMacAddress(),
        };
    }

    const mac = getMachineMacAddress();
    const today = daysSinceEpoch();
    const result = validateLicenseForMachine(rec.key, rec.macHex);
    if (!result.valid) {
        const expiresAtMs = rec?.expiresAt ? Date.parse(rec.expiresAt) : NaN;
        if (rec?.key && Number.isFinite(expiresAtMs) && expiresAtMs > Date.now()) {
            return buildActivatedLicenseState(rec, {
                valid: true,
                expired: false,
                expiryDay: rec.expiryDay,
                expiryDate: rec.expiryDate,
                macHex: rec.macHex,
                macAddress: rec.macHex ? formatMac(rec.macHex) : mac,
            }, mac);
        }
        return {
            activated: false,
            expired: Number.isFinite(expiresAtMs) ? expiresAtMs <= Date.now() : Boolean(rec.expiryDay),
            daysRemaining: 0,
            expiryDate: rec.expiryDate || null,
            macAddress: result.macAddress || mac,
            invalid: true,
        };
    }

    if (isClockRollback(rec.lastSeenDay, today)) {
        return {
            activated: false,
            expired: true,
            clockTampered: true,
            daysRemaining: 0,
            expiryDay: result.expiryDay,
            expiryDate: result.expiryDate,
            macAddress: result.macAddress || mac,
            macHex: result.macHex,
        };
    }

    if (result.expired) {
        return {
            activated: false,
            expired: true,
            daysRemaining: 0,
            hoursRemaining: 0,
            expiryDay: result.expiryDay,
            expiryDate: result.expiryDate,
            macAddress: result.macAddress || mac,
            macHex: result.macHex,
        };
    }

    return buildActivatedLicenseState(rec, result, mac);
}

function isLicenseActivated() {
    if (!isLicenseRequired()) return true;
    const state = evaluateLicenseRecord();
    return state.activated;
}

function saveLicenseActivation(rawKey) {
    const key = normalizeLicenseKey(rawKey);
    if (!key) throw new Error('Invalid license key format');

    const today = daysSinceEpoch();
    const existing = readLicenseRecord();
    const prevLastSeen = Number(existing?.lastSeenDay);
    if (Number.isFinite(prevLastSeen) && today < prevLastSeen) {
        throw new Error('System clock tampering detected');
    }

    const result = validateLicenseForMachine(key);
    if (!result.valid) throw new Error('Invalid license key for this device');
    if (result.expired) throw new Error('License key has expired');

    const activationDay = daysSinceEpoch();
    const daysValid = Math.max(1, result.expiryDay - activationDay);
    const expiresAt = new Date(Date.now() + daysValid * 86400000).toISOString();

    writeLicenseRecord({
        key,
        macHex: result.macHex,
        expiryDay: result.expiryDay,
        expiryDate: result.expiryDate,
        activatedAt: new Date().toISOString(),
        expiresAt,
        daysValid,
        lastSeenDay: Number.isFinite(prevLastSeen) ? Math.max(prevLastSeen, today) : today,
    });
}

function getLicenseStatusPayload() {
    const required = isLicenseRequired();
    const macAddress = getMachineMacAddress();
    if (!required) {
        return { ok: true, required: false, activated: true, expired: false, daysRemaining: null, macAddress };
    }

    const rec = readLicenseRecord();
    if (!rec?.key) {
        return {
            ok: true,
            required: true,
            activated: false,
            expired: false,
            daysRemaining: 0,
            macAddress,
        };
    }

    const state = evaluateLicenseRecord(rec);
    return {
        ok: true,
        required: true,
        activated: state.activated,
        expired: Boolean(state.expired),
        daysRemaining: state.daysRemaining,
        hoursRemaining: state.hoursRemaining ?? null,
        expiryDate: state.expiryDate || null,
        expiresAt: state.expiresAt || null,
        macAddress: state.macAddress || macAddress,
        invalid: Boolean(state.invalid),
        clockTampered: Boolean(state.clockTampered),
    };
}
let lastDownloadedZipPath = null;
let lastDownloadedStudyUid = null;
/** Full MWL rows (with tags) — kept in main process to avoid huge IPC payloads */
const mwlStudyDetailCache = new Map();

function mwlStudyKey(row) {
    return `${row?.accessionNumber || ''}|${row?.patientId || ''}|${row?.patientName || ''}`;
}

function toMwlSummary(study) {
    return {
        patientName: study.patientName || '',
        patientId: study.patientId || '',
        accessionNumber: study.accessionNumber || '',
        modality: study.modality || '',
        description: study.description || '',
    };
}
const PREVIEW_ZOOM_FACTOR = 0.75;
const LEFT_PANEL_WIDTH = 480;
const DEFAULT_WINDOW_WIDTH = 1400;
const MENU_ONLY_WINDOW_WIDTH = LEFT_PANEL_WIDTH;
const MENU_ONLY_WINDOW_HEIGHT = 738;
const WINDOW_HEIGHT_RATIO = 0.95;

function getPrimaryWorkArea() {
    try {
        return screen.getPrimaryDisplay().workArea;
    } catch {
        return { x: 0, y: 0, width: 1280, height: 800 };
    }
}

function getDefaultWindowHeight() {
    const work = getPrimaryWorkArea();
    return Math.max(480, Math.round(work.height * WINDOW_HEIGHT_RATIO));
}

function getCenteredWindowBounds(width, height) {
    const work = getPrimaryWorkArea();
    return {
        x: work.x + Math.max(0, Math.round((work.width - width) / 2)),
        y: work.y + Math.max(0, Math.round((work.height - height) / 2)),
        width,
        height,
    };
}

// Admin password storage (per-machine) in ProgramData
const PROGRAM_DATA_DIR = process.env.ProgramData || 'C:\\ProgramData';
const ADMIN_DIR = path.join(PROGRAM_DATA_DIR, 'WebPreviewer');
const ADMIN_FILE = path.join(ADMIN_DIR, 'admin.json');

function ensureDir(p) {
    try { fs.mkdirSync(p, { recursive: true }); } catch { }
}

function readAdminRecord() {
    try {
        const raw = fs.readFileSync(ADMIN_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        if (typeof data.salt !== 'string' || typeof data.hash !== 'string') return null;
        return data;
    } catch {
        return null;
    }
}

function hashPassword(password, saltHex, iterations = 200_000) {
    const salt = Buffer.from(saltHex, 'hex');
    const dk = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    return dk.toString('hex');
}

function isAdminInitialized() {
    const rec = readAdminRecord();
    return Boolean(rec && rec.salt && rec.hash);
}

async function createWindow() {
    // If an SVG exists, rasterize it to a high-res PNG we can reuse
    try {
        const svgPath = path.join(__dirname, 'renderer', 'icon.svg');
        const outPng = path.join(__dirname, 'renderer', 'icon.png');
        if (fs.existsSync(svgPath)) {
            const svgBuf = fs.readFileSync(svgPath);
            let svgImage = nativeImage.createFromBuffer(svgBuf);
            if (!svgImage.isEmpty()) {
                svgImage = svgImage.resize({ width: 256, height: 256, quality: 'best' });
                const pngBuf = svgImage.toPNG();
                fs.writeFileSync(outPng, pngBuf);
            }
        }
    } catch { }

    const iconCandidates = [
        // Prefer user-provided PNGs named favicon.png
        path.join(__dirname, 'favicon.png'),
        path.join(__dirname, 'renderer', 'favicon.png'),
        // Common ICO names
        path.join(__dirname, 'renderer', 'favicon.ico'),
        path.join(__dirname, 'favicon.ico'),
        path.join(__dirname, 'renderer', 'icon.ico'),
        path.join(__dirname, 'icon.ico'),
        // Fallback PNG names
        path.join(__dirname, 'renderer', 'icon.png'),
        path.join(__dirname, 'icon.png'),
    ];
    let winIcon = null;
    for (const p of iconCandidates) {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) { winIcon = img; break; }
    }
    if (winIcon) {
        const sz = winIcon.getSize();
        if (sz && (sz.width < 256 || sz.height < 256)) {
            try { winIcon = winIcon.resize({ width: 256, height: 256, quality: 'best' }); } catch { }
        }
    }
    const initialHeight = MENU_ONLY_WINDOW_HEIGHT;
    const initialBounds = getCenteredWindowBounds(MENU_ONLY_WINDOW_WIDTH, initialHeight);
    mainWindow = new BrowserWindow({
        ...initialBounds,
        title: 'Cognizance Health',
        icon: winIcon || undefined,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: true,
    });

    try {
        await mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    } catch (e) {
        try {
            const fileUrl = `file://${path.join(__dirname, 'renderer', 'index.html').replace(/\\/g, '/')}`;
            await mainWindow.loadURL(fileUrl);
        } catch (e2) {
            console.error('Failed to load renderer HTML:', e2);
        }
    }

    // Diagnose load issues for the main window
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.error('Main window failed to load', { code, desc, url });
    });
    mainWindow.webContents.on('render-process-gone', (_e, details) => {
        console.error('Renderer process gone', details);
    });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Main window loaded index.html');
    });

    // Ensure window becomes visible even if ready-to-show doesn't fire
    try { mainWindow.show(); } catch { }

    // Handle window resize / fullscreen
    mainWindow.on('resize', () => {
        resizePreview();
    });
    mainWindow.on('enter-full-screen', () => resizePreview());
    mainWindow.on('leave-full-screen', () => resizePreview());
    mainWindow.on('maximize', () => resizePreview());
    mainWindow.on('unmaximize', () => resizePreview());

    // When alt-tabbing back, ensure BrowserView doesn't steal clicks over modals
    mainWindow.on('focus', () => {
        if (overlaySuspended) suspendPreviewBounds();
        else resizePreview();
    });
}

function openAppDevTools() {
    if (!mainWindow?.webContents || mainWindow.webContents.isDestroyed()) return;
    if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
        return;
    }
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
}

function openPreviewDevTools() {
    const wc = previewView?.webContents;
    if (!wc || wc.isDestroyed()) return;
    if (wc.isDevToolsOpened()) {
        wc.closeDevTools();
        return;
    }
    wc.openDevTools({ mode: 'detach', activate: true });
}

function registerAppShortcuts() {
    try {
        globalShortcut.unregister('CommandOrControl+Shift+A');
        globalShortcut.register('CommandOrControl+Shift+A', () => {
            if (!mainWindow?.webContents || mainWindow.webContents.isDestroyed()) return;
            mainWindow.webContents.send('open-admin-panel');
        });
    } catch (e) {
        console.error('Failed to register app shortcuts', e);
    }
}

function hideNativeMenuBar() {
    try {
        Menu.setApplicationMenu(null);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setMenuBarVisibility(false);
        }
    } catch { /* ignore */ }
}

function createPreviewView() {
    if (previewView) {
        previewView.destroy();
    }

    previewView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            backgroundThrottling: false,
        }
    });

    mainWindow.setBrowserView(previewView);
    configureWebContentsForSpeed(previewView.webContents);
    previewView.webContents.setZoomFactor(PREVIEW_ZOOM_FACTOR);
    resizePreview();
}

function setWebPreviewEnabled(enabled) {
    const wasEnabled = webPreviewEnabled;
    webPreviewEnabled = Boolean(enabled);

    if (!webPreviewEnabled) {
        hdscViewIsVisible = false;
        if (hdscView && mainWindow) {
            try { mainWindow.setBrowserView(null); } catch { }
        }
    }

    if (!mainWindow) return;

    if (webPreviewEnabled) {
        if (!wasEnabled) {
            try {
                const b = mainWindow.getBounds();
                mainWindow.setSize(DEFAULT_WINDOW_WIDTH, b.height);
            } catch { }
        }
        if (!previewView) createPreviewView();
        else {
            try { mainWindow.setBrowserView(previewView); } catch { }
        }
        resizePreview();
    } else {
        try { mainWindow.setBrowserView(null); } catch { }
        if (previewView) {
            suspendPreviewBounds();
        }
        if (wasEnabled) {
            try {
                mainWindow.setSize(MENU_ONLY_WINDOW_WIDTH, MENU_ONLY_WINDOW_HEIGHT);
            } catch { }
        }
    }

    try {
        mainWindow.webContents.send('web-preview-enabled-changed', { enabled: webPreviewEnabled });
    } catch { }
}

function suspendPreviewBounds() {
    if (!previewView || !mainWindow) return;
    const b = mainWindow.getContentBounds();
    // Move it out of view and collapse so it doesn't intercept input
    previewView.setBounds({ x: b.width, y: 0, width: 0, height: 0 });
}

function configureWebContentsForSpeed(webContents) {
    if (!webContents || webContents.isDestroyed()) return;
    try { webContents.setUserAgent(CHROME_USER_AGENT); } catch { }
    try { webContents.setBackgroundThrottling(false); } catch { }
    try { webContents.setZoomFactor(1); } catch { }
}

function getOrCreateHdscView() {
    if (hdscView?.webContents && !hdscView.webContents.isDestroyed()) {
        configureWebContentsForSpeed(hdscView.webContents);
        return hdscView;
    }

    hdscView = new BrowserView({
        webPreferences: {
            partition: HDSC_PARTITION,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            webSecurity: true,
        },
    });

    configureWebContentsForSpeed(hdscView.webContents);
    hdscView.webContents.on('dom-ready', () => {
        configureWebContentsForSpeed(hdscView.webContents);
        injectHdscSavePickerHook(hdscView.webContents).catch(() => {});
    });

    return hdscView;
}

function getLayoutMetrics() {
    const bounds = mainWindow.getContentBounds();
    const layoutWidth = Math.min(bounds.width, DEFAULT_WINDOW_WIDTH);
    const layoutX = Math.max(0, Math.floor((bounds.width - layoutWidth) / 2));
    return { bounds, layoutWidth, layoutX };
}

function getHdscVisibleBounds() {
    const { bounds, layoutWidth, layoutX } = getLayoutMetrics();
    return {
        x: layoutX + LEFT_PANEL_WIDTH,
        y: 0,
        width: Math.max(400, layoutWidth - LEFT_PANEL_WIDTH),
        height: bounds.height,
    };
}

/** Attach HDSC browser — visible in preview panel when web preview is on */
function attachHdscBrowser(showInPreview) {
    if (!mainWindow) return null;
    const view = getOrCreateHdscView();
    hdscViewIsVisible = Boolean(showInPreview && webPreviewEnabled);
    try { mainWindow.setBrowserView(view); } catch { }

    if (hdscViewIsVisible) {
        view.setBounds(getHdscVisibleBounds());
    } else {
        view.setBounds({
            x: -(HDSC_VIEW_WIDTH + 40),
            y: 0,
            width: HDSC_VIEW_WIDTH,
            height: HDSC_VIEW_HEIGHT,
        });
    }
    return view;
}

function detachHdscView() {
    if (!mainWindow) return;
    hdscViewIsVisible = false;
    try { mainWindow.setBrowserView(null); } catch { }
    if (webPreviewEnabled && previewView) {
        try { mainWindow.setBrowserView(previewView); } catch { }
        resizePreview();
    }
}

function resizePreview() {
    if (!mainWindow) return;
    if (hidePreviewForAutomation) {
        suspendPreviewBounds();
        return;
    }
    if (hdscViewIsVisible && hdscView?.webContents && !hdscView.webContents.isDestroyed()) {
        hdscView.setBounds(getHdscVisibleBounds());
        return;
    }
    if (!previewView) return;
    if (!webPreviewEnabled) {
        suspendPreviewBounds();
        return;
    }
    if (overlaySuspended) {
        suspendPreviewBounds();
        return;
    }

    const { bounds, layoutWidth, layoutX } = getLayoutMetrics();
    previewView.setBounds({
        x: layoutX + LEFT_PANEL_WIDTH,
        y: 0,
        width: Math.max(0, layoutWidth - LEFT_PANEL_WIDTH),
        height: bounds.height
    });
}

function ensurePreviewViewForAutomation() {
    if (!mainWindow) return null;
    hidePreviewForAutomation = true;
    if (!previewView || previewView.webContents?.isDestroyed()) {
        previewView = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false,
                backgroundThrottling: false,
            },
        });
        previewView.webContents.setZoomFactor(PREVIEW_ZOOM_FACTOR);
    }
    configureWebContentsForSpeed(previewView.webContents);
    try { mainWindow.setBrowserView(previewView); } catch { }
    suspendPreviewBounds();
    try {
        mainWindow.webContents.executeJavaScript('document.activeElement?.blur?.()');
    } catch { /* ignore */ }
    try { previewView.webContents.focus(); } catch { }
    return previewView;
}

function stopPreviewWebContents() {
    const wc = previewView?.webContents;
    if (!wc || wc.isDestroyed()) return;
    try { wc.stop(); } catch { /* ignore */ }
    try { wc.loadURL('about:blank'); } catch { /* ignore */ }
}

function releaseAutomationPreviewView() {
    if (!mainWindow) return;
    hidePreviewForAutomation = false;
    stopPreviewWebContents();
    if (!webPreviewEnabled) {
        try { mainWindow.setBrowserView(null); } catch { }
        if (previewView) suspendPreviewBounds();
    } else {
        try { mainWindow.setBrowserView(previewView); } catch { }
        overlaySuspended = false;
        resizePreview();
    }
    try { mainWindow.webContents.focus(); } catch { }
}

function loadWebsite(url) {
    if (!previewView) return;

    try {
        previewView.webContents.setZoomFactor(PREVIEW_ZOOM_FACTOR);
        previewView.webContents.loadURL(url);

        // Simple CSS injection to remove gaps - much more conservative
        previewView.webContents.once('did-finish-load', () => {
            previewView.webContents.setZoomFactor(PREVIEW_ZOOM_FACTOR);
            previewView.webContents.insertCSS(`
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            `);
        });
    } catch (error) {
        console.error('Error loading website:', error);
    }
}

// IPC handlers
ipcMain.handle('load-website', async (event, url) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return { success: false, error: licenseBlocked.reason };
    if (!webPreviewEnabled) return { success: false, error: 'Web preview is disabled' };
    loadWebsite(url);
    return { success: true };
});

ipcMain.handle('app-quit', async () => {
    app.quit();
    return { ok: true };
});

ipcMain.handle('app-update-get-version', async () => {
    try {
        const version = readLocalPackageVersion(__dirname);
        return { ok: true, version };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to read version' };
    }
});

ipcMain.handle('app-update-check', async () => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const result = await checkForAppUpdate(__dirname);
        return {
            ...result,
            requiresAdmin: process.platform === 'win32' && !isAppRootWritable(__dirname),
        };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Update check failed' };
    }
});

ipcMain.handle('app-update-apply', async (event) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const sender = event?.sender;
        const result = await applyAppUpdate(__dirname, (message) => {
            try {
                sender?.send('app-update-progress', { message });
            } catch { /* ignore */ }
        });
        if (result.ok && result.updated) {
            setTimeout(() => {
                app.exit(0);
            }, 400);
        }
        return result;
    } catch (e) {
        return { ok: false, reason: e?.message || 'Update failed' };
    }
});

ipcMain.handle('app-language-get', async () => {
    return { ok: true, lang: appLanguage };
});

ipcMain.handle('app-language-set', async (_event, lang) => {
    saveAppLanguage(lang);
    return { ok: true, lang: appLanguage };
});

ipcMain.handle('web-preview-get-enabled', async () => {
    return { ok: true, enabled: webPreviewEnabled };
});

ipcMain.handle('web-preview-set-enabled', async (_event, enabled) => {
    setWebPreviewEnabled(Boolean(enabled));
    return { ok: true, enabled: webPreviewEnabled };
});

ipcMain.handle('qr-generate', async (_event, url) => {
    try {
        const u = new URL(String(url));
        const safe = u.toString();
        const dataUrl = await QRCode.toDataURL(safe, { width: 280, margin: 1 });
        return { ok: true, dataUrl };
    } catch (e) {
        return { ok: false, error: e?.message || 'Invalid URL' };
    }
});

ipcMain.handle('clipboard-copy', async (_event, text) => {
    clipboard.writeText(String(text || ''));
    return { ok: true };
});

function emitDownloadProgress(onProgress, received, total) {
    if (typeof onProgress !== 'function') return;
    const percent =
        total > 0 ? Math.min(100, Math.floor((received / total) * 100)) : null;
    onProgress({ received, total, percent });
}

function downloadToFile(url, outPath, maxRedirects = 5, onProgress) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const proto = u.protocol === 'https:' ? https : http;
        const req = proto.get(
            {
                protocol: u.protocol,
                hostname: u.hostname,
                port: u.port,
                path: `${u.pathname}${u.search}`,
                headers: {
                    // Some servers block "non-browser" downloads without UA/Accept
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive',
                }
            },
            (res) => {
            // Redirects
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
                res.resume();
                const next = new URL(res.headers.location, u).toString();
                return resolve(downloadToFile(next, outPath, maxRedirects - 1, onProgress));
            }

            if (res.statusCode !== 200) {
                // Capture a small response snippet for debugging
                let snippet = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    if (snippet.length < 2000) snippet += chunk;
                });
                res.on('end', () => {
                    const msg = snippet ? ` - ${snippet.replace(/\\s+/g, ' ').trim().slice(0, 2000)}` : '';
                    reject(new Error(`Download failed (HTTP ${res.statusCode})${msg}`));
                });
                res.on('error', () => reject(new Error(`Download failed (HTTP ${res.statusCode})`)));
                return;
            }

            const total = Number.parseInt(res.headers['content-length'], 10) || 0;
            let received = 0;
            emitDownloadProgress(onProgress, 0, total);

            const file = fs.createWriteStream(outPath);
            res.on('data', (chunk) => {
                received += chunk.length;
                if (!file.write(chunk)) {
                    res.pause();
                    file.once('drain', () => res.resume());
                }
                emitDownloadProgress(onProgress, received, total);
            });
            res.on('end', () => {
                file.end(() => {
                    file.close(() => {
                        emitDownloadProgress(onProgress, received, total > 0 ? total : received);
                        resolve({ ok: true, path: outPath, bytes: received });
                    });
                });
            });
            res.on('error', (err) => {
                file.destroy();
                try { fs.unlinkSync(outPath); } catch { }
                reject(err);
            });
            file.on('error', (err) => {
                try { file.close(() => { }); } catch { }
                try { fs.unlinkSync(outPath); } catch { }
                reject(err);
            });
        });

        req.on('error', reject);
        req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
            req.destroy();
            reject(new Error('Download timed out after 5 minutes — check PACS server or network'));
        });
    });
}

ipcMain.handle('get-downloaded-study', async (_event, studyUid) => {
    const uid = String(studyUid || '').trim();
    if (!uid || !lastDownloadedZipPath || !fs.existsSync(lastDownloadedZipPath)) {
        return { ok: true, ready: false };
    }
    const ready = lastDownloadedStudyUid === uid;
    return {
        ok: true,
        ready,
        path: ready ? lastDownloadedZipPath : null,
    };
});

ipcMain.handle('download-zip', async (event, url, options = {}) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const silent = Boolean(options?.silent);
        const u = new URL(String(url));
        const downloadsDir = app.getPath('downloads');
        const baseName = path.basename(u.pathname) || 'download.zip';
        const safeName = baseName.toLowerCase().endsWith('.zip') ? baseName : `${baseName}.zip`;
        let outPath = path.join(downloadsDir, safeName);

        // Avoid overwrite
        if (fs.existsSync(outPath)) {
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const nameNoExt = safeName.replace(/\.zip$/i, '');
            outPath = path.join(downloadsDir, `${nameNoExt}-${stamp}.zip`);
        }

        const reportProgress = (data) => {
            try {
                event.sender.send('download-progress', data);
            } catch { /* window may be closing */ }
        };
        const result = await downloadToFile(u.toString(), outPath, 5, reportProgress);
        if (!silent) {
            const choice = await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Download Complete',
                message: 'Download complete',
                detail: `Saved to:\n${result.path}`,
                buttons: ['Open Folder', 'Close'],
                defaultId: 0,
                cancelId: 1,
                noLink: true
            });
            if (choice.response === 0) {
                shell.showItemInFolder(result.path);
            }
        }
        lastDownloadedZipPath = result.path;
        const studyUid =
            String(options?.studyUid || '').trim() ||
            (() => {
                const m = u.pathname.match(/\/studies\/([^/]+)/i);
                return m ? m[1] : '';
            })();
        if (studyUid) lastDownloadedStudyUid = studyUid;

        const metaResult = await readMetadataFromZip(result.path);
        return {
            ok: true,
            path: result.path,
            metadata: metaResult.ok ? metaResult.metadata : null,
            metadataAvailability: metaResult.ok ? metaResult.availability : null,
            metadataWarnings: metaResult.warnings || (metaResult.ok ? [] : [metaResult.reason]),
        };
    } catch (e) {
        return { ok: false, error: e?.message || 'Download failed' };
    }
});

async function downloadMappedPortalZip(event, fallback, logLabel = 'Portal') {
    const downloadsDir = path.join(app.getPath('downloads'), 'radshare-hdsc');
    fs.mkdirSync(downloadsDir, { recursive: true });
    const safeName = (fallback.filename || 'study.zip').replace(/[<>:"/\\|?*]/g, '_');
    let outPath = path.join(downloadsDir, safeName);
    if (fs.existsSync(outPath)) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const ext = path.extname(safeName);
        const base = safeName.slice(0, safeName.length - ext.length);
        outPath = path.join(downloadsDir, `${base}-${stamp}${ext}`);
    }

    const reportProgress = (data) => {
        try {
            event.sender.send('download-progress', data);
        } catch { /* ignore */ }
    };
    await downloadGoogleDriveToFile(fallback.sourceUrl, outPath, reportProgress);

    lastDownloadedZipPath = outPath;
    if (fallback.studyUid) lastDownloadedStudyUid = fallback.studyUid;

    const metaResult = await readMetadataFromZip(outPath);
    return {
        ok: true,
        path: outPath,
        studyUid: fallback.studyUid || null,
        metadata: metaResult.ok ? metaResult.metadata : null,
        metadataAvailability: metaResult.ok ? metaResult.availability : null,
        metadataWarnings: metaResult.warnings || (metaResult.ok ? [] : [metaResult.reason]),
        source: 'fallback',
    };
}

let jivexDownloadInProgress = false;

const DEFAULT_JIVEX_PASSWORD_FORMAT = {
    ok: true,
    formatType: 'date',
    format: 'DD-MM-YYYY',
    placeholder: 'DD-MM-YYYY',
    title: 'Password',
    hint: '',
};

ipcMain.handle('jivex-detect-password-format', async (_event, portalUrl) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;

    const url = String(portalUrl || '').trim();
    if (!url || !isJivexPortalUrl(url)) {
        return { ok: false, error: 'Not a valid Jivex portal link' };
    }

    const preview = ensurePreviewViewForAutomation();
    if (!preview) {
        return { ...DEFAULT_JIVEX_PASSWORD_FORMAT };
    }

    try {
        const detected = await detectJivexPasswordFormat(preview, url);
        if (detected?.ok && detected.formatType === 'date' && detected.format) {
            return detected;
        }
        return { ...DEFAULT_JIVEX_PASSWORD_FORMAT, title: detected?.title || 'Password' };
    } catch (e) {
        releaseAutomationPreviewView();
        return { ...DEFAULT_JIVEX_PASSWORD_FORMAT, detectError: e?.message || String(e) };
    }
});

ipcMain.handle('jivex-release-preview', async () => {
    releaseAutomationPreviewView();
    return { ok: true };
});

ipcMain.handle('jivex-download-study', async (_event, params) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;

    if (jivexDownloadInProgress) {
        return { ok: false, error: 'A Jivex download is already in progress — please wait' };
    }
    jivexDownloadInProgress = true;
    try {
        const portalUrl = String(params?.portalUrl || '').trim();
        const password = String(params?.password || '');
        const user = String(params?.user || '').trim();

        if (!portalUrl || !isJivexPortalUrl(portalUrl)) {
            return { ok: false, error: 'Not a valid Jivex portal link' };
        }
        if (!password) {
            return { ok: false, error: 'Portal password is required' };
        }

        const preview = ensurePreviewViewForAutomation();
        if (!preview) {
            return { ok: false, error: 'Web preview is not available' };
        }

        const downloadsDir = app.getPath('downloads');
        console.log('[JiveX] Automating Jivex download in background (preview hidden)…');
        const emitBrowserDownload = (payload) => {
            try {
                mainWindow?.webContents?.send('browser-download-progress', payload);
            } catch { /* ignore */ }
        };
        const result = await downloadJivexStudyWithSeleniumInPreview(preview, portalUrl, {
            password,
            user,
            downloadsDir,
            onDownloadProgress: emitBrowserDownload,
        });

        lastDownloadedZipPath = result.path;
        if (result.studyUid) lastDownloadedStudyUid = result.studyUid;

        const metaResult = await readMetadataFromZip(result.path);
        console.log('[JiveX] Metadata read', {
            ok: metaResult.ok,
            patient: metaResult.metadata?.patientName || null,
            path: result.path,
        });
        if (!metaResult.ok) {
            return {
                ok: false,
                error: metaResult.reason || 'Download finished but DICOM metadata could not be read (ZIP may be incomplete)',
                path: result.path,
            };
        }
        return {
            ok: true,
            path: result.path,
            studyUid: result.studyUid || null,
            metadata: metaResult.ok ? metaResult.metadata : null,
            metadataAvailability: metaResult.ok ? metaResult.availability : null,
            metadataWarnings: metaResult.warnings || (metaResult.ok ? [] : [metaResult.reason]),
        };
    } catch (e) {
        return { ok: false, error: e?.message || 'Jivex download failed' };
    } finally {
        releaseAutomationPreviewView();
        jivexDownloadInProgress = false;
    }
});

ipcMain.handle('portal-fallback-download', async (event, portalUrl) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const url = String(portalUrl || '').trim();
        if (!url) return { ok: false, noFallback: true };

        const fallback = resolvePortalFallbackDownload(url);
        if (!fallback) return { ok: false, noFallback: true };

        // HDSC and Jivex use dedicated download handlers
        if (isHdscPortalUrl(url) || isJivexPortalUrl(url)) return { ok: false, noFallback: true };

        return await downloadMappedPortalZip(event, fallback, 'Portal');
    } catch (e) {
        return { ok: false, error: e?.message || 'Portal download failed' };
    }
});

ipcMain.handle('hdsc-download-study', async (event, portalUrl) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const url = String(portalUrl || '').trim();
        if (!url || !isHdscPortalUrl(url)) {
            return { ok: false, error: 'Not a valid HDSC portal link' };
        }

        const fallback = resolveHdscFallbackDownload(url);
        if (fallback) {
            return await downloadMappedPortalZip(event, fallback, 'HDSC');
        }

        const showInPreview = webPreviewEnabled;
        const hdscBrowser = attachHdscBrowser(showInPreview);
        if (!hdscBrowser) {
            return { ok: false, error: 'Main window not ready' };
        }
        if (showInPreview) {
            try { mainWindow.webContents.send('hdsc-preview-active', { active: true }); } catch { }
        }

        const downloadsDir = app.getPath('downloads');
        console.log('[HDSC] Download folder:', path.join(downloadsDir, 'radshare-hdsc'));
        const result = await downloadHdscStudyFromPreview(hdscBrowser, url, {
            downloadsDir,
            showInPreview,
        });
        console.log('[HDSC] Download complete:', result.path);

        lastDownloadedZipPath = result.path;
        if (result.studyUid) lastDownloadedStudyUid = result.studyUid;

        const metaResult = await readMetadataFromZip(result.path);
        return {
            ok: true,
            path: result.path,
            studyUid: result.studyUid || null,
            metadata: metaResult.ok ? metaResult.metadata : null,
            metadataAvailability: metaResult.ok ? metaResult.availability : null,
            metadataWarnings: metaResult.warnings || (metaResult.ok ? [] : [metaResult.reason]),
        };
    } catch (e) {
        return { ok: false, error: e?.message || 'HDSC download failed' };
    } finally {
        if (!webPreviewEnabled) {
            detachHdscView();
        }
    }
});

ipcMain.handle('dicom-metadata-from-zip', async (_event, zipPath) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const target = zipPath || getLatestZipPath();
        return await readMetadataFromZip(target);
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to read metadata' };
    }
});

ipcMain.handle('license-get-status', async () => getLicenseStatusPayload());

ipcMain.handle('license-activate', async (_event, rawKey) => {
    try {
        if (!isLicenseRequired()) {
            return { ok: true, activated: true, skipped: true };
        }

        const status = getLicenseStatusPayload();
        if (status.activated) {
            return { ok: true, activated: true, already: true, daysRemaining: status.daysRemaining };
        }

        saveLicenseActivation(rawKey);
        const updated = getLicenseStatusPayload();
        return {
            ok: true,
            activated: true,
            daysRemaining: updated.daysRemaining,
            expiryDate: updated.expiryDate,
        };
    } catch (e) {
        const msg = String(e?.message || '');
        if (msg.toLowerCase().includes('expired')) {
            return { ok: false, error: 'expired' };
        }
        if (msg.toLowerCase().includes('clock')) {
            return { ok: false, error: 'clock_tampered' };
        }
        return { ok: false, error: 'invalid' };
    }
});

ipcMain.handle('admin-state', async () => {
    return { ok: true, initialized: isAdminInitialized() };
});

ipcMain.handle('admin-set-password', async (_event, newPassword) => {
    try {
        const pwd = String(newPassword || '');
        if (pwd.length < 4) return { ok: false, error: 'Password too short' };
        if (isAdminInitialized()) return { ok: false, error: 'Admin password already set' };

        ensureDir(ADMIN_DIR);
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 200_000;
        const hash = hashPassword(pwd, salt, iterations);

        fs.writeFileSync(
            ADMIN_FILE,
            JSON.stringify({ version: 1, salt, hash, iterations, digest: 'sha256', createdAt: new Date().toISOString() }, null, 2) + os.EOL,
            'utf8'
        );
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e?.message || 'Failed to set password' };
    }
});

ipcMain.handle('admin-verify-password', async (_event, password) => {
    try {
        const rec = readAdminRecord();
        if (!rec) return { ok: false, error: 'Admin not initialized' };
        const iterations = Number(rec.iterations) || 200_000;
        const digest = rec.digest === 'sha256' ? 'sha256' : 'sha256';
        const saltHex = rec.salt;
        const expected = String(rec.hash);

        const salt = Buffer.from(saltHex, 'hex');
        const dk = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, digest);
        const actual = dk.toString('hex');
        const ok = crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
        return { ok };
    } catch {
        return { ok: false };
    }
});

ipcMain.handle('admin-change-password', async (_event, currentPassword, newPassword) => {
    try {
        const rec = readAdminRecord();
        if (!rec) return { ok: false, error: 'Admin not initialized' };
        const iterations = Number(rec.iterations) || 200_000;
        const digest = rec.digest === 'sha256' ? 'sha256' : 'sha256';
        const saltHex = rec.salt;
        const expected = String(rec.hash);

        const salt = Buffer.from(saltHex, 'hex');
        const dk = crypto.pbkdf2Sync(String(currentPassword || ''), salt, iterations, 32, digest);
        const actual = dk.toString('hex');
        const verified = crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
        if (!verified) return { ok: false, error: 'Wrong current password' };

        const next = String(newPassword || '');
        if (next.length < 4) return { ok: false, error: 'New password too short' };

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newIterations = 200_000;
        const newHash = hashPassword(next, newSalt, newIterations);

        ensureDir(ADMIN_DIR);
        fs.writeFileSync(
            ADMIN_FILE,
            JSON.stringify({ version: 1, salt: newSalt, hash: newHash, iterations: newIterations, digest: 'sha256', updatedAt: new Date().toISOString() }, null, 2) + os.EOL,
            'utf8'
        );
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e?.message || 'Failed to change password' };
    }
});

function getLatestZipPath() {
    if (lastDownloadedZipPath && fs.existsSync(lastDownloadedZipPath)) {
        return lastDownloadedZipPath;
    }

    const downloadsDir = app.getPath('downloads');
    if (!fs.existsSync(downloadsDir)) return null;

    const zipFiles = fs.readdirSync(downloadsDir)
        .filter(f => /\.zip$/i.test(f))
        .map(f => path.join(downloadsDir, f))
        .filter(p => fs.existsSync(p))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    return zipFiles[0] || null;
}

function isDicomFile(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const base = path.basename(filePath).toUpperCase();
        if (base === 'DICOMDIR' || base.includes('DICOMDIR')) return false;
        if (ext === '.dcm' || ext === '.dicom' || base.startsWith('DICM')) return true;

        const stats = fs.statSync(filePath);
        if (!stats.isFile() || stats.size < 132) return false;

        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 128);
        fs.closeSync(fd);
        return buffer.toString('ascii') === 'DICM';
    } catch {
        return false;
    }
}

function collectDicomFiles(dir) {
    const dicomFiles = [];
    const walk = (currentDir) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) walk(fullPath);
            else if (entry.isFile() && isDicomFile(fullPath)) dicomFiles.push(fullPath);
        }
    };
    walk(dir);
    return dicomFiles;
}

function isLikelyChocolateyShim(exePath) {
    try {
        return fs.statSync(exePath).size > 200000;
    } catch {
        return false;
    }
}

function findStorescuInDir(dir) {
    if (!dir || !fs.existsSync(dir)) return null;

    const candidates = [
        path.join(dir, 'storescu.exe'),
        path.join(dir, 'bin', 'storescu.exe'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && !isLikelyChocolateyShim(candidate)) {
            return candidate;
        }
    }
    return null;
}

function getBundledStorescuDir() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'dcmtk');
    }
    return path.join(__dirname, 'dcmtk');
}

function getBundledStorescuPath() {
    return findStorescuInDir(getBundledStorescuDir());
}

async function unblockWindowsFile(filePath) {
    if (process.platform !== 'win32' || !filePath || !fs.existsSync(filePath)) return;
    try {
        await execFileAsync('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            `Unblock-File -LiteralPath '${String(filePath).replace(/'/g, "''")}' -ErrorAction SilentlyContinue`,
        ], { windowsHide: true });
    } catch { /* ignore */ }
}

async function unblockStorescuDirectory(dir) {
    if (process.platform !== 'win32' || !dir || !fs.existsSync(dir)) return;
    try {
        for (const file of fs.readdirSync(dir)) {
            if (/\.(exe|dll)$/i.test(file)) {
                await unblockWindowsFile(path.join(dir, file));
            }
        }
    } catch { /* ignore */ }
}

function getStorescuDir() {
    return getBundledStorescuDir();
}

function getLocalStorescuPath() {
    return getBundledStorescuPath();
}

function findSystemStorescuCandidates() {
    const bundled = getBundledStorescuPath();
    return bundled ? [bundled] : [];
}

async function copyStorescuSupportFiles(_sourceDir, _destDir) {
    return false;
}

let storescuReadyPromise = null;

async function ensureStorescuReady() {
    if (storescuReadyPromise) return storescuReadyPromise;

    storescuReadyPromise = (async () => {
        const bundledDir = getBundledStorescuDir();
        const bundledPath = getBundledStorescuPath();
        if (!bundledPath) {
            return null;
        }
        await unblockStorescuDirectory(bundledDir);
        await unblockStorescuDirectory(path.dirname(bundledPath));
        return bundledPath;
    })().catch((err) => {
        storescuReadyPromise = null;
        throw err;
    });

    return storescuReadyPromise;
}

function getStorescuPath() {
    const bundledPath = getBundledStorescuPath();
    if (fs.existsSync(bundledPath)) return bundledPath;
    return null;
}

/** Windows cmd.exe limit is ~8191 chars — keep file batches well under that */
const STORESCU_CMD_MAX_LEN = 5000;

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function chunkFilesByCommandLength(files, storescuPath, aeTitle, ip, port, maxLen = STORESCU_CMD_MAX_LEN) {
    const baseLen =
        String(storescuPath).length +
        String(aeTitle).length +
        String(ip).length +
        String(port).length +
        32;
    const batches = [];
    let batch = [];
    let len = baseLen;

    for (const file of files) {
        const fileLen = String(file).length + 1;
        if (batch.length > 0 && len + fileLen > maxLen) {
            batches.push(batch);
            batch = [];
            len = baseLen;
        }
        batch.push(file);
        len += fileLen;
    }
    if (batch.length) batches.push(batch);
    return batches;
}

function formatStorescuError(err) {
    const stderr = String(err?.stderr || '').trim();
    const stdout = String(err?.stdout || '').trim();
    const msg = String(err?.message || '').trim();
    const detail = [stderr, stdout, msg].filter(Boolean).join('\n').trim();
    const blob = detail || msg;

    if (/smart app control|blocked|access denied|0x800711c7/i.test(blob)) {
        return {
            reason: 'Windows blocked the send tool. Allow it in Security settings.',
            detail: blob,
        };
    }
    if (/storescu not found|ENOENT/i.test(blob)) {
        return {
            reason: 'PACS send tool is not available on this computer.',
            detail: blob,
        };
    }
    if (/Cannot find file at|missing or moved file/i.test(blob)) {
        return {
            reason: 'PACS send tool is not available on this computer.',
            detail: blob,
        };
    }
    if (/ECONNREFUSED|Unable to connect|Connection refused|No route to host|connect timed out/i.test(blob)) {
        return {
            reason: 'Could not connect to PACS. Check IP address and port.',
            detail: blob,
        };
    }
    if (/Association.*reject|Called AE Title|Calling AE Title|Unknown AE|refused/i.test(blob)) {
        return {
            reason: 'PACS rejected the connection. Check AE Title settings.',
            detail: blob,
        };
    }
    if (/ENAMETOOLONG|command line is too long|spawn ENAMETOOLONG/i.test(blob)) {
        return {
            reason: 'Study is too large to send. Please contact support.',
            detail: blob,
        };
    }

    const cleanDetail = blob.replace(/^Command failed:[^\n]*(?:\n|$)/i, '').trim() || blob;
    return {
        reason: 'Save to PACS failed. Please try again.',
        detail: cleanDetail.substring(0, 12000),
    };
}

function throwStorescuError(err) {
    const formatted = formatStorescuError(err);
    const error = new Error(formatted.reason);
    error.detail = formatted.detail;
    error.shortReason = formatted.reason;
    throw error;
}

function isFatalStorescuOutput(stdout, stderr) {
    const errText = String(stderr || '');
    return (
        /\bE:\s*(?:Association|Failed|Unable|Cannot|Error)\b/i.test(errText) ||
        (errText.includes('E:') && !String(stdout || '').trim() && errText.length > 80)
    );
}

async function runStorescuArgs(storescuPath, args) {
    try {
        const { stdout, stderr } = await execFileAsync(storescuPath, args, {
            maxBuffer: 10 * 1024 * 1024,
            windowsHide: true,
            cwd: path.dirname(storescuPath),
        });
        if (isFatalStorescuOutput(stdout, stderr)) {
            throwStorescuError({ stderr, stdout, message: 'storescu failed' });
        }
        return { stdout, stderr };
    } catch (e) {
        if (e?.shortReason) throw e;
        throwStorescuError(e);
    }
}

async function runStorescuDirectory(storescuPath, aeTitle, ip, port, directory) {
    const args = ['-aec', String(aeTitle), String(ip), String(port), '+sd', directory];
    return runStorescuArgs(storescuPath, args);
}

async function runStorescuBatch(storescuPath, aeTitle, ip, port, files) {
    const args = ['-aec', String(aeTitle), String(ip), String(port), ...files];
    return runStorescuArgs(storescuPath, args);
}

async function sendDicomFilesWithStorescu(dicomFiles, aeTitle, ip, port, extractDir) {
    const storescuPath = await ensureStorescuReady();
    if (!storescuPath || !fs.existsSync(storescuPath)) {
        const err = new Error('PACS send tool is not available. Real DCMTK files are missing from the dcmtk folder.');
        err.detail = `Expected storescu.exe in ${getBundledStorescuDir()} (not Chocolatey shims).`;
        err.shortReason = err.message;
        throw err;
    }

    let batches = 0;
    let lastOutput = '';

    // Prefer directory scan — avoids Windows command-line length limits entirely
    try {
        const { stdout, stderr } = await runStorescuDirectory(storescuPath, aeTitle, ip, port, extractDir);
        lastOutput = stdout || stderr || 'Success';
        batches = 1;
    } catch (dirErr) {
        const blob = String(dirErr?.detail || dirErr?.message || '');
        const sdUnsupported =
            /(\+sd|scan-director)/i.test(blob) &&
            /(unknown|unrecognized|invalid).*(option|argument)/i.test(blob);
        if (!sdUnsupported) throw dirErr;

        const fileBatches = chunkFilesByCommandLength(dicomFiles, storescuPath, aeTitle, ip, port);
        batches = fileBatches.length;
        for (const batch of fileBatches) {
            const { stdout, stderr } = await runStorescuBatch(storescuPath, aeTitle, ip, port, batch);
            lastOutput = stdout || stderr || lastOutput;
        }
    }

    return {
        filesSent: dicomFiles.length,
        batches,
        output: lastOutput || 'Success',
    };
}

ipcMain.handle('send-dicom-files', async (_event, params) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;

    const { aeTitle, port, ip, assignedMetadata } = params || {};
    if (!aeTitle || !port || !ip) {
        return { ok: false, reason: 'Missing IP, port, or AE Title' };
    }

    const zipPath = getLatestZipPath();
    if (!zipPath) {
        return { ok: false, reason: 'No downloaded study — use Load or Assign study first' };
    }

    const extractDir = path.join(os.tmpdir(), `web_preview_dicom_${Date.now()}`);
    try {
        fs.mkdirSync(extractDir, { recursive: true });
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);

        const dicomFiles = collectDicomFiles(extractDir);
        if (dicomFiles.length === 0) {
            return { ok: false, reason: 'No DICOM files found in downloaded ZIP' };
        }

        let modifyResult = null;
        if (assignedMetadata && typeof assignedMetadata === 'object') {
            modifyResult = await applyAssignedMetadataToDicomFiles(dicomFiles, assignedMetadata);
            if (!modifyResult.ok) {
                return { ok: false, reason: modifyResult.reason || 'Failed to apply assigned metadata' };
            }
        }

        const sendResult = await sendDicomFilesWithStorescu(dicomFiles, aeTitle, ip, port, extractDir);

        return {
            ok: true,
            filesSent: sendResult.filesSent,
            batches: sendResult.batches,
            filesModified: modifyResult?.filesModified || 0,
            output: sendResult.output,
        };
    } catch (e) {
        return {
            ok: false,
            reason: e?.shortReason || e?.message || 'Save to PACS failed. Please try again.',
            detail: e?.detail || String(e?.message || ''),
        };
    } finally {
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch { }
    }
});

ipcMain.handle('get-preview-bounds', () => {
    if (!previewView) return null;
    return previewView.getBounds();
});

// Temporarily suspend and resume the preview view so overlay UI is clickable
ipcMain.handle('preview-suspend', () => {
    if (!mainWindow || !previewView) return { ok: false };
    overlaySuspended = true;
    suspendPreviewBounds();
    return { ok: true };
});

ipcMain.handle('preview-resume', () => {
    if (!mainWindow || !previewView) return { ok: false };
    if (!webPreviewEnabled) return { ok: true };
    overlaySuspended = false;
    resizePreview();
    return { ok: true };
});

// PACS storage helpers
const pacsFilePath = path.join(__dirname, 'pacs.json');
const sendSettingsFilePath = path.join(__dirname, 'send-settings.json');
const assignStudySettingsFilePath = path.join(__dirname, 'assign-study-settings.json');
const adminSettingsFilePath = path.join(__dirname, 'admin-settings.json');

function readAdminSettings() {
    try {
        if (!fs.existsSync(adminSettingsFilePath)) {
            return { webPreviewButton: false };
        }
        const data = JSON.parse(fs.readFileSync(adminSettingsFilePath, 'utf8'));
        return {
            webPreviewButton: Boolean(data?.webPreviewButton),
        };
    } catch {
        return { webPreviewButton: false };
    }
}
function readPacsFile() {
    try {
        const data = fs.readFileSync(pacsFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writePacsFile(records) {
    try {
        fs.writeFileSync(pacsFilePath, JSON.stringify(records, null, 2) + os.EOL, 'utf8');
        return true;
    } catch {
        return false;
    }
}

ipcMain.handle('pacs-save', (event, record) => {
    const records = readPacsFile();
    const withId = { id: Date.now(), ...record };
    records.push(withId);
    writePacsFile(records);
    return { ok: true, record: withId };
});

ipcMain.handle('pacs-list', () => {
    return readPacsFile();
});

ipcMain.handle('pacs-update', (event, updated) => {
    const records = readPacsFile();
    const idx = records.findIndex(r => r.id === updated.id);
    if (idx >= 0) {
        records[idx] = { ...records[idx], ...updated };
        writePacsFile(records);
        return { ok: true, record: records[idx] };
    }
    return { ok: false };
});

ipcMain.handle('send-settings-save', (_event, settings) => {
    try {
        const ip = String(settings?.ip || '').trim();
        const port = String(settings?.port || '').trim();
        const aeTitle = String(settings?.aeTitle || '').trim();
        if (!ip || !port || !aeTitle) {
            return { ok: false, reason: 'IP, port, and AE Title are required' };
        }
        const data = { ip, port, aeTitle, savedAt: Date.now() };
        fs.writeFileSync(sendSettingsFilePath, JSON.stringify(data, null, 2) + os.EOL, 'utf8');
        return { ok: true, settings: data };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to save send settings' };
    }
});

ipcMain.handle('send-settings-get', () => {
    try {
        if (!fs.existsSync(sendSettingsFilePath)) {
            return { ok: true, settings: null };
        }
        const settings = JSON.parse(fs.readFileSync(sendSettingsFilePath, 'utf8'));
        return { ok: true, settings };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to load send settings' };
    }
});

ipcMain.handle('assign-study-settings-save', (_event, settings) => {
    try {
        const ip = String(settings?.ip || '').trim();
        const port = String(settings?.port || '').trim();
        const aeTitle = String(settings?.aeTitle || '').trim();
        if (!ip || !port || !aeTitle) {
            return { ok: false, reason: 'IP, port, and AE Title are required' };
        }
        const data = { ip, port, aeTitle, savedAt: Date.now() };
        fs.writeFileSync(assignStudySettingsFilePath, JSON.stringify(data, null, 2) + os.EOL, 'utf8');
        return { ok: true, settings: data };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to save assign study settings' };
    }
});

ipcMain.handle('assign-study-settings-get', () => {
    try {
        if (!fs.existsSync(assignStudySettingsFilePath)) {
            return { ok: true, settings: null };
        }
        const settings = JSON.parse(fs.readFileSync(assignStudySettingsFilePath, 'utf8'));
        return { ok: true, settings };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to load assign study settings' };
    }
});

ipcMain.handle('admin-settings-get', () => {
    try {
        const settings = readAdminSettings();
        return { ok: true, settings };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to load admin settings' };
    }
});

ipcMain.handle('mwl-query', async (_event, params) => {
    const licenseBlocked = licenseGuardResponse();
    if (licenseBlocked) return licenseBlocked;
    try {
        const { ip, port, aeTitle, startDate, endDate, maxResults } = params || {};
        if (!ip || !port || !aeTitle) {
            return { ok: false, reason: 'Set IP, port, and AE Title in Admin → Worklist Settings' };
        }
        if (!startDate || !endDate) {
            return { ok: false, reason: 'Choose a start and end date' };
        }
        const { studies, dateRange } = await queryMwlWorklist({
            ip: String(ip).trim(),
            port: String(port).trim(),
            aeTitle: String(aeTitle).trim(),
            startDate,
            endDate,
            maxResults: maxResults || 300,
        });
        mwlStudyDetailCache.clear();
        for (const study of studies) {
            mwlStudyDetailCache.set(mwlStudyKey(study), study);
        }
        return {
            ok: true,
            studies: studies.map(toMwlSummary),
            dateRange,
            count: studies.length,
        };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Worklist query failed' };
    }
});

ipcMain.handle('mwl-study-tags', (_event, studyKey) => {
    const study = mwlStudyDetailCache.get(String(studyKey || ''));
    if (!study) {
        return { ok: false, reason: 'Study not found — run Search again' };
    }
    return {
        ok: true,
        tags: study.tags || [],
        study: toMwlSummary(study),
    };
});

// Click the eye icon (load selected study)
ipcMain.handle('trigger-eye', async () => {
    if (!previewView) return { ok: false };
    try {
        const selectors = [
            'img[title*="image viewer" i]',
            '[title*="image viewer" i]',
            'img[alt*="image viewer" i]',
            'img[title*="Load selected study" i]',
            '[title*="Load selected study" i]'
        ];
        const rowSelectors = [
            'tbody tr[__gwt_row="0"][__gwt_subrow="0"]',
            'tbody tr[__gwt_row="0"]',
            '.gwt-ScrollTable table tbody tr',
            'table tbody tr',
            '[role="row"]',
            'tr'
        ];
        const did = await previewView.webContents.executeJavaScript(`
            (async function(){
                const eyeSels = ${JSON.stringify(selectors)};
                const rowSels = ${JSON.stringify(rowSelectors)};
                function firstVisible(elements){
                    for (const el of elements){ if (el && el.offsetParent !== null) return el; }
                    return null;
                }
                function clickFirstRow(){
                    // Prefer explicit GWT first data row if present
                    let best = document.querySelector('tbody tr[__gwt_row="0"][__gwt_subrow="0"]') || document.querySelector('tbody tr[__gwt_row="0"]');
                    if (!best){
                        // Fallback strategy: find all candidate rows (must contain at least one TD),
                        // keep the one with the smallest Y (closest to top) and visible.
                        let bestTop = Infinity;
                        function consider(nodes){
                            for (const el of nodes){
                                if (!el) continue;
                                const hasTd = el.querySelector && el.querySelector('td');
                                if (!hasTd) continue;
                                const r = el.getBoundingClientRect && el.getBoundingClientRect();
                                if (!r || r.height < 18 || r.width < 40) continue;
                                if (r.top < 0) continue; // skip above viewport headers
                                const style = window.getComputedStyle(el);
                                if (style.display === 'none' || style.visibility === 'hidden') continue;
                                if (r.top < bestTop) { bestTop = r.top; best = el; }
                            }
                        }
                        for (const s of rowSels){ consider(document.querySelectorAll(s)); }
                    }
                    if (best){
                        // Try to click a specific cell (3rd column typically contains patient name as per sample)
                        const nameCell = best.querySelector('td:nth-child(3) div[__gwt_cell], td:nth-child(3)');
                        const target = nameCell || best;
                        target.scrollIntoView({block:'center'});
                        target.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));
                        target.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
                        target.dispatchEvent(new MouseEvent('click',{bubbles:true}));
                        return true;
                    }
                    return false;
                }
                // Click first study row (if any)
                clickFirstRow();
                // small delay to let selection apply
                await new Promise(r=>setTimeout(r,250));
                for (const s of eyeSels){
                    const el = document.querySelector(s);
                    if (el){ el.click(); return true; }
                }
                return false;
            })();
        `, true);
        return { ok: did };
    } catch (e) {
        return { ok: false, error: e?.message };
    }
});

app.whenReady().then(async () => {
    migrateLicenseRecordIfNeeded();
    loadAppLanguage();
    // Helps Windows pick up the correct taskbar icon/app identity
    try { app.setAppUserModelId('com.web-previewer.app'); } catch { }
    registerAppShortcuts();
    await createWindow();
    hideNativeMenuBar();
    setWebPreviewEnabled(false);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    try { globalShortcut.unregisterAll(); } catch { /* ignore */ }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});