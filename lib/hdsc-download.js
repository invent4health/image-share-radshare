import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const HDSC_AUTOMATION_SCRIPT = `
(async function() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function clickEl(el) {
        if (!el) return false;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        if (typeof el.click === 'function') el.click();
        return true;
    }

    function findDownloadButton() {
        const candidates = Array.from(
            document.querySelectorAll('.download-btn, div.iconClick.download-btn, [class*="download-btn"]')
        );
        const visible = candidates.filter(isVisible);
        if (visible.length) return visible[0];
        return candidates[0] || null;
    }

    function findDicomButton() {
        const buttons = Array.from(document.querySelectorAll('button.btn, button'));
        return (
            buttons.find((b) => b.textContent.replace(/\\s+/g, ' ').trim().toUpperCase() === 'DICOM') ||
            buttons.find((b) => /^\\s*dicom\\s*$/i.test(b.textContent))
        );
    }

    function readProgressPercent() {
        const texts = Array.from(document.querySelectorAll('text, svg text'));
        let best = null;
        for (const node of texts) {
            const m = String(node.textContent || '').match(/(\\d+)\\s*%/);
            if (m) best = Math.max(best ?? 0, Number.parseInt(m[1], 10));
        }
        if (best !== null) return best;
        const bodyMatch = document.body?.innerText?.match(/(\\d+)\\s*%/);
        if (bodyMatch) return Number.parseInt(bodyMatch[1], 10);
        return null;
    }

    let downloadBtn = null;
    for (let i = 0; i < 300; i++) {
        downloadBtn = findDownloadButton();
        if (downloadBtn) break;
        await sleep(200);
    }
    if (!downloadBtn) {
        return { ok: false, error: 'HDSC download button not found' };
    }

    const studyId = downloadBtn.id || '';
    downloadBtn.classList?.remove('disabled');
    clickEl(downloadBtn);

    let dicomBtn = null;
    for (let i = 0; i < 150; i++) {
        dicomBtn = findDicomButton();
        if (dicomBtn && isVisible(dicomBtn)) break;
        await sleep(200);
    }
    if (!dicomBtn) {
        return { ok: false, error: 'DICOM button not found in download popup' };
    }
    clickEl(dicomBtn);

    let sawProgress = false;
    let lastPct = -1;
    for (let i = 0; i < 1200; i++) {
        const pct = readProgressPercent();
        if (pct !== null) {
            sawProgress = true;
            if (pct >= 100) {
                await sleep(500);
                return { ok: true, studyId, progress: pct };
            }
            const moving = pct > lastPct;
            lastPct = pct;
            await sleep(moving ? 150 : 250);
            continue;
        }
        await sleep(250);
    }

    if (!sawProgress) {
        return { ok: false, error: 'Download progress bar not detected' };
    }
    return { ok: false, error: 'Download progress did not reach 100%' };
})();
`;

const HDSC_POST_100_SCRIPT = `
(function() {
    for (const a of document.querySelectorAll('a[download], a[href$=".zip"], a[href*="blob:"]')) {
        a.click();
    }
    return { ok: true };
})();
`;

/** Convert HDSC File System Access API saves into <a download> (triggers will-download) */
const HDSC_SAVE_PICKER_HOOK = `
(function() {
    if (window.__radshareSaveHook) return { ok: true, already: true };
    window.__radshareSaveHook = true;

    if (typeof window.showSaveFilePicker !== 'function') {
        return { ok: true, hooked: false };
    }

    window.showSaveFilePicker = async function(options) {
        const suggestedName = options?.suggestedName || 'study.zip';
        return {
            kind: 'file',
            name: suggestedName,
            createWritable: async function() {
                const chunks = [];
                return {
                    write: async function(data) {
                        if (!data) return;
                        if (data instanceof Blob) {
                            chunks.push(data);
                            return;
                        }
                        if (typeof data.getReader === 'function') {
                            const reader = data.getReader();
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                if (value) chunks.push(new Blob([value]));
                            }
                            return;
                        }
                        chunks.push(new Blob([data]));
                    },
                    close: async function() {
                        const blob = new Blob(chunks, { type: 'application/zip' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = suggestedName;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 120000);
                    },
                    abort: async function() {}
                };
            }
        };
    };

    return { ok: true, hooked: true };
})();
`;

