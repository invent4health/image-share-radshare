import crypto from 'crypto';

function readLicenseSecret() {
    try {
        if (typeof process !== 'undefined' && process.env?.COGNIZANCE_LICENSE_SECRET) {
            return process.env.COGNIZANCE_LICENSE_SECRET;
        }
    } catch { /* browser */ }
    return 'CognizanceHealth-AES256-License-Secret-2026';
}

/** Shared secret — set COGNIZANCE_LICENSE_SECRET in production (same in app + generator). */
export const DEFAULT_LICENSE_SECRET = readLicenseSecret();

function getAesKey(secret = DEFAULT_LICENSE_SECRET) {
    return crypto.createHash('sha256').update(String(secret), 'utf8').digest();
}

const ECB_IV = Buffer.alloc(0);

export function normalizeMac(mac) {
    const hex = String(mac || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (hex.length !== 12) return null;
    return hex;
}

export function normalizeLicenseKey(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    return digits.length === 16 ? digits : null;
}

export function formatLicenseKey(raw) {
    const digits = normalizeLicenseKey(raw);
    if (!digits) return '';
    return digits.replace(/(\d{4})(?=\d)/g, '$1-');
}

export function daysSinceEpoch(date = new Date()) {
    return Math.floor(date.getTime() / 86400000);
}

function buildPlaintextBlock(macHex, expiryDay, secret) {
    const plain = Buffer.alloc(16, 0);
    Buffer.from(macHex, 'hex').copy(plain, 0);
    plain.writeUInt32BE(expiryDay >>> 0, 6);
    const tag = crypto.createHmac('sha256', getAesKey(secret)).update(plain.subarray(0, 10)).digest();
    tag.copy(plain, 10, 0, 6);
    return plain;
}

function aes256EncryptBlock(block16, secret) {
    const cipher = crypto.createCipheriv('aes-256-ecb', getAesKey(secret), ECB_IV);
    cipher.setAutoPadding(false);
    return Buffer.concat([cipher.update(block16), cipher.final()]);
}

function aes256DecryptBlock(block16, secret) {
    const decipher = crypto.createDecipheriv('aes-256-ecb', getAesKey(secret), ECB_IV);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(block16), decipher.final()]);
}

function deriveKeyDigits(macHex, expiryDay, secret) {
    const plain = buildPlaintextBlock(macHex, expiryDay, secret);
    const encrypted = aes256EncryptBlock(plain, secret);
    const mixed = crypto.createHash('sha256').update(Buffer.concat([plain, encrypted])).digest();
    const num = mixed.readBigUInt64BE(0) % (10n ** 16n);
    return num.toString().padStart(16, '0');
}

/**
 * Generate a 16-digit license key bound to MAC + validity period (AES-256).
 */
export function generateLicenseKey(macAddress, daysValid, secret = DEFAULT_LICENSE_SECRET) {
    const macHex = normalizeMac(macAddress);
    if (!macHex) throw new Error('Invalid MAC address');
    const days = Number(daysValid);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
        throw new Error('Days must be between 1 and 3650');
    }

    const startDay = daysSinceEpoch();
    const expiryDay = startDay + Math.floor(days);
    const key = deriveKeyDigits(macHex, expiryDay, secret);

    return {
        key,
        keyFormatted: formatLicenseKey(key),
        macHex,
        macFormatted: formatMac(macHex),
        expiryDay,
        daysValid: Math.floor(days),
        daysRemaining: expiryDay - startDay,
        expiryDate: dayToIsoDate(expiryDay),
    };
}

/**
 * Validate key against this machine's MAC. Returns expiry + days remaining.
 */
export function validateLicenseKey(rawKey, machineMac, secret = DEFAULT_LICENSE_SECRET) {
    const key = normalizeLicenseKey(rawKey);
    const macHex = normalizeMac(machineMac);
    if (!key || !macHex) return { valid: false, reason: 'invalid_format' };

    const today = daysSinceEpoch();
    const minDay = today - 30;
    const maxDay = today + 3650;

    for (let expDay = minDay; expDay <= maxDay; expDay++) {
        const candidate = deriveKeyDigits(macHex, expDay, secret);
        if (candidate !== key) continue;

        const plain = buildPlaintextBlock(macHex, expDay, secret);
        const encrypted = aes256EncryptBlock(plain, secret);
        const decrypted = aes256DecryptBlock(encrypted, secret);
        if (!plain.equals(decrypted)) continue;

        const expired = expDay < today;
        return {
            valid: true,
            expired,
            expiryDay: expDay,
            daysRemaining: expDay - today,
            expiryDate: dayToIsoDate(expDay),
            macHex,
            key,
        };
    }

    return { valid: false, reason: 'invalid_key' };
}

export function formatMac(macHex) {
    const hex = normalizeMac(macHex);
    if (!hex) return '';
    return hex.match(/.{2}/g)?.join(':') || hex;
}

export function dayToIsoDate(day) {
    return new Date(day * 86400000).toISOString().slice(0, 10);
}
