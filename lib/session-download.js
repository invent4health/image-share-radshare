import fs from 'fs';
import path from 'path';
import { waitForStableFile } from './hdsc-download.js';

function emitProgress(onProgress, payload) {
    if (typeof onProgress === 'function') onProgress(payload);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait until zip size stops growing and meets a minimum size (Jivex studies are ~100MB+). */
export async function waitForStableZip(filePath, options = {}) {
    const {
        stableMs = 3000,
        minBytes = 50 * 1024 * 1024,
        timeoutMs = 10 * 60 * 1000,
        expectedBytes = 0,
    } = options;

    const started = Date.now();
    let lastSize = -1;
    let stableSince = Date.now();

    while (Date.now() - started < timeoutMs) {
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch {
            await sleep(400);
            continue;
        }

        if (expectedBytes > 0 && stat.size >= expectedBytes) {
            await waitForStableFile(filePath, stableMs);
            return filePath;
        }

        if (stat.size < minBytes) {
            lastSize = -1;
            stableSince = Date.now();
            await sleep(500);
            continue;
        }

        if (stat.size === lastSize) {
            if (Date.now() - stableSince >= stableMs) {
                return filePath;
            }
        } else {
            lastSize = stat.size;
            stableSince = Date.now();
        }
        await sleep(500);
    }

    throw new Error('ZIP download did not finish — file size still changing or too small');
}

/**
 * Download a URL using the Electron session (keeps Jivex login cookies).
 */
export async function downloadWithSession(session, url, savePath, options = {}) {
    const { onProgress, timeoutMs = 10 * 60 * 1000, minBytes = 50 * 1024 * 1024 } = options;
    const filename = path.basename(savePath);

    fs.mkdirSync(path.dirname(savePath), { recursive: true });

    emitProgress(onProgress, {
        state: 'started',
        filename,
        received: 0,
        total: 0,
        percent: 0,
        url,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await session.fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Download failed (HTTP ${response.status})`);
        }

        const total = Number.parseInt(response.headers.get('content-length') || '0', 10) || 0;
        const body = response.body;
        if (!body?.getReader) {
            const buffer = Buffer.from(await response.arrayBuffer());
            if (buffer.length < minBytes && total > 0 && buffer.length < total) {
                throw new Error(`Incomplete download (${buffer.length} of ${total} bytes)`);
            }
            fs.writeFileSync(savePath, buffer);
            await waitForStableFile(savePath, 1500);
            emitProgress(onProgress, {
                state: 'completed',
                filename,
                received: buffer.length,
                total: total || buffer.length,
                percent: 100,
            });
            return savePath;
        }

        const reader = body.getReader();
        const file = fs.createWriteStream(savePath);
        let received = 0;
        let lastEmit = 0;

        const report = (state = 'progressing') => {
            const percent = total > 0 ? Math.min(100, Math.floor((received / total) * 100)) : null;
            emitProgress(onProgress, { state, filename, received, total, percent, url });
        };

        report('progressing');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            if (!file.write(Buffer.from(value))) {
                await new Promise((resolve) => file.once('drain', resolve));
            }
            if (Date.now() - lastEmit > 250) {
                report('progressing');
                lastEmit = Date.now();
            }
        }

        await new Promise((resolve, reject) => {
            file.end(() => resolve());
            file.on('error', reject);
        });

        const stat = fs.statSync(savePath);
        if (total > 0 && stat.size !== total) {
            throw new Error(`Incomplete download: saved ${stat.size} of ${total} bytes`);
        }
        if (stat.size < minBytes && total === 0) {
            await waitForStableZip(savePath, { minBytes, expectedBytes: 0, timeoutMs: 60000 });
        } else {
            await waitForStableFile(savePath, 2000);
        }

        const finalSize = fs.statSync(savePath).size;
        emitProgress(onProgress, {
            state: 'completed',
            filename,
            received: finalSize,
            total: total || finalSize,
            percent: 100,
        });
        return savePath;
    } catch (e) {
        emitProgress(onProgress, {
            state: 'failed',
            filename,
            error: e?.message || 'Download failed',
            url,
        });
        try { fs.unlinkSync(savePath); } catch { /* ignore */ }
        throw e;
    } finally {
        clearTimeout(timer);
    }
}