export async function injectHdscSavePickerHook(webContents) {
    if (!webContents || webContents.isDestroyed()) return;
    try {
        const result = await webContents.executeJavaScript(HDSC_SAVE_PICKER_HOOK, true);
        logHdsc('Save picker hook injected', result);
        return result;
    } catch (e) {
        logHdsc('Save picker hook inject failed', { error: e?.message });
        return null;
    }
}

export function isHdscPortalUrl(url) {
    try {
        const u = new URL(String(url || '').trim());
        return /hdsc/i.test(u.hostname) || /hdsc/i.test(String(url || ''));
    } catch {
        return /hdsc/i.test(String(url || ''));
    }
}

export function extractHdscStudyId(url) {
    try {
        const u = new URL(String(url || '').trim());
        const hash = u.hash || '';
        const fromHash = hash.match(/\/study\/([a-f0-9-]{36})/i);
        if (fromHash) return fromHash[1];
    } catch { /* ignore */ }
    return null;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function logHdsc(msg, extra) {
    const line = extra ? `${msg} ${JSON.stringify(extra)}` : msg;
    console.log(`[HDSC] ${line}`);
}

function listDownloadCandidates(downloadsDir) {
    try {
        return fs.readdirSync(downloadsDir).map((name) => ({
            name,
            fullPath: path.join(downloadsDir, name),
        }));
    } catch {
        return [];
    }
}

function isPartialDownloadName(name) {
    return /\.(crdownload|part|tmp)$/i.test(name);
}

function isArchiveName(name) {
    const ext = path.extname(name).toLowerCase();
    if (ext) return /\.(zip|dcm|tar|gz)$/i.test(ext);
    return true;
}

async function waitForStableFile(filePath, stableMs = 2000) {
    let lastSize = -1;
    let stableSince = Date.now();
    while (Date.now() - stableSince < stableMs + 4000) {
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch {
            await sleep(400);
            continue;
        }
        if (stat.size <= 0) {
            lastSize = -1;
            stableSince = Date.now();
            await sleep(400);
            continue;
        }
        if (stat.size === lastSize) {
            if (Date.now() - stableSince >= stableMs) return filePath;
        } else {
            lastSize = stat.size;
            stableSince = Date.now();
        }
        await sleep(400);
    }
    return filePath;
}

function snapshotDownloads(downloadsDir) {
    const map = new Map();
    for (const entry of listDownloadCandidates(downloadsDir)) {
        try {
            const stat = fs.statSync(entry.fullPath);
            map.set(entry.fullPath, { mtimeMs: stat.mtimeMs, size: stat.size });
        } catch { /* ignore */ }
    }
    return map;
}

function isNewOrUpdatedDownload(fullPath, beforeSnapshot, sinceMs) {
    let stat;
    try {
        stat = fs.statSync(fullPath);
    } catch {
        return false;
    }
    if (stat.size < 1024) return false;
    const prev = beforeSnapshot.get(fullPath);
    if (!prev) return stat.mtimeMs >= sinceMs - 120000;
    if (stat.mtimeMs > prev.mtimeMs + 300 || stat.size !== prev.size) return true;
    return stat.mtimeMs >= sinceMs - 120000 && stat.size > prev.size;
}

function findNewestZip(downloadsDir, beforeSnapshot, sinceMs) {
    let bestPath = null;
    let bestMtime = 0;
    for (const { name, fullPath } of listDownloadCandidates(downloadsDir)) {
        if (isPartialDownloadName(name)) continue;
        if (!isArchiveName(name)) continue;
        if (!isNewOrUpdatedDownload(fullPath, beforeSnapshot, sinceMs)) continue;
        try {
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs >= bestMtime) {
                bestMtime = stat.mtimeMs;
                bestPath = fullPath;
            }
        } catch { /* ignore */ }
    }
    return bestPath;
}

function findNewestZipInDirs(dirs, beforeSnapshot, sinceMs) {
    let bestPath = null;
    let bestMtime = 0;
    for (const dir of dirs) {
        const found = findNewestZip(dir, beforeSnapshot, sinceMs);
        if (!found) continue;
        try {
            const stat = fs.statSync(found);
            if (stat.mtimeMs >= bestMtime) {
                bestMtime = stat.mtimeMs;
                bestPath = found;
            }
        } catch { /* ignore */ }
    }
    return bestPath;
}

