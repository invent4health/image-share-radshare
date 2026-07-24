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
const importProgressFill = document.getElementById('import-progress-fill');
const importProgressText = document.getElementById('import-progress-text');
const importStepTitle = document.getElementById('import-step-title');
const importProgressWrap = document.getElementById('import-progress-wrap');
const importErrorPanel = document.getElementById('import-error-panel');
const importErrorSummary = document.getElementById('import-error-summary');
const importErrorLogsBtn = document.getElementById('import-error-logs-btn');
const importLogsModal = document.getElementById('import-logs-modal');
const importLogsContent = document.getElementById('import-logs-content');
const importLogsClose = document.getElementById('import-logs-close');
const importStepBackBtn = document.getElementById('import-step-back-btn');
const assignStepBackBtn = document.getElementById('assign-step-back-btn');
const importStatusHeading = document.getElementById('import-status-heading');
const importStatusSub = document.getElementById('import-status-sub');
const importIconCloud = document.getElementById('import-icon-cloud');
const importIconSuccess = document.getElementById('import-icon-success');
const importReadyActions = document.getElementById('import-ready-actions');
const importSuccessActions = document.getElementById('import-success-actions');
const importDoneBtn = document.getElementById('import-done-btn');
const importAnotherBtn = document.getElementById('import-another-btn');
const wizardStepSections = document.querySelectorAll('[data-wizard-step]');
const wizardRailSteps = document.querySelectorAll('.wizard-rail-step');
const skipAssignBtn = document.getElementById('skip-assign-btn');
const operationSuccessModal = document.getElementById('operation-success-modal');
const operationSuccessTitle = document.getElementById('operation-success-title');
const operationSuccessMessage = document.getElementById('operation-success-message');
const operationSuccessOk = document.getElementById('operation-success-ok');
const jivexPasswordInline = document.getElementById('jivex-password-inline');
const jivexPasswordInlineHint = document.getElementById('jivex-password-inline-hint');
const jivexPasswordFormatHint = document.getElementById('jivex-password-format-hint');
const jivexPasswordInlineLabel = document.getElementById('jivex-password-inline-label');
const jivexPortalPasswordInput = document.getElementById('jivex-portal-password');
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
const downloadsPanel = document.getElementById('downloads-panel');
const downloadsList = document.getElementById('downloads-list');
const downloadsPanelClose = document.getElementById('downloads-panel-close');

// Admin + QR
const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const adminClose = document.getElementById('admin-close');
const adminDone = document.getElementById('admin-done');
const adminChangePasswordBtn = document.getElementById('admin-change-password');
const adminPreviewToggle = document.getElementById('admin-preview-toggle');
const adminPreviewRow = document.getElementById('admin-preview-row');

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

const languageModal = document.getElementById('language-modal');
const languageEnglish = document.getElementById('language-english');
const languageGerman = document.getElementById('language-german');
const languageCancel = document.getElementById('language-cancel');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const settingsAdminPanel = document.getElementById('settings-admin-panel');
const settingsChangeLanguage = document.getElementById('settings-change-language');
const settingsPreviewToggle = document.getElementById('settings-preview-toggle');
const settingsPreviewRow = document.getElementById('settings-preview-row');
const settingsAppVersion = document.getElementById('settings-app-version');
const settingsUpdateBtn = document.getElementById('settings-update-btn');
const settingsUpdateStatus = document.getElementById('settings-update-status');
const licenseModal = document.getElementById('license-modal');
const licenseKeyInput = document.getElementById('license-key-input');
const licenseActivateBtn = document.getElementById('license-activate-btn');
const licenseErrorEl = document.getElementById('license-error');
const licensePromptEl = document.getElementById('license-prompt');
const licenseTitleEl = document.getElementById('license-modal-title');
const settingsLicenseStatus = document.getElementById('settings-license-status');

const t = (key, vars) => {
	let str = window.i18n?.t(key) ?? key;
	if (vars && typeof vars === 'object') {
		for (const [k, v] of Object.entries(vars)) {
			str = str.replaceAll(`{${k}}`, String(v));
		}
	}
	return str;
};

let scanCompleteTimer = null;
let wedgeScanActive = false;
let wizardStep = 1;
let importSuccessShown = false;
let settingsAppVersionText = '1.0.0';
let appUpdateInProgress = false;

function refreshDynamicLabels() {
	if (loadBtn && !loadInProgress) loadBtn.textContent = t('load');
	if (assignStudyBtn && !assignStudyInProgress) assignStudyBtn.textContent = t('assignStudy');
	if (importStepTitle) {
		if (importSuccessShown) importStepTitle.textContent = t('step3StudyImport');
		else if (!importInProgress) {
			importStepTitle.textContent = wizardStep === 3 ? t('step3ReadyTitle') : t('step3Title');
		}
	}
	if (importStatusHeading) {
		if (importSuccessShown) importStatusHeading.textContent = t('importSuccessful');
		else if (wizardStep === 3 && !importInProgress) importStatusHeading.textContent = t('readyToImport');
	}
	if (importStatusSub) {
		if (importSuccessShown) importStatusSub.textContent = t('importSuccessfulDesc');
		else if (wizardStep === 3 && !importInProgress) importStatusSub.textContent = t('readyToImportDesc');
	}
	if (importProgressText && importSuccessShown) importProgressText.textContent = '100%';
	if (jivexPasswordInlineLabel) jivexPasswordInlineLabel.textContent = t('password');
	if (jivexPortalPasswordInput && jivexFormatInfo.formatType === 'date') {
		jivexPortalPasswordInput.placeholder = jivexFormatInfo.format || DEFAULT_JIVEX_DATE_FORMAT;
	}
	updateJivexPasswordFormatHint();
	if (settingsAppVersion) {
		settingsAppVersion.textContent = t('appVersionLabel', { version: settingsAppVersionText });
	}
	for (const el of [metaPatientName, metaPatientId, metaDob, metaGender, metaModality]) {
		if (el?.classList.contains('meta-missing')) el.textContent = t('notAvailable');
	}
	updateLanguageModalSelection();
}

function updateLanguageModalSelection() {
	const lang = window.i18n?.getLanguage?.() || 'en';
	languageEnglish?.classList.toggle('is-selected', lang === 'en');
	languageGerman?.classList.toggle('is-selected', lang === 'de');
}

function openLanguageModal() {
	updateLanguageModalSelection();
	if (languageModal) openModal(languageModal);
}

async function syncSettingsPreviewToggle() {
	if (!settingsPreviewToggle) return;
	try {
		if (window.electronAPI?.webPreviewGetEnabled) {
			const res = await window.electronAPI.webPreviewGetEnabled();
			if (res?.ok) settingsPreviewToggle.checked = Boolean(res.enabled);
		}
	} catch { /* ignore */ }
}

function setWebPreviewControlsVisible(show) {
	const visible = Boolean(show);
	if (settingsPreviewRow) {
		settingsPreviewRow.hidden = !visible;
		settingsPreviewRow.classList.toggle('hidden-ui', !visible);
	}
	if (adminPreviewRow) {
		adminPreviewRow.classList.toggle('hidden-ui', !visible);
	}
}

async function syncWebPreviewControlVisibility() {
	let show = false;
	try {
		if (window.electronAPI?.getAdminSettings) {
			const res = await window.electronAPI.getAdminSettings();
			if (res?.ok) show = Boolean(res.settings?.webPreviewButton);
		}
	} catch { /* ignore */ }
	setWebPreviewControlsVisible(show);
}

function setSettingsUpdateStatus(text, isError = false) {
	if (!settingsUpdateStatus) return;
	const value = String(text || '').trim();
	settingsUpdateStatus.textContent = value;
	settingsUpdateStatus.hidden = !value;
	settingsUpdateStatus.classList.toggle('is-error', Boolean(isError) && Boolean(value));
}

async function syncSettingsAppVersion() {
	if (!settingsAppVersion || !window.electronAPI?.appUpdateGetVersion) return;
	try {
		const res = await window.electronAPI.appUpdateGetVersion();
		if (res?.ok && res.version) {
			settingsAppVersionText = res.version;
			settingsAppVersion.textContent = t('appVersionLabel', { version: settingsAppVersionText });
		}
	} catch { /* ignore */ }
}

