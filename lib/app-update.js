import { execFile } from 'child_process';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const execFileAsync = promisify(execFile);

export const UPDATE_REPO_ZIP_URL =
    'https://github.com/invent4health/image-share-radshare/archive/refs/heads/main.zip';
export const UPDATE_PACKAGE_JSON_URL =
    'https://raw.githubusercontent.com/invent4health/image-share-radshare/main/package.json';

const PRESERVE_FILES = new Set([
    'send-settings.json',
    'assign-study-settings.json',
    'admin-settings.json',
    'pacs.json',
]);

const SKIP_COPY_DIRS = new Set([
    'node_modules',
    '.git',
    'received-dicom',
]);

function httpsGetText(url, redirect = 0) {
    return new Promise((resolve, reject) => {
        if (redirect > 5) {
            reject(new Error('Too many redirects'));
            return;
        }
        https
            .get(
                url,
                {
                    headers: {
                        'User-Agent': 'CognizanceHealth-Updater',
                        Accept: 'application/json,text/plain,*/*',
                    },
                },
                (res) => {
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        res.resume();
                        httpsGetText(res.headers.location, redirect + 1).then(resolve, reject);
                        return;
                    }
                    if (res.statusCode !== 200) {
                        res.resume();
                        reject(new Error(`Download failed (${res.statusCode})`));
                        return;
                    }
                    const chunks = [];
                    res.on('data', (c) => chunks.push(c));
                    res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
                    res.on('error', reject);
                },
            )
            .on('error', reject);
    });
}

function httpsGetBuffer(url, redirect = 0) {
    return new Promise((resolve, reject) => {
        if (redirect > 5) {
            reject(new Error('Too many redirects'));
            return;
        }
        https
            .get(
                url,
                {
                    headers: {
                        'User-Agent': 'CognizanceHealth-Updater',
                        Accept: 'application/zip,*/*',
                    },
                },
                (res) => {
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        res.resume();
                        httpsGetBuffer(res.headers.location, redirect + 1).then(resolve, reject);
                        return;
                    }
                    if (res.statusCode !== 200) {
                        res.resume();
                        reject(new Error(`Download failed (${res.statusCode})`));
                        return;
                    }
                    const chunks = [];
                    res.on('data', (c) => chunks.push(c));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', reject);
                },
            )
            .on('error', reject);
    });
}

export function parseVersionParts(version) {
    return String(version || '0.0.0')
        .trim()
        .replace(/^v/i, '')
        .split('.')
        .map((part) => {
            const n = parseInt(String(part).replace(/\D.*$/, ''), 10);
            return Number.isFinite(n) ? n : 0;
        });
}

export function isRemoteVersionNewer(remoteVersion, localVersion) {
    const remote = parseVersionParts(remoteVersion);
    const local = parseVersionParts(localVersion);
    const len = Math.max(remote.length, local.length);
    for (let i = 0; i < len; i += 1) {
        const r = remote[i] || 0;
        const l = local[i] || 0;
        if (r > l) return true;
        if (r < l) return false;
    }
    return false;
}

export function readLocalPackageVersion(appRoot) {
    const pkgPath = path.join(appRoot, 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    return String(pkg.version || '0.0.0');
}

export async function fetchRemotePackageVersion() {
    const raw = await httpsGetText(UPDATE_PACKAGE_JSON_URL);
    const pkg = JSON.parse(raw);
    return String(pkg.version || '0.0.0');
}

export async function checkForAppUpdate(appRoot) {
    const localVersion = readLocalPackageVersion(appRoot);
    const remoteVersion = await fetchRemotePackageVersion();
    const updateAvailable = isRemoteVersionNewer(remoteVersion, localVersion);
    return {
        ok: true,
        localVersion,
        remoteVersion,
        updateAvailable,
    };
}

function copyRecursive(src, dest, appRoot, preservedFiles) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        const name = path.basename(src);
        if (SKIP_COPY_DIRS.has(name)) return;
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry), appRoot, preservedFiles);
        }
        return;
    }

    const rel = path.relative(appRoot, dest);
    if (PRESERVE_FILES.has(rel) && preservedFiles[rel] !== undefined) {
        return;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

async function runNpmInstall(appRoot) {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await execFileAsync(npmCmd, ['install', '--no-fund', '--no-audit'], {
        cwd: appRoot,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
    });
}

export async function applyAppUpdate(appRoot, onStatus) {
    const notify = (message) => {
        if (typeof onStatus === 'function') onStatus(message);
    };

    notify('Checking version…');
    const check = await checkForAppUpdate(appRoot);
    if (!check.updateAvailable) {
        return { ok: true, updated: false, ...check };
    }

    const preservedFiles = {};
    for (const name of PRESERVE_FILES) {
        const filePath = path.join(appRoot, name);
        if (fs.existsSync(filePath)) {
            preservedFiles[name] = fs.readFileSync(filePath);
        }
    }

    notify('Downloading update…');
    const zipBuffer = await httpsGetBuffer(UPDATE_REPO_ZIP_URL);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cognizance-update-'));
    const zipPath = path.join(tempRoot, 'source.zip');
    fs.writeFileSync(zipPath, zipBuffer);

    notify('Extracting update…');
    const extractDir = path.join(tempRoot, 'extract');
    fs.mkdirSync(extractDir, { recursive: true });
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    const entries = fs.readdirSync(extractDir);
    const sourceFolder = entries.length === 1 && fs.statSync(path.join(extractDir, entries[0])).isDirectory()
        ? path.join(extractDir, entries[0])
        : extractDir;

    notify('Installing files…');
    for (const entry of fs.readdirSync(sourceFolder)) {
        const src = path.join(sourceFolder, entry);
        const dest = path.join(appRoot, entry);
        if (SKIP_COPY_DIRS.has(entry)) continue;
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
        }
        if (fs.statSync(src).isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            for (const sub of fs.readdirSync(src)) {
                copyRecursive(path.join(src, sub), path.join(dest, sub), appRoot, preservedFiles);
            }
        } else {
            const rel = entry;
            if (PRESERVE_FILES.has(rel) && preservedFiles[rel] !== undefined) continue;
            fs.copyFileSync(src, dest);
        }
    }

    for (const [name, content] of Object.entries(preservedFiles)) {
        fs.writeFileSync(path.join(appRoot, name), content);
    }

    notify('Updating dependencies…');
    await runNpmInstall(appRoot);

    try {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch { /* ignore */ }

    const localVersion = readLocalPackageVersion(appRoot);
    return {
        ok: true,
        updated: true,
        localVersion,
        remoteVersion: check.remoteVersion,
        updateAvailable: false,
    };
}
