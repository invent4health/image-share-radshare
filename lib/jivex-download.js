import fs from 'fs';
import path from 'path';
import {
    injectHdscSavePickerHook,
} from './hdsc-download.js';
import { downloadWithSession, waitForStableZip } from './session-download.js';

export function isJivexPortalUrl(url) {
    try {
        const u = new URL(String(url || '').trim());
        return /jivexmobile/i.test(u.hostname) || /jivexmobile/i.test(u.pathname);
    } catch {
        return /jivexmobile/i.test(String(url || ''));
    }
}

export function extractJivexCode(portalUrl) {
    try {
        const u = new URL(String(portalUrl || '').trim());
        return u.searchParams.get('code') || null;
    } catch {
        const m = String(portalUrl || '').match(/[?&]code=([^&#]+)/i);
        return m ? decodeURIComponent(m[1]) : null;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function logJivex(msg, extra) {
    if (extra !== undefined) console.log(`[JiveX] ${msg}`, extra);
    else console.log(`[JiveX] ${msg}`);
}

const JIVEX_PASSWORD_HELPER = `
function findJivexPasswordInput() {
    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2 || r.height < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    }
    for (const holder of document.querySelectorAll('div.widgetHolder')) {
        const label = holder.querySelector('.gwt-Label.textFieldWidget, .labelWrapper .gwt-Label, .gwt-Label');
        const labelText = (label?.textContent || '').trim().toLowerCase();
        if (labelText !== 'password' && labelText !== 'passwort') continue;
        const input = holder.querySelector('.textFieldWrapper input.inputField, input.inputField[type="text"], input.inputField');
        if (input && isVisible(input)) return input;
    }
    const fallback = document.querySelector('input.inputField[type="text"], input.inputField');
    return fallback && isVisible(fallback) ? fallback : null;
}
function jivexPortalReady() {
    return !!(
        findJivexDownloadButton() ||
        document.getElementById('downloadbutton') ||
        document.querySelector('button[ng-click*="downloadStudy"]') ||
        document.querySelector('table tbody tr[__gwt_row], .gwt-ScrollTable, .studyManagerMainPanel')
    );
}
function findJivexStudyRow() {
    return (
        document.querySelector('tbody tr[__gwt_row="0"][__gwt_subrow="0"]') ||
        document.querySelector('tbody tr[__gwt_row="0"]') ||
        document.querySelector('table tbody tr[__gwt_row]')
    );
}
function findJivexDownloadButton() {
    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2 || r.height < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    }
    const selectors = [
        'button.imageButton.down[title="Download"]',
        'button.imageButton.down[title="Herunterladen"]',
        'button.imageButton.down',
        'button[title="Download"]',
        'button[title="Herunterladen"]',
        '#downloadbutton',
        'button#downloadbutton',
        'button[ng-click*="downloadStudy"]',
    ];
    for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
            if (isVisible(el)) return el;
        }
    }
    return null;
}
function jivexFullClick(el) {
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const init = {
        bubbles: true,
        cancelable: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
        view: window,
        buttons: 1,
    };
    try { el.dispatchEvent(new PointerEvent('pointerdown', init)); } catch {}
    el.dispatchEvent(new MouseEvent('mousedown', init));
    try { el.dispatchEvent(new PointerEvent('pointerup', init)); } catch {}
    el.dispatchEvent(new MouseEvent('mouseup', init));
    el.dispatchEvent(new MouseEvent('click', init));
    if (typeof el.click === 'function') el.click();
    return true;
}
function findJivexDicomFormatButton() {
    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2 || r.height < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    }
    for (const btn of document.querySelectorAll('button.downloadFormatButton')) {
        if (!isVisible(btn)) continue;
        const heading = btn.querySelector('.downloadFormatButton-heading');
        const text = (heading?.textContent || btn.textContent || '').trim().toUpperCase();
        if (text.includes('DICOM')) return btn;
    }
    const fallback = document.querySelector('button.downloadFormatButton');
    return fallback && isVisible(fallback) ? fallback : null;
}
function findJivexModalDownloadButton() {
    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2 || r.height < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    }
    const selectors = [
        'button.textButton.downloadButton[title="Download"]',
        'button.downloadButton[title="Download"]',
        'button.textButton.downloadButton',
    ];
    for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
            if (isVisible(el)) return el;
        }
    }
    return null;
}
`;

const JIVEX_DOWNLOAD_HOOK = `
(function() {
    if (window.__radshareJivexDownloadHook) return { ok: true, already: true };
    window.__radshareJivexDownloadHook = true;
    return { ok: true, hooked: true };
})();
`;

export async function injectJivexPortalHooks(webContents) {
    if (!webContents || webContents.isDestroyed()) return;
    try {
        await injectHdscSavePickerHook(webContents);
        const result = await webContents.executeJavaScript(JIVEX_DOWNLOAD_HOOK, true);
        logJivex('Portal download hooks', result);
        return result;
    } catch (e) {
        logJivex('Portal download hook failed', { error: e?.message });
        return null;
    }
}

const JIVEX_FIND_PASSWORD_FIELD_SCRIPT = `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    const field = findJivexPasswordInput();
    if (!field) return { ok: false };
    field.scrollIntoView({ block: 'center', inline: 'center' });
    const r = field.getBoundingClientRect();
    return {
        ok: true,
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2),
    };
})();
`;

const JIVEX_VERIFY_PASSWORD_SCRIPT = `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    const field = findJivexPasswordInput();
    const value = field?.value || '';
    return { ok: value.length > 0, length: value.length, value };
})();
`;

const JIVEX_TYPE_PASSWORD_GWT_SCRIPT = (password) => `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    const password = ${JSON.stringify(password)};
    const field = findJivexPasswordInput();
    if (!field) return { ok: false, reason: 'field not found' };

    field.focus();
    field.click();

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(field, '');
    else field.value = '';

    for (const ch of password) {
        const code = ch.charCodeAt(0);
        field.dispatchEvent(new KeyboardEvent('keydown', {
            key: ch, charCode: code, keyCode: code, bubbles: true, cancelable: true,
        }));
        field.dispatchEvent(new KeyboardEvent('keypress', {
            key: ch, charCode: code, keyCode: code, bubbles: true, cancelable: true,
        }));
        const next = (field.value || '') + ch;
        if (nativeSetter) nativeSetter.call(field, next);
        else field.value = next;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keyup', {
            key: ch, charCode: code, keyCode: code, bubbles: true,
        }));
    }

    field.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: (field.value || '').length > 0, length: (field.value || '').length };
})();
`;

const JIVEX_SET_PASSWORD_SCRIPT = (password) => `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    const password = ${JSON.stringify(password)};
    const field = findJivexPasswordInput();
    if (!field) return { ok: false, reason: 'field not found' };
    field.focus();
    field.click();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(field, password);
    else field.value = password;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: (field.value || '').length > 0, length: (field.value || '').length };
})();
`;

const JIVEX_JS_SUBMIT_LOGIN_SCRIPT = `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
    }
    const field = findJivexPasswordInput();
    if (!field) return { ok: false, reason: 'Password field not found' };

    const pwRect = field.getBoundingClientRect();
    const pwMidY = pwRect.top + pwRect.height / 2;
    let best = null;
    let bestDist = Infinity;
    for (const img of document.querySelectorAll('img.gwt-Image, img')) {
        if (!isVisible(img)) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        if (Math.abs((r.top + r.bottom) / 2 - pwMidY) > 80) continue;
        if (r.left < pwRect.left - 20) continue;
        const dist = Math.abs(r.left - pwRect.right);
        if (dist < bestDist) { bestDist = dist; best = img; }
    }
    if (best) {
        best.scrollIntoView({ block: 'center' });
        best.click();
        return { ok: true, method: 'login-icon' };
    }
    field.focus();
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    field.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    return { ok: true, method: 'enter' };
})();
`;

async function waitForJivexPortalUi(webContents, timeoutMs = 45000) {
    logJivex('Waiting for Jivex login or study UI…');
    let stableLogin = 0;
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        const state = await webContents.executeJavaScript(
            `(function() {
                ${JIVEX_PASSWORD_HELPER}
                return { login: !!findJivexPasswordInput(), ready: jivexPortalReady() };
            })();`,
            true
        );
        if (state?.ready) {
            logJivex('Portal UI ready (study view)', { ms: Date.now() - started });
            return state;
        }
        if (state?.login) {
            stableLogin += 1;
            if (stableLogin >= 2) {
                logJivex('Login UI ready', { ms: Date.now() - started });
                await sleep(350);
                return state;
            }
        } else {
            stableLogin = 0;
        }
        await sleep(250);
    }
    throw new Error('Jivex portal did not finish loading');
}

async function nativeClick(webContents, x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    webContents.sendInputEvent({ type: 'mouseMove', x: ix, y: iy });
    await sleep(50);
    webContents.sendInputEvent({ type: 'mouseDown', x: ix, y: iy, button: 'left', clickCount: 1 });
    await sleep(50);
    webContents.sendInputEvent({ type: 'mouseUp', x: ix, y: iy, button: 'left', clickCount: 1 });
    await sleep(150);
}

async function nativePressEnter(webContents) {
    webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
    await sleep(40);
    webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
}

async function nativeTypeText(webContents, text) {
    for (const char of text) {
        webContents.sendInputEvent({ type: 'char', keyCode: char });
        await sleep(35);
    }
}

async function cdpInsertText(webContents, text) {
    const dbg = webContents.debugger;
    try {
        if (!dbg.isAttached()) dbg.attach('1.3');
        await dbg.sendCommand('Input.insertText', { text });
        return true;
    } catch {
        return false;
    }
}

async function verifyPasswordEntered(webContents, minLength = 1) {
    const v = await webContents.executeJavaScript(JIVEX_VERIFY_PASSWORD_SCRIPT, true);
    return v?.ok && (v.length || 0) >= minLength;
}

async function fillJivexPasswordField(webContents, password) {
    logJivex('Waiting for password field…');
    const coords = await (async () => {
        const started = Date.now();
        while (Date.now() - started < 30000) {
            const info = await webContents.executeJavaScript(JIVEX_FIND_PASSWORD_FIELD_SCRIPT, true);
            if (info?.ok) return info;
            await sleep(300);
        }
        return null;
    })();
    if (!coords) {
        throw new Error('Password field not found on portal page');
    }
    logJivex('Password field found', coords);

    webContents.focus();

    // GWT listens to in-page keyboard events on input.inputField (type="text").
    const gwtTypeResult = await webContents.executeJavaScript(JIVEX_TYPE_PASSWORD_GWT_SCRIPT(password), true);
    logJivex('GWT char-by-char typing', gwtTypeResult);
    await sleep(300);

    if (!(await verifyPasswordEntered(webContents, 1))) {
        const setResult = await webContents.executeJavaScript(JIVEX_SET_PASSWORD_SCRIPT(password), true);
        logJivex('GWT bulk value setter', setResult);
        await sleep(200);
    }

    if (!(await verifyPasswordEntered(webContents, 1))) {
        await nativeClick(webContents, coords.x, coords.y);
        webContents.insertText(password);
        await sleep(200);
    }

    const verified = await verifyPasswordEntered(webContents, 1);
    logJivex('Password verify after fill', { verified });
    if (!verified) {
        logJivex('Password not readable in DOM — continuing to submit anyway');
    }
}

const JIVEX_FIND_SUBMIT_COORDS_SCRIPT = `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
    }
    const passField = findJivexPasswordInput();
    if (!passField) return { ok: false };
    const holder = passField.closest('.widgetHolder');
    const pr = passField.getBoundingClientRect();
    let best = null;
    let bestDist = Infinity;
    const scope = holder?.parentElement || document;
    for (const img of scope.querySelectorAll('img.gwt-Image, img')) {
        if (!isVisible(img)) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        if (r.left >= pr.left - 20 && Math.abs((r.top + r.bottom) / 2 - (pr.top + pr.bottom) / 2) < 80) {
            const dist = Math.abs(r.left - pr.right);
            if (dist < bestDist) { bestDist = dist; best = img; }
        }
    }
    if (!best) return { ok: false };
    const r = best.getBoundingClientRect();
    return {
        ok: true,
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2),
    };
})();
`;

async function waitForPortalReady(webContents, timeoutMs = 45000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        const ready = await webContents.executeJavaScript(JIVEX_ALREADY_LOGGED_IN_SCRIPT, true);
        if (ready?.ok) return true;
        await sleep(400);
    }
    return false;
}

const JIVEX_SELENIUM_LOGIN_SCRIPT = (password) => `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    const password = ${JSON.stringify(password)};

    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect?.();
        if (!r || r.width < 2) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
    }

    function setGwtValue(el, value) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function clickSubmitNearPassword(passwordEl) {
        const pwRect = passwordEl.getBoundingClientRect();
        const pwMidY = pwRect.top + pwRect.height / 2;
        let best = null;
        let bestDist = Infinity;
        for (const img of document.querySelectorAll('img.gwt-Image, img')) {
            if (!isVisible(img)) continue;
            const r = img.getBoundingClientRect();
            if (r.width < 8 || r.height < 8) continue;
            if (Math.abs((r.top + r.bottom) / 2 - pwMidY) > 80) continue;
            if (r.left < pwRect.left) continue;
            const dist = Math.abs(r.left - pwRect.right);
            if (dist < bestDist) { bestDist = dist; best = img; }
        }
        if (best) {
            best.scrollIntoView({ block: 'center' });
            best.click();
            return true;
        }
        passwordEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        passwordEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
        return true;
    }

    if (jivexPortalReady()) return { ok: true, skipped: true };

    const field = findJivexPasswordInput();
    if (!field) return { ok: false, reason: 'Password field not found' };

    field.scrollIntoView({ block: 'center' });
    field.click();
    setGwtValue(field, password);
    clickSubmitNearPassword(field);
    return { ok: true };
})();
`;

/** Selenium-equivalent login — stepped with delays (matches working Python Selenium timing). */
export async function runSeleniumStyleLoginOnPreview(webContents, password) {
    const previewUrl = webContents.getURL?.() || '';
    logJivex('Selenium login on BrowserView', previewUrl);
    if (!/jivexmobile/i.test(previewUrl)) {
        throw new Error(`Preview is not on Jivex portal (got: ${previewUrl || 'empty'})`);
    }

    const alreadyIn = await webContents.executeJavaScript(
        `(function() { ${JIVEX_PASSWORD_HELPER} return jivexPortalReady(); })();`,
        true
    );
    if (alreadyIn) {
        logJivex('Already logged in');
        return;
    }

    webContents.focus();
    await sleep(200);

    logJivex('Step 1: click password field…');
    const clickField = await webContents.executeJavaScript(
        `(function() {
            ${JIVEX_PASSWORD_HELPER}
            const field = findJivexPasswordInput();
            if (!field) return { ok: false, reason: 'Password field not found' };
            field.scrollIntoView({ block: 'center' });
            field.focus();
            field.click();
            return { ok: true };
        })();`,
        true
    );
    if (!clickField?.ok) {
        throw new Error(clickField?.reason || 'Password field not found');
    }
    await sleep(200);

    logJivex('Step 2: enter password…');
    const setPw = await webContents.executeJavaScript(JIVEX_SET_PASSWORD_SCRIPT(password), true);
    logJivex('Password set result', setPw);
    if (!setPw?.ok) {
        throw new Error('Could not set password on portal field');
    }
    await sleep(200);

    logJivex('Step 3: submit login (icon or Enter)…');
    await submitJivexLogin(webContents, password);
}

const JIVEX_SELECT_STUDY_ROW_SCRIPT = `
(function() {
    function fullClick(el) {
        if (!el) return false;
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        const init = {
            bubbles: true,
            cancelable: true,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height / 2,
            view: window,
            buttons: 1,
        };
        try { el.dispatchEvent(new PointerEvent('pointerdown', init)); } catch {}
        el.dispatchEvent(new MouseEvent('mousedown', init));
        try { el.dispatchEvent(new PointerEvent('pointerup', init)); } catch {}
        el.dispatchEvent(new MouseEvent('mouseup', init));
        el.dispatchEvent(new MouseEvent('click', init));
        if (typeof el.click === 'function') el.click();
        return true;
    }
    let row =
        document.querySelector('tbody tr[__gwt_row="0"][__gwt_subrow="0"]') ||
        document.querySelector('tbody tr[__gwt_row="0"]') ||
        document.querySelector('table tbody tr[__gwt_row]');
    if (!row) return { ok: false, reason: 'Study row not found' };
    const nameCell =
        row.querySelector('td:nth-child(3) div[__gwt_cell]') ||
        row.querySelector('td div[__gwt_cell][tabindex="0"]') ||
        row.querySelector('td:nth-child(3)') ||
        row;
    fullClick(nameCell);
    return { ok: true, name: (nameCell.textContent || '').trim() };
})();
`;

export async function selectJivexStudyRow(webContents) {
    logJivex('Waiting for patient study row…');
    const started = Date.now();
    while (Date.now() - started < 60000) {
        const result = await webContents.executeJavaScript(JIVEX_SELECT_STUDY_ROW_SCRIPT, true);
        if (result?.ok) {
            logJivex('Selected study row', { name: result.name, ms: Date.now() - started });
            await sleep(800);
            return result;
        }
        await sleep(400);
    }
    throw new Error('Could not select patient study row');
}

export async function confirmJivexDownloadModal(webContents) {
    logJivex('Waiting for download format dialog…');
    const dialogStarted = Date.now();
    while (Date.now() - dialogStarted < 30000) {
        const state = await webContents.executeJavaScript(
            `(function() {
                ${JIVEX_PASSWORD_HELPER}
                return {
                    dicom: !!findJivexDicomFormatButton(),
                    modalDownload: !!findJivexModalDownloadButton(),
                };
            })();`,
            true
        );
        if (state?.dicom) break;
        await sleep(300);
    }

    logJivex('Selecting DICOM format…');
    const dicomResult = await webContents.executeJavaScript(
        `(function() {
            ${JIVEX_PASSWORD_HELPER}
            const btn = findJivexDicomFormatButton();
            if (!btn) return { ok: false, reason: 'DICOM format button not found' };
            jivexFullClick(btn);
            return { ok: true };
        })();`,
        true
    );
    if (!dicomResult?.ok) {
        throw new Error(dicomResult?.reason || 'Could not select DICOM format');
    }
    await sleep(600);

    logJivex('Waiting for modal Download button…');
    const modalStarted = Date.now();
    let modalState = null;
    while (Date.now() - modalStarted < 30000) {
        modalState = await webContents.executeJavaScript(
            `(function() {
                ${JIVEX_PASSWORD_HELPER}
                const btn = findJivexModalDownloadButton();
                if (!btn) return { found: false };
                return {
                    found: true,
                    enabled: !btn.disabled,
                    title: btn.getAttribute('title') || '',
                };
            })();`,
            true
        );
        if (modalState?.found && modalState?.enabled) break;
        await sleep(300);
    }
    if (!modalState?.found) {
        throw new Error('Modal Download button not found');
    }
    if (!modalState?.enabled) {
        throw new Error('Modal Download button is still disabled');
    }

    logJivex('Clicking modal Download button…');
    const confirmResult = await webContents.executeJavaScript(
        `(function() {
            ${JIVEX_PASSWORD_HELPER}
            const btn = findJivexModalDownloadButton();
            if (!btn) return { ok: false, reason: 'Modal Download button not found' };
            if (btn.disabled) return { ok: false, reason: 'Modal Download button is disabled' };
            jivexFullClick(btn);
            return { ok: true };
        })();`,
        true
    );
    if (!confirmResult?.ok) {
        throw new Error(confirmResult?.reason || 'Failed to confirm download in modal');
    }
    logJivex('Download modal confirmed');
}

export async function clickJivexDownloadButton(webContents) {
    await selectJivexStudyRow(webContents);

    logJivex('Waiting for Download button to become enabled…');
    const started = Date.now();
    let lastState = null;
    let retriedSelect = false;
    while (Date.now() - started < 90000) {
        lastState = await webContents.executeJavaScript(
            `(function() {
                ${JIVEX_PASSWORD_HELPER}
                const btn = findJivexDownloadButton();
                if (!btn) return { found: false };
                return {
                    found: true,
                    enabled: !btn.disabled,
                    title: btn.getAttribute('title') || '',
                    className: btn.className || '',
                };
            })();`,
            true
        );
        if (lastState?.found && lastState?.enabled) {
            logJivex('Download button ready', { ms: Date.now() - started, ...lastState });
            break;
        }
        if (lastState?.found && !lastState?.enabled && !retriedSelect && Date.now() - started > 3000) {
            retriedSelect = true;
            logJivex('Download still disabled — re-selecting study row…');
            await webContents.executeJavaScript(JIVEX_SELECT_STUDY_ROW_SCRIPT, true);
            await sleep(800);
        }
        await sleep(400);
    }
    if (!lastState?.found) {
        throw new Error('Download button not found on Jivex portal');
    }
    if (!lastState?.enabled) {
        throw new Error('Download button is still disabled — study may not be ready');
    }

    logJivex('Clicking toolbar Download button…');
    const clickResult = await webContents.executeJavaScript(JIVEX_DOWNLOAD_CLICK_SCRIPT, true);
    logJivex('Toolbar download click result', clickResult);
    if (!clickResult?.clicked) {
        throw new Error(clickResult?.reason || 'Failed to click Download button');
    }

    await confirmJivexDownloadModal(webContents);
}

async function submitJivexLogin(webContents, password) {
    logJivex('Submitting login…');

    const submitResult = await webContents.executeJavaScript(JIVEX_JS_SUBMIT_LOGIN_SCRIPT, true);
    logJivex('Submit action', submitResult);
    if (!submitResult?.ok) {
        throw new Error(submitResult?.reason || 'Could not submit login');
    }

    let ready = await waitForPortalReady(webContents, 8000);
    if (ready) {
        logJivex('Portal ready after login');
        return;
    }

    logJivex('Retry submit — Enter key on password field…');
    await webContents.executeJavaScript(
        `(function() {
            ${JIVEX_PASSWORD_HELPER}
            const field = findJivexPasswordInput();
            if (!field) return { ok: false };
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) nativeSetter.call(field, ${JSON.stringify(password)});
            else field.value = ${JSON.stringify(password)};
            field.focus();
            field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            return { ok: true };
        })();`,
        true
    );
    webContents.focus();
    await nativePressEnter(webContents);

    ready = await waitForPortalReady(webContents, 35000);
    if (!ready) {
        throw new Error('Login did not complete — check password');
    }
    logJivex('Portal ready after login');
}

const JIVEX_SUBMIT_LOGIN_SCRIPT = `
(async function() {
    try {
        function isVisible(el) {
            if (!el) return false;
            const r = el.getBoundingClientRect?.();
            if (!r || r.width < 2) return false;
            const s = window.getComputedStyle(el);
            return s.display !== 'none' && s.visibility !== 'hidden';
        }
        function findPass() {
            for (const label of document.querySelectorAll('.gwt-Label')) {
                const t = (label.textContent || '').trim().toLowerCase();
                if (t !== 'password' && t !== 'passwort') continue;
                const input = label.closest('.widgetHolder')?.querySelector('input.inputField, input');
                if (input && isVisible(input)) return input;
            }
            return document.querySelector('input.inputField');
        }
        function fullClick(el) {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            const c = { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
            const init = { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, view: window, buttons: 1 };
            try { el.dispatchEvent(new PointerEvent('pointerdown', init)); } catch {}
            el.dispatchEvent(new MouseEvent('mousedown', init));
            try { el.dispatchEvent(new PointerEvent('pointerup', init)); } catch {}
            el.dispatchEvent(new MouseEvent('mouseup', init));
            el.dispatchEvent(new MouseEvent('click', init));
            if (typeof el.click === 'function') el.click();
            return true;
        }
        function findSubmit(passField) {
            const pr = passField.getBoundingClientRect();
            let best = null;
            let bestDist = Infinity;
            for (const img of document.querySelectorAll('img.gwt-Image, img')) {
                if (!isVisible(img)) continue;
                const r = img.getBoundingClientRect();
                if (r.width < 8 || r.height < 8) continue;
                if (r.left >= pr.left && Math.abs((r.top + r.bottom) / 2 - (pr.top + pr.bottom) / 2) < 60) {
                    const dist = Math.abs(r.left - pr.right);
                    if (dist < bestDist) { bestDist = dist; best = img; }
                }
            }
            if (best) return best;
            let scope = passField?.closest('.widgetHolder')?.parentElement;
            for (let i = 0; i < 6 && scope; i++) {
                for (const img of scope.querySelectorAll('img.gwt-Image, img')) {
                    if (!isVisible(img)) continue;
                    const r = img.getBoundingClientRect();
                    if (r.width >= 8 && r.height >= 8) return img;
                }
                scope = scope.parentElement;
            }
            return null;
        }
        const passField = findPass();
        if (!passField) return { ok: false, reason: 'Password field not found' };
        const submit = findSubmit(passField);
        if (submit) fullClick(submit);
        else {
            passField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            passField.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
        for (let i = 0; i < 50; i++) {
            await new Promise((r) => setTimeout(r, 300));
            const ready = !!(
                document.getElementById('downloadbutton') ||
                document.querySelector('button[ng-click*="downloadStudy"]') ||
                document.querySelector('table tbody tr[__gwt_row], .gwt-ScrollTable, .studyManagerMainPanel')
            );
            if (ready) return { ok: true };
        }
        return { ok: false, reason: 'Login did not complete — check password' };
    } catch (e) {
        return { ok: false, reason: e?.message || 'Submit script error' };
    }
})();
`;

const JIVEX_ALREADY_LOGGED_IN_SCRIPT = `
(function() {
    return {
        ok: !!(
            document.getElementById('downloadbutton') ||
            document.querySelector('button[ng-click*="downloadStudy"]') ||
            document.querySelector('table tbody tr[__gwt_row], .gwt-ScrollTable, .studyManagerMainPanel')
        ),
    };
})();
`;

const JIVEX_DOWNLOAD_CLICK_SCRIPT = `
(function() {
    ${JIVEX_PASSWORD_HELPER}
    function center(el) {
        const r = el.getBoundingClientRect();
        return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
    }
    function fire(el, type, c) {
        const init = { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, view: window, buttons: 1 };
        try { el.dispatchEvent(new PointerEvent(type.replace('mouse', 'pointer'), init)); } catch {}
        return el.dispatchEvent(new MouseEvent(type, init));
    }
    function fullClick(el) {
        if (!el) return false;
        el.scrollIntoView({ block: 'center' });
        const c = center(el);
        fire(el, 'pointerdown', c);
        fire(el, 'mousedown', c);
        fire(el, 'pointerup', c);
        fire(el, 'mouseup', c);
        fire(el, 'click', c);
        if (typeof el.click === 'function') el.click();
        return true;
    }
    const btn = findJivexDownloadButton();
    if (!btn) return { clicked: false, reason: 'Download button not found' };
    if (btn.disabled) return { clicked: false, reason: 'Download button is disabled' };
    fullClick(btn);
    return { clicked: true, title: btn.getAttribute('title') || '' };
})();
`;

async function waitForPageLoad(webContents, timeoutMs = 5000) {
    if (!webContents.isLoading()) return;
    await new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            cleanup();
            resolve();
        };
        const timer = setTimeout(finish, timeoutMs);
        const onFinish = () => finish();
        function cleanup() {
            clearTimeout(timer);
            webContents.removeListener('did-finish-load', onFinish);
            webContents.removeListener('did-fail-load', onFinish);
        }
        webContents.on('did-finish-load', onFinish);
        webContents.on('did-fail-load', onFinish);
    });
}

