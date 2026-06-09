const urlInput = document.getElementById('url-input');
const loadBtn = document.getElementById('load-btn');
const qrScannerBtn = document.getElementById('qr-scanner-btn');
const portalLinkScanStatus = document.getElementById('portal-link-scan-status');
const pasteLinkBtn = document.getElementById('paste-link-btn');
const statusEl = document.getElementById('status');
const previewPlaceholder = document.getElementById('preview-placeholder');
const containerEl = document.querySelector('.container');
const addPacsBtn = document.getElementById('add-pacs-btn');
const pacsModal = document.getElementById('pacs-modal');
const pacsClose = document.getElementById('pacs-close');
const savePacsBtn = document.getElementById('save-pacs');
const showExistingBtn = document.getElementById('show-existing-pacs');
const viewPacsBtn = document.getElementById('view-pacs-btn');
const pacsListModal = document.getElementById('pacs-list-modal');
const pacsListClose = document.getElementById('pacs-list-close');
const pacsListRefresh = document.getElementById('pacs-list-refresh');
const pacsListBody = document.getElementById('pacs-list-body');
const eyeBtn = document.getElementById('eye-btn');
const metaPatientId = document.getElementById('meta-patient-id');
const metaPatientName = document.getElementById('meta-patient-name');
const metaDob = document.getElementById('meta-dob');
const metaGender = document.getElementById('meta-gender');
const metaModality = document.getElementById('meta-modality');
const assignStudyBtn = document.getElementById('assign-study-btn');
const assignStudyModal = document.getElementById('assign-study-modal');
const assignStudyModalClose = document.getElementById('assign-study-modal-close');
const assignMwlStart = document.getElementById('assign-mwl-start');
const assignMwlEnd = document.getElementById('assign-mwl-end');
const assignMwlSearch = document.getElementById('assign-mwl-search');
const assignMwlRun = document.getElementById('assign-mwl-run');
const assignMwlStatus = document.getElementById('assign-mwl-status');
const assignMwlTbody = document.getElementById('assign-mwl-tbody');
const assignMwlEmpty = document.getElementById('assign-mwl-empty');
const assignMwlTable = document.getElementById('assign-mwl-table');
const assignMwlCancel = document.getElementById('assign-mwl-cancel');
const assignMwlConfirm = document.getElementById('assign-mwl-confirm');
const assignMwlTagsModal = document.getElementById('assign-mwl-tags-modal');
const assignMwlTagsSubtitle = document.getElementById('assign-mwl-tags-subtitle');
const assignMwlTagsTbody = document.getElementById('assign-mwl-tags-tbody');
const assignMwlTagsClose = document.getElementById('assign-mwl-tags-close');
const assignMwlTagsDone = document.getElementById('assign-mwl-tags-done');
const assignMwlTagsSearch = document.getElementById('assign-mwl-tags-search');
const addToPacsBtn = document.getElementById('add-to-pacs-btn');
const importCancelBtn = document.getElementById('import-cancel-btn');
const importProgressFill = document.getElementById('import-progress-fill');
const importProgressText = document.getElementById('import-progress-text');
const importStepTitle = document.getElementById('import-step-title');
const importProgressWrap = document.getElementById('import-progress-wrap');
const operationSuccessModal = document.getElementById('operation-success-modal');
const operationSuccessTitle = document.getElementById('operation-success-title');
const operationSuccessMessage = document.getElementById('operation-success-message');
const operationSuccessOk = document.getElementById('operation-success-ok');
const sendModal = document.getElementById('send-modal');
const sendClose = document.getElementById('send-close');
const sendSubmit = document.getElementById('send-submit');
const sendSettingsBtn = document.getElementById('send-settings-btn');
const sendSettingsModal = document.getElementById('send-settings-modal');
const sendSettingsClose = document.getElementById('send-settings-close');
const sendSettingsSave = document.getElementById('send-settings-save');
const sendSettingsIp = document.getElementById('send-settings-ip');
const sendSettingsPort = document.getElementById('send-settings-port');
const sendSettingsAe = document.getElementById('send-settings-ae');
const assignStudySettingsBtn = document.getElementById('assign-study-settings-btn');
const assignStudySettingsModal = document.getElementById('assign-study-settings-modal');
const assignStudySettingsClose = document.getElementById('assign-study-settings-close');
const assignStudySettingsSave = document.getElementById('assign-study-settings-save');
const assignStudySettingsIp = document.getElementById('assign-study-settings-ip');
const assignStudySettingsPort = document.getElementById('assign-study-settings-port');
const assignStudySettingsAe = document.getElementById('assign-study-settings-ae');

// Admin + QR
const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const adminClose = document.getElementById('admin-close');
const adminDone = document.getElementById('admin-done');
const adminChangePasswordBtn = document.getElementById('admin-change-password');
const adminPreviewToggle = document.getElementById('admin-preview-toggle');

// Auth modal (replaces prompt())
const authModal = document.getElementById('auth-modal');
const authCurrentWrap = document.getElementById('auth-current-wrap');
const authNewWrap = document.getElementById('auth-new-wrap');
const authCurrentInput = document.getElementById('auth-current');
const authNewInput = document.getElementById('auth-new');
const authCurrentEye = document.getElementById('auth-current-eye');
const authNewEye = document.getElementById('auth-new-eye');
const authCancel = document.getElementById('auth-cancel');
const authOk = document.getElementById('auth-ok');

const qrModal = document.getElementById('qr-modal');
const qrClose = document.getElementById('qr-close');
const qrDone = document.getElementById('qr-done');
const qrImage = document.getElementById('qr-image');
const qrTitle = document.getElementById('qr-title');
const qrLink = document.getElementById('qr-link');
const qrLinkRow = document.getElementById('qr-link-row');
const copyDownloadLinkBtn = document.getElementById('copy-download-link');

let scanCompleteTimer = null;
let wedgeScanActive = false;

const DCM4CHEE_DOWNLOAD_BASE =
	'http://102.67.142.34:8084/dcm4chee-arc/aets/RADSHARE/rs/studies';

function isHdscPortalUrl(portalUrl) {
	return /hdsc/i.test(String(portalUrl || ''));
}