async function handleSettingsUpdateClick() {
	if (appUpdateInProgress || !window.electronAPI?.appUpdateCheck) return;

	appUpdateInProgress = true;
	if (settingsUpdateBtn) settingsUpdateBtn.disabled = true;
	setSettingsUpdateStatus(t('updateChecking'));

	let removeProgressListener = null;
	try {
		const check = await window.electronAPI.appUpdateCheck();
		if (handleLicenseApiError(check)) {
			setSettingsUpdateStatus(t('updateFailed'), true);
			return;
		}
		if (!check?.ok) {
			setSettingsUpdateStatus(check?.reason || t('updateFailed'), true);
			return;
		}

		settingsAppVersionText = check.localVersion || settingsAppVersionText;
		if (settingsAppVersion) {
			settingsAppVersion.textContent = t('appVersionLabel', { version: settingsAppVersionText });
		}

		if (!check.updateAvailable) {
			setSettingsUpdateStatus('');
			window.alert(t('updateUpToDateAlert', {
				version: check.remoteVersion || check.localVersion || settingsAppVersionText,
			}));
			return;
		}

		setSettingsUpdateStatus(
			t('updateAvailable', {
				local: check.localVersion,
				remote: check.remoteVersion,
			}),
		);

		const confirmed = window.confirm(
			t(check.requiresAdmin ? 'updateConfirmAdmin' : 'updateConfirm', { version: check.remoteVersion }),
		);
		if (!confirmed) return;

		setSettingsUpdateStatus(check.requiresAdmin ? t('updateAdminPending') : t('updateApplying'));
		if (window.electronAPI.onAppUpdateProgress) {
			removeProgressListener = window.electronAPI.onAppUpdateProgress(({ message } = {}) => {
				if (message) setSettingsUpdateStatus(message);
			});
		}

		const result = await window.electronAPI.appUpdateApply();
		if (handleLicenseApiError(result)) {
			setSettingsUpdateStatus(t('updateFailed'), true);
			return;
		}
		if (!result?.ok) {
			setSettingsUpdateStatus(result?.reason || t('updateFailed'), true);
			return;
		}
		if (result.updated) {
			setSettingsUpdateStatus(result.elevated ? t('updateRestarting') : t('updateApplying'));
			if (result.elevated && result.remoteVersion) {
				settingsAppVersionText = result.remoteVersion;
				if (settingsAppVersion) {
					settingsAppVersion.textContent = t('appVersionLabel', { version: settingsAppVersionText });
				}
			}
			return;
		}

		setSettingsUpdateStatus('');
		window.alert(t('updateUpToDateAlert', {
			version: result.remoteVersion || result.localVersion || settingsAppVersionText,
		}));
	} catch (e) {
		const msg = e?.message || t('updateFailed');
		if (/spawn EINVAL|Object has been destroyed|reply was never sent|ERR_IPC/i.test(msg)) {
			setSettingsUpdateStatus(t('updateRestarting'));
			return;
		}
		setSettingsUpdateStatus(msg, true);
	} finally {
		removeProgressListener?.();
		appUpdateInProgress = false;
		if (settingsUpdateBtn) settingsUpdateBtn.disabled = false;
	}
}

function openSettingsModal() {
	syncWebPreviewControlVisibility();
	syncSettingsPreviewToggle();
	syncSettingsAppVersion();
	setSettingsUpdateStatus('');
	refreshSettingsLicenseStatus();
	if (settingsModal) openModal(settingsModal);
}

function closeSettingsModal() {
	if (settingsModal) closeModal(settingsModal);
	resumePreviewIfIdle();
}

function openLanguageFromSettings() {
	closeSettingsModal();
	openLanguageModal();
}

async function openAdminFromSettings() {
	closeSettingsModal();
	await handleAdminClick();
}

function closeLanguageModal() {
	if (languageModal) closeModal(languageModal);
	resumePreviewIfIdle();
}

function selectLanguage(lang) {
	window.i18n?.setLanguage(lang);
	refreshDynamicLabels();
	closeLanguageModal();
}

document.addEventListener('app-language-changed', () => {
	refreshDynamicLabels();
	refreshSettingsLicenseStatus();
	if (window.electronAPI?.webPreviewGetEnabled) {
		window.electronAPI.webPreviewGetEnabled().then((res) => {
			if (res?.ok) applyWebPreviewEnabled(res.enabled);
		}).catch(() => {});
	}
});

window.i18n?.initLanguage();

function normalizeLicenseInputValue(raw) {
	return String(raw || '').replace(/\D/g, '').slice(0, 16);
}

function formatLicenseInputValue(raw) {
	const digits = normalizeLicenseInputValue(raw);
	return digits.replace(/(\d{4})(?=\d)/g, '$1-');
}

function setLicenseError(message = '') {
	if (licenseErrorEl) licenseErrorEl.textContent = message;
}

function openLicenseModal({ expired = false, clockTampered = false } = {}) {
	if (!licenseModal) return;
	setLicenseError('');
	if (licenseTitleEl) {
		if (clockTampered) licenseTitleEl.textContent = t('licenseClockTampered');
		else licenseTitleEl.textContent = expired ? t('licenseEnded') : t('licenseTitle');
	}
	if (licensePromptEl) {
		if (clockTampered) licensePromptEl.textContent = t('licenseClockTamperedPrompt');
		else licensePromptEl.textContent = expired ? t('licenseEndedPrompt') : t('licensePrompt');
	}
	if (licenseKeyInput) licenseKeyInput.value = '';
	openModal(licenseModal);
	requestAnimationFrame(() => licenseKeyInput?.focus());
}

function setLicenseBlocked(blocked) {
	document.body.classList.toggle('license-blocked', Boolean(blocked));
}

async function refreshSettingsLicenseStatus() {
	if (!settingsLicenseStatus || !window.electronAPI?.licenseGetStatus) return;
	try {
		const status = await window.electronAPI.licenseGetStatus();
		if (!status?.required) {
			settingsLicenseStatus.textContent = '';
			settingsLicenseStatus.hidden = true;
			return;
		}
		settingsLicenseStatus.hidden = false;
		if (status.activated && !status.expired) {
			if (status.hoursRemaining != null && status.hoursRemaining <= 12) {
				settingsLicenseStatus.textContent = t('licenseExpiringSoon', { hours: status.hoursRemaining });
			} else if (status.daysRemaining != null && status.daysRemaining >= 1) {
				settingsLicenseStatus.textContent = t('licenseDaysRemaining', { days: status.daysRemaining });
			} else {
				settingsLicenseStatus.textContent = t('licenseExpiredToday');
			}
		} else if (status.clockTampered) {
			settingsLicenseStatus.textContent = t('licenseClockTampered');
		} else if (status.expired) {
			settingsLicenseStatus.textContent = t('licenseEnded');
		} else {
			settingsLicenseStatus.textContent = t('licenseNotActivated');
		}
	} catch {
		settingsLicenseStatus.textContent = '';
		settingsLicenseStatus.hidden = true;
	}
}

function openLicenseModalForced({ expired = false, clockTampered = false } = {}) {
	openLicenseModal({ expired, clockTampered });
}

async function checkAndEnforceLicense({ allowPrompt = true } = {}) {
	if (!window.electronAPI?.licenseGetStatus) return true;
	let status;
	try {
		status = await window.electronAPI.licenseGetStatus();
	} catch {
		return true;
	}
	if (!status?.ok || !status.required) {
		setLicenseBlocked(false);
		return true;
	}
	if (status.activated && !status.expired) {
		setLicenseBlocked(false);
		await refreshSettingsLicenseStatus();
		return true;
	}

	setLicenseBlocked(true);
	await refreshSettingsLicenseStatus();
	if (allowPrompt && !isOverlayOpen(licenseModal)) {
		openLicenseModalForced({
			expired: Boolean(status.expired),
			clockTampered: Boolean(status.clockTampered),
		});
	}
	return false;
}

