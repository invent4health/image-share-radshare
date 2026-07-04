# Cognizance Health — silent dependency setup (run hidden from Inno Setup)
param(
    [Parameter(Mandatory = $true)]
    [string]$InstallDir,

    [string]$LogFile = '',
    [string]$StatusFile = ''
)

$ErrorActionPreference = 'Stop'

$AppDir = Join-Path $InstallDir 'app'
$RepoZipUrl = 'https://github.com/invent4health/image-share-radshare/archive/refs/heads/main.zip'
$RequiredNodeMajor = 24
$RequiredPythonVersion = '3.12'

function Write-Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $line -Encoding UTF8
    }
}

function Write-Status {
    param([string]$Message)
    Write-Log $Message
    if ($StatusFile) {
        Set-Content -Path $StatusFile -Value $Message -Encoding UTF8
    }
}

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($machinePath -or $userPath) {
        $env:Path = "$machinePath;$userPath"
    }
    foreach ($dir in @(
        'C:\ProgramData\chocolatey\bin',
        'C:\Program Files\nodejs',
        'C:\Python312',
        'C:\Python312\Scripts',
        'C:\Program Files\Python312',
        'C:\Program Files\Python312\Scripts',
        "$env:LOCALAPPDATA\Programs\Python\Python312",
        "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts"
    )) {
        if (Test-Path $dir) {
            $env:Path = "$dir;$env:Path"
        }
    }
}

function Test-IsAdmin {
    $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-Chocolatey {
    Refresh-Path
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Status 'Chocolatey is already installed.'
        return
    }

    Write-Status 'Installing package manager...'
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = `
        [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Refresh-Path

    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        throw 'Chocolatey installation failed.'
    }
    Write-Status 'Package manager installed.'
}

function Invoke-Choco {
    param(
        [string[]]$PackageArgs
    )
    Refresh-Path
    $choco = (Get-Command choco -ErrorAction SilentlyContinue).Source
    if (-not $choco) { throw 'Chocolatey (choco) was not found on PATH.' }

    $proc = Start-Process -FilePath $choco -ArgumentList $PackageArgs -Wait -PassThru -WindowStyle Hidden
    if ($proc.ExitCode -ne 0) {
        throw "Chocolatey failed: choco $($PackageArgs -join ' ') (exit $($proc.ExitCode))"
    }
}

function Get-NodeMajor {
    Refresh-Path
    try {
        $raw = & node -v 2>$null
        if ($raw -match '^v(\d+)') { return [int]$Matches[1] }
    } catch { }
    return $null
}

function Ensure-Node {
    $major = Get-NodeMajor
    if ($major -eq $RequiredNodeMajor) {
        Write-Status "Node.js v$RequiredNodeMajor is already installed."
        return
    }

    Write-Status "Installing Node.js $RequiredNodeMajor..."
    # Pin to latest Node 24.x available on Chocolatey; override with --version=24.15.0 if published.
    try {
        Invoke-Choco @('install', 'nodejs', '--version=24.15.0', '-y', '--no-progress')
    } catch {
        Write-Log "Node 24.15.0 not available on Chocolatey, trying nodejs-lts..."
        Invoke-Choco @('install', 'nodejs-lts', '-y', '--no-progress')
    }
    Refresh-Path

    $major = Get-NodeMajor
    if ($major -ne $RequiredNodeMajor) {
        throw "Node.js $RequiredNodeMajor is required but found version: $(node -v 2>$null)"
    }
    Write-Status 'Node.js installed.'
}

function Test-Python312 {
    Refresh-Path
    foreach ($exe in @('py', 'python', 'python3')) {
        if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { continue }
        try {
            $ver = & $exe -3.12 --version 2>&1
            if ($ver -match '3\.12') { return $true }
        } catch { }
        try {
            $ver = & $exe --version 2>&1
            if ($ver -match '3\.12') { return $true }
        } catch { }
    }
    return $false
}

function Ensure-Python {
    if (Test-Python312) {
        Write-Status 'Python 3.12 is already installed.'
        return
    }

    Write-Status 'Installing Python 3.12...'
    Invoke-Choco @('install', 'python312', '-y', '--no-progress')
    Refresh-Path

    if (-not (Test-Python312)) {
        throw 'Python 3.12 installation failed.'
    }
    Write-Status 'Python 3.12 installed.'
}

function Ensure-Dcmtk {
    $dcmtkBin = 'C:\ProgramData\chocolatey\bin\storescu.exe'
    if (Test-Path $dcmtkBin) {
        Write-Status 'DCMTK is already installed.'
        return
    }

    Write-Status 'Installing DCMTK...'
    Invoke-Choco @('install', 'dcmtk', '-y', '--no-progress')
    Refresh-Path

    if (-not (Test-Path $dcmtkBin)) {
        throw 'DCMTK installation failed (storescu.exe not found).'
    }

    Get-ChildItem -Path (Split-Path $dcmtkBin -Parent) -Filter '*.exe' -ErrorAction SilentlyContinue |
        ForEach-Object { Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue }
    Get-ChildItem -Path 'C:\ProgramData\chocolatey\lib\dcmtk\tools' -Filter '*.exe' -ErrorAction SilentlyContinue |
        ForEach-Object { Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue }
    Get-ChildItem -Path 'C:\ProgramData\chocolatey\lib\dcmtk\tools' -Filter '*.dll' -ErrorAction SilentlyContinue |
        ForEach-Object { Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue }

    Write-Status 'DCMTK installed.'
}

function Ensure-AppSource {
    if (Test-Path (Join-Path $AppDir 'package.json')) {
        Write-Status 'Application files are already present.'
        return
    }

    Write-Status 'Downloading application from GitHub...'
    New-Item -ItemType Directory -Path $AppDir -Force | Out-Null

    $zipPath = Join-Path $env:TEMP 'image-share-radshare-main.zip'
    $extractRoot = Join-Path $env:TEMP 'image-share-radshare-extract'

    if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

    Invoke-WebRequest -Uri $RepoZipUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

    $extracted = Get-ChildItem -Path $extractRoot -Directory | Select-Object -First 1
    if (-not $extracted) { throw 'GitHub download did not contain a source folder.' }

    Copy-Item -Path (Join-Path $extracted.FullName '*') -Destination $AppDir -Recurse -Force
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue

    Write-Status 'Application downloaded.'
}

function Ensure-NpmDependencies {
    $pkg = Join-Path $AppDir 'package.json'
    if (-not (Test-Path $pkg)) { throw "package.json not found in $AppDir" }

    Refresh-Path
    $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $npm) { $npm = (Get-Command npm -ErrorAction SilentlyContinue).Source }
    if (-not $npm) { throw 'npm was not found after Node.js installation.' }

    Write-Status 'Installing application dependencies (npm)...'
    $proc = Start-Process -FilePath $npm -ArgumentList @('install', '--no-fund', '--no-audit') `
        -WorkingDirectory $AppDir -Wait -PassThru -WindowStyle Hidden
    if ($proc.ExitCode -ne 0) {
        throw "npm install failed with exit code $($proc.ExitCode)"
    }
    Write-Status 'Application dependencies installed.'
}

