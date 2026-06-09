import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const execFileAsync = promisify(execFile);

const TAGS = {
    patientId: '0010,0020',
    patientName: '0010,0010',
    dob: '0010,0030',
    gender: '0010,0040',
    modality: '0008,0060',
};

function getDcmdumpPath() {
    const chocolatey = 'C:\\ProgramData\\chocolatey\\bin\\dcmdump.exe';
    if (fs.existsSync(chocolatey)) return chocolatey;
    return 'dcmdump';
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

function parseTagValue(dumpText, tag) {
    const re = new RegExp(`\\(${tag}\\)[^\\n]*\\[([^\\]]*)\\]`, 'gi');
    let match;
    while ((match = re.exec(dumpText)) !== null) {
        let value = match[1].trim();
        if (!value || /\(no value available\)/i.test(value)) continue;
        // PN values may use =encoding for non-ASCII; keep readable part before =
        if (value.includes('=')) {
            const parts = value.split('=');
            if (parts[0].trim()) value = parts[0].trim();
        }
        if (value) return value;
    }
    return null;
}

async function runDcmdumpOnFile(dicomPath) {
    const dcmdump = getDcmdumpPath();
    const tagArgs = Object.values(TAGS).flatMap((t) => ['+P', t]);
    const { stdout } = await execFileAsync(
        dcmdump,
        [...tagArgs, dicomPath],
        { maxBuffer: 2 * 1024 * 1024, windowsHide: true }
    );
    const text = String(stdout || '');
    const result = {};
    for (const [key, tag] of Object.entries(TAGS)) {
        result[key] = parseTagValue(text, tag);
    }
    return result;
}

export async function readMetadataFromZip(zipPath) {
    if (!zipPath || !fs.existsSync(zipPath)) {
        return { ok: false, reason: 'ZIP file not found' };
    }

    const extractDir = path.join(os.tmpdir(), `web_preview_meta_${Date.now()}`);
    try {
        fs.mkdirSync(extractDir, { recursive: true });
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);

        const dicomFiles = collectDicomFiles(extractDir);
        if (dicomFiles.length === 0) {
            return {
                ok: true,
                metadata: emptyMetadata(),
                warnings: ['No DICOM files found in ZIP'],
            };
        }

        let metadata;
        let warnings = [];
        try {
            metadata = await runDcmdumpOnFile(dicomFiles[0]);
        } catch (e) {
            warnings.push(e?.message || 'dcmdump failed');
            metadata = emptyMetadata();
        }

        const availability = {};
        for (const key of Object.keys(TAGS)) {
            const val = metadata[key];
            availability[key] = Boolean(val && String(val).trim());
        }

        return { ok: true, metadata, availability, warnings, dicomFileCount: dicomFiles.length };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Failed to read DICOM metadata' };
    } finally {
        try {
            fs.rmSync(extractDir, { recursive: true, force: true });
        } catch { /* ignore */ }
    }
}

function emptyMetadata() {
    return {
        patientId: null,
        patientName: null,
        dob: null,
        gender: null,
        modality: null,
    };
}