function handleLicenseApiError(res) {
	if (res?.error === 'license_expired' || res?.error === 'clock_tampered') {
		checkAndEnforceLicense({ allowPrompt: true });
		return true;
	}
	return false;
}

async function ensureLicenseActivated() {
	if (!window.electronAPI?.licenseGetStatus) return true;
	let status;
	try {
		status = await window.electronAPI.licenseGetStatus();
	} catch {
		return true;
	}
	if (!status?.ok || !status.required) return true;
	if (status.activated && !status.expired) {
		setLicenseBlocked(false);
		return true;
	}

	setLicenseBlocked(true);
	openLicenseModal({ expired: Boolean(status.expired), clockTampered: Boolean(status.clockTampered) });

	return new Promise((resolve) => {
		let done = false;
		const finish = (ok) => {
			if (done) return;
			done = true;
			cleanup();
			if (ok) closeModal(licenseModal);
			resolve(ok);
		};

		const onActivate = async () => {
			const key = normalizeLicenseInputValue(licenseKeyInput?.value || '');
			if (key.length !== 16) {
				setLicenseError(t('licenseInvalid'));
				return;
			}
			if (licenseActivateBtn) licenseActivateBtn.disabled = true;
			try {
				const res = await window.electronAPI.licenseActivate(key);
				if (res?.ok && res.activated) {
					setLicenseError('');
					setLicenseBlocked(false);
					await refreshSettingsLicenseStatus();
					finish(true);
					return;
				}
				if (res?.error === 'expired') {
					setLicenseError(t('licenseEnded'));
				} else if (res?.error === 'clock_tampered') {
					setLicenseError(t('licenseClockTampered'));
				} else {
					setLicenseError(t('licenseInvalid'));
				}
			} catch {
				setLicenseError(t('licenseInvalid'));
			} finally {
				if (licenseActivateBtn) licenseActivateBtn.disabled = false;
			}
		};

		const onKey = (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				onActivate();
			}
		};

		const onInput = () => {
			if (!licenseKeyInput) return;
			const formatted = formatLicenseInputValue(licenseKeyInput.value);
			if (licenseKeyInput.value !== formatted) licenseKeyInput.value = formatted;
			if (licenseErrorEl?.textContent) setLicenseError('');
		};

		const cleanup = () => {
			if (licenseActivateBtn) licenseActivateBtn.removeEventListener('click', onActivate);
			if (licenseKeyInput) {
				licenseKeyInput.removeEventListener('keydown', onKey);
				licenseKeyInput.removeEventListener('input', onInput);
			}
		};

		if (licenseActivateBtn) licenseActivateBtn.addEventListener('click', onActivate);
		if (licenseKeyInput) {
			licenseKeyInput.addEventListener('keydown', onKey);
			licenseKeyInput.addEventListener('input', onInput);
		}
	});
}

(async () => {
	try {
		if (window.electronAPI?.getAppLanguage) {
			const res = await window.electronAPI.getAppLanguage();
			if (res?.ok && (res.lang === 'de' || res.lang === 'en') && res.lang !== window.i18n?.getLanguage()) {
				window.i18n?.applyLanguage(res.lang);
			}
		}
	} catch { /* ignore */ }
	refreshDynamicLabels();
	await ensureLicenseActivated();
	setInterval(() => {
		checkAndEnforceLicense({ allowPrompt: true });
	}, 30000);
})();

const DCM4CHEE_DOWNLOAD_BASE =
	'http://102.67.142.34:8084/dcm4chee-arc/aets/RADSHARE/rs/studies';

function isHdscPortalUrl(portalUrl) {
	return /hdsc/i.test(String(portalUrl || ''));
}

function isJivexPortalUrl(portalUrl) {
	return /jivexmobile/i.test(String(portalUrl || '').trim());
}

const DEFAULT_JIVEX_DATE_FORMAT = 'DD-MM-YYYY';

function getDefaultJivexPasswordFormat() {
	return {
		formatType: 'date',
		format: DEFAULT_JIVEX_DATE_FORMAT,
		placeholder: DEFAULT_JIVEX_DATE_FORMAT,
		title: t('password'),
		hint: '',
	};
}

function mergeDetectedJivexPasswordFormat(detected) {
	if (detected?.ok && detected.formatType === 'date' && detected.format) {
		return {
			formatType: 'date',
			format: detected.format,
			placeholder: detected.placeholder || detected.format,
			title: detected.title || t('password'),
			hint: detected.hint || '',
		};
	}
	return getDefaultJivexPasswordFormat();
}

function validateJivexPasswordInput(value, formatInfo = {}) {
	const pass = String(value || '').trim();
	if (!pass) return { ok: false, message: t('passwordPlaceholder') };

	if (formatInfo.formatType !== 'date') return { ok: true, value: pass };

	const fmt = String(formatInfo.format || 'YYYY-MM-DD').toUpperCase();
	const patterns = {
		'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
		'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
		'MM-DD-YYYY': /^\d{2}-\d{2}-\d{4}$/,
		'DD.MM.YYYY': /^\d{2}\.\d{2}\.\d{4}$/,
	};
	const pattern = patterns[fmt] || patterns['YYYY-MM-DD'];
	if (!pattern.test(pass)) {
		return { ok: false, message: t('jivexPasswordInvalidDate', { format: formatInfo.format || fmt }) };
	}
	return { ok: true, value: pass };
}

function getJivexDateFormatSpec(formatStr) {
	const fmt = String(formatStr || 'YYYY-MM-DD').toUpperCase();
	const specs = {
		'YYYY-MM-DD': { separator: '-', groups: [4, 2, 2], maxDigits: 8 },
		'DD-MM-YYYY': { separator: '-', groups: [2, 2, 4], maxDigits: 8 },
		'MM-DD-YYYY': { separator: '-', groups: [2, 2, 4], maxDigits: 8 },
		'DD.MM.YYYY': { separator: '.', groups: [2, 2, 4], maxDigits: 8 },
	};
	return specs[fmt] || specs['YYYY-MM-DD'];
}

function formatJivexDateDigits(digits, formatStr) {
	const spec = getJivexDateFormatSpec(formatStr);
	const d = String(digits || '').replace(/\D/g, '').slice(0, spec.maxDigits);
	let out = '';
	let pos = 0;
	for (const len of spec.groups) {
		const chunk = d.slice(pos, pos + len);
		if (!chunk) break;
		if (out) out += spec.separator;
		out += chunk;
		pos += len;
	}
	return out;
}

function updateJivexPasswordFormatHint() {
	if (!jivexPasswordFormatHint) return;
	const isDate = jivexFormatInfo.formatType === 'date' && jivexFormatInfo.format;
	jivexPasswordFormatHint.textContent = isDate ? jivexFormatInfo.format : '';
}

function applyJivexDatePasswordMask() {
	if (!jivexPortalPasswordInput || jivexFormatInfo.formatType !== 'date') return;

	const input = jivexPortalPasswordInput;
	const start = input.selectionStart ?? input.value.length;
	const digitsBefore = input.value.slice(0, start).replace(/\D/g, '').length;
	const formatted = formatJivexDateDigits(input.value, jivexFormatInfo.format);

	if (input.value !== formatted) {
		input.value = formatted;
	}

	let digitCount = 0;
	let newPos = formatted.length;
	for (let i = 0; i < formatted.length; i += 1) {
		if (/\d/.test(formatted[i])) {
			digitCount += 1;
			if (digitCount >= digitsBefore) {
				newPos = i + 1;
				break;
			}
		}
	}
	input.setSelectionRange(newPos, newPos);
}

function handleJivexPasswordInput() {
	clearJivexPasswordInlineError();
	if (jivexFormatInfo.formatType === 'date') {
		applyJivexDatePasswordMask();
	}
}

