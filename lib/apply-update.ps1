param(
    [Parameter(Mandatory = $true)][string]$ParamsFile
)

$ErrorActionPreference = 'Stop'

function Write-Log([string]$Message, [string]$LogFile) {
    if (-not $LogFile) { return }
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    try {
        $logDir = Split-Path $LogFile -Parent
        if ($logDir -and -not (Test-Path -LiteralPath $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
    } catch {
        # Logging must never fail the update.
    }
}

function Get-RelativePath([string]$Base, [string]$Target) {
    $basePath = [System.IO.Path]::GetFullPath($Base)
    if (-not $basePath.EndsWith('\')) { $basePath += '\' }
    $targetPath = [System.IO.Path]::GetFullPath($Target)
    if ($targetPath.StartsWith($basePath, [StringComparison]::OrdinalIgnoreCase)) {
        return $targetPath.Substring($basePath.Length)
    }
    return $targetPath
}

function Stop-CognizanceApp([string]$AppRoot, [int]$RootPid, [string]$LogFile) {
    Write-Log "Stopping existing Cognizance Health processes..." $LogFile

    if ($RootPid -gt 0) {
        try {
            cmd.exe /c "taskkill /T /F /PID $RootPid" 2>$null | Out-Null
        } catch {
            Write-Log "taskkill for root PID skipped: $($_.Exception.Message)" $LogFile
        }
    }

    Start-Sleep -Seconds 2

    $appRootNorm = [System.IO.Path]::GetFullPath($AppRoot)
    $processNames = @('electron.exe', 'node.exe', 'cmd.exe')
    foreach ($name in $processNames) {
        Get-CimInstance Win32_Process -Filter "Name = '$name'" -ErrorAction SilentlyContinue | ForEach-Object {
            $cmdLine = [string]$_.CommandLine
            if (-not $cmdLine) { return }
            $matchesApp = $cmdLine -like "*$appRootNorm*"
            $matchesLauncher = $cmdLine -like '*electronmon*' -or $cmdLine -like '*Cognizance Health*' -or $cmdLine -like '*npm run dev*'
            if ($matchesApp -or ($name -ne 'cmd.exe' -and $matchesLauncher)) {
                try {
                    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                } catch { }
            }
        }
    }

    Start-Sleep -Seconds 2
    Write-Log 'Existing app processes stopped.' $LogFile
}

function Start-CognizanceAppHidden([string]$AppRoot, [string]$LogFile) {
    Write-Log "Starting Cognizance Health (hidden)..." $LogFile
    $env:PATH = 'C:\Program Files\nodejs;C:\ProgramData\chocolatey\bin;' + $env:PATH
    $env:COGNIZANCE_REQUIRE_LICENSE = '1'

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'
    $psi.Arguments = '/c npm run dev'
    $psi.WorkingDirectory = $AppRoot
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    [void][System.Diagnostics.Process]::Start($psi)
}

function Copy-Tree([string]$Src, [string]$Dest, [string]$AppRoot, [string[]]$PreserveNames, [string[]]$SkipDirs, [string]$PreserveDir) {
    if (Test-Path $Src -PathType Container) {
        $name = Split-Path $Src -Leaf
        if ($SkipDirs -contains $name) { return }
        if (-not (Test-Path $Dest)) {
            New-Item -ItemType Directory -Path $Dest -Force | Out-Null
        }
        Get-ChildItem -LiteralPath $Src | ForEach-Object {
            Copy-Tree -Src $_.FullName -Dest (Join-Path $Dest $_.Name) -AppRoot $AppRoot -PreserveNames $PreserveNames -SkipDirs $SkipDirs -PreserveDir $PreserveDir
        }
        return
    }

    $rel = Get-RelativePath -Base $AppRoot -Target $Dest
    if ($PreserveNames -contains $rel -and (Test-Path (Join-Path $PreserveDir $rel))) {
        return
    }

    $destParent = Split-Path $Dest -Parent
    if ($destParent -and -not (Test-Path $destParent)) {
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }
    Copy-Item -LiteralPath $Src -Destination $Dest -Force
}

$logFile = $null
$updateFailed = $false
$failureMessage = ''

try {
    if (-not (Test-Path -LiteralPath $ParamsFile)) {
        throw "Update params file not found: $ParamsFile"
    }

    $params = Get-Content -LiteralPath $ParamsFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $sourceDir = [string]$params.sourceDir
    $appRoot = [string]$params.appRoot
    $preserveDir = [string]$params.preserveDir
    $parentPid = [int]$params.parentPid
    $tempRoot = [string]$params.tempRoot
    $logFile = [string]$params.logFile

    $preserveNames = @('send-settings.json', 'assign-study-settings.json', 'admin-settings.json', 'pacs.json')
    $skipDirs = @('node_modules', '.git', 'received-dicom')

    Write-Log 'Updater started.' $logFile
    Write-Log "Source: $sourceDir" $logFile
    Write-Log "Target: $appRoot" $logFile

    Stop-CognizanceApp -AppRoot $appRoot -RootPid $parentPid -LogFile $logFile

    if (-not (Test-Path -LiteralPath $sourceDir)) {
        throw "Extracted update folder not found: $sourceDir"
    }
    if (-not (Test-Path -LiteralPath $appRoot)) {
        throw "Application folder not found: $appRoot"
    }

    Write-Log 'Copying updated files...' $logFile
    Get-ChildItem -LiteralPath $sourceDir | ForEach-Object {
        if ($skipDirs -contains $_.Name) { return }

        $dest = Join-Path $appRoot $_.Name
        if (Test-Path -LiteralPath $dest) {
            Remove-Item -LiteralPath $dest -Recurse -Force
        }

        if ($_.PSIsContainer) {
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
            Get-ChildItem -LiteralPath $_.FullName | ForEach-Object {
                Copy-Tree -Src $_.FullName -Dest (Join-Path $dest $_.Name) -AppRoot $appRoot -PreserveNames $preserveNames -SkipDirs $skipDirs -PreserveDir $preserveDir
            }
        } else {
            if ($preserveNames -contains $_.Name -and (Test-Path (Join-Path $preserveDir $_.Name))) {
                return
            }
            Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
        }
    }

    foreach ($name in $preserveNames) {
        $preserved = Join-Path $preserveDir $name
        if (Test-Path -LiteralPath $preserved) {
            Copy-Item -LiteralPath $preserved -Destination (Join-Path $appRoot $name) -Force
        }
    }

    Write-Log 'Running npm install...' $logFile
    $env:PATH = 'C:\Program Files\nodejs;C:\ProgramData\chocolatey\bin;' + $env:PATH
    Push-Location $appRoot
    try {
        & npm.cmd install --no-fund --no-audit
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }

    Start-CognizanceAppHidden -AppRoot $appRoot -LogFile $logFile
    Write-Log 'Updater finished successfully.' $logFile

    if ($tempRoot -and (Test-Path -LiteralPath $tempRoot)) {
        Start-Sleep -Seconds 2
        try {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force
        } catch {
            Write-Log "Temp cleanup skipped: $($_.Exception.Message)" $logFile
        }
    }

    exit 0
} catch {
    $updateFailed = $true
    $failureMessage = $_.Exception.Message
    Write-Log "Update failed: $failureMessage" $logFile
    exit 1
} finally {
    if ($updateFailed) {
        try {
            Add-Type -AssemblyName PresentationFramework
            [System.Windows.MessageBox]::Show(
                "Cognizance Health could not finish the update:`n`n$failureMessage`n`nTry running the app as administrator or reinstall from the latest installer.",
                'Update failed',
                'OK',
                'Error'
            ) | Out-Null
        } catch { }
    }
}