async function enableSilentDownloadCdp(webContents, downloadDir) {
    const dbg = webContents.debugger;
    try {
        if (!dbg.isAttached()) dbg.attach('1.3');
        const dir = downloadDir.replace(/\\/g, '/');
        const commands = [
            ['Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir, eventsEnabled: true }],
            ['Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir }],
        ];
        for (const [command, params] of commands) {
            try {
                await dbg.sendCommand(command, params);
                logHdsc('CDP silent download enabled', { command, dir });
            } catch (e) {
                logHdsc('CDP command skipped', { command, error: e?.message });
            }
        }
    } catch (e) {
        logHdsc('CDP attach failed', { error: e?.message });
    }
}

async function disableSilentDownloadCdp(webContents) {
    try {
        if (!webContents?.debugger?.isAttached()) return;
        await webContents.debugger.sendCommand('Browser.setDownloadBehavior', { behavior: 'default' });
        webContents.debugger.detach();
    } catch { /* ignore */ }
}

/** Find Windows Save As dialog and press Enter (same as clicking Save) */
async function autoConfirmWindowsSaveDialog() {
    if (process.platform !== 'win32') return;
    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class RadshareWin32 {
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@
$target = [IntPtr]::Zero
[RadshareWin32]::EnumWindows({
    param($hWnd, $lParam)
    if (-not [RadshareWin32]::IsWindowVisible($hWnd)) { return $true }
    $sb = New-Object System.Text.StringBuilder 512
    [void][RadshareWin32]::GetWindowText($hWnd, $sb, 512)
    $t = $sb.ToString()
    if ($t -match 'Save As|Speichern unter|Speichern|Save') {
        $script:target = $hWnd
        return $false
    }
    return $true
}, [IntPtr]::Zero) | Out-Null
if ($target -ne [IntPtr]::Zero) {
    [RadshareWin32]::SetForegroundWindow($target) | Out-Null
    Start-Sleep -Milliseconds 350
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
    Write-Output 'confirmed'
} else {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
    Write-Output 'fallback-enter'
}
`;
    try {
        const { stdout } = await execFileAsync(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
            { windowsHide: true }
        );
        logHdsc('Save As auto-confirm', { result: String(stdout || '').trim() });
    } catch (e) {
        logHdsc('Save As auto-confirm failed', { error: e?.message });
    }
}

function scheduleSaveAsAutoConfirm() {
    for (const delay of [400, 900, 1500, 2500, 4000, 6000, 9000]) {
        setTimeout(() => {
            autoConfirmWindowsSaveDialog().catch(() => {});
        }, delay);
    }
}

/** Wait for zip — CDP silent save, auto-confirm Save As, folder watch */
function waitForHdscZipFile(session, watchDirs, beforeSnapshot, sinceMs, timeoutMs) {
    return new Promise((resolve, reject) => {
        let settled = false;

        const finish = (filePath) => {
            if (settled || !filePath) return;
            settled = true;
            cleanup();
            logHdsc('Zip file ready', { filePath });
            waitForStableFile(filePath)
                .then((stable) => resolve(stable))
                .catch(() => resolve(filePath));
        };

        const fail = (err) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(err);
        };

        const timer = setTimeout(
            () => fail(new Error('Timed out waiting for HDSC zip — check Downloads\\radshare-hdsc')),
            timeoutMs
        );

        const scanFolders = () => {
            const found = findNewestZipInDirs(watchDirs, beforeSnapshot, sinceMs);
            if (found) finish(found);
        };

        const interval = setInterval(scanFolders, 300);

        const onDownload = (event, item) => {
            const filename = item.getFilename() || `hdsc-${Date.now()}.zip`;
            if (isPartialDownloadName(filename)) return;

            logHdsc('will-download event', { filename });

            event.preventDefault();
            const primaryDir = watchDirs[0] || watchDirs[watchDirs.length - 1];
            const safeName = filename.replace(/[<>:"/\\|?*]/g, '_');
            const targetPath = path.join(primaryDir, safeName);
            try {
                fs.mkdirSync(primaryDir, { recursive: true });
            } catch { /* ignore */ }
            item.setSavePath(targetPath);

            item.on('updated', (_evt, state) => {
                if (state === 'progressing') scanFolders();
            });

            item.once('done', (_evt, state) => {
                const savePath = item.getSavePath() || targetPath;
                logHdsc('will-download finished', { state, savePath });
                if (state === 'completed' && savePath) {
                    finish(savePath);
                } else {
                    scanFolders();
                }
            });
        };

        session.on('will-download', onDownload);
        scanFolders();

        function cleanup() {
            clearTimeout(timer);
            clearInterval(interval);
            session.removeListener('will-download', onDownload);
        }
    });
}

const HDSC_PAGE_READY_CHECK = `
(function() {
    const hasDownload = !!document.querySelector('.download-btn, div.iconClick.download-btn, [class*="download-btn"]');
    const hasApp = !!document.querySelector('#app, [id*="app"], [class*="viewer"], [class*="study"]');
    const hash = String(location.hash || '');
    const onStudy = /\\/study\\//i.test(hash) || /\\/login/i.test(hash);
    return hasDownload || (hasApp && onStudy);
})();
`;

async function waitForHdscPortalReady(webContents, url, timeoutMs = 120000) {
    const started = Date.now();
    let navigated = false;

    await new Promise((resolve, reject) => {
        const hardTimeout = setTimeout(() => {
            cleanup();
            resolve();
        }, timeoutMs);

        const onNav = () => {
            navigated = true;
        };

        function cleanup() {
            clearTimeout(hardTimeout);
            webContents.removeListener('did-finish-load', onNav);
            webContents.removeListener('did-navigate-in-page', onNav);
            webContents.removeListener('dom-ready', onNav);
        }

        webContents.on('did-finish-load', onNav);
        webContents.on('did-navigate-in-page', onNav);
        webContents.on('dom-ready', onNav);
        webContents.loadURL(url).catch((err) => {
            cleanup();
            reject(err);
        });

        const poll = setInterval(async () => {
            if (!navigated) return;
            try {
                const ready = await webContents.executeJavaScript(HDSC_PAGE_READY_CHECK, true);
                if (ready) {
                    clearInterval(poll);
                    cleanup();
                    resolve();
                }
            } catch { /* page still loading */ }
            if (Date.now() - started > timeoutMs) {
                clearInterval(poll);
                cleanup();
                resolve();
            }
        }, 150);
    });

    while (Date.now() - started < timeoutMs) {
        try {
            const ready = await webContents.executeJavaScript(HDSC_PAGE_READY_CHECK, true);
            if (ready) {
                await sleep(200);
                return;
            }
        } catch { /* ignore */ }
        await sleep(150);
    }
}

export async function downloadHdscStudyFromPreview(previewView, portalUrl, { downloadsDir }) {
    if (!previewView?.webContents) {
        throw new Error('Web preview is not available');
    }

    const webContents = previewView.webContents;
    const session = webContents.session;
    const hdscDir = path.join(downloadsDir, 'radshare-hdsc');
    fs.mkdirSync(hdscDir, { recursive: true });
    logHdsc('Using download folder', { hdscDir });

    try {
        session.setDownloadPath(hdscDir);
    } catch { /* ignore */ }
    try {
        webContents.setBackgroundThrottling?.(false);
    } catch { /* ignore */ }

    await enableSilentDownloadCdp(webContents, hdscDir);

    const studyHint = extractHdscStudyId(portalUrl);
    const sinceMs = Date.now();
    const watchDirs = [hdscDir, downloadsDir];
    const beforeSnapshot = new Map();
    for (const dir of watchDirs) {
        for (const [k, v] of snapshotDownloads(dir)) beforeSnapshot.set(k, v);
    }
    const timeoutMs = 8 * 60 * 1000;

    try {
        logHdsc('Loading portal (persistent session, Chrome UA)');
        await waitForHdscPortalReady(webContents, portalUrl);

        try {
            const hookResult = await webContents.executeJavaScript(HDSC_SAVE_PICKER_HOOK, true);
            logHdsc('Save picker hook', hookResult);
        } catch (e) {
            logHdsc('Save picker hook failed', { error: e?.message });
        }

        const fileWait = waitForHdscZipFile(session, watchDirs, beforeSnapshot, sinceMs, timeoutMs);

        const autoResult = await webContents.executeJavaScript(HDSC_AUTOMATION_SCRIPT, true);
        if (!autoResult?.ok) {
            throw new Error(autoResult?.error || 'HDSC portal automation failed');
        }
        logHdsc('Portal preparation reached 100%', autoResult);

        // Save As dialog appears here on HDSC — auto-click Save (Enter)
        scheduleSaveAsAutoConfirm();

        try {
            await webContents.executeJavaScript(HDSC_POST_100_SCRIPT, true);
        } catch { /* ignore */ }

        logHdsc('Waiting for zip file…', { watchDirs });
        const finalPath = await fileWait;
        return {
            path: finalPath,
            studyUid: autoResult.studyId || studyHint || path.basename(finalPath, path.extname(finalPath)),
            progress: autoResult.progress,
        };
    } finally {
        await disableSilentDownloadCdp(webContents);
    }
}