function Get-Python312Executable {
    Refresh-Path
    $candidates = @(
        'C:\Python312\python.exe',
        'C:\Program Files\Python312\python.exe',
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }

    foreach ($exe in @('python', 'python3')) {
        $cmd = Get-Command $exe -ErrorAction SilentlyContinue
        if (-not $cmd) { continue }
        try {
            $ver = & $cmd.Source --version 2>&1
            if ($ver -match '3\.12') { return $cmd.Source }
        } catch { }
    }

    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        try {
            $resolved = & $pyLauncher.Source -3.12 -c "import sys; print(sys.executable)" 2>$null
            $resolved = ($resolved | Out-String).Trim()
            if ($resolved -and (Test-Path $resolved)) { return $resolved }
        } catch { }
    }

    return $null
}

function Invoke-PythonCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PythonExe,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [string]$WorkingDirectory = $AppDir
    )

    $quotedArgs = ($Arguments | ForEach-Object {
        if ($_ -match '\s') { "`"$_`"" } else { $_ }
    }) -join ' '

    Write-Log "Running: `"$PythonExe`" $quotedArgs"

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $PythonExe
    $psi.Arguments = $quotedArgs
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()

    if ($stdout.Trim()) { Write-Log $stdout.Trim() }
    if ($stderr.Trim()) { Write-Log $stderr.Trim() }

    return $proc.ExitCode
}

function Ensure-Pip {
    param([string]$PythonExe)

    $ensureCode = Invoke-PythonCommand -PythonExe $PythonExe -Arguments @('-m', 'ensurepip', '--upgrade')
    if ($ensureCode -ne 0) {
        Write-Log "ensurepip returned exit code $ensureCode (pip may already be present)."
    }

    $pipUpgradeCode = Invoke-PythonCommand -PythonExe $PythonExe -Arguments @(
        '-m', 'pip', 'install', '--upgrade', 'pip', '--disable-pip-version-check'
    )
    if ($pipUpgradeCode -ne 0) {
        Write-Log "pip upgrade returned exit code $pipUpgradeCode."
    }
}

function Ensure-Selenium {
    $req = Join-Path $AppDir 'requirements-selenium.txt'
    if (-not (Test-Path $req)) {
        Write-Status 'No Python selenium requirements file — skipping.'
        return
    }

    Write-Status 'Installing Python Selenium package...'
    Refresh-Path

    $pythonExe = Get-Python312Executable
    if (-not $pythonExe) {
        throw 'Python 3.12 executable not found for pip install.'
    }

    Write-Log "Using Python: $pythonExe"
    Ensure-Pip -PythonExe $pythonExe

    $pipArgs = @(
        '-m', 'pip', 'install',
        '-r', $req,
        '--disable-pip-version-check',
        '--no-warn-script-location'
    )

    $exitCode = Invoke-PythonCommand -PythonExe $pythonExe -Arguments $pipArgs
    if ($exitCode -ne 0) {
        Write-Log 'Retrying selenium install without requirements file...'
        $exitCode = Invoke-PythonCommand -PythonExe $pythonExe -Arguments @(
            '-m', 'pip', 'install', 'selenium>=4.15.0',
            '--disable-pip-version-check',
            '--no-warn-script-location'
        )
    }

    if ($exitCode -ne 0) {
        throw "pip install selenium failed with exit code $exitCode"
    }

    $verifyCode = Invoke-PythonCommand -PythonExe $pythonExe -Arguments @(
        '-c', 'import selenium; print(selenium.__version__)'
    )
    if ($verifyCode -ne 0) {
        throw 'Selenium import verification failed after install.'
    }

    Write-Status 'Selenium installed.'
}

try {
    if (-not (Test-IsAdmin)) {
        throw 'Administrator rights are required to install dependencies.'
    }

    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Status 'Starting installation...'

    Ensure-Chocolatey
    Ensure-Node
    Ensure-Python
    Ensure-Dcmtk
    Ensure-AppSource
    Ensure-NpmDependencies
    Ensure-Selenium

    Write-Status 'Installation complete.'
    exit 0
} catch {
    Write-Status "Installation failed: $($_.Exception.Message)"
    exit 1
}
