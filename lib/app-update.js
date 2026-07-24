import { execFile } from 'child_process';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const execFileAsync = promisify(execFile);
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const UPDATER_SCRIPT_PATH = path.join(moduleDir, 'apply-update.ps1');

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

export function isAppRootWritable(appRoot) {
    try {
        const probePath = path.join(appRoot, `.update-write-test-${process.pid}`);
        fs.writeFileSync(probePath, 'ok');
        fs.unlinkSync(probePath);
        return true;
    } catch {
        return false;
    }
}

function readPreservedFiles(appRoot) {
    const preservedFiles = {};
    for (const name of PRESERVE_FILES) {
        const filePath = path.join(appRoot, name);
        if (fs.existsSync(filePath)) {
            preservedFiles[name] = fs.readFileSync(filePath);
        }
    }
    return preservedFiles;
}

function writePreserveDir(preserveDir, preservedFiles) {
    fs.mkdirSync(preserveDir, { recursive: true });
    for (const [name, content] of Object.entries(preservedFiles)) {
        fs.writeFileSync(path.join(preserveDir, name), content);
    }
}

function resolveLaunchCommand(appRoot) {
    const launchCmd = path.resolve(appRoot, '..', 'launch-app.cmd');
    return fs.existsSync(launchCmd) ? launchCmd : '';
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

async function downloadAndExtractUpdate(tempRoot, onStatus) {
    onStatus?.('Downloading update…');
    const zipBuffer = await httpsGetBuffer(UPDATE_REPO_ZIP_URL);
    const zipPath = path.join(tempRoot, 'source.zip');
    fs.writeFileSync(zipPath, zipBuffer);

    onStatus?.('Extracting update…');
    const extractDir = path.join(tempRoot, 'extract');
    fs.mkdirSync(extractDir, { recursive: true });
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    const entries = fs.readdirSync(extractDir);
    const sourceFolder = entries.length === 1 && fs.statSync(path.join(extractDir, entries[0])).isDirectory()
        ? path.join(extractDir, entries[0])
        : extractDir;

    return sourceFolder;
}

async function applyInProcessUpdate(appRoot, sourceFolder, preservedFiles, onStatus) {
    onStatus?.('Installing files…');
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
            if (PRESERVE_FILES.has(entry) && preservedFiles[entry] !== undefined) continue;
            fs.copyFileSync(src, dest);
        }
    }

    for (const [name, content] of Object.entries(preservedFiles)) {
        fs.writeFileSync(path.join(appRoot, name), content);
    }

    onStatus?.('Updating dependencies…');
    await runNpmInstall(appRoot);
}

function psSingleQuote(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
}

async function launchElevatedUpdate({ tempRoot, sourceFolder, appRoot, preserveDir, launchCmd, logFile }) {
    if (!fs.existsSync(UPDATER_SCRIPT_PATH)) {
        throw new Error('Updater script is missing from this installation. Please reinstall the app.');
    }

    const updaterScriptCopy = path.join(tempRoot, 'apply-update.ps1');
    fs.copyFileSync(UPDATER_SCRIPT_PATH, updaterScriptCopy);

    const paramsFile = path.join(tempRoot, 'update-params.json');
    fs.writeFileSync(
        paramsFile,
        JSON.stringify(
            {
                sourceDir: sourceFolder,
                appRoot,
                preserveDir,
                parentPid: process.pid,
                launchCmd,
                tempRoot,
                logFile,
            },
            null,
            2,
        ) + os.EOL,
        'utf8',
    );

    const psCommand = [
        '$ErrorActionPreference = "Stop";',
        `$script = ${psSingleQuote(updaterScriptCopy)};`,
        `$params = ${psSingleQuote(paramsFile)};`,
        '$proc = Start-Process -FilePath powershell.exe -Verb RunAs -PassThru -WindowStyle Hidden -ArgumentList @(',
        "'-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',$script,'-ParamsFile',$params);",
        'if ($null -eq $proc) { exit 1 }',
        'exit 0',
    ].join(' ');

    await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
        {
            windowsHide: true,
            maxBuffer: 1024 * 1024,
        },
    );
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

    const preservedFiles = readPreservedFiles(appRoot);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cognizance-update-'));
    const preserveDir = path.join(tempRoot, 'preserve');
    writePreserveDir(preserveDir, preservedFiles);
    const logFile = path.join(tempRoot, 'update.log');

    try {
        const sourceFolder = await downloadAndExtractUpdate(tempRoot, notify);
        const needsElevation = process.platform === 'win32' && !isAppRootWritable(appRoot);

        if (needsElevation) {
            notify('Waiting for administrator approval…');
            const launchCmd = resolveLaunchCommand(appRoot);
            await launchElevatedUpdate({
                tempRoot,
                sourceFolder,
                appRoot,
                preserveDir,
                launchCmd,
                logFile,
            });
            return {
                ok: true,
                updated: true,
                elevated: true,
                localVersion: check.localVersion,
                remoteVersion: check.remoteVersion,
                updateAvailable: false,
            };
        }

        await applyInProcessUpdate(appRoot, sourceFolder, preservedFiles, notify);

        try {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        } catch { /* ignore */ }

        const localVersion = readLocalPackageVersion(appRoot);
        return {
            ok: true,
            updated: true,
            elevated: false,
            localVersion,
            remoteVersion: check.remoteVersion,
            updateAvailable: false,
        };
    } catch (e) {
        try {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        } catch { /* ignore */ }

        const message = e?.message || 'Update failed';
        if (/EPERM|operation not permitted|access is denied|EACCES/i.test(message)) {
            throw new Error(
                'Update needs administrator permission because the app is installed in Program Files. Click Yes on the Windows permission prompt, or reinstall from the latest installer.',
            );
        }
        if (/canceled|cancelled|1223/i.test(message)) {
            throw new Error('Update was cancelled. Administrator permission is required.');
        }
        throw e;
    }
}