function configureJivexPasswordInline(formatInfo = {}, { resetValue = false } = {}) {
	const prevFormat = jivexFormatInfo.format;
	jivexFormatInfo = {
		formatType: formatInfo.formatType || 'text',
		format: formatInfo.format || '',
		placeholder: formatInfo.placeholder || t('passwordPlaceholder'),
		title: formatInfo.title || t('password'),
		hint: formatInfo.hint || '',
	};

	if (jivexPasswordInlineLabel) jivexPasswordInlineLabel.textContent = t('password');

	const isDate = jivexFormatInfo.formatType === 'date';
	updateJivexPasswordFormatHint();

	if (jivexPasswordInlineHint) {
		jivexPasswordInlineHint.classList.remove('is-error', 'is-detecting');
		if (!isDate && jivexFormatInfo.hint) {
			jivexPasswordInlineHint.textContent = jivexFormatInfo.hint;
		} else {
			jivexPasswordInlineHint.textContent = '';
		}
	}

	if (jivexPortalPasswordInput) {
		const formatChanged = prevFormat !== jivexFormatInfo.format;
		if (resetValue || formatChanged) {
			jivexPortalPasswordInput.value = '';
		} else if (isDate && jivexPortalPasswordInput.value) {
			applyJivexDatePasswordMask();
		}

		jivexPortalPasswordInput.placeholder = isDate
			? jivexFormatInfo.format || jivexFormatInfo.placeholder
			: jivexFormatInfo.placeholder;
		jivexPortalPasswordInput.setAttribute('autocomplete', 'off');
		jivexPortalPasswordInput.setAttribute('spellcheck', 'false');
		jivexPortalPasswordInput.setAttribute('inputmode', isDate ? 'numeric' : 'text');
	}
}

let jivexFormatInfo = {
	formatType: 'text',
	format: '',
	placeholder: '',
	title: '',
	hint: '',
};
let jivexFormatDetectSeq = 0;
let jivexFormatDetectPromise = null;
let lastJivexDetectUrl = '';

function setJivexPasswordInlineError(message) {
	if (!jivexPasswordInline) return;
	jivexPasswordInline.classList.add('is-error');
	if (jivexPasswordInlineHint) {
		jivexPasswordInlineHint.textContent = message || '';
		jivexPasswordInlineHint.classList.add('is-error');
	}
	window.setTimeout(() => {
		jivexPasswordInline?.classList.remove('is-error');
	}, 450);
}

function clearJivexPasswordInlineError() {
	jivexPasswordInline?.classList.remove('is-error');
	if (jivexPasswordInlineHint) {
		jivexPasswordInlineHint.textContent = '';
		jivexPasswordInlineHint.classList.remove('is-error', 'is-detecting');
	}
	updateJivexPasswordFormatHint();
}

async function detectJivexPasswordFormat(url) {
	const seq = ++jivexFormatDetectSeq;
	jivexPasswordInline?.classList.add('is-detecting');
	if (jivexPasswordInlineHint) {
		jivexPasswordInlineHint.textContent = t('jivexPasswordDetecting');
		jivexPasswordInlineHint.classList.add('is-detecting');
		jivexPasswordInlineHint.classList.remove('is-error');
	}

	let formatInfo = getDefaultJivexPasswordFormat();

	const run = (async () => {
		try {
			if (window.electronAPI?.jivexDetectPasswordFormat) {
				const detected = await window.electronAPI.jivexDetectPasswordFormat(url);
				if (seq !== jivexFormatDetectSeq) return formatInfo;
				formatInfo = mergeDetectedJivexPasswordFormat(detected);
			}
		} catch {
			/* keep default date format */
		} finally {
			if (seq === jivexFormatDetectSeq) {
				jivexPasswordInline?.classList.remove('is-detecting');
				configureJivexPasswordInline(formatInfo);
			}
		}
		return formatInfo;
	})();

	jivexFormatDetectPromise = run;
	return run;
}

function syncJivexPasswordField() {
	if (!jivexPasswordInline || !urlInput) return;

	const url = urlInput.value.trim();
	const isJivex = Boolean(url) && isJivexPortalUrl(url);

	if (isJivex) {
		jivexPasswordInline.classList.add('is-visible');
		clearJivexPasswordInlineError();
		if (url !== lastJivexDetectUrl) {
			lastJivexDetectUrl = url;
			configureJivexPasswordInline(getDefaultJivexPasswordFormat(), { resetValue: true });
			detectJivexPasswordFormat(url);
		}
		return;
	}

	lastJivexDetectUrl = '';
	jivexFormatDetectSeq += 1;
	jivexFormatDetectPromise = null;
	jivexPasswordInline.classList.remove('is-visible', 'is-detecting', 'is-error');
	if (jivexPortalPasswordInput) jivexPortalPasswordInput.value = '';
	if (jivexPasswordFormatHint) jivexPasswordFormatHint.textContent = '';
	if (jivexPasswordInlineHint) {
		jivexPasswordInlineHint.textContent = '';
		jivexPasswordInlineHint.classList.remove('is-detecting', 'is-error');
	}
}