function logJivexDownload(msg, extra) {
    if (extra !== undefined) console.log(`[JiveX] ${msg}`, extra);
    else console.log(`[JiveX] ${msg}`);
}

function waitForJivexDownload(
    session,
    saveDir,
    timeoutMs = 180000,
    downloadsDir = saveDir,
    fileStamp = String(Date.now()),
    onProgress = null,
    targetName = null
) {
    const safeStamp = fileStamp.replace(/[^a-zA-Z0-9_-]+/g, '_');
    const zipName = targetName || `jivex-${safeStamp}.zip`;
    const targetPath = path.join(saveDir, zipName);

    return new Promise((resolve, reject) => {
        let settled = false;
        let sessionDownloadStarted = false;

        const finish = async (filePath) => {
            if (settled || !filePath) return;
            try {
                await waitForStableZip(filePath, { timeoutMs });
                const size = fs.statSync(filePath).size;
                settled = true;
                cleanup();
                logJivexDownload('Zip file ready', { filePath, size });
                resolve(filePath);
            } catch (e) {
                fail(e);
            }
        };

        const fail = (err) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(err);
        };

        const timer = setTimeout(
            () => fail(new Error('Timed out waiting for Jivex zip download')),
            timeoutMs
        );

        const onDownload = (event, item) => {
            const filename = item.getFilename() || 'download.zip';
            const url = typeof item.getURL === 'function' ? item.getURL() : '';
            if (!url && !/\.zip/i.test(filename)) return;

            logJivexDownload('Portal download detected — fetching with session', { filename, url });
            event.preventDefault();

            if (sessionDownloadStarted) return;
            sessionDownloadStarted = true;

            downloadWithSession(session, url, targetPath, {
                timeoutMs,
                onProgress: (payload) => {
                    if (typeof onProgress === 'function') onProgress({ ...payload, filename: zipName });
                },
            })
                .then((p) => finish(p))
                .catch((e) => {
                    logJivexDownload('Session fetch failed', { error: e?.message });
                    fail(e);
                });
        };

        session.on('will-download', onDownload);

        function cleanup() {
            clearTimeout(timer);
            session.removeListener('will-download', onDownload);
        }
    });
}

