import fs from 'fs';
import path from 'path';
import {
    clickJivexDownloadButton,
    extractJivexCode,
    injectJivexPortalHooks,
    prepareJivexPortalInPreview,
    runSeleniumStyleLoginOnPreview,
    shutdownJivexAutomation,
    waitForJivexDownload,
} from './jivex-download.js';

export const ELECTRON_DEBUG_PORT = 9222;

/**
 * Electron has two separate pages:
 * - mainWindow.webContents → sidebar UI (index.html)  ← Selenium attach lands here
 * - previewView.webContents (BrowserView) → Jivex portal ← we automate here directly
 */
export async function downloadJivexStudyWithSeleniumInPreview(previewView, portalUrl, { password, user, downloadsDir, onDownloadProgress }) {
    if (!previewView?.webContents || previewView.webContents.isDestroyed()) {
        throw new Error('Browser preview is not available');
    }

    const webContents = previewView.webContents;
    const saveDir = path.join(downloadsDir, 'radshare-jivex');
    fs.mkdirSync(saveDir, { recursive: true });

    const accessCode = user || extractJivexCode(portalUrl) || '';
    const session = webContents.session;

    try {
        session.setDownloadPath(saveDir);
    } catch { /* ignore */ }

    const { restoreZoom } = await prepareJivexPortalInPreview(previewView, portalUrl);

    try {
        webContents.focus();
        webContents.setBackgroundThrottling?.(false);
        await injectJivexPortalHooks(webContents);

        await runSeleniumStyleLoginOnPreview(webContents, password);

        const stamp = accessCode
            ? `${accessCode.replace(/[^a-zA-Z0-9_-]+/g, '_')}-${Date.now()}`
            : String(Date.now());
        const targetName = `jivex-${stamp}.zip`;

        onDownloadProgress?.({
            state: 'preparing',
            filename: targetName,
            message: 'Preparing your study (about 15 seconds)…',
            received: 0,
            total: 0,
            percent: 0,
        });

        await clickJivexDownloadButton(webContents);

        console.log('[JiveX] Waiting for zip download…');
        const finalPath = await waitForJivexDownload(
            session,
            saveDir,
            600000,
            downloadsDir,
            stamp,
            onDownloadProgress,
            targetName
        );
        if (!finalPath || !fs.existsSync(finalPath)) {
            throw new Error('JiveX download completed but zip file was not found');
        }

        console.log('[JiveX] Download complete:', finalPath);
        return {
            path: finalPath,
            studyUid: accessCode ? `jivex-${accessCode}` : null,
        };
    } finally {
        await shutdownJivexAutomation(webContents);
        restoreZoom?.();
    }
}