function extractJivexCode(portalUrl) {
	try {
		const parsed = new URL(String(portalUrl || '').trim());
		return parsed.searchParams.get('code') || null;
	} catch {
		const m = String(portalUrl || '').match(/[?&]code=([^&#]+)/i);
		return m ? decodeURIComponent(m[1]) : null;
	}
}

function extractJivexStudyKey(portalUrl) {
	const code = extractJivexCode(portalUrl);
	return code ? `jivex-${code}` : null;
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
	if (isJivexPortalUrl(portal)) {
		return hdscLoadedStudyUid || extractJivexStudyKey(portal);
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
	if (isJivexPortalUrl(portal)) {
		const studyUid = getStudyUidForCurrentPortal();
		if (!studyUid) {
			return { ok: false, reason: 'Load the study first' };
		}
		return { ok: true, url: portal, studyUid, mapped: true };
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

function syncImportStepBackVisibility() {
	if (!importStepBackBtn) return;
	const show = wizardStep === 3 && !importInProgress && !importSuccessShown;
	importStepBackBtn.hidden = !show;
}

function showImportReadyState() {
	importSuccessShown = false;
	if (importStepTitle) importStepTitle.textContent = t('step3ReadyTitle');
	if (importStatusHeading) importStatusHeading.textContent = t('readyToImport');
	if (importStatusSub) importStatusSub.textContent = t('readyToImportDesc');
	if (importIconCloud) importIconCloud.hidden = false;
	if (importIconSuccess) importIconSuccess.hidden = true;
	if (importReadyActions) {
		importReadyActions.hidden = false;
		importReadyActions.style.display = '';
	}
	if (importSuccessActions) {
		importSuccessActions.hidden = true;
		importSuccessActions.style.display = 'none';
	}
	clearImportError();
	hideImportProgressBar();
	if (importProgressFill) importProgressFill.style.width = '0%';
	if (importProgressText) importProgressText.textContent = '';
	syncImportStepBackVisibility();
}

function showImportSuccessState() {
	importSuccessShown = true;
	if (importStepTitle) importStepTitle.textContent = t('step3StudyImport');
	if (importStatusHeading) importStatusHeading.textContent = t('importSuccessful');
	if (importStatusSub) importStatusSub.textContent = t('importSuccessfulDesc');
	if (importIconCloud) importIconCloud.hidden = true;
	if (importIconSuccess) importIconSuccess.hidden = false;
	if (importReadyActions) {
		importReadyActions.hidden = true;
		importReadyActions.style.display = 'none';
	}
	if (importSuccessActions) {
		importSuccessActions.hidden = false;
		importSuccessActions.style.display = '';
	}
	if (importStepBackBtn) importStepBackBtn.hidden = true;
	showImportProgressBar();
	setImportProgress(100, '100%', t('step3StudyImport'));
}

function resetForAnotherStudy() {
	showImportReadyState();
	clearPatientMetadata();
	hdscLoadedStudyUid = null;
	if (urlInput) urlInput.value = '';
	syncJivexPasswordField();
	setPortalLinkScanStatus('', '');
	updateStatus(t('statusBegin'));
	goToWizardStep(1);
}

function handleAssignStepBack() {
	if (assignStudyInProgress) return;
	closeAssignStudyModal();
	goToWizardStep(1);
}

function handleImportStepBack() {
	if (importInProgress || importSuccessShown) return;
	goToWizardStep(2);
}

function goToWizardStep(step) {
	wizardStep = Math.max(1, Math.min(3, Number(step) || 1));
	wizardStepSections.forEach((section) => {
		const stepNumber = Number(section.dataset.wizardStep);
		section.classList.toggle('is-active', stepNumber === wizardStep);
	});
	wizardRailSteps.forEach((stepEl) => {
		const stepNumber = Number(stepEl.dataset.step);
		stepEl.classList.toggle('is-active', stepNumber === wizardStep);
		stepEl.classList.toggle('is-done', stepNumber < wizardStep);
	});
	if (wizardStep === 3 && !importInProgress && !importSuccessShown) {
		showImportReadyState();
	} else {
		syncImportStepBackVisibility();
	}
}

// Update status message
function updateStatus(message, isError = false) {
	statusEl.textContent = message;
	statusEl.style.color = isError ? '#d32f2f' : '#666';
}

let unloadDownloadProgress = null;
let unloadBrowserDownloadProgress = null;
let loadDotsInterval = null;

function formatDownloadBytes(bytes) {
	const n = Number(bytes) || 0;
	if (n <= 0) return '0 B';
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function showDownloadsPanel() {
	downloadsPanel?.classList.remove('is-hidden');
}

function hideDownloadsPanel() {
	downloadsPanel?.classList.add('is-hidden');
}

let downloadsHideTimer = null;

function scheduleHideDownloadsPanel(delayMs = 1500) {
	if (downloadsHideTimer) clearTimeout(downloadsHideTimer);
	downloadsHideTimer = setTimeout(() => {
		downloadsHideTimer = null;
		resetDownloadsPanel();
	}, delayMs);
}

function resetDownloadsPanel() {
	if (downloadsList) downloadsList.innerHTML = '';
	hideDownloadsPanel();
}

function renderBrowserDownloadProgress(payload) {
	if (!downloadsList || !payload) return;
	showDownloadsPanel();

	let row = downloadsList.querySelector('[data-download-id="active"]');
	if (!row) {
		row = document.createElement('div');
		row.className = 'downloads-item';
		row.dataset.downloadId = 'active';
		row.innerHTML = `
			<div class="downloads-item-name"></div>
			<div class="downloads-item-track"><div class="downloads-item-bar"></div></div>
			<div class="downloads-item-meta"></div>
		`;
		downloadsList.prepend(row);
	}

	const nameEl = row.querySelector('.downloads-item-name');
	const barEl = row.querySelector('.downloads-item-bar');
	const metaEl = row.querySelector('.downloads-item-meta');
	const filename = payload.filename || 'download.zip';

	row.classList.remove('is-failed', 'is-complete');
	barEl.classList.remove('is-complete');

	if (payload.state === 'preparing') {
		if (downloadsHideTimer) {
			clearTimeout(downloadsHideTimer);
			downloadsHideTimer = null;
		}
		nameEl.textContent = filename;
		barEl.classList.add('is-indeterminate');
		metaEl.textContent = t('studyPreparingYourStudy');
		return;
	}

	if (payload.state === 'failed') {
		nameEl.textContent = filename;
		barEl.classList.remove('is-indeterminate');
		barEl.style.width = '0%';
		metaEl.textContent = payload.error || t('downloadFailed');
		row.classList.add('is-failed');
		return;
	}

	if (payload.state === 'completed') {
		nameEl.textContent = filename;
		barEl.classList.remove('is-indeterminate');
		barEl.classList.add('is-complete');
		barEl.style.width = '100%';
		const size = formatDownloadBytes(payload.received || payload.total);
		metaEl.textContent = `${t('downloadComplete')} — ${size}`;
		row.classList.add('is-complete');
		scheduleHideDownloadsPanel(1500);
		return;
	}

	const received = payload.received || 0;
	const total = payload.total || 0;
	const percent = payload.percent ?? (total > 0 ? Math.min(100, Math.floor((received / total) * 100)) : null);

	nameEl.textContent = filename;
	barEl.style.width = percent != null ? `${percent}%` : '35%';
	if (percent == null) barEl.classList.add('is-indeterminate');
	else barEl.classList.remove('is-indeterminate');

	const left = formatDownloadBytes(received);
	const right = total > 0 ? formatDownloadBytes(total) : '…';
	metaEl.textContent = percent != null ? `${percent}% — ${left} / ${right}` : `${t('downloadingProgress')} — ${left}`;
	if (percent != null && percent >= 100) {
		scheduleHideDownloadsPanel(1500);
	}
}

function stopDownloadProgressListener() {
	if (unloadDownloadProgress) {
		unloadDownloadProgress();
		unloadDownloadProgress = null;
	}
	if (unloadBrowserDownloadProgress) {
		unloadBrowserDownloadProgress();
		unloadBrowserDownloadProgress = null;
	}
}

function startDownloadProgressListener(_mode) {
	stopDownloadProgressListener();
	if (window.electronAPI?.onDownloadProgress) {
		unloadDownloadProgress = window.electronAPI.onDownloadProgress((payload) => {
			renderBrowserDownloadProgress({
				state: 'progressing',
				filename: payload?.filename || 'download.zip',
				received: payload?.received,
				total: payload?.total,
				percent: payload?.percent,
			});
		});
	}
	if (window.electronAPI?.onBrowserDownloadProgress) {
		unloadBrowserDownloadProgress = window.electronAPI.onBrowserDownloadProgress(renderBrowserDownloadProgress);
	}
}

downloadsPanelClose?.addEventListener('click', hideDownloadsPanel);

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
	loadBtn.textContent = `${t('downloading')}.`;
	loadDotsInterval = setInterval(() => {
		step = (step + 1) % 3;
		loadBtn.textContent = `${t('downloading')}${'.'.repeat(step + 1)}`;
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
		loadBtn.textContent = t('load');
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function setAssignStudyAnimating(active) {
	if (!assignStudyBtn) return;
	assignStudyBtn.disabled = active;
	assignStudyBtn.classList.toggle('is-assigning', active);
	assignStudyBtn.textContent = active ? t('assigningStudy') : t('assignStudy');
}

// Hide/show preview placeholder
function togglePlaceholder(show) {
	previewPlaceholder.classList.toggle('hidden', !show);
}

async function downloadJivexStudyAndShowMetadata(portalUrl, password) {
	if (!window.electronAPI?.jivexDownloadStudy) {
		throw new Error('Jivex download not available');
	}
	const dl = await window.electronAPI.jivexDownloadStudy({
		portalUrl,
		password,
		user: extractJivexCode(portalUrl) || '',
	});
	if (!dl?.ok) throw new Error(dl?.error || 'Jivex download failed');
	hdscLoadedStudyUid = dl.studyUid || extractJivexStudyKey(portalUrl) || null;
	await applyMetadataFromDownload(dl);
	return dl;
}

async function downloadMappedPortalStudyAndShowMetadata(portalUrl) {
	if (!window.electronAPI?.downloadPortalFallbackStudy) {
		throw new Error('Portal download not available');
	}
	const dl = await window.electronAPI.downloadPortalFallbackStudy(portalUrl);
	if (dl?.noFallback) return null;
	if (!dl?.ok) throw new Error(dl?.error || 'Portal download failed');
	hdscLoadedStudyUid = dl.studyUid || extractJivexStudyKey(portalUrl) || null;
	await applyMetadataFromDownload(dl);
	return dl;
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

	if (!isHdscPortalUrl(portal) && !isJivexPortalUrl(portal) && window.electronAPI?.downloadPortalFallbackStudy) {
		startDownloadProgressListener(progressMode);
		if (progressMode === 'load') setLoadButtonProgress(true);
		try {
			const mapped = await downloadMappedPortalStudyAndShowMetadata(portal);
			if (mapped) return mapped;
		} finally {
			stopDownloadProgressListener();
		}
	}

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
		updateStatus(t('statusEnterUrlRequired'), true);
		return;
	}

	try {
		new URL(url);
	} catch {
		updateStatus(t('statusInvalidUrl'), true);
		return;
	}

	if (assignStudyInProgress || importInProgress || loadInProgress) return;

	const jivex = isJivexPortalUrl(url);
	if (jivex) {
		syncJivexPasswordField();
		if (jivexFormatDetectPromise) {
			try {
				await jivexFormatDetectPromise;
			} catch { /* use last known format */ }
		}

		const validation = validateJivexPasswordInput(
			jivexPortalPasswordInput?.value,
			jivexFormatInfo
		);
		if (!validation.ok) {
			setJivexPasswordInlineError(validation.message);
			jivexPortalPasswordInput?.focus();
			return;
		}

		const password = validation.value;
		loadInProgress = true;
		setLoadButtonProgress(true);
		clearAssignedStudyMetadata();
		hdscLoadedStudyUid = null;
		resetDownloadsPanel();

		try {
			updateStatus(t('downloadingBackground'));
			startDownloadProgressListener('load');
			await downloadJivexStudyAndShowMetadata(url, password);
			scrollPatientCardIntoView();
			updateStatus(t('studyLoaded'));
			showLoadSuccessPopup();
		} catch (error) {
			clearPatientMetadata();
			updateStatus(error?.message || t('studyLoadFailed'), true);
		} finally {
			stopDownloadProgressListener();
			loadInProgress = false;
			setLoadButtonProgress(false);
		}
		return;
	}

	loadInProgress = true;
	setLoadButtonProgress(true);
	clearAssignedStudyMetadata();
	hdscLoadedStudyUid = null;

	try {
		const hdsc = isHdscPortalUrl(url);
		updateStatus(hdsc ? t('downloadingFromHdsc') : t('downloadingStudy'));

		if (hdsc && window.electronAPI?.webPreviewGetEnabled) {
			const previewRes = await window.electronAPI.webPreviewGetEnabled();
			if (previewRes?.enabled) {
				togglePlaceholder(false);
			}
		}

		await downloadStudyAndShowMetadata({ progressMode: 'load' });
		scrollPatientCardIntoView();

		if (hdsc) {
			updateStatus(t('studyLoadedFromHdsc'));
			showLoadSuccessPopup();
			return;
		}

		togglePlaceholder(false);
		if (window.electronAPI?.loadWebsite) {
			const res = await window.electronAPI.loadWebsite(url);
			if (res && res.success === false) {
				updateStatus(t('studyDownloadedPreviewOff'));
				togglePlaceholder(true);
				showLoadSuccessPopup();
				return;
			}
		}
		updateStatus(t('studyLoaded'));
		showLoadSuccessPopup();
	} catch (error) {
		clearPatientMetadata();
		updateStatus(error?.message || t('studyLoadFailed'), true);
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
	setPortalLinkScanStatus(t('scanningInProgress'), 'scanning');
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
		setPortalLinkScanStatus(t('scanInvalidUrl'), 'error');
		return false;
	}
	urlInput.value = normalized;
	setPortalLinkScanStatus(t('scanCompleted'), 'completed');
	updateStatus(t('portalLinkReady'));
	syncJivexPasswordField();
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
					setPortalLinkScanStatus(t('scanCompleted'), 'completed');
				} else {
					urlInput.value = text;
					setPortalLinkScanStatus('', '');
				}
				updateStatus(t('linkPasted'));
				syncJivexPasswordField();
				return;
			}
		}
	} catch {
		// fall through
	}
	updateStatus(t('pasteIntoUrlField'));
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
	if (wedgeScanActive && urlInput.value.includes('\n')) {
		urlInput.value = urlInput.value.replace(/\r?\n/g, '');
		finalizePortalLinkScan();
		return;
	}
	syncJivexPasswordField();
});

urlInput.addEventListener('paste', () => {
	window.setTimeout(syncJivexPasswordField, 0);
});

if (jivexPortalPasswordInput) {
	jivexPortalPasswordInput.addEventListener('input', handleJivexPasswordInput);
	jivexPortalPasswordInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			loadWebsite();
			return;
		}
		if (jivexFormatInfo.formatType !== 'date') return;
		const allowed = [
			'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
		];
		if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
		if (/^\d$/.test(e.key)) return;
		e.preventDefault();
	});
	jivexPortalPasswordInput.addEventListener('paste', (e) => {
		if (jivexFormatInfo.formatType !== 'date') return;
		e.preventDefault();
		const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
		if (!pasted) return;
		const input = jivexPortalPasswordInput;
		const spec = getJivexDateFormatSpec(jivexFormatInfo.format);
		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? start;
		const before = input.value.slice(0, start).replace(/\D/g, '');
		const after = input.value.slice(end).replace(/\D/g, '');
		const merged = (before + pasted + after).slice(0, spec.maxDigits);
		const digitsBefore = before.length + pasted.length;
		input.value = formatJivexDateDigits(merged, jivexFormatInfo.format);

		let digitCount = 0;
		let newPos = input.value.length;
		for (let i = 0; i < input.value.length; i += 1) {
			if (/\d/.test(input.value[i])) {
				digitCount += 1;
				if (digitCount >= digitsBefore) {
					newPos = i + 1;
					break;
				}
			}
		}
		input.setSelectionRange(newPos, newPos);
		clearJivexPasswordInlineError();
	});
	jivexPortalPasswordInput.addEventListener('blur', () => {
		if (jivexFormatInfo.formatType === 'date') applyJivexDatePasswordMask();
	});
}

