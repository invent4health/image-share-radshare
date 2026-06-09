import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export function getDcmodifyCommand() {
    const chocolatey = 'C:\\ProgramData\\chocolatey\\bin\\dcmodify.exe';
    if (fs.existsSync(chocolatey)) return chocolatey;
    // Older DCMTK builds may ship dcmmodify instead
    const legacy = 'C:\\ProgramData\\chocolatey\\bin\\dcmmodify.exe';
    if (fs.existsSync(legacy)) return legacy;
    return 'dcmodify';
}

export function displayNameToDicomPn(display) {
    const s = String(display || '').trim();
    if (!s) return '';
    if (s.includes('^')) return s;
    const comma = s.indexOf(',');
    if (comma >= 0) {
        const last = s.slice(0, comma).trim();
        const rest = s.slice(comma + 1).trim();
        return rest ? `${last}^${rest}` : last;
    }
    return s;
}

export function dobToDicomDa(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const digits = s.replace(/\D/g, '');
    if (/^\d{8}$/.test(digits)) return digits;
    const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
        const [, d, m, y] = slash;
        return `${y}${m.padStart(2, '0')}${d.padStart(2, '0')}`;
    }
    return digits.slice(0, 8);
}

export function genderToDicomCs(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const u = s.toUpperCase();
    if (u === 'M' || u === 'MALE') return 'M';
    if (u === 'F' || u === 'FEMALE') return 'F';
    if (u === 'O' || u === 'OTHER') return 'O';
    return s.length === 1 ? u : s;
}

export function normalizeAssignedMetadata(input = {}) {
    const out = {};
    const name = input.patientName || input.patientNameRaw;
    if (name) out.patientName = displayNameToDicomPn(name);
    if (input.patientId) out.patientId = String(input.patientId).trim();
    const dob = dobToDicomDa(input.dob || input.patientBirthDate);
    if (dob) out.dob = dob;
    const gender = genderToDicomCs(input.gender || input.patientSex);
    if (gender) out.gender = gender;
    if (input.modality) out.modality = String(input.modality).trim();
    if (input.accessionNumber) out.accessionNumber = String(input.accessionNumber).trim();
    return out;
}

function buildModifyArgs(metadata) {
    const args = ['-nb', '-imt'];
    const pairs = [
        ['0010,0010', metadata.patientName],
        ['0010,0020', metadata.patientId],
        ['0010,0030', metadata.dob],
        ['0010,0040', metadata.gender],
        ['0008,0060', metadata.modality],
        ['0008,0050', metadata.accessionNumber],
    ];
    for (const [tag, value] of pairs) {
        if (value && String(value).trim()) {
            args.push('-m', `${tag}=${String(value).trim()}`);
        }
    }
    return args;
}

export async function applyAssignedMetadataToDicomFiles(dicomFiles, assignedMetadata) {
    const meta = normalizeAssignedMetadata(assignedMetadata);
    const modifyPairs = buildModifyArgs(meta);
    if (modifyPairs.length <= 2) {
        return { ok: false, reason: 'No assigned metadata fields to apply' };
    }
    if (!dicomFiles?.length) {
        return { ok: false, reason: 'No DICOM files to modify' };
    }

    const dcmodify = getDcmodifyCommand();
    let modified = 0;
    const errors = [];

    for (const filePath of dicomFiles) {
        try {
            await execFileAsync(dcmodify, [...modifyPairs, filePath], {
                maxBuffer: 4 * 1024 * 1024,
                windowsHide: true,
            });
            modified += 1;
        } catch (e) {
            const msg = e?.stderr || e?.message || 'dcmodify failed';
            errors.push(`${filePath}: ${String(msg).trim().slice(0, 120)}`);
        }
    }

    if (modified === 0) {
        return {
            ok: false,
            reason: errors[0] || 'dcmodify failed on all files — is DCMTK installed?',
        };
    }

    return {
        ok: true,
        filesModified: modified,
        metadata: meta,
        warnings: errors.length ? errors.slice(0, 3) : [],
    };
}
