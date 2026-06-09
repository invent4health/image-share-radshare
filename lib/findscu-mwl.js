import { execFile } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export function getFindscuCommand() {
    const chocolateyFindscu = 'C:\\ProgramData\\chocolatey\\bin\\findscu.exe';
    if (fs.existsSync(chocolateyFindscu)) {
        return chocolateyFindscu;
    }
    return 'findscu';
}

export function toDicomDateRange(startDate, endDate) {
    const s = String(startDate || '').replace(/\D/g, '');
    const e = String(endDate || '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(s) || !/^\d{8}$/.test(e)) {
        throw new Error('Invalid date — use YYYY-MM-DD');
    }
    if (s > e) throw new Error('Start date must be on or before end date');
    return s === e ? s : `${s}-${e}`;
}

export function formatDicomPatientName(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const parts = s.split('^').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts.slice(1).join(' ')}`;
    return parts[0] || s;
}

function newMwlRow() {
    return {
        patientName: '',
        patientId: '',
        accessionNumber: '',
        modality: '',
        description: '',
        tags: [],
    };
}

function isMeaningfulMwlRow(row) {
    if (!row) return false;
    if (row.patientName || row.patientId || row.accessionNumber) return true;
    return (row.tags || []).some((t) => t.tag !== '0008,0005');
}

function pushMwlRow(studies, row) {
    if (!isMeaningfulMwlRow(row)) return;
    studies.push(row);
}

export function parseFindscuMwlOutput(text) {
    const studies = [];
    let current = null;

    for (const line of String(text || '').split(/\r?\n/)) {
        if (/Find Response:\s*\d+\s*\(Pending\)/i.test(line)) {
            pushMwlRow(studies, current);
            current = newMwlRow();
            continue;
        }
        if (!current) continue;

        const tagMatch = line.match(/\(([0-9a-fA-F]{4}),([0-9a-fA-F]{4})\)\s+(\w+)\s+\[([^\]]*)\]/);
        if (!tagMatch) continue;

        const [, group, element, vr, value] = tagMatch;
        const v = String(value || '').trim();
        const tag = `${group},${element}`.toUpperCase();

        current.tags.push({ tag, vr: String(vr || '').toUpperCase(), value: v });

        if (tag === '0010,0010') current.patientName = formatDicomPatientName(v);
        else if (tag === '0010,0020') current.patientId = v;
        else if (tag === '0008,0050') current.accessionNumber = v;
        else if (tag === '0008,0060') current.modality = v;
        else if (tag === '0040,0007') current.description = v;
    }

    pushMwlRow(studies, current);

    const byKey = new Map();
    for (const row of studies) {
        const key = `${row.accessionNumber}|${row.patientId}|${row.patientName}`;
        const prev = byKey.get(key);
        if (!prev || (row.tags?.length || 0) > (prev.tags?.length || 0)) {
            byKey.set(key, row);
        }
    }
    return Array.from(byKey.values());
}

export async function queryMwlWorklist({
    ip,
    port,
    aeTitle,
    startDate,
    endDate,
    callingAet = 'FINDSCU',
    maxResults = 300,
}) {
    const findscu = getFindscuCommand();
    const dateRange = toDicomDateRange(startDate, endDate);
    const args = [
        '-W',
        '-aec',
        String(aeTitle),
        '-aet',
        String(callingAet),
        String(ip),
        String(port),
        '-k',
        `ScheduledProcedureStepStartDate=${dateRange}`,
        '-k',
        'PatientName=',
        '-k',
        'PatientID=',
        '-k',
        'AccessionNumber=',
        '-k',
        'Modality=',
        '-k',
        'ScheduledProcedureStepDescription=',
        '-k',
        'ScheduledProcedureStepStartTime=',
        '-k',
        'ScheduledProcedureStepID=',
        '-k',
        'RequestedProcedureID=',
        '-k',
        'RequestedProcedureDescription=',
        '-k',
        'StudyInstanceUID=',
        '-k',
        'ScheduledStationAETitle=',
        '-k',
        'ScheduledPerformingPhysicianName=',
        '-k',
        'PatientBirthDate=',
        '-k',
        'PatientSex=',
        '--cancel',
        String(Math.max(1, Math.min(maxResults, 2000))),
    ];

    let stdout = '';
    let stderr = '';
    try {
        const result = await execFileAsync(findscu, args, {
            maxBuffer: 64 * 1024 * 1024,
            windowsHide: true,
        });
        stdout = result.stdout || '';
        stderr = result.stderr || '';
    } catch (e) {
        stdout = e?.stdout || '';
        stderr = e?.stderr || '';
        const combined = `${stdout}\n${stderr}`;
        if (!/Find Response:/i.test(combined)) {
            throw new Error(
                e?.message ||
                    stderr?.trim()?.slice(0, 200) ||
                    'findscu failed — check IP, port, and AE Title in Worklist Settings'
            );
        }
    }

    const studies = parseFindscuMwlOutput(`${stdout}\n${stderr}`);
    return { studies, dateRange };
}