// Initial state (updated once web preview state is known)
updateStatus(t('statusBegin'));

function applyWebPreviewEnabled(enabled) {
	if (!containerEl) return;
	const on = Boolean(enabled);
	containerEl.classList.toggle('preview-disabled', !on);
	if (!on) {
		togglePlaceholder(true);
		updateStatus(t('statusBegin'));
	} else {
		updateStatus(t('statusEnterUrl'));
	}
	if (adminPreviewToggle) {
		adminPreviewToggle.checked = !on;
	}
	if (settingsPreviewToggle) {
		settingsPreviewToggle.checked = on;
	}
}

// Initialize web preview state + keep in sync with main process menu toggle
(async () => {
	try {
		await syncWebPreviewControlVisibility();
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
			if (res && res.ok) adminPreviewToggle.checked = !Boolean(res.enabled);
		}
	} catch { }
}

if (adminPreviewToggle) {
	adminPreviewToggle.addEventListener('change', async () => {
		try {
			if (window.electronAPI && typeof window.electronAPI.webPreviewSetEnabled === 'function') {
				await window.electronAPI.webPreviewSetEnabled(!adminPreviewToggle.checked);
			}
		} catch {
			updateStatus(t('previewSettingFailed'), true);
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
		isOverlayOpen(operationSuccessModal) ||
		isOverlayOpen(importLogsModal) ||
		isOverlayOpen(languageModal) ||
		isOverlayOpen(settingsModal) ||
		isOverlayOpen(licenseModal)
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
				btn.setAttribute('aria-label', isHidden ? t('hidePassword') : t('showPassword'));
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
			authCurrentEye.setAttribute('aria-label', t('showPassword'));
		}
		if (authNewEye) {
			authNewEye.innerHTML = `
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			`;
			authNewEye.setAttribute('aria-label', t('showPassword'));
		}
		const authTitleEl = document.getElementById('auth-title');
		if (mode === 'set') {
			if (authTitleEl) authTitleEl.textContent = t('setAdminPassword');
			authCurrentWrap.style.display = 'none';
			authNewWrap.style.display = '';
			authOk.textContent = t('save');
			openModal(authModal);
			unbindNewEye = bindEye(authNewEye, authNewInput);
			setTimeout(() => authNewInput.focus(), 0);
		} else if (mode === 'verify') {
			if (authTitleEl) authTitleEl.textContent = t('adminLogin');
			authCurrentWrap.style.display = '';
			authNewWrap.style.display = 'none';
			authOk.textContent = t('continue');
			openModal(authModal);
			unbindCurrentEye = bindEye(authCurrentEye, authCurrentInput);
			setTimeout(() => authCurrentInput.focus(), 0);
		} else {
			if (authTitleEl) authTitleEl.textContent = t('changeAdminPassword');
			authCurrentWrap.style.display = '';
			authNewWrap.style.display = '';
			authOk.textContent = t('change');
			openModal(authModal);
			unbindCurrentEye = bindEye(authCurrentEye, authCurrentInput);
			unbindNewEye = bindEye(authNewEye, authNewInput);
			setTimeout(() => authCurrentInput.focus(), 0);
		}

		authModal.querySelectorAll('[data-i18n]').forEach((el) => {
			const key = el.getAttribute('data-i18n');
			if (key && el !== authTitleEl && el !== authOk) el.textContent = t(key);
		});

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
			await syncWebPreviewControlVisibility();
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
		await syncWebPreviewControlVisibility();
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
		updateStatus(t('statusEnterUrlRequired'), true);
		return;
	}
	try {
		new URL(url);
	} catch {
		updateStatus(t('statusInvalidUrl'), true);
		return;
	}

	try {
		const res = await window.electronAPI.qrGenerate(url);
		if (!res || !res.ok) {
			updateStatus(res?.error || 'Failed to generate QR', true);
			return;
		}
		qrImage.src = res.dataUrl;
		if (qrTitle) qrTitle.textContent = t('qrCode');
		if (qrLink) {
			qrLink.textContent = '';
		}
		if (qrLinkRow) {
			qrLinkRow.classList.add('hidden');
		}
		openModal(qrModal);
	} catch {
		updateStatus(t('qrGenerateFailed'), true);
	}
}

qrClose.addEventListener('click', () => closeModal(qrModal));
qrDone.addEventListener('click', () => closeModal(qrModal));
qrModal.addEventListener('click', (e) => {
	if (e.target === qrModal) closeModal(qrModal);
});

let lastImportErrorDetail = '';

function clearImportError() {
	lastImportErrorDetail = '';
	if (importErrorPanel) importErrorPanel.hidden = true;
	if (importErrorSummary) importErrorSummary.textContent = '';
}

function showImportError(summary, detail = '') {
	const message = String(summary || t('pacsSaveFailed')).trim();
	lastImportErrorDetail = String(detail || '').trim();
	if (importProgressFill) importProgressFill.style.width = '0%';
	if (importStepTitle) importStepTitle.textContent = t('step3ImportFailed');
	if (importProgressText) {
		importProgressText.textContent = '';
		importProgressText.classList.remove('is-error');
	}
	if (importErrorSummary) importErrorSummary.textContent = message;
	if (importErrorPanel) importErrorPanel.hidden = false;
	if (importErrorLogsBtn) importErrorLogsBtn.hidden = !lastImportErrorDetail;
	syncImportStepBackVisibility();
}

function openImportLogsModal() {
	if (!importLogsModal || !lastImportErrorDetail) return;
	if (importLogsContent) importLogsContent.textContent = lastImportErrorDetail;
	openModal(importLogsModal);
}

function setImportProgress(percent, text, title, isError = false) {
	const pct = Math.min(100, Math.max(0, percent));
	if (importProgressFill) importProgressFill.style.width = `${pct}%`;
	if (importProgressText) {
		importProgressText.textContent =
			text || (pct >= 100 ? t('importProgressContinue', { percent: 100 }) : t('importProgressContinue', { percent: Math.round(pct) }));
		importProgressText.classList.toggle('is-error', Boolean(isError));
	}
	if (title && importStepTitle) importStepTitle.textContent = title;
	if (!isError) clearImportError();
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
	goToWizardStep(2);
	showOperationSuccessPopup({ title: t('loadSuccessTitle') });
}

function showAssignSuccessPopup() {
	goToWizardStep(3);
	showOperationSuccessPopup({ title: t('studyAssigned') });
}

function showPacsSuccessPopup() {
	showImportSuccessState();
}

function resetImportUi() {
	importInProgress = false;
	importAborted = false;
	if (addToPacsBtn) addToPacsBtn.disabled = false;
	if (loadBtn) loadBtn.disabled = false;
	if (eyeBtn) eyeBtn.disabled = false;
	if (!importSuccessShown) {
		clearImportError();
		showImportProgressBar();
		setImportProgress(0, '', t('step3ReadyTitle'));
	}
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
	if (s === 'M') return t('male');
	if (s === 'F') return t('female');
	if (s === 'O') return t('other');
	return String(raw || '').trim();
}

function clearPatientMetadata() {
	clearAssignedStudyMetadata();
	hdscLoadedStudyUid = null;
	for (const { el } of META_FIELDS) {
		if (!el) continue;
		el.textContent = t('notAvailable');
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
			el.textContent = display || t('notAvailable');
			el.classList.toggle('meta-missing', !display);
		} else {
			el.textContent = t('notAvailable');
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
	setAssignMwlStatus(t('assignMwlSetDates'));
	renderAssignMwlTable([]);
}

function closeAssignStudyModal() {
	if (assignStudyModal) closeModal(assignStudyModal);
}

async function runAssignMwlSearch() {
	if (!window.electronAPI?.queryMwlWorklist) {
		setAssignMwlStatus(t('assignMwlNotAvailable'), true);
		return;
	}
	const params = await resolveAssignStudyParams();
	if (!params) {
		setAssignMwlStatus(t('assignMwlConfigureSettings'), true);
		return;
	}
	const startDate = assignMwlStart?.value;
	const endDate = assignMwlEnd?.value;
	if (!startDate || !endDate) {
		setAssignMwlStatus(t('assignMwlChooseDates'), true);
		return;
	}

	if (assignMwlRun) assignMwlRun.disabled = true;
	setAssignMwlStatus(t('assignMwlSearching'));

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
					? t('assignMwlNoFilterMatch')
					: t('assignMwlNoStudiesInRange', { range: res.dateRange || t('assignMwlSelectedDates') })
			);
		} else {
			setAssignMwlStatus(
				t(filtered.length === 1 ? 'assignMwlSelectAndAssignOne' : 'assignMwlSelectAndAssignMany', {
					count: filtered.length,
				})
			);
		}
	} catch (e) {
		setAssignMwlStatus(e?.message || t('assignMwlSearchFailed'), true);
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
	updateStatus(t('assigningStudy'));

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
		updateStatus(t('studyAssigned'));
		scrollPatientCardIntoView();
		showAssignSuccessPopup();
	} catch (e) {
		updateStatus(e?.message || t('assignStudyFailed'), true);
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
		updateStatus(t('clickLoadFirst'), true);
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
		showImportError(t('pacsSaveUnavailable'), '');
		return;
	}

	const downloadTarget = getDownloadUrlForCurrentStudy();
	if (!downloadTarget.ok) {
		showImportProgressBar();
		showImportError(downloadTarget.reason, '');
		return;
	}

	importInProgress = true;
	importAborted = false;
	if (importStepBackBtn) importStepBackBtn.hidden = true;
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
				t('importProgressUsingStudy', { percent: 25 }),
				t('step3Title')
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
			showImportError(t('clickLoadFirst'), '');
			return;
		}

		setImportProgress(45, t('importProgressPreparing', { percent: 45 }), t('step3Title'));

		const params = await resolveSendParams();
		if (importAborted) return;
		if (!params) {
			showImportProgressBar();
			showImportError(t('setPacsSettingsFirst'), '');
			openSendModal();
			return;
		}

		const sendParams = { ...params };
		if (assignedStudyForExport) {
			setImportProgress(55, t('importProgressApplyingMetadata', { percent: 55 }), t('step3Title'));
			sendParams.assignedMetadata = assignedStudyForExport;
		}

		setImportProgress(70, t('importProgressSending', { percent: 70, ip: params.ip, port: params.port }), t('step3Title'));

		const sendRes = await window.electronAPI.sendDicomFiles(sendParams);
		if (importAborted) return;
		if (!sendRes?.ok) {
			if (handleLicenseApiError(sendRes)) throw new Error(t('licenseEnded'));
			showImportError(sendRes?.reason || t('pacsSaveFailed'), sendRes?.detail || '');
			return;
		}

		clearImportError();

		showPacsSuccessPopup();
	} catch (e) {
		if (!importAborted) {
			showImportProgressBar();
			if (e?.message === t('licenseEnded')) {
				showImportError(t('licenseEnded'), '');
			} else {
				showImportError(e?.message || t('pacsSaveFailed'), e?.detail || '');
			}
		}
	} finally {
		importInProgress = false;
		if (addToPacsBtn && !importSuccessShown) addToPacsBtn.disabled = false;
		if (assignStudyBtn) assignStudyBtn.disabled = false;
		if (loadBtn) loadBtn.disabled = false;
		if (eyeBtn) eyeBtn.disabled = false;
		if (!importSuccessShown) syncImportStepBackVisibility();
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
			setAssignMwlStatus(t(filtered.length === 1 ? 'assignMwlSelectOne' : 'assignMwlSelectMany', { count: filtered.length }));
		} else if (assignMwlAllResults.length) {
			setAssignMwlStatus(t('assignMwlNoFilterMatch'));
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
if (operationSuccessOk) {
	operationSuccessOk.addEventListener('click', closeOperationSuccessPopup);
}

if (importErrorLogsBtn) {
	importErrorLogsBtn.addEventListener('click', openImportLogsModal);
}
if (importLogsClose) {
	importLogsClose.addEventListener('click', () => closeModal(importLogsModal));
}
if (importLogsModal) {
	importLogsModal.addEventListener('click', (e) => {
		if (e.target === importLogsModal) closeModal(importLogsModal);
	});
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
		if (qrTitle) qrTitle.textContent = t('downloadQrLinkTitle');
		if (qrLink) {
			qrLink.textContent = downloadTarget.url;
		}
		if (qrLinkRow) {
			qrLinkRow.classList.remove('hidden');
		}
		openModal(qrModal);
	} catch {
		updateStatus(t('downloadQrFailed'), true);
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
			updateStatus(t('downloadLinkCopied'));
		} catch {
			updateStatus(t('downloadLinkCopyFailed'), true);
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
		updateStatus(t('fillAllPacsFields'), true);
		return;
	}

	try {
		await window.electronAPI.savePacs({ node, ip, port, ae });
		updateStatus(t('pacsSaved', { node, ip, port, ae }), false);
		closePacsModal();
	} catch (e) {
		updateStatus(t('pacsSaveFailedShort'), true);
	}
});