export async function dismissJivexDownloadUi(webContents) {
    if (!webContents || webContents.isDestroyed()) return;
    try {
        const result = await webContents.executeJavaScript(
            `(function() {
                function clickEl(el) {
                    if (!el) return false;
                    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    if (typeof el.click === 'function') el.click();
                    return true;
                }
                const closeSelectors = [
                    'button[title="Close"]',
                    'button[title="Schließen"]',
                    '.gwt-DialogBox .dialogTop .dialogTopCenter img',
                    '.gwt-DialogBox .dialogTop img.gwt-Image',
                ];
                for (const sel of closeSelectors) {
                    const el = document.querySelector(sel);
                    if (clickEl(el)) return { ok: true, method: sel };
                }
                document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true,
                }));
                return { ok: true, method: 'escape' };
            })();`,
            true
        );
        logJivex('Dismissed download UI', result);
    } catch (e) {
        logJivex('Dismiss download UI failed', { error: e?.message });
    }
}

/** Stop Jivex portal page after automation so loaders/background work do not continue. */
export async function shutdownJivexAutomation(webContents) {
    if (!webContents || webContents.isDestroyed()) return;
    await dismissJivexDownloadUi(webContents);
    try {
        webContents.stop();
    } catch { /* ignore */ }
    try {
        if (!webContents.isDestroyed()) {
            await webContents.loadURL('about:blank');
        }
    } catch (e) {
        logJivex('Shutdown Jivex preview failed', { error: e?.message });
    }
    logJivex('Jivex automation stopped');
}

