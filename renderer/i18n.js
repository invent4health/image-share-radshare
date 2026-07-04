(function () {
    const STORAGE_KEY = 'app-language';

    const translations = {
        en: {
            step1Title: 'Step 1: Scan or paste link',
            step2Title: 'Step 2: Assign patient',
            step3Title: 'Step 3: Study import…',
            scanQr: 'Scan QR code',
            pasteLink: 'Paste link',
            portalLink: 'Portal link',
            portalLinkPlaceholder: 'Paste or scan URL',
            load: 'Load',
            downloading: 'Downloading',
            patientName: 'Patient Name',
            patientId: 'Patient ID',
            dateOfBirth: 'Date of Birth',
            gender: 'Gender',
            modality: 'Modality',
            notAvailable: 'Not available',
            assignStudy: 'Assign study',
            assigningStudy: 'Assigning study…',
            readyToImport: 'Ready to import',
            saveToPacs: 'Save to PACS',
            cancel: 'Cancel',
            continue: 'Continue',
            close: 'Close',
            save: 'Save',
            send: 'Send',
            statusBegin: 'Scan or paste a portal link to begin',
            statusEnterUrl: 'Enter a URL and click Load to preview',
            previewPlaceholder: 'Website preview will appear here.',
            downloads: 'Downloads',
            password: 'Password',
            passwordPlaceholder: 'Enter password',
            success: 'Success',
            done: 'Done',
            languageModalTitle: 'Change Language',
            languageEnglish: 'English',
            languageGerman: 'German / Deutsch',
            adminPanel: 'Admin Panel',
            admin: 'Admin',
            adminLogin: 'Admin Login',
            setAdminPassword: 'Set Admin Password',
            changeAdminPassword: 'Change Admin Password',
            currentPassword: 'Current password',
            newPassword: 'New password',
            showPassword: 'Show password',
            hidePassword: 'Hide password',
            change: 'Change',
            addPacsDetails: 'Add PACS Details',
            viewPacs: 'View PACS',
            pacsEntries: 'PACS Entries',
            sendDicom: 'Send DICOM Files',
            worklistSettings: 'Worklist Settings',
            pacsSettings: 'PACS Settings',
            qrCode: 'QR Code',
            assignFromWorklist: 'Search worklist',
            dicomTags: 'DICOM tags',
            nodeName: 'Node name',
            ipAddress: 'IP Address',
            port: 'Port',
            aeTitle: 'AE Title',
            refresh: 'Refresh',
            studyLoaded: 'Study loaded',
            studyLoadFailed: 'Load failed',
            downloadingBackground: 'Downloading study in background…',
            downloadPreparing: 'Preparing study on server…',
            studyPreparingYourStudy: 'Preparing your study (about 15 seconds)…',
            downloadFailed: 'Download failed',
            downloadComplete: 'Complete',
            downloadingProgress: 'Downloading',
            loadSuccessTitle: 'Study loaded',
            loadSuccessMessage: 'Patient metadata is ready. You can assign the study or save to PACS.',
            male: 'Male',
            female: 'Female',
            other: 'Other',
            hideWebPreview: 'Hide Web Preview',
            hideWebPreviewHint: 'Hides the right panel; browser still runs in the background',
            changePassword: 'Change Password',
            studyAssigned: 'Study assigned',
            copyLink: 'Copy Link',
            search: 'Search',
            assign: 'Assign',
            changeLanguage: 'Change Language',
            settings: 'Settings',
            showWebPreview: 'Show Web Preview',
            showWebPreviewHint: 'Shows the website preview panel on the right',
            reload: 'Reload',
            forceReload: 'Force Reload',
            exit: 'Exit',
            complete: 'Complete',
            footerCopyright: '© 2026 Cognizance Health Private Limited. All rights reserved.',
            licenseTitle: 'License activation',
            licensePrompt: 'Enter your 16-digit license key to continue.',
            licenseKey: 'License key',
            licenseKeyPlaceholder: 'XXXX-XXXX-XXXX-XXXX',
            licenseActivate: 'Activate',
            licenseInvalid: 'Invalid license key. Please check and try again.',
            licenseRequired: 'A valid license key is required to use this application.',
            licenseEnded: 'Your license has ended.',
            licenseEndedPrompt: 'Enter a new 16-digit license key to continue.',
            licenseDaysRemaining: '{days} day(s) remaining',
            licenseExpiredToday: 'License expires today',
            licenseExpiringSoon: 'License expires in {hours} hour(s)',
            licenseNotActivated: 'License not activated',
            licenseClockTampered: 'System date is earlier than last use. Set the correct date and time, then restart the app.',
            licenseClockTamperedPrompt: 'The system clock appears to have been changed backwards. Correct your date and time, then enter your license key again.',
        },
        de: {
            step1Title: 'Schritt 1: Link scannen oder einfügen',
            step2Title: 'Schritt 2: Patient zuweisen',
            step3Title: 'Schritt 3: Studienimport…',
            scanQr: 'QR-Code scannen',
            pasteLink: 'Link einfügen',
            portalLink: 'Portal-Link',
            portalLinkPlaceholder: 'URL einfügen oder scannen',
            load: 'Laden',
            downloading: 'Wird heruntergeladen',
            patientName: 'Patientenname',
            patientId: 'Patienten-ID',
            dateOfBirth: 'Geburtsdatum',
            gender: 'Geschlecht',
            modality: 'Modalität',
            notAvailable: 'Nicht verfügbar',
            assignStudy: 'Studie zuweisen',
            assigningStudy: 'Studie wird zugewiesen…',
            readyToImport: 'Bereit zum Import',
            saveToPacs: 'In PACS speichern',
            cancel: 'Abbrechen',
            continue: 'Weiter',
            close: 'Schließen',
            save: 'Speichern',
            send: 'Senden',
            statusBegin: 'Portal-Link scannen oder einfügen, um zu beginnen',
            statusEnterUrl: 'URL eingeben und Laden klicken für die Vorschau',
            previewPlaceholder: 'Die Webvorschau erscheint hier.',
            downloads: 'Downloads',
            password: 'Passwort',
            passwordPlaceholder: 'Passwort eingeben',
            success: 'Erfolg',
            done: 'Fertig',
            languageModalTitle: 'Sprache ändern',
            languageEnglish: 'English',
            languageGerman: 'Deutsch',
            adminPanel: 'Adminbereich',
            admin: 'Admin',
            adminLogin: 'Admin-Anmeldung',
            setAdminPassword: 'Admin-Passwort festlegen',
            changeAdminPassword: 'Admin-Passwort ändern',
            currentPassword: 'Aktuelles Passwort',
            newPassword: 'Neues Passwort',
            showPassword: 'Passwort anzeigen',
            hidePassword: 'Passwort ausblenden',
            change: 'Ändern',
            addPacsDetails: 'PACS-Details hinzufügen',
            viewPacs: 'PACS anzeigen',
            pacsEntries: 'PACS-Einträge',
            sendDicom: 'DICOM-Dateien senden',
            worklistSettings: 'Worklist-Einstellungen',
            pacsSettings: 'PACS-Einstellungen',
            qrCode: 'QR-Code',
            assignFromWorklist: 'Worklist durchsuchen',
            dicomTags: 'DICOM-Tags',
            nodeName: 'Knotenname',
            ipAddress: 'IP-Adresse',
            port: 'Port',
            aeTitle: 'AE-Titel',
            refresh: 'Aktualisieren',
            studyLoaded: 'Studie geladen',
            studyLoadFailed: 'Laden fehlgeschlagen',
            downloadingBackground: 'Studie wird im Hintergrund heruntergeladen…',
            downloadPreparing: 'Studie wird auf dem Server vorbereitet…',
            studyPreparingYourStudy: 'Ihre Studie wird vorbereitet (ca. 15 Sekunden)…',
            downloadFailed: 'Download fehlgeschlagen',
            downloadComplete: 'Abgeschlossen',
            downloadingProgress: 'Wird heruntergeladen',
            loadSuccessTitle: 'Studie geladen',
            loadSuccessMessage: 'Patientenmetadaten sind bereit. Sie können die Studie zuweisen oder in PACS speichern.',
            male: 'Männlich',
            female: 'Weiblich',
            other: 'Sonstiges',
            hideWebPreview: 'Webvorschau ausblenden',
            hideWebPreviewHint: 'Blendet das rechte Panel aus; der Browser läuft weiter im Hintergrund',
            changePassword: 'Passwort ändern',
            studyAssigned: 'Studie zugewiesen',
            copyLink: 'Link kopieren',
            search: 'Suchen',
            assign: 'Zuweisen',
            changeLanguage: 'Sprache ändern',
            settings: 'Einstellungen',
            showWebPreview: 'Webvorschau anzeigen',
            showWebPreviewHint: 'Zeigt das Webvorschau-Panel rechts an',
            reload: 'Neu laden',
            forceReload: 'Erzwingen neu laden',
            exit: 'Beenden',
            complete: 'Abgeschlossen',
            footerCopyright: '© 2026 Cognizance Health Private Limited. Alle Rechte vorbehalten.',
            licenseTitle: 'Lizenzaktivierung',
            licensePrompt: 'Geben Sie Ihren 16-stelligen Lizenzschlüssel ein, um fortzufahren.',
            licenseKey: 'Lizenzschlüssel',
            licenseKeyPlaceholder: 'XXXX-XXXX-XXXX-XXXX',
            licenseActivate: 'Aktivieren',
            licenseInvalid: 'Ungültiger Lizenzschlüssel. Bitte prüfen und erneut versuchen.',
            licenseRequired: 'Ein gültiger Lizenzschlüssel ist erforderlich, um die Anwendung zu nutzen.',
            licenseEnded: 'Ihre Lizenz ist abgelaufen.',
            licenseEndedPrompt: 'Geben Sie einen neuen 16-stelligen Lizenzschlüssel ein, um fortzufahren.',
            licenseDaysRemaining: 'Noch {days} Tag(e)',
            licenseExpiredToday: 'Lizenz läuft heute ab',
            licenseExpiringSoon: 'Lizenz läuft in {hours} Stunde(n) ab',
            licenseNotActivated: 'Lizenz nicht aktiviert',
            licenseClockTampered: 'Systemdatum liegt vor dem letzten Nutzungsdatum. Datum und Uhrzeit korrigieren und die App neu starten.',
            licenseClockTamperedPrompt: 'Die Systemuhr scheint zurückgestellt worden zu sein. Datum und Uhrzeit korrigieren und den Lizenzschlüssel erneut eingeben.',
        },
    };

    let currentLang = 'en';

    function t(key) {
        return translations[currentLang]?.[key] ?? translations.en[key] ?? key;
    }

    function getLanguage() {
        return currentLang;
    }

    function applyLanguage(lang) {
        currentLang = lang === 'de' ? 'de' : 'en';
        try {
            localStorage.setItem(STORAGE_KEY, currentLang);
        } catch { /* ignore */ }

        document.documentElement.lang = currentLang;

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
            const key = el.getAttribute('data-i18n-aria-label');
            if (key) el.setAttribute('aria-label', t(key));
        });

        if (window.electronAPI?.setAppLanguage) {
            window.electronAPI.setAppLanguage(currentLang).catch(() => {});
        }

        document.dispatchEvent(new CustomEvent('app-language-changed', { detail: { lang: currentLang } }));
    }

    function setLanguage(lang) {
        applyLanguage(lang);
    }

    function initLanguage() {
        let saved = 'en';
        try {
            saved = localStorage.getItem(STORAGE_KEY) || 'en';
        } catch { /* ignore */ }
        applyLanguage(saved);
    }

    window.i18n = { t, getLanguage, setLanguage, applyLanguage, initLanguage };
})();
