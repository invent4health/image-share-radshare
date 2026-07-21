const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	loadWebsite: (url) => ipcRenderer.invoke('load-website', url),
	qrGenerate: (url) => ipcRenderer.invoke('qr-generate', url),
	downloadZip: (url, options) => ipcRenderer.invoke('download-zip', url, options),
	hdscDownloadStudy: (portalUrl) => ipcRenderer.invoke('hdsc-download-study', portalUrl),
	downloadPortalFallbackStudy: (portalUrl) => ipcRenderer.invoke('portal-fallback-download', portalUrl),
	jivexDownloadStudy: (params) => ipcRenderer.invoke('jivex-download-study', params),
	jivexDetectPasswordFormat: (portalUrl) => ipcRenderer.invoke('jivex-detect-password-format', portalUrl),
	jivexReleasePreview: () => ipcRenderer.invoke('jivex-release-preview'),
	getDownloadedStudy: (studyUid) => ipcRenderer.invoke('get-downloaded-study', studyUid),
	onDownloadProgress: (handler) => {
		if (typeof handler !== 'function') return () => {};
		const listener = (_event, payload) => handler(payload);
		ipcRenderer.on('download-progress', listener);
		return () => ipcRenderer.removeListener('download-progress', listener);
	},
	onBrowserDownloadProgress: (handler) => {
		if (typeof handler !== 'function') return () => {};
		const listener = (_event, payload) => handler(payload);
		ipcRenderer.on('browser-download-progress', listener);
		return () => ipcRenderer.removeListener('browser-download-progress', listener);
	},
	getDicomMetadataFromZip: (zipPath) => ipcRenderer.invoke('dicom-metadata-from-zip', zipPath),
	copyToClipboard: (text) => ipcRenderer.invoke('clipboard-copy', text),
	webPreviewGetEnabled: () => ipcRenderer.invoke('web-preview-get-enabled'),
	webPreviewSetEnabled: (enabled) => ipcRenderer.invoke('web-preview-set-enabled', enabled),
	getPreviewBounds: () => ipcRenderer.invoke('get-preview-bounds'),
	previewSuspend: () => ipcRenderer.invoke('preview-suspend'),
	previewResume: () => ipcRenderer.invoke('preview-resume'),
	savePacs: (record) => ipcRenderer.invoke('pacs-save', record),
	listPacs: () => ipcRenderer.invoke('pacs-list'),
	saveSendSettings: (settings) => ipcRenderer.invoke('send-settings-save', settings),
	getSendSettings: () => ipcRenderer.invoke('send-settings-get'),
	saveAssignStudySettings: (settings) => ipcRenderer.invoke('assign-study-settings-save', settings),
	getAssignStudySettings: () => ipcRenderer.invoke('assign-study-settings-get'),
	queryMwlWorklist: (params) => ipcRenderer.invoke('mwl-query', params),
	getMwlStudyTags: (studyKey) => ipcRenderer.invoke('mwl-study-tags', studyKey),
	sendDicomFiles: (params) => ipcRenderer.invoke('send-dicom-files', params),
	triggerEye: () => ipcRenderer.invoke('trigger-eye'),
	updatePacs: (record) => ipcRenderer.invoke('pacs-update', record),
	adminState: () => ipcRenderer.invoke('admin-state'),
	adminSetPassword: (newPassword) => ipcRenderer.invoke('admin-set-password', newPassword),
	adminVerifyPassword: (password) => ipcRenderer.invoke('admin-verify-password', password),
	adminChangePassword: (currentPassword, newPassword) => ipcRenderer.invoke('admin-change-password', currentPassword, newPassword),
	onOpenAdminPanel: (handler) => {
		if (typeof handler !== 'function') return;
		ipcRenderer.on('open-admin-panel', () => handler());
	},
	onOpenLanguageModal: (handler) => {
		if (typeof handler !== 'function') return;
		ipcRenderer.on('open-language-modal', () => handler());
	},
	onOpenSettingsModal: (handler) => {
		if (typeof handler !== 'function') return;
		ipcRenderer.on('open-settings-modal', () => handler());
	},
	quitApp: () => ipcRenderer.invoke('app-quit'),
	getAppLanguage: () => ipcRenderer.invoke('app-language-get'),
	setAppLanguage: (lang) => ipcRenderer.invoke('app-language-set', lang),
	licenseGetStatus: () => ipcRenderer.invoke('license-get-status'),
	licenseActivate: (key) => ipcRenderer.invoke('license-activate', key),
	onWebPreviewEnabledChanged: (handler) => {
		if (typeof handler !== 'function') return;
		ipcRenderer.on('web-preview-enabled-changed', (_evt, payload) => handler(payload));
	},
	onHdscPreviewActive: (handler) => {
		if (typeof handler !== 'function') return () => {};
		const listener = (_evt, payload) => handler(payload);
		ipcRenderer.on('hdsc-preview-active', listener);
		return () => ipcRenderer.removeListener('hdsc-preview-active', listener);
	},
});