export { waitForJivexDownload };

export async function prepareJivexPortalInPreview(previewView, portalUrl) {
    if (!previewView?.webContents) {
        throw new Error('Browser preview is not available');
    }
    const webContents = previewView.webContents;
    const previousZoom = webContents.getZoomFactor?.() ?? 1;
    webContents.setZoomFactor(1);
    logJivex('Loading portal URL in BrowserView…', portalUrl);
    try {
        await webContents.loadURL(portalUrl);
    } catch (e) {
        logJivex('loadURL warning', e?.message || e);
    }
    logJivex('loadURL finished — polling for login UI…');
    const onDomReady = () => {
        injectJivexPortalHooks(webContents).catch(() => {});
    };
    webContents.on('dom-ready', onDomReady);
    await injectJivexPortalHooks(webContents);
    await waitForJivexPortalUi(webContents);
    logJivex('Preview ready for login automation');
    return {
        restoreZoom: () => {
            try {
                webContents.removeListener('dom-ready', onDomReady);
            } catch { /* ignore */ }
            try {
                webContents.setZoomFactor(previousZoom);
            } catch { /* ignore */ }
        },
    };
}

export async function downloadJivexStudyFromPreview(previewView, portalUrl, { password, user, downloadsDir }) {
    if (!previewView?.webContents) {
        throw new Error('Browser preview is not available');
    }

    const webContents = previewView.webContents;
    const session = webContents.session;
    const accessCode = user || extractJivexCode(portalUrl) || '';

    if (!password) throw new Error('Portal password is required');

    const saveDir = path.join(downloadsDir, 'radshare-jivex');
    fs.mkdirSync(saveDir, { recursive: true });

    try {
        session.setDownloadPath(saveDir);
    } catch { /* ignore */ }

    const previousZoom = webContents.getZoomFactor?.() ?? 1;
    try {
        webContents.setZoomFactor(1);
        logJivex('Loading portal in preview…');
        await webContents.loadURL(portalUrl);
        const portalUi = await waitForJivexPortalUi(webContents);

        if (!portalUi?.ready) {
            await fillJivexPasswordField(webContents, password);
            await submitJivexLogin(webContents, password);
        } else {
            logJivex('Already logged in');
        }

        await sleep(1000);
        logJivex('Clicking download button…');

        await clickJivexDownloadButton(webContents);
        const finalPath = await waitForJivexDownload(session, saveDir, 120000);
        logJivex('Download complete', finalPath);
        return {
            path: finalPath,
            studyUid: accessCode ? `jivex-${accessCode}` : null,
        };
    } finally {
        try {
            webContents.setZoomFactor(previousZoom);
        } catch { /* ignore */ }
    }
}