showExistingBtn.addEventListener('click', async () => {
	try {
		const records = await window.electronAPI.listPacs();
		if (!records || records.length === 0) {
			updateStatus(t('pacsNoneYet'));
			return;
		}
		const summary = records.map(r => `${r.node} (${r.ip}:${r.port}) AE=${r.ae}`).join(' | ');
		updateStatus(t('pacsExistingSummary', { summary }), false);
	} catch (e) {
		updateStatus(t('pacsReadFailed'), true);
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
			updateStatus(t('fillAllPacsFieldsSave'), true);
			return;
		}
		try {
			const res = await window.electronAPI.updatePacs(updated);
			if (res && res.ok) {
				updateStatus(t('pacsUpdated'));
				refreshPacsList();
			} else {
				updateStatus(t('pacsUpdateFailed'), true);
			}
		} catch {
			updateStatus(t('pacsUpdateFailed'), true);
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
	updateStatus(t('sendingDicom'));
	const res = await window.electronAPI.sendDicomFiles(params);
	if (res && res.ok) {
		updateStatus(`Sent ${res.filesSent || 0} DICOM files successfully`);
		return true;
	}
	if (handleLicenseApiError(res)) {
		updateStatus(t('licenseEnded'), true);
		return false;
	}
	updateStatus(res?.reason || t('pacsSaveFailed'), true);
	if (res?.detail) showImportError(res.reason || t('pacsSaveFailed'), res.detail);
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
			updateStatus(t('fillAllAssignSettings'), true);
			return;
		}
		try {
			const res = await window.electronAPI.saveAssignStudySettings({ ip, port, aeTitle });
			if (res?.ok) {
				updateStatus(t('assignSettingsSaved'));
				closeAssignStudySettingsModal();
			} else {
				updateStatus(res?.reason || 'Failed to save assign study settings', true);
			}
		} catch {
			updateStatus(t('assignSettingsSaveFailed'), true);
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
goToWizardStep(1);

const wizardCard = document.querySelector('.wizard-card');
if (wizardCard) {
	wizardCard.addEventListener('click', (e) => {
		if (e.target.closest('#assign-step-back-btn')) {
			e.preventDefault();
			handleAssignStepBack();
			return;
		}
		if (e.target.closest('#import-step-back-btn')) {
			e.preventDefault();
			handleImportStepBack();
		}
	});
}

if (assignStepBackBtn) {
	assignStepBackBtn.addEventListener('click', (e) => {
		e.preventDefault();
		handleAssignStepBack();
	});
}

if (importStepBackBtn) {
	importStepBackBtn.addEventListener('click', (e) => {
		e.preventDefault();
		handleImportStepBack();
	});
}

if (importDoneBtn) {
	importDoneBtn.addEventListener('click', () => {
		window.electronAPI?.quitApp?.();
	});
}

if (importAnotherBtn) {
	importAnotherBtn.addEventListener('click', () => {
		resetForAnotherStudy();
	});
}

if (skipAssignBtn) {
	skipAssignBtn.addEventListener('click', () => {
		if (assignStudyInProgress || importInProgress || loadInProgress) return;
		goToWizardStep(3);
	});
}

if (sendSettingsSave) {
	sendSettingsSave.addEventListener('click', async () => {
		const ip = sendSettingsIp.value.trim();
		const port = sendSettingsPort.value.trim();
		const aeTitle = sendSettingsAe.value.trim();
		if (!ip || !port || !aeTitle) {
			updateStatus(t('fillAllSendSettings'), true);
			return;
		}
		try {
			const res = await window.electronAPI.saveSendSettings({ ip, port, aeTitle });
			if (res && res.ok) {
				updateStatus(t('sendSettingsSaved'));
				closeSendSettingsModal();
			} else {
				updateStatus(res?.reason || 'Failed to save send settings', true);
			}
		} catch {
			updateStatus(t('sendSettingsSaveFailed'), true);
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
			updateStatus(t('fillAllSendFields'), true);
			return;
		}
		const ok = await sendDicom({ aeTitle: ae, port, ip });
		if (ok) closeSendModal();
	});
}

if (languageEnglish) languageEnglish.addEventListener('click', () => selectLanguage('en'));
if (languageGerman) languageGerman.addEventListener('click', () => selectLanguage('de'));
if (languageCancel) languageCancel.addEventListener('click', closeLanguageModal);
if (languageModal) {
	languageModal.addEventListener('click', (e) => {
		if (e.target === languageModal) closeLanguageModal();
	});
}
if (window.electronAPI?.onOpenLanguageModal) {
	window.electronAPI.onOpenLanguageModal(() => openLanguageModal());
}

if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
if (settingsClose) settingsClose.addEventListener('click', closeSettingsModal);
if (settingsModal) {
	settingsModal.addEventListener('click', (e) => {
		if (e.target === settingsModal) closeSettingsModal();
	});
}
if (settingsAdminPanel) settingsAdminPanel.addEventListener('click', () => { openAdminFromSettings(); });
if (settingsChangeLanguage) settingsChangeLanguage.addEventListener('click', openLanguageFromSettings);
if (settingsPreviewToggle) {
	settingsPreviewToggle.addEventListener('change', async () => {
		const wantEnabled = settingsPreviewToggle.checked;
		try {
			if (window.electronAPI?.webPreviewSetEnabled) {
				await window.electronAPI.webPreviewSetEnabled(wantEnabled);
			}
			if (isOverlayOpen(settingsModal) && window.electronAPI?.previewSuspend) {
				await window.electronAPI.previewSuspend();
			}
		} catch {
			updateStatus(t('previewSettingFailed'), true);
			settingsPreviewToggle.checked = !wantEnabled;
		}
	});
	settingsPreviewToggle.addEventListener('click', (e) => e.stopPropagation());
}
if (settingsUpdateBtn) {
	settingsUpdateBtn.addEventListener('click', () => {
		handleSettingsUpdateClick();
	});
}
if (window.electronAPI?.onOpenSettingsModal) {
	window.electronAPI.onOpenSettingsModal(() => openSettingsModal());
}