function extractHdscStudyId(portalUrl) {
	try {
		const parsed = new URL(String(portalUrl || '').trim());
		const match = (parsed.hash || '').match(/\/study\/([a-f0-9-]{36})/i);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

/** Study key for cached download — DICOM UID or HDSC study UUID */
let hdscLoadedStudyUid = null;

function getStudyUidForCurrentPortal() {
	const portal = urlInput?.value?.trim();
	if (!portal) return null;
	if (isHdscPortalUrl(portal)) {
		return hdscLoadedStudyUid || extractHdscStudyId(portal);
	}
	return extractStudyInstanceUid(portal);
}

/** Read StudyInstanceUID from portal viewer URL (?StudyInstanceUIDs=…). */
function extractStudyInstanceUid(portalUrl) {
	let parsed;
	try {
		parsed = new URL(String(portalUrl || '').trim());
	} catch {
		return null;
	}
	const params = parsed.searchParams;
	const raw =
		params.get('StudyInstanceUIDs') ||
		params.get('studyInstanceUIDs') ||
		params.get('StudyInstanceUID') ||
		params.get('studyInstanceUID') ||
		'';
	const uid = raw.split(',')[0]?.trim();
	if (!uid || !/^[\d.]+$/.test(uid)) return null;
	return uid;
}

function buildDownloadUrlFromPortalLink(portalUrl) {
	const uid = extractStudyInstanceUid(portalUrl);
	if (!uid) return null;
	return `${DCM4CHEE_DOWNLOAD_BASE}/${uid}?accept=application/zip`;
}

function getDownloadUrlForCurrentStudy() {
	const portal = urlInput?.value?.trim();
	if (!portal) {
		return { ok: false, reason: 'Enter a portal link first' };
	}
	if (isHdscPortalUrl(portal)) {
		const studyUid = getStudyUidForCurrentPortal();
		if (!studyUid) {
			return { ok: false, reason: 'Load the HDSC study first' };
		}
		return { ok: true, url: portal, studyUid, hdsc: true };
	}
	const url = buildDownloadUrlFromPortalLink(portal);
	if (!url) {
		return {
			ok: false,
			reason:
				'Portal link has no StudyInstanceUID (use ?StudyInstanceUIDs=1.2.3…)',
		};
	}
	return { ok: true, url, studyUid: extractStudyInstanceUid(portal) };
}

let importInProgress = false;
let importAborted = false;
let loadInProgress = false;
let assignStudyInProgress = false;
let assignMwlAllResults = [];
let assignMwlSelectedIndex = -1;
let mwlTagsModalAllTags = [];
let mwlTagsModalStudyRef = null;
/** Metadata from Assign study — applied to DICOM files before Save to PACS */
let assignedStudyForExport = null;

const MWL_TAG_PRIORITY = [
	'0020,000D',
	'0010,0010',
	'0010,0020',
	'0010,0030',
	'0010,0040',
	'0008,0060',
];

// Update status message
function updateStatus(message, isError = false) {
	statusEl.textContent = message;
	statusEl.style.color = isError ? '#d32f2f' : '#666';
}

let unloadDownloadProgress = null;
let loadDotsInterval = null;

function stopDownloadProgressListener() {
	if (unloadDownloadProgress) {
		unloadDownloadProgress();
		unloadDownloadProgress = null;
	}
}

function startDownloadProgressListener(_mode) {
	stopDownloadProgressListener();
	// Load uses dots only — progress events must not restart the animation
}

function stopLoadDotsAnimation() {
	if (loadDotsInterval) {
		clearInterval(loadDotsInterval);
		loadDotsInterval = null;
	}
}

function startLoadDotsAnimation() {
	stopLoadDotsAnimation();
	if (!loadBtn) return;
	let step = 0;
	loadBtn.textContent = 'Downloading.';
	loadDotsInterval = setInterval(() => {
		step = (step + 1) % 3;
		loadBtn.textContent = `Downloading${'.'.repeat(step + 1)}`;
	}, 450);
}

function setLoadButtonProgress(active) {
	if (!loadBtn) return;
	const downloading = Boolean(active) && loadInProgress;
	loadBtn.disabled = downloading;
	loadBtn.classList.toggle('is-downloading', downloading);
	if (downloading) {
		if (!loadDotsInterval) startLoadDotsAnimation();
	} else {
		stopLoadDotsAnimation();
		loadBtn.textContent = 'Load';
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function setAssignStudyAnimating(active) {
	if (!assignStudyBtn) return;
	assignStudyBtn.disabled = active;
	assignStudyBtn.classList.toggle('is-assigning', active);
	assignStudyBtn.textContent = active ? 'Assigning study…' : 'Assign study';
}

// Hide/show preview placeholder
function togglePlaceholder(show) {
	previewPlaceholder.classList.toggle('hidden', !show);
}

async function downloadHdscStudyAndShowMetadata(portalUrl) {
	if (!window.electronAPI?.hdscDownloadStudy) {
		throw new Error('HDSC download not available');
	}
	const dl = await window.electronAPI.hdscDownloadStudy(portalUrl);
	if (!dl?.ok) throw new Error(dl?.error || 'HDSC download failed');
	hdscLoadedStudyUid = dl.studyUid || extractHdscStudyId(portalUrl) || null;
	await applyMetadataFromDownload(dl);
	return dl;
}

async function downloadStudyAndShowMetadata({ progressMode = 'load' } = {}) {
	const portal = urlInput?.value?.trim();
	if (isHdscPortalUrl(portal)) {
		startDownloadProgressListener(progressMode);
		if (progressMode === 'load') setLoadButtonProgress(true);
		try {
			return await downloadHdscStudyAndShowMetadata(portal);
		} finally {
			stopDownloadProgressListener();
		}
	}

	if (!window.electronAPI?.downloadZip) {
		throw new Error('Download not available');
	}
	const downloadTarget = getDownloadUrlForCurrentStudy();
	if (!downloadTarget.ok) {
		throw new Error(downloadTarget.reason);
	}
	startDownloadProgressListener(progressMode);
	if (progressMode === 'load') setLoadButtonProgress(true);
	try {
		const dl = await window.electronAPI.downloadZip(downloadTarget.url, {
			silent: true,
			studyUid: downloadTarget.studyUid,
		});
		if (!dl?.ok) throw new Error(dl?.error || 'Download failed');
		await applyMetadataFromDownload(dl);
		return dl;
	} finally {
		stopDownloadProgressListener();
	}
}

function scrollPatientCardIntoView() {
	const patientCard = document.getElementById('patient-card');
	if (patientCard) patientCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Load: download study, read DICOM metadata, optionally open web preview
async function loadWebsite() {
	const url = urlInput.value.trim();

	if (!url) {
		updateStatus('Please enter a URL', true);
		return;
	}

	try {
		new URL(url);
	} catch {
		updateStatus('Please enter a valid URL', true);
		return;
	}

	if (assignStudyInProgress || importInProgress || loadInProgress) return;

	loadInProgress = true;
	setLoadButtonProgress(true);
	clearAssignedStudyMetadata();
	hdscLoadedStudyUid = null;

	try {
		const hdsc = isHdscPortalUrl(url);
		updateStatus(hdsc ? 'Downloading from HDSC…' : 'Downloading study…');

		if (hdsc && window.electronAPI?.webPreviewGetEnabled) {
			const previewRes = await window.electronAPI.webPreviewGetEnabled();
			if (previewRes?.enabled) {
				togglePlaceholder(false);
			}
		}

		await downloadStudyAndShowMetadata({ progressMode: 'load' });
		scrollPatientCardIntoView();

		if (hdsc) {
			updateStatus('Study loaded from HDSC');
			showLoadSuccessPopup();
			return;
		}

		togglePlaceholder(false);
		if (window.electronAPI?.loadWebsite) {
			const res = await window.electronAPI.loadWebsite(url);
			if (res && res.success === false) {
				updateStatus('Study downloaded — web preview is disabled');
				togglePlaceholder(true);
				showLoadSuccessPopup();
				return;
			}
		}
		updateStatus('Study loaded');
		showLoadSuccessPopup();
	} catch (error) {
		clearPatientMetadata();
		updateStatus(error?.message || 'Load failed', true);
		togglePlaceholder(true);
	} finally {
		loadInProgress = false;
		setLoadButtonProgress(false);
	}
}

// Event listeners
if (loadBtn) {
loadBtn.addEventListener('click', loadWebsite);
}

function normalizeScannedUrl(raw) {
	let s = String(raw || '').trim();
	s = s.replace(/\r?\n/g, '').trim();
	if (!s) return null;
	if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
		s = `https://${s}`;
	}
	try {
		new URL(s);
		return s;
	} catch {
		return null;
	}
}

function setPortalLinkScanStatus(message, state = '') {
	if (!portalLinkScanStatus) return;
	portalLinkScanStatus.textContent = message || '';
	portalLinkScanStatus.className = 'portal-link-scan-status';
	if (state) portalLinkScanStatus.classList.add(`is-${state}`);
}

function stopWedgeScan() {
	if (scanCompleteTimer) {
		clearTimeout(scanCompleteTimer);
		scanCompleteTimer = null;
	}
	wedgeScanActive = false;
	if (qrScannerBtn) qrScannerBtn.disabled = false;
}

/** USB QR scanner: focus portal link and type the scanned URL there. */
function startWedgeQrScan() {
	stopWedgeScan();
	wedgeScanActive = true;
	setPortalLinkScanStatus('Scanning in progress…', 'scanning');
	if (urlInput) {
		urlInput.value = '';
		urlInput.focus();
		urlInput.select();
	}
}

function finalizePortalLinkScan() {
	const raw = urlInput?.value ?? '';
	const normalized = normalizeScannedUrl(raw.replace(/\r?\n/g, ''));
	wedgeScanActive = false;
	if (!normalized) {
		setPortalLinkScanStatus('Scanned text is not a valid URL', 'error');
		return false;
	}
	urlInput.value = normalized;
	setPortalLinkScanStatus('Scan completed', 'completed');
	updateStatus('Portal link ready');
	return true;
}

if (qrScannerBtn) {
	qrScannerBtn.addEventListener('click', () => {
		startWedgeQrScan();
	});
}

async function handlePasteLink() {
	stopWedgeScan();
	wedgeScanActive = false;
	urlInput.focus();
	try {
		if (navigator.clipboard?.readText) {
			const text = (await navigator.clipboard.readText()).trim();
			if (text) {
				const normalized = normalizeScannedUrl(text);
				if (normalized) {
					urlInput.value = normalized;
					setPortalLinkScanStatus('Scan completed', 'completed');
				} else {
					urlInput.value = text;
					setPortalLinkScanStatus('', '');
				}
				updateStatus('Link pasted');
				return;
			}
		}
	} catch {
		// fall through
	}
	updateStatus('Paste into the URL field (Ctrl+V)');
}

if (pasteLinkBtn) {
	pasteLinkBtn.addEventListener('click', handlePasteLink);
}
urlInput.addEventListener('keydown', (e) => {
	if (e.key !== 'Enter') return;
		e.preventDefault();
	if (wedgeScanActive) {
		finalizePortalLinkScan();
		return;
	}
	const normalized = normalizeScannedUrl(urlInput.value);
	if (normalized) urlInput.value = normalized;
		loadWebsite();
});

urlInput.addEventListener('input', () => {
	if (!wedgeScanActive || !urlInput.value.includes('\n')) return;
	urlInput.value = urlInput.value.replace(/\r?\n/g, '');
	finalizePortalLinkScan();
});

// Initial state (updated once web preview state is known)
updateStatus('Scan or paste a portal link to begin');

function applyWebPreviewEnabled(enabled) {
	if (!containerEl) return;
	const on = Boolean(enabled);
	containerEl.classList.toggle('preview-disabled', !on);
	if (!on) {
		togglePlaceholder(true);
		updateStatus('Scan or paste a portal link to begin');
	} else {
		updateStatus('Enter a URL and click Load to preview');
	}
	if (adminPreviewToggle) {
		adminPreviewToggle.checked = on;
	}
}

// Initialize web preview state + keep in sync with main process menu toggle
(async () => {
	try {
		if (window.electronAPI && typeof window.electronAPI.webPreviewGetEnabled === 'function') {
			const res = await window.electronAPI.webPreviewGetEnabled();
			if (res && res.ok) applyWebPreviewEnabled(res.enabled);
		}
	} catch { }
})();

if (window.electronAPI && typeof window.electronAPI.onWebPreviewEnabledChanged === 'function') {
	window.electronAPI.onWebPreviewEnabledChanged((payload) => {
		applyWebPreviewEnabled(payload && payload.enabled);
	});
}

if (window.electronAPI?.onHdscPreviewActive) {
	window.electronAPI.onHdscPreviewActive((payload) => {
		if (payload?.active) togglePlaceholder(false);
	});
}

async function syncAdminPreviewToggle() {
	if (!adminPreviewToggle) return;
	try {
		if (window.electronAPI && typeof window.electronAPI.webPreviewGetEnabled === 'function') {
			const res = await window.electronAPI.webPreviewGetEnabled();
			if (res && res.ok) adminPreviewToggle.checked = Boolean(res.enabled);
		}
	} catch { }
}

if (adminPreviewToggle) {
	adminPreviewToggle.addEventListener('change', async () => {
		try {
			if (window.electronAPI && typeof window.electronAPI.webPreviewSetEnabled === 'function') {
				await window.electronAPI.webPreviewSetEnabled(adminPreviewToggle.checked);
			}
		} catch {
			updateStatus('Failed to change web preview setting', true);
		}
	});
}

function isOverlayOpen(el) {
	return el && el.classList.contains('open');
}

function resumePreviewIfIdle() {
	if (
		isOverlayOpen(pacsModal) ||
		isOverlayOpen(pacsListModal) ||
		isOverlayOpen(sendModal) ||
		isOverlayOpen(sendSettingsModal) ||
		isOverlayOpen(assignStudySettingsModal) ||
		isOverlayOpen(adminModal) ||
		isOverlayOpen(authModal) ||
		isOverlayOpen(qrModal) ||
		isOverlayOpen(assignStudyModal) ||
		isOverlayOpen(assignMwlTagsModal) ||
		isOverlayOpen(operationSuccessModal)
	) {
		return;
	}
	window.electronAPI.previewResume();
}

function openModal(modalEl) {
	modalEl.classList.add('open');
	window.electronAPI.previewSuspend();
}

function closeModal(modalEl) {
	modalEl.classList.remove('open');
	resumePreviewIfIdle();
}

function askAdminAuth(mode) {
	// mode: 'set' | 'verify' | 'change'
	return new Promise((resolve) => {
		let done = false;
		const finish = (result) => {
			if (done) return;
			done = true;
			try { closeModal(authModal); } catch { }
			cleanup();
			resolve(result);
		};

		const onCancel = () => finish({ cancelled: true });
		const onOk = () => {
			const current = authCurrentInput.value || '';
			const next = authNewInput.value || '';
			if (mode === 'verify') finish({ cancelled: false, password: current });
			else if (mode === 'set') finish({ cancelled: false, newPassword: next });
			else finish({ cancelled: false, currentPassword: current, newPassword: next });
		};
		const onKey = (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				onOk();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				onCancel();
			}
		};
		const onOverlay = (e) => {
			if (e.target === authModal) onCancel();
		};
		const bindEye = (btn, input) => {
			if (!btn || !input) return () => {};
			const eyeSvg = `
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			`;
			const eyeOffSvg = `
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M3.5 3.5 20.5 20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M10.3 10.3a3.5 3.5 0 0 0 4.95 4.95" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M6.2 6.2C4 7.9 2.5 10.7 2.5 12c0 0 3.5 7 9.5 7 1.7 0 3.2-.4 4.4-1.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M9.2 5.4A9.3 9.3 0 0 1 12 5c6 0 9.5 7 9.5 7 0 .8-1.4 3.6-3.9 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			`;

			const onEye = () => {
				const isHidden = input.type === 'password';
				input.type = isHidden ? 'text' : 'password';
				btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
				btn.innerHTML = isHidden ? eyeOffSvg : eyeSvg;
				try { input.focus(); } catch { }
			};
			btn.addEventListener('click', onEye);
			return () => btn.removeEventListener('click', onEye);
		};
		let unbindCurrentEye = () => {};
		let unbindNewEye = () => {};
		const cleanup = () => {
			authCancel.removeEventListener('click', onCancel);
			authOk.removeEventListener('click', onOk);
			authModal.removeEventListener('click', onOverlay);
			authCurrentInput.removeEventListener('keydown', onKey);
			authNewInput.removeEventListener('keydown', onKey);
			unbindCurrentEye();
			unbindNewEye();
		};

		// Setup UI
		authCurrentInput.value = '';
		authNewInput.value = '';
		authCurrentInput.type = 'password';
		authNewInput.type = 'password';
		if (authCurrentEye) {
			// reset to "show" state icon
			authCurrentEye.innerHTML = `
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			`;
			authCurrentEye.setAttribute('aria-label', 'Show password');
		}
		if (authNewEye) {
			authNewEye.innerHTML = `
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			`;
			authNewEye.setAttribute('aria-label', 'Show password');
		}
		if (mode === 'set') {
			document.getElementById('auth-title').textContent = 'Set Admin Password';
			authCurrentWrap.style.display = 'none';
			authNewWrap.style.display = '';
			authOk.textContent = 'Save';
			openModal(authModal);
			unbindNewEye = bindEye(authNewEye, authNewInput);
			setTimeout(() => authNewInput.focus(), 0);
		} else if (mode === 'verify') {
			document.getElementById('auth-title').textContent = 'Admin Login';
			authCurrentWrap.style.display = '';
			authNewWrap.style.display = 'none';
			authOk.textContent = 'Continue';
			openModal(authModal);
			unbindCurrentEye = bindEye(authCurrentEye, authCurrentInput);
			setTimeout(() => authCurrentInput.focus(), 0);
		} else {
			document.getElementById('auth-title').textContent = 'Change Admin Password';
			authCurrentWrap.style.display = '';
			authNewWrap.style.display = '';
			authOk.textContent = 'Change';
			openModal(authModal);
			unbindCurrentEye = bindEye(authCurrentEye, authCurrentInput);
			unbindNewEye = bindEye(authNewEye, authNewInput);
			setTimeout(() => authCurrentInput.focus(), 0);
		}

		// Wire events
		authCancel.addEventListener('click', onCancel);
		authOk.addEventListener('click', onOk);
		authModal.addEventListener('click', onOverlay);
		authCurrentInput.addEventListener('keydown', onKey);
		authNewInput.addEventListener('keydown', onKey);
	});
}

async function handleAdminClick() {
	try {
		if (!window.electronAPI) {
			updateStatus('Failed to open admin panel: electronAPI missing', true);
			return;
		}
		if (typeof window.electronAPI.adminState !== 'function') {
			updateStatus('Failed to open admin panel: adminState API missing', true);
			return;
		}
		const state = await window.electronAPI.adminState();
		if (!state || !state.ok) {
			updateStatus('Admin system unavailable', true);
			return;
		}

		if (!state.initialized) {
			const resAuth = await askAdminAuth('set');
			if (resAuth.cancelled) return;
			const newPwd = String(resAuth.newPassword || '');
			if (!newPwd) {
				updateStatus('Password is required', true);
				return;
			}
			const res = await window.electronAPI.adminSetPassword(newPwd);
			if (!res || !res.ok) {
				updateStatus(res?.error || 'Failed to set password', true);
				return;
			}
			updateStatus('Admin password set');
			await syncAdminPreviewToggle();
			openModal(adminModal);
			return;
		}

		const resAuth = await askAdminAuth('verify');
		if (resAuth.cancelled) return;
		const pwd = String(resAuth.password || '');
		const ok = await window.electronAPI.adminVerifyPassword(pwd);
		if (!ok || !ok.ok) {
			updateStatus('Wrong password', true);
			return;
		}
		await syncAdminPreviewToggle();
		openModal(adminModal);
	} catch (e) {
		const msg = (e && (e.message || e.toString && e.toString())) ? (e.message || e.toString()) : 'Unknown error';
		updateStatus(`Failed to open admin panel: ${msg}`, true);
		try { console.error('Admin panel open failed', e); } catch { }
	}
}

async function handleChangePassword() {
	try {
		const resAuth = await askAdminAuth('change');
		if (resAuth.cancelled) return;
		const currentPwd = String(resAuth.currentPassword || '');
		const newPwd = String(resAuth.newPassword || '');
		if (!currentPwd || !newPwd) {
			updateStatus('Both current and new password are required', true);
			return;
		}
		const res = await window.electronAPI.adminChangePassword(currentPwd, newPwd);
		if (res && res.ok) {
			updateStatus('Password changed');
		} else {
			updateStatus(res?.error || 'Failed to change password', true);
		}
	} catch {
		updateStatus('Failed to change password', true);
	}
}

// Open from hidden button (if present) and from app menu event
if (adminBtn) adminBtn.addEventListener('click', handleAdminClick);
if (window.electronAPI.onOpenAdminPanel) {
	window.electronAPI.onOpenAdminPanel(handleAdminClick);
}
adminClose.addEventListener('click', () => closeModal(adminModal));
adminDone.addEventListener('click', () => closeModal(adminModal));
adminChangePasswordBtn.addEventListener('click', handleChangePassword);
adminModal.addEventListener('click', (e) => {
	if (e.target === adminModal) closeModal(adminModal);
});

async function handleGenerateQr() {
	const url = urlInput.value.trim();
	if (!url) {
		updateStatus('Please enter a URL', true);
		return;
	}
	try {
		new URL(url);
	} catch {
		updateStatus('Please enter a valid URL', true);
		return;
	}

	try {
		const res = await window.electronAPI.qrGenerate(url);
		if (!res || !res.ok) {
			updateStatus(res?.error || 'Failed to generate QR', true);
			return;
		}
		qrImage.src = res.dataUrl;
		if (qrTitle) qrTitle.textContent = 'QR Code';
		if (qrLink) {
			qrLink.textContent = '';
		}
		if (qrLinkRow) {
			qrLinkRow.classList.add('hidden');
		}
		openModal(qrModal);
	} catch {
		updateStatus('Failed to generate QR', true);
	}
}

qrClose.addEventListener('click', () => closeModal(qrModal));
qrDone.addEventListener('click', () => closeModal(qrModal));
qrModal.addEventListener('click', (e) => {
	if (e.target === qrModal) closeModal(qrModal);
});

function setImportProgress(percent, text, title, isError = false) {
	const pct = Math.min(100, Math.max(0, percent));
	if (importProgressFill) importProgressFill.style.width = `${pct}%`;
	if (importProgressText) {
		importProgressText.textContent =
			text || (pct >= 100 ? 'You may continue (100%)' : `You may continue (${Math.round(pct)}%)`);
		importProgressText.classList.toggle('is-error', Boolean(isError));
	}
	if (title && importStepTitle) importStepTitle.textContent = title;
}

function showImportProgressBar() {
	if (importProgressWrap) importProgressWrap.classList.remove('is-hidden');
}

function hideImportProgressBar() {
	if (importProgressWrap) importProgressWrap.classList.add('is-hidden');
}

function showOperationSuccessPopup({ title = 'Success', message = '' } = {}) {
	if (!operationSuccessModal) return;
	if (operationSuccessTitle) operationSuccessTitle.textContent = title;
	if (operationSuccessMessage) {
		const detail = String(message || '').trim();
		operationSuccessMessage.textContent = detail;
		operationSuccessMessage.hidden = !detail;
		operationSuccessMessage.classList.toggle('is-empty', !detail);
	}
	openModal(operationSuccessModal);
}

function closeOperationSuccessPopup() {
	if (operationSuccessModal) closeModal(operationSuccessModal);
	resumePreviewIfIdle();
}

function showLoadSuccessPopup() {
	showOperationSuccessPopup({ title: 'Study loaded' });
}

function showAssignSuccessPopup() {
	showOperationSuccessPopup({ title: 'Study assigned' });
}

function showPacsSuccessPopup({ filesSent = 0, patientName = '' } = {}) {
	const n = Number(filesSent) || 0;
	const name = patientName && String(patientName).trim();
	const fileLabel = `${n} DICOM image${n === 1 ? '' : 's'}`;
	const message = name
		? `${name} — ${fileLabel} transmitted to PACS successfully.`
		: `${fileLabel} transmitted to PACS successfully.`;
	setImportProgress(100, 'You may continue (100%)', 'Step 3: Import complete');
	hideImportProgressBar();
	showOperationSuccessPopup({ title: 'Saved to PACS', message });
	const patientCard = document.getElementById('patient-card');
	if (patientCard) patientCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetImportUi() {
	importInProgress = false;
	importAborted = false;
	if (addToPacsBtn) addToPacsBtn.disabled = false;
	if (importCancelBtn) importCancelBtn.disabled = false;
	if (loadBtn) loadBtn.disabled = false;
	if (eyeBtn) eyeBtn.disabled = false;
	showImportProgressBar();
	setImportProgress(0, 'Ready to import', 'Step 3: Import in progress…');
}

const META_FIELDS = [
	{ key: 'patientName', el: metaPatientName },
	{ key: 'patientId', el: metaPatientId },
	{ key: 'dob', el: metaDob, format: formatPatientDob },
	{ key: 'gender', el: metaGender, format: formatPatientGender },
	{ key: 'modality', el: metaModality },
];

function formatPatientDob(raw) {
	const s = String(raw || '').trim();
	if (!s) return '';
	const digits = s.replace(/\D/g, '');
	if (digits.length === 8) {
		const y = digits.slice(0, 4);
		const m = digits.slice(4, 6);
		const d = digits.slice(6, 8);
		return `${d}/${m}/${y}`;
	}
	return s;
}

function formatPatientGender(raw) {
	const s = String(raw || '').trim().toUpperCase();
	if (s === 'M') return 'Male';
	if (s === 'F') return 'Female';
	if (s === 'O') return 'Other';
	return String(raw || '').trim();
}

function clearPatientMetadata() {
	clearAssignedStudyMetadata();
	hdscLoadedStudyUid = null;
	for (const { el } of META_FIELDS) {
		if (!el) continue;
		el.textContent = 'Not available';
		el.classList.add('meta-missing');
	}
}

function getMetadataPatientName(metadata) {
	const name = metadata?.patientName;
	return name && String(name).trim() ? String(name).trim() : '';
}

function getPatientNameFromCard() {
	if (metaPatientName && !metaPatientName.classList.contains('meta-missing')) {
		return metaPatientName.textContent?.trim() || '';
	}
	return '';
}

function renderPatientMetadata(metadata, availability) {
	for (const { key, el, format } of META_FIELDS) {
		if (!el) continue;
		const raw = metadata?.[key];
		const has = availability?.[key] ?? Boolean(raw && String(raw).trim());
		if (has && raw) {
			const display = format ? format(raw) : String(raw).trim();
			el.textContent = display || 'Not available';
			el.classList.toggle('meta-missing', !display);
		} else {
			el.textContent = 'Not available';
			el.classList.add('meta-missing');
		}
	}
}

async function applyMetadataFromDownload(dl) {
	if (dl?.path && window.electronAPI?.getDicomMetadataFromZip) {
		const metaRes = await window.electronAPI.getDicomMetadataFromZip(dl.path);
		if (metaRes?.ok) {
			renderPatientMetadata(metaRes.metadata, metaRes.availability, metaRes.warnings);
			return getMetadataPatientName(metaRes.metadata);
		}
		clearPatientMetadata();
		throw new Error(metaRes?.reason || 'Could not read DICOM metadata');
	}
	if (dl?.metadata) {
		renderPatientMetadata(dl.metadata, dl.metadataAvailability, dl.metadataWarnings);
		return getMetadataPatientName(dl.metadata);
	}
	clearPatientMetadata();
	throw new Error('No DICOM metadata found in download');
}

function toInputDate(d) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function getDefaultMwlDateRange() {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - 1);
	return { start: toInputDate(start), end: toInputDate(end) };
}

function setAssignMwlStatus(message, isError = false) {
	if (!assignMwlStatus) return;
	assignMwlStatus.textContent = message || '';
	assignMwlStatus.classList.toggle('is-error', Boolean(isError));
}

const DICOM_TAG_NAMES = {
	'0008,0005': 'SpecificCharacterSet',
	'0008,0050': 'AccessionNumber',
	'0008,0060': 'Modality',
	'0008,0090': 'ReferringPhysicianName',
	'0010,0010': 'PatientName',
	'0010,0020': 'PatientID',
	'0010,0030': 'PatientBirthDate',
	'0010,0040': 'PatientSex',
	'0020,000D': 'StudyInstanceUID',
	'0040,0002': 'ScheduledProcedureStepStartDate',
	'0040,0003': 'ScheduledProcedureStepStartTime',
	'0040,0006': 'ScheduledPerformingPhysicianName',
	'0040,0007': 'ScheduledProcedureStepDescription',
	'0040,0009': 'ScheduledProcedureStepID',
	'0040,0010': 'ScheduledStationName',
	'0040,0011': 'ScheduledProcedureStepLocation',
	'0040,0012': 'PreMedication',
	'0040,1001': 'RequestedProcedureID',
	'0040,1003': 'RequestedProcedureDescription',
};

function dicomTagLabel(tag) {
	return DICOM_TAG_NAMES[String(tag || '').toUpperCase()] || '—';
}

function normalizeDicomTagValue(raw) {
	return String(raw || '')
		.replace(/\u0000/g, '')
		.trim();
}

function isNonemptyMwlTag(t) {
	return Boolean(normalizeDicomTagValue(t?.value));
}

function formatMwlTagDisplayValue(tag, value) {
	const v = normalizeDicomTagValue(value);
	const key = String(tag || '').toUpperCase();
	if (key === '0010,0030') return formatPatientDob(v) || v;
	if (key === '0010,0040') return formatPatientGender(v) || v;
	return v;
}

function sortMwlTagsForDisplay(tags) {
	const priorityIndex = (tag) => {
		const i = MWL_TAG_PRIORITY.indexOf(String(tag || '').toUpperCase());
		return i === -1 ? 999 : i;
	};
	return [...tags].sort((a, b) => {
		const pa = priorityIndex(a.tag);
		const pb = priorityIndex(b.tag);
		if (pa !== pb) return pa - pb;
		return String(a.tag).localeCompare(String(b.tag));
	});
}

function filterMwlTagsBySearch(tags, query) {
	const q = String(query || '').trim().toLowerCase();
	if (!q) return tags;
	return tags.filter((t) => {
		const display = formatMwlTagDisplayValue(t.tag, t.value);
		const hay = [t.tag, dicomTagLabel(t.tag), t.vr, display, normalizeDicomTagValue(t.value)]
			.join(' ')
			.toLowerCase();
		return hay.includes(q);
	});
}

function isPriorityMwlTag(tag) {
	return MWL_TAG_PRIORITY.includes(String(tag || '').toUpperCase());
}

function mwlRowKey(study) {
	return `${study?.accessionNumber || ''}|${study?.patientId || ''}|${study?.patientName || ''}`;
}

function tagsFromMwlSummary(study) {
	const tags = [];
	if (study?.patientName) tags.push({ tag: '0010,0010', vr: 'PN', value: study.patientName });
	if (study?.patientId) tags.push({ tag: '0010,0020', vr: 'LO', value: study.patientId });
	if (study?.accessionNumber) tags.push({ tag: '0008,0050', vr: 'SH', value: study.accessionNumber });
	if (study?.modality) tags.push({ tag: '0008,0060', vr: 'CS', value: study.modality });
	if (study?.description) tags.push({ tag: '0040,0007', vr: 'LO', value: study.description });
	return tags;
}

function filterMwlResults(rows, query) {
	const q = String(query || '').trim().toLowerCase();
	if (!q) return rows;
	return rows.filter((row) => {
		const hay = [
			row.patientName,
			row.patientId,
			row.accessionNumber,
			row.modality,
			row.description,
		]
			.join(' ')
			.toLowerCase();
		return hay.includes(q);
	});
}

function renderAssignMwlTable(rows) {
	if (!assignMwlTbody) return;
	assignMwlSelectedIndex = -1;
	if (assignMwlConfirm) assignMwlConfirm.disabled = true;
	assignMwlTbody.innerHTML = '';

	const list = rows || [];
	if (assignMwlTable) assignMwlTable.classList.toggle('hidden-ui', list.length === 0);
	if (assignMwlEmpty) assignMwlEmpty.classList.toggle('hidden-ui', list.length > 0);

	for (let i = 0; i < list.length; i++) {
		const row = list[i];
		const tr = document.createElement('tr');
		tr.dataset.index = String(i);
		tr.innerHTML = `
			<td>${escapeHtml(row.patientName || '—')}</td>
			<td>${escapeHtml(row.patientId || '—')}</td>
			<td>${escapeHtml(row.accessionNumber || '—')}</td>
			<td>${escapeHtml(row.modality || '—')}</td>
		`;
		tr.addEventListener('click', () => selectAssignMwlRow(i));
		tr.addEventListener('dblclick', (e) => {
			e.preventDefault();
			void showMwlDicomTagsModal(row);
		});
		assignMwlTbody.appendChild(tr);
	}
}

function renderMwlTagsModalTable() {
	const study = mwlTagsModalStudyRef;
	const searchQ = assignMwlTagsSearch?.value || '';
	const filtered = filterMwlTagsBySearch(mwlTagsModalAllTags, searchQ);

	const label = [study?.patientName, study?.patientId, study?.accessionNumber]
		.filter(Boolean)
		.join(' · ');
	if (assignMwlTagsSubtitle) {
		const total = mwlTagsModalAllTags.length;
		const shown = filtered.length;
		let msg = '';
		if (!total) {
			msg = 'No non-empty DICOM attributes for this entry.';
		} else if (searchQ) {
			msg = label
				? `${label} — showing ${shown} of ${total} tags`
				: `Showing ${shown} of ${total} tags`;
		} else {
			msg = label
				? `${label} — ${total} tag${total === 1 ? '' : 's'}`
				: `${total} tag${total === 1 ? '' : 's'}`;
		}
		assignMwlTagsSubtitle.textContent = msg;
	}

	if (!assignMwlTagsTbody) return;
	assignMwlTagsTbody.innerHTML = '';

	if (!filtered.length) {
		const tr = document.createElement('tr');
		tr.innerHTML = searchQ
			? '<td colspan="4" style="text-align:center;color:#8a9a94;padding:20px">No tags match your search.</td>'
			: '<td colspan="4" style="text-align:center;color:#8a9a94;padding:20px">No non-empty DICOM attributes for this entry.</td>';
		assignMwlTagsTbody.appendChild(tr);
		return;
	}

	for (const t of filtered) {
		const displayValue = formatMwlTagDisplayValue(t.tag, t.value);
		const tr = document.createElement('tr');
		if (isPriorityMwlTag(t.tag)) tr.classList.add('is-priority');
		tr.innerHTML = `
			<td class="tag-col">(${escapeHtml(t.tag)})</td>
			<td class="name-col">${escapeHtml(dicomTagLabel(t.tag))}</td>
			<td>${escapeHtml(t.vr || '')}</td>
			<td class="value-col">${escapeHtml(displayValue)}</td>
		`;
		assignMwlTagsTbody.appendChild(tr);
	}
}

async function showMwlDicomTagsModal(study) {
	if (!assignMwlTagsModal || !study) return;

	let tags = [];
	if (window.electronAPI?.getMwlStudyTags) {
		try {
			const res = await window.electronAPI.getMwlStudyTags(mwlRowKey(study));
			if (res?.ok) tags = res.tags || [];
		} catch {
			tags = [];
		}
	}
	if (!tags.length) tags = tagsFromMwlSummary(study);

	mwlTagsModalStudyRef = study;
	mwlTagsModalAllTags = sortMwlTagsForDisplay(tags.filter(isNonemptyMwlTag));

	if (assignMwlTagsSearch) assignMwlTagsSearch.value = '';
	renderMwlTagsModalTable();
	openModal(assignMwlTagsModal);
	if (assignMwlTagsSearch) assignMwlTagsSearch.focus();
}

function closeMwlDicomTagsModal() {
	mwlTagsModalAllTags = [];
	mwlTagsModalStudyRef = null;
	if (assignMwlTagsSearch) assignMwlTagsSearch.value = '';
	if (assignMwlTagsModal) closeModal(assignMwlTagsModal);
}

function escapeHtml(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function selectAssignMwlRow(index) {
	assignMwlSelectedIndex = index;
	if (!assignMwlTbody) return;
	assignMwlTbody.querySelectorAll('tr').forEach((tr) => {
		tr.classList.toggle('is-selected', Number(tr.dataset.index) === index);
	});
	if (assignMwlConfirm) assignMwlConfirm.disabled = index < 0;
}

function getCardValue(el) {
	if (!el) return '';
	if (el.classList.contains('meta-missing')) return '';
	return (el.textContent || '').trim();
}

function buildCardMetadataBaseline() {
	return {
		patientName: getCardValue(metaPatientName),
		patientId: getCardValue(metaPatientId),
		dob: getCardValue(metaDob),
		gender: getCardValue(metaGender),
		modality: getCardValue(metaModality),
	};
}

function clearAssignedStudyMetadata() {
	assignedStudyForExport = null;
}

function displayNameToDicomPn(display) {
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

function buildAssignedExportMetadata(study, tags = []) {
	const nameRaw = tagValue(tags, '0010,0010') || study?.patientName || '';
	return {
		patientName: nameRaw.includes('^') ? nameRaw : displayNameToDicomPn(nameRaw),
		patientId: tagValue(tags, '0010,0020') || study?.patientId || '',
		dob: tagValue(tags, '0010,0030') || '',
		gender: tagValue(tags, '0010,0040') || '',
		modality: tagValue(tags, '0008,0060') || study?.modality || '',
		accessionNumber: tagValue(tags, '0008,0050') || study?.accessionNumber || '',
	};
}

function tagValue(tags, tag) {
	const wanted = String(tag || '').toUpperCase();
	const hit = (tags || []).find((t) => String(t?.tag || '').toUpperCase() === wanted);
	return normalizeDicomTagValue(hit?.value || '');
}

function storeAssignedStudyMetadata(study, tags = []) {
	const meta = buildAssignedExportMetadata(study, tags);
	const hasAny = Object.values(meta).some((v) => Boolean(String(v || '').trim()));
	assignedStudyForExport = hasAny ? meta : null;
}

function applyMwlStudyToPatientCard(study, tags = []) {
	// Important: Assign should NOT wipe out fields we already got from Load (ZIP metadata).
	// So we start from what's already on the card, then overwrite with MWL values if present.
	const base = buildCardMetadataBaseline();

	const dobRaw = tagValue(tags, '0010,0030');
	const sexRaw = tagValue(tags, '0010,0040');
	const modalityRaw = tagValue(tags, '0008,0060'); // Often empty on this PACS MWL

	const metadata = {
		patientName: study?.patientName || base.patientName || '',
		patientId: study?.patientId || base.patientId || '',
		// DOB/Gender from worklist tags (preferred)
		dob: dobRaw || base.dob || '',
		gender: sexRaw || base.gender || '',
		// Modality: keep existing from Load if MWL does not provide it
		modality: modalityRaw || study?.modality || base.modality || '',
	};

	const availability = {
		patientName: Boolean(metadata.patientName),
		patientId: Boolean(metadata.patientId),
		dob: Boolean(metadata.dob),
		gender: Boolean(metadata.gender),
		modality: Boolean(metadata.modality),
	};

	renderPatientMetadata(metadata, availability);
}

function resetAssignStudyModal() {
	assignMwlAllResults = [];
	assignMwlSelectedIndex = -1;
	const { start, end } = getDefaultMwlDateRange();
	if (assignMwlStart) assignMwlStart.value = start;
	if (assignMwlEnd) assignMwlEnd.value = end;
	if (assignMwlSearch) assignMwlSearch.value = '';
	setAssignMwlStatus('Set dates and click Search.');
	renderAssignMwlTable([]);
}

function closeAssignStudyModal() {
	if (assignStudyModal) closeModal(assignStudyModal);
}

async function runAssignMwlSearch() {
	if (!window.electronAPI?.queryMwlWorklist) {
		setAssignMwlStatus('Worklist search not available', true);
		return;
	}
	const params = await resolveAssignStudyParams();
	if (!params) {
		setAssignMwlStatus('Set IP, port, and AE Title in Admin → Worklist Settings', true);
		return;
	}
	const startDate = assignMwlStart?.value;
	const endDate = assignMwlEnd?.value;
	if (!startDate || !endDate) {
		setAssignMwlStatus('Choose start and end dates', true);
		return;
	}

	if (assignMwlRun) assignMwlRun.disabled = true;
	setAssignMwlStatus('Searching worklist…');

	try {
		const res = await window.electronAPI.queryMwlWorklist({
			ip: params.ip,
			port: params.port,
			aeTitle: params.aeTitle,
			startDate,
			endDate,
			maxResults: 300,
		});
		if (!res?.ok) throw new Error(res?.reason || 'Search failed');

		assignMwlAllResults = res.studies || [];
		const filtered = filterMwlResults(assignMwlAllResults, assignMwlSearch?.value);
		renderAssignMwlTable(filtered);

		if (filtered.length === 0) {
			setAssignMwlStatus(
				assignMwlAllResults.length
					? 'No rows match your search filter.'
					: `No studies found (${res.dateRange || 'selected dates'}).`
			);
		} else {
			setAssignMwlStatus(
				`${filtered.length} stud${filtered.length === 1 ? 'y' : 'ies'} — select one, then click Assign.`
			);
		}
	} catch (e) {
		setAssignMwlStatus(e?.message || 'Search failed', true);
		renderAssignMwlTable([]);
	} finally {
		if (assignMwlRun) assignMwlRun.disabled = false;
	}
}

function openAssignStudyModal() {
	resetAssignStudyModal();
	if (assignStudyModal) openModal(assignStudyModal);
}

async function confirmAssignMwlSelection() {
	const filtered = filterMwlResults(assignMwlAllResults, assignMwlSearch?.value);
	const study = filtered[assignMwlSelectedIndex];
	if (!study) return;

	closeAssignStudyModal();
	assignStudyInProgress = true;
	setAssignStudyAnimating(true);
	updateStatus('Assigning study…');

	try {
		let tags = [];
		if (window.electronAPI?.getMwlStudyTags) {
			try {
				const res = await window.electronAPI.getMwlStudyTags(mwlRowKey(study));
				if (res?.ok) tags = res.tags || [];
			} catch {
				tags = [];
			}
		}
		storeAssignedStudyMetadata(study, tags);
		applyMwlStudyToPatientCard(study, tags);
		await sleep(3000);
		updateStatus('Study assigned');
		scrollPatientCardIntoView();
		showAssignSuccessPopup();
	} catch (e) {
		updateStatus(e?.message || 'Assign study failed', true);
	} finally {
		assignStudyInProgress = false;
		setAssignStudyAnimating(false);
	}
}

async function ensureLoadBeforeAssign() {
	const downloadTarget = getDownloadUrlForCurrentStudy();
	if (!downloadTarget.ok) {
		updateStatus(downloadTarget.reason, true);
		return false;
	}
	if (!window.electronAPI?.getDownloadedStudy) return false;
	const cached = await window.electronAPI.getDownloadedStudy(downloadTarget.studyUid);
	if (!cached?.ready) {
		updateStatus('Click Load button first', true);
		return false;
	}
	return true;
}

async function handleAssignStudy() {
	if (assignStudyInProgress || importInProgress || loadInProgress) return;
	const ready = await ensureLoadBeforeAssign();
	if (!ready) return;
	openAssignStudyModal();
}

async function resolveAssignStudyParams() {
	if (!window.electronAPI?.getAssignStudySettings) return null;
	const settingsRes = await window.electronAPI.getAssignStudySettings();
	if (settingsRes?.ok && settingsRes.settings) {
		const { ip, port, aeTitle } = settingsRes.settings;
		return { ip, port, aeTitle };
	}
	return null;
}

async function resolveSendParams() {
	const settingsRes = await window.electronAPI.getSendSettings();
	if (settingsRes?.ok && settingsRes.settings) {
		const { ip, port, aeTitle } = settingsRes.settings;
		return { ip, port, aeTitle };
	}
	const records = await window.electronAPI.listPacs();
	if (records?.length > 0) {
		const pacs = records[0];
		return { ip: pacs.ip, port: pacs.port, aeTitle: pacs.ae };
	}
	return null;
}

async function handleAddToPacs() {
	if (importInProgress) return;
	if (!window.electronAPI?.getDownloadedStudy || !window.electronAPI?.sendDicomFiles) {
		showImportProgressBar();
		setImportProgress(0, 'Save to PACS not available', 'Step 3: Import', true);
		return;
	}

	const downloadTarget = getDownloadUrlForCurrentStudy();
	if (!downloadTarget.ok) {
		showImportProgressBar();
		setImportProgress(0, downloadTarget.reason, 'Step 3: Import', true);
		return;
	}

	importInProgress = true;
	importAborted = false;
	if (addToPacsBtn) addToPacsBtn.disabled = true;
	if (assignStudyBtn) assignStudyBtn.disabled = true;
	if (loadBtn) loadBtn.disabled = true;
	if (eyeBtn) eyeBtn.disabled = true;
	showImportProgressBar();

	try {
		const cached = await window.electronAPI.getDownloadedStudy(downloadTarget.studyUid);
		let importPatientName = getPatientNameFromCard();

		if (cached?.ready) {
			setImportProgress(
				25,
				'You may continue (25%) — using study from Load / Assign',
				'Step 3: Import in progress…'
			);
			if (!importPatientName && cached.path && window.electronAPI.getDicomMetadataFromZip) {
				const metaRes = await window.electronAPI.getDicomMetadataFromZip(cached.path);
				if (metaRes?.ok) {
					renderPatientMetadata(metaRes.metadata, metaRes.availability, metaRes.warnings);
					importPatientName = getMetadataPatientName(metaRes.metadata);
				}
			}
		} else {
			showImportProgressBar();
			setImportProgress(
				0,
				'Click Load button first',
				'Step 3: Import',
				true
			);
			return;
		}

		setImportProgress(45, 'You may continue (45%) — preparing send…', 'Step 3: Import in progress…');

		const params = await resolveSendParams();
		if (importAborted) return;
		if (!params) {
			showImportProgressBar();
			setImportProgress(45, 'Set PACS Settings in Admin, then try again', 'Step 3: Import paused', true);
			openSendModal();
			return;
		}

		const sendParams = { ...params };
		if (assignedStudyForExport) {
			setImportProgress(55, 'You may continue (55%) — applying assigned patient metadata…', 'Step 3: Import in progress…');
			sendParams.assignedMetadata = assignedStudyForExport;
		}

		setImportProgress(70, `You may continue (70%) — sending to ${params.ip}:${params.port}…`, 'Step 3: Import in progress…');

		const sendRes = await window.electronAPI.sendDicomFiles(sendParams);
		if (importAborted) return;
		if (!sendRes?.ok) throw new Error(sendRes?.reason || 'Send failed');

		const n = sendRes.filesSent || 0;
		let patientName = importPatientName;
		if (!patientName && metaPatientName && !metaPatientName.classList.contains('meta-missing')) {
			patientName = metaPatientName.textContent?.trim() || '';
		}
		showPacsSuccessPopup({ filesSent: n, patientName });
	} catch (e) {
		if (!importAborted) {
			showImportProgressBar();
			setImportProgress(0, e?.message || 'Import failed', 'Step 3: Import failed', true);
		}
	} finally {
		importInProgress = false;
		if (addToPacsBtn) addToPacsBtn.disabled = false;
		if (assignStudyBtn) assignStudyBtn.disabled = false;
		if (loadBtn) loadBtn.disabled = false;
		if (eyeBtn) eyeBtn.disabled = false;
	}
}

if (assignStudyBtn) {
	assignStudyBtn.addEventListener('click', handleAssignStudy);
}
if (assignStudyModalClose) assignStudyModalClose.addEventListener('click', closeAssignStudyModal);
if (assignMwlCancel) assignMwlCancel.addEventListener('click', closeAssignStudyModal);
if (assignMwlRun) assignMwlRun.addEventListener('click', runAssignMwlSearch);
if (assignMwlConfirm) assignMwlConfirm.addEventListener('click', confirmAssignMwlSelection);
if (assignMwlTagsClose) assignMwlTagsClose.addEventListener('click', closeMwlDicomTagsModal);
if (assignMwlTagsDone) assignMwlTagsDone.addEventListener('click', closeMwlDicomTagsModal);
if (assignMwlTagsSearch) {
	assignMwlTagsSearch.addEventListener('input', renderMwlTagsModalTable);
}
if (assignMwlTagsModal) {
	assignMwlTagsModal.addEventListener('click', (e) => {
		if (e.target === assignMwlTagsModal) closeMwlDicomTagsModal();
	});
}
if (assignMwlSearch) {
	assignMwlSearch.addEventListener('input', () => {
		const filtered = filterMwlResults(assignMwlAllResults, assignMwlSearch.value);
		renderAssignMwlTable(filtered);
		if (filtered.length) {
			setAssignMwlStatus(`${filtered.length} stud${filtered.length === 1 ? 'y' : 'ies'} — select one.`);
		} else if (assignMwlAllResults.length) {
			setAssignMwlStatus('No rows match your search filter.');
		}
	});
}
if (assignStudyModal) {
	assignStudyModal.addEventListener('click', (e) => {
		if (e.target === assignStudyModal) closeAssignStudyModal();
	});
}
if (addToPacsBtn) {
	addToPacsBtn.addEventListener('click', handleAddToPacs);
}
if (importCancelBtn) {
	importCancelBtn.addEventListener('click', () => {
		if (importInProgress) {
			importAborted = true;
			resetImportUi();
			updateStatus('Import cancelled');
		} else {
			resetImportUi();
			clearPatientMetadata();
		}
	});
}
if (operationSuccessOk) {
	operationSuccessOk.addEventListener('click', closeOperationSuccessPopup);
}
if (operationSuccessModal) {
	operationSuccessModal.addEventListener('click', (e) => {
		if (e.target === operationSuccessModal) closeOperationSuccessPopup();
	});
}

async function handleGenerateDownloadQr() {
	try {
		const downloadTarget = getDownloadUrlForCurrentStudy();
		if (!downloadTarget.ok) {
			updateStatus(downloadTarget.reason, true);
			return;
		}
		const res = await window.electronAPI.qrGenerate(downloadTarget.url);
		if (!res || !res.ok) {
			updateStatus(res?.error || 'Failed to generate download QR', true);
			return;
		}
		qrImage.src = res.dataUrl;
		if (qrTitle) qrTitle.textContent = 'Download QR/Link';
		if (qrLink) {
			qrLink.textContent = downloadTarget.url;
		}
		if (qrLinkRow) {
			qrLinkRow.classList.remove('hidden');
		}
		openModal(qrModal);
	} catch {
		updateStatus('Failed to generate download QR', true);
	}
}

if (copyDownloadLinkBtn) {
	copyDownloadLinkBtn.addEventListener('click', async () => {
		const downloadTarget = getDownloadUrlForCurrentStudy();
		if (!downloadTarget.ok) {
			updateStatus(downloadTarget.reason, true);
			return;
		}
		try {
			await window.electronAPI.copyToClipboard(downloadTarget.url);
			updateStatus('Download link copied');
		} catch {
			updateStatus('Failed to copy download link', true);
		}
	});
}

// PACS Modal logic
function openPacsModal() {
	pacsModal.classList.add('open');
	// Suspend preview so it doesn't steal mouse/keyboard events
	window.electronAPI.previewSuspend();
}

function closePacsModal() {
	pacsModal.classList.remove('open');
	resumePreviewIfIdle();
}

if (addPacsBtn) addPacsBtn.addEventListener('click', openPacsModal);
pacsClose.addEventListener('click', closePacsModal);

// Close on overlay click (but not when clicking inside modal)
pacsModal.addEventListener('click', (e) => {
	if (e.target === pacsModal) {
		closePacsModal();
	}
});

savePacsBtn.addEventListener('click', async () => {
	const node = document.getElementById('pacs-node').value.trim();
	const ip = document.getElementById('pacs-ip').value.trim();
	const port = document.getElementById('pacs-port').value.trim();
	const ae = document.getElementById('pacs-ae').value.trim();

	// For now, just show a status message. Later we can persist.
	if (!node || !ip || !port || !ae) {
		updateStatus('Please fill all PACS fields', true);
		return;
	}

	try {
		await window.electronAPI.savePacs({ node, ip, port, ae });
		updateStatus(`Saved PACS: ${node} (${ip}:${port}) AE=${ae}`);
		closePacsModal();
	} catch (e) {
		updateStatus('Failed to save PACS', true);
	}
});

showExistingBtn.addEventListener('click', async () => {
	try {
		const records = await window.electronAPI.listPacs();
		if (!records || records.length === 0) {
			updateStatus('Existing PACS: (none yet)');
			return;
		}
		const summary = records.map(r => `${r.node} (${r.ip}:${r.port}) AE=${r.ae}`).join(' | ');
		updateStatus(`Existing PACS: ${summary}`);
	} catch (e) {
		updateStatus('Failed to read PACS', true);
	}
});

// PACS list modal control
function openPacsList() {
	pacsListModal.classList.add('open');
	window.electronAPI.previewSuspend();
	refreshPacsList();
}

function closePacsList() {
	pacsListModal.classList.remove('open');
	resumePreviewIfIdle();
}

async function refreshPacsList() {
	try {
		const records = await window.electronAPI.listPacs();
		if (!records || records.length === 0) {
			pacsListBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#666; padding:16px;">No PACS added yet</td></tr>';
			return;
		}
		pacsListBody.innerHTML = records.map(r => `
			<tr>
				<td>${r.node}</td>
				<td>${r.ip}</td>
				<td>${r.port}</td>
				<td>${r.ae}</td>
				<td>
					<div class="pacs-actions">
						<button class="button btn-sm" data-edit="${r.id}">Edit</button>
					</div>
				</td>
			</tr>
		`).join('');

		// Attach edit handlers
		Array.from(pacsListBody.querySelectorAll('button[data-edit]')).forEach(btn => {
			btn.addEventListener('click', () => startEditPacs(btn.getAttribute('data-edit')));
		});
	} catch (e) {
		pacsListBody.innerHTML = '<tr><td colspan="4" style="color:#a00; padding:16px;">Failed to load PACS list</td></tr>';
	}
}

function startEditPacs(id) {
	const row = Array.from(pacsListBody.querySelectorAll('tr')).find(tr => {
		const b = tr.querySelector('button[data-edit]');
		return b && b.getAttribute('data-edit') === String(id);
	});
	if (!row) return;
	row.classList.add('editing');
	const cells = row.querySelectorAll('td');
	const [nodeTd, ipTd, portTd, aeTd, actTd] = cells;
	const node = nodeTd.textContent.trim();
	const ip = ipTd.textContent.trim();
	const port = portTd.textContent.trim();
	const ae = aeTd.textContent.trim();

	nodeTd.innerHTML = `<input value="${node}">`;
	ipTd.innerHTML = `<input value="${ip}">`;
	portTd.innerHTML = `<input type="number" value="${port}">`;
	aeTd.innerHTML = `<input value="${ae}">`;
	actTd.innerHTML = `
		<div class="pacs-actions">
			<button class="button btn-sm" data-save="${id}">Save</button>
			<button class="btn-secondary button btn-sm" data-cancel="${id}">Cancel</button>
		</div>
	`;

	actTd.querySelector('[data-save]').addEventListener('click', async () => {
		const updated = {
			id: Number(id),
			node: nodeTd.querySelector('input').value.trim(),
			ip: ipTd.querySelector('input').value.trim(),
			port: portTd.querySelector('input').value.trim(),
			ae: aeTd.querySelector('input').value.trim(),
		};
		if (!updated.node || !updated.ip || !updated.port || !updated.ae) {
			updateStatus('Please fill all fields to save PACS', true);
			return;
		}
		try {
			const res = await window.electronAPI.updatePacs(updated);
			if (res && res.ok) {
				updateStatus('PACS updated');
				refreshPacsList();
			} else {
				updateStatus('Failed to update PACS', true);
			}
		} catch {
			updateStatus('Failed to update PACS', true);
		}
	});

	actTd.querySelector('[data-cancel]').addEventListener('click', refreshPacsList);
}

if (viewPacsBtn) viewPacsBtn.addEventListener('click', openPacsList);
pacsListClose.addEventListener('click', closePacsList);
pacsListRefresh.addEventListener('click', refreshPacsList);

eyeBtn.addEventListener('click', async () => {
	try {
		await window.electronAPI.triggerEye();
		updateStatus('Triggered image viewer');
	} catch (e) {
		updateStatus('Failed to trigger image viewer', true);
	}
});

function openSendModal() {
	openModal(sendModal);
}

function closeSendModal() {
	closeModal(sendModal);
}

async function openSendSettingsModal() {
	try {
		const res = await window.electronAPI.getSendSettings();
		const settings = res && res.ok ? res.settings : null;
		sendSettingsIp.value = settings?.ip || '';
		sendSettingsPort.value = settings?.port || '';
		sendSettingsAe.value = settings?.aeTitle || '';
	} catch {
		sendSettingsIp.value = '';
		sendSettingsPort.value = '';
		sendSettingsAe.value = '';
	}
	openModal(sendSettingsModal);
}

function closeSendSettingsModal() {
	closeModal(sendSettingsModal);
}

async function openAssignStudySettingsModal() {
	try {
		const res = await window.electronAPI.getAssignStudySettings();
		const settings = res && res.ok ? res.settings : null;
		if (assignStudySettingsIp) assignStudySettingsIp.value = settings?.ip || '';
		if (assignStudySettingsPort) assignStudySettingsPort.value = settings?.port || '';
		if (assignStudySettingsAe) assignStudySettingsAe.value = settings?.aeTitle || '';
	} catch {
		if (assignStudySettingsIp) assignStudySettingsIp.value = '';
		if (assignStudySettingsPort) assignStudySettingsPort.value = '';
		if (assignStudySettingsAe) assignStudySettingsAe.value = '';
	}
	if (assignStudySettingsModal) openModal(assignStudySettingsModal);
}

function closeAssignStudySettingsModal() {
	if (assignStudySettingsModal) closeModal(assignStudySettingsModal);
}

async function sendDicom(params) {
	updateStatus('Sending DICOM files...');
	const res = await window.electronAPI.sendDicomFiles(params);
	if (res && res.ok) {
		updateStatus(`Sent ${res.filesSent || 0} DICOM files successfully`);
		return true;
	}
	updateStatus(res && res.reason ? res.reason : 'Failed to send files', true);
	return false;
}

if (assignStudySettingsBtn) {
	assignStudySettingsBtn.addEventListener('click', openAssignStudySettingsModal);
}
if (assignStudySettingsClose) {
	assignStudySettingsClose.addEventListener('click', closeAssignStudySettingsModal);
}
if (assignStudySettingsModal) {
	assignStudySettingsModal.addEventListener('click', (e) => {
		if (e.target === assignStudySettingsModal) closeAssignStudySettingsModal();
	});
}
if (assignStudySettingsSave) {
	assignStudySettingsSave.addEventListener('click', async () => {
		const ip = assignStudySettingsIp?.value.trim() || '';
		const port = assignStudySettingsPort?.value.trim() || '';
		const aeTitle = assignStudySettingsAe?.value.trim() || '';
		if (!ip || !port || !aeTitle) {
			updateStatus('Please fill all assign study settings fields', true);
			return;
		}
		try {
			const res = await window.electronAPI.saveAssignStudySettings({ ip, port, aeTitle });
			if (res?.ok) {
				updateStatus('Worklist settings saved');
				closeAssignStudySettingsModal();
			} else {
				updateStatus(res?.reason || 'Failed to save assign study settings', true);
			}
		} catch {
			updateStatus('Failed to save assign study settings', true);
		}
	});
}

if (sendSettingsBtn) sendSettingsBtn.addEventListener('click', openSendSettingsModal);
if (sendSettingsClose) sendSettingsClose.addEventListener('click', closeSendSettingsModal);
if (sendSettingsModal) {
	sendSettingsModal.addEventListener('click', (e) => {
		if (e.target === sendSettingsModal) closeSendSettingsModal();
	});
}
clearPatientMetadata();

if (sendSettingsSave) {
	sendSettingsSave.addEventListener('click', async () => {
		const ip = sendSettingsIp.value.trim();
		const port = sendSettingsPort.value.trim();
		const aeTitle = sendSettingsAe.value.trim();
		if (!ip || !port || !aeTitle) {
			updateStatus('Please fill all send settings fields', true);
			return;
		}
		try {
			const res = await window.electronAPI.saveSendSettings({ ip, port, aeTitle });
			if (res && res.ok) {
				updateStatus('PACS settings saved');
				closeSendSettingsModal();
			} else {
				updateStatus(res?.reason || 'Failed to save send settings', true);
			}
		} catch {
			updateStatus('Failed to save send settings', true);
		}
	});
}

if (sendClose) sendClose.addEventListener('click', closeSendModal);
if (sendModal) {
	sendModal.addEventListener('click', (e) => {
		if (e.target === sendModal) closeSendModal();
	});
}

if (sendSubmit) {
	sendSubmit.addEventListener('click', async () => {
		const ip = document.getElementById('send-ip').value.trim();
		const port = document.getElementById('send-port').value.trim();
		const ae = document.getElementById('send-ae').value.trim();
		if (!ip || !port || !ae) {
			updateStatus('Please fill all send fields', true);
			return;
		}
		const ok = await sendDicom({ aeTitle: ae, port, ip });
		if (ok) closeSendModal();
	});
}