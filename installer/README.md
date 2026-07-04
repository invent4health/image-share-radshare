# Cognizance Health — Windows Installer

One-click installer for customers. Installs everything in the background with a simple wizard — no terminals or manual steps.

## What it installs

| Component | Version / source |
|-----------|------------------|
| **Chocolatey** | Latest (bootstrap script) |
| **Node.js** | 24.x (pins 24.15.0 when available on Chocolatey) |
| **Python** | 3.12 |
| **DCMTK** | via `choco install dcmtk -y` |
| **Selenium** | from `requirements-selenium.txt` in the app |
| **Application** | [image-share-radshare](https://github.com/invent4health/image-share-radshare) (main branch ZIP) |
| **npm packages** | `npm install` in the app folder |
| **Desktop shortcut** | **Cognizance Health** on desktop — double-click to run `npm run dev` and start the app |

## Desktop shortcut — how the app starts

After installation, the installer creates a **desktop shortcut** named **Cognizance Health** (and a Start Menu entry).

When the customer double-clicks that shortcut:

1. `launch-app.cmd` runs in the install folder
2. It opens the **app** subfolder (`C:\Program Files\Cognizance Health\app\`)
3. It runs **`npm run dev`** in that folder
4. That starts the Electron app (same as running `npm run dev` from the project on a dev machine)

The customer does **not** need to open a terminal, `cd` into a folder, or run any commands manually — the shortcut is the only way they need to start the app.

| Shortcut | Target | Working folder | What it does |
|----------|--------|----------------|--------------|
| **Cognizance Health** (desktop) | `launch-app.cmd` | `C:\Program Files\Cognizance Health\` | `cd app` → `npm run dev` → app opens |

## Customer experience

1. Double-click `CognizanceHealth-Setup.exe`
2. Click **Install**
3. Wait on the progress screen (no command windows during install)
4. A **desktop shortcut** named **Cognizance Health** is created
5. Double-click the shortcut anytime to **start the app** (`npm run dev` in the installed app folder)

## Build the installer

### Prerequisites (on your build machine only)

1. [Inno Setup 6](https://jrsoftware.org/isinfo.php) — add `ISCC.exe` to PATH, or use full path
2. Internet access (installer downloads GitHub source at install time on customer PC)

### Compile

```powershell
cd installer
ISCC.exe setup.iss
```

Output: `installer\output\CognizanceHealth-Setup.exe`

### Optional: compile from repo root

```powershell
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "installer\setup.iss"
```

## Install layout

```
C:\Program Files\Cognizance Health\
  launch-app.cmd              ← desktop shortcut points here; runs npm run dev in app\
  install-dependencies.ps1
  install.log                 ← support log (hidden from normal UI)
  install-status.txt
  app\                        ← GitHub app (npm project root)
    package.json
    main.js
    ...
```

**Starting the app:** Desktop shortcut → `launch-app.cmd` → `npm run dev` inside `app\`

## Requirements on customer PC

- Windows 10 or later (64-bit)
- Administrator rights (UAC prompt once)
- Internet connection during first install

## Troubleshooting

If install fails, check:

```
C:\Program Files\Cognizance Health\install.log
```

Common issues:

- **No internet** — GitHub download or Chocolatey will fail
- **Antivirus** — may block Chocolatey bootstrap
- **Node 24.15.0** — if not on Chocolatey, installer falls back to `nodejs-lts`

## Customization

- **App version** — edit `#define MyAppVersion` in `setup.iss`
- **GitHub branch** — edit `$RepoZipUrl` in `scripts/install-dependencies.ps1`
- **Icon** — add `SetupIconFile=assets\app-icon.ico` under `[Setup]` in `setup.iss`

## Note for production

This installer uses **dev mode** (`npm run dev`) via the desktop shortcut. For a production customer build, consider switching the launcher to `npm start` or a packaged `electron-builder` `.exe` instead.
