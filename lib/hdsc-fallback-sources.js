import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

/** Known portal links → direct zip source (Google Drive, etc.) */
const PORTAL_FALLBACKS = [
    {
        id: 'hdsc-demo-barney-burke',
        portalMatch(portalUrl) {
            try {
                const raw = String(portalUrl || '').trim();
                const u = new URL(raw);
                const hashQuery = u.hash.includes('?') ? u.hash.slice(u.hash.indexOf('?') + 1) : '';
                const params = new URLSearchParams(hashQuery);
                const hac = params.get('hac') || u.searchParams.get('hac');
                const bd = params.get('bd') || u.searchParams.get('bd');
                return hac === '5BKW5NCQGD4E' && bd === '20010409';
            } catch {
                const s = String(portalUrl || '');
                return /hac=5BKW5NCQGD4E/i.test(s) && /bd=20010409/i.test(s);
            }
        },
        sourceUrl: 'https://drive.google.com/file/d/1YAHzDWX4jK4jIFFByfxl9dX1RMUef7RA/view?usp=sharing',
        filename: 'Barney^BurkeDICOM.zip',
        studyUid: 'hdsc-5BKW5NCQGD4E',
    },
    {
        id: 'jivex-gmz9q-o7kes-yagvs',
        portalMatch(portalUrl) {
            try {
                const raw = String(portalUrl || '').trim();
                const u = new URL(raw);
                if (!/jivexmobile\.visus\.com/i.test(u.hostname)) return false;
                const code = u.searchParams.get('code');
                return code === 'GMZ9Q-O7KES-YAGVS';
            } catch {
                const s = String(portalUrl || '');
                return /jivexmobile\.visus\.com/i.test(s) && /code=GMZ9Q-O7KES-YAGVS/i.test(s);
            }
        },
        sourceUrl: 'https://drive.google.com/file/d/1WJXLSzgigx_q4AK0Q0ppt4sDeAaX3yGK/view?usp=sharing',
        filename: 'download.zip',
        studyUid: 'jivex-GMZ9Q-O7KES-YAGVS',
    },
];

export function resolvePortalFallbackDownload(portalUrl) {
    for (const entry of PORTAL_FALLBACKS) {
        if (entry.portalMatch(portalUrl)) {
            return {
                sourceUrl: entry.sourceUrl,
                filename: entry.filename,
                studyUid: entry.studyUid || null,
            };
        }
    }
    return null;
}

/** @deprecated use resolvePortalFallbackDownload */
export function resolveHdscFallbackDownload(portalUrl) {
    return resolvePortalFallbackDownload(portalUrl);
}

export function extractGoogleDriveFileId(url) {
    const s = String(url || '');
    let m = s.match(/\/file\/d\/([^/?]+)/i);
    if (m) return m[1];
    m = s.match(/[?&]id=([^&]+)/i);
    if (m) return m[1];
    return null;
}

function emitProgress(onProgress, received, total) {
    if (typeof onProgress !== 'function') return;
    const percent = total > 0 ? Math.min(100, Math.floor((received / total) * 100)) : null;
    onProgress({ received, total, percent });
}

function httpGet(url, maxRedirects = 8) {
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
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    Accept: '*/*',
                },
            },
            (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
                    res.resume();
                    const next = new URL(res.headers.location, u).toString();
                    resolve(httpGet(next, maxRedirects - 1));
                    return;
                }
                resolve(res);
            }
        );
        req.on('error', reject);
        req.setTimeout(5 * 60 * 1000, () => {
            req.destroy();
            reject(new Error('Google Drive download timed out'));
        });
    });
}

function readResponseBody(res) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
    });
}

function parseDriveConfirmParams(html, fileId) {
    const text = String(html || '');
    const confirmHidden = text.match(/name="confirm"[^>]*value="([^"]+)"/i);
    const uuidHidden = text.match(/name="uuid"[^>]*value="([^"]+)"/i);
    if (confirmHidden) {
        const params = new URLSearchParams({
            id: fileId,
            export: 'download',
            confirm: confirmHidden[1],
        });
        if (uuidHidden?.[1]) params.set('uuid', uuidHidden[1]);
        return `https://drive.usercontent.google.com/download?${params.toString()}`;
    }
    const inline = text.match(/confirm=([0-9A-Za-z_]+)/);
    if (inline) {
        return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${inline[1]}`;
    }
    return null;
}

function isZipContentType(contentType) {
    const ct = String(contentType || '').toLowerCase();
    return (
        ct.includes('application/zip') ||
        ct.includes('application/x-zip') ||
        ct.includes('application/octet-stream') ||
        ct.includes('binary/octet-stream')
    );
}

function streamResponseToFile(res, outPath, onProgress) {
    return new Promise((resolve, reject) => {
        const total = Number.parseInt(res.headers['content-length'], 10) || 0;
        let received = 0;
        emitProgress(onProgress, 0, total);

        const file = fs.createWriteStream(outPath);
        res.on('data', (chunk) => {
            received += chunk.length;
            if (!file.write(chunk)) {
                res.pause();
                file.once('drain', () => res.resume());
            }
            emitProgress(onProgress, received, total);
        });
        res.on('end', () => {
            file.end(() => {
                file.close(() => {
                    emitProgress(onProgress, received, total > 0 ? total : received);
                    resolve({ path: outPath, bytes: received });
                });
            });
        });
        res.on('error', (err) => {
            file.destroy();
            try {
                fs.unlinkSync(outPath);
            } catch { /* ignore */ }
            reject(err);
        });
        file.on('error', (err) => {
            try {
                file.close(() => {});
            } catch { /* ignore */ }
            try {
                fs.unlinkSync(outPath);
            } catch { /* ignore */ }
            reject(err);
        });
    });
}

/** Download a Google Drive shared file to disk (handles large-file confirm token). */
export async function downloadGoogleDriveToFile(sourceUrl, outPath, onProgress) {
    const fileId = extractGoogleDriveFileId(sourceUrl);
    if (!fileId) throw new Error('Invalid Google Drive link');

    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    for (let attempt = 0; attempt < 4; attempt++) {
        const res = await httpGet(url);
        const contentType = res.headers['content-type'] || '';

        if (res.statusCode !== 200) {
            const body = await readResponseBody(res);
            throw new Error(
                `Google Drive download failed (HTTP ${res.statusCode})${body.length ? `: ${body.toString('utf8').slice(0, 200)}` : ''}`
            );
        }

        if (isZipContentType(contentType)) {
            return streamResponseToFile(res, outPath, onProgress);
        }

        const body = await readResponseBody(res);
        const confirmUrl = parseDriveConfirmParams(body.toString('utf8'), fileId);
        if (confirmUrl) {
            url = confirmUrl;
            continue;
        }

        // Some Drive responses redirect to usercontent without zip content-type
        if (body.length > 1024 && body[0] === 0x50 && body[1] === 0x4b) {
            fs.writeFileSync(outPath, body);
            emitProgress(onProgress, body.length, body.length);
            return { path: outPath, bytes: body.length };
        }

        throw new Error('Google Drive did not return a zip file — check sharing permissions');
    }

    throw new Error('Google Drive download failed after retries');
}
