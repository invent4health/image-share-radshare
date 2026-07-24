param(
    [Parameter(Mandatory = $true)][string]$ParamsFile
)

$ErrorActionPreference = 'Stop'

function Write-Log([string]$Message, [string]$LogFile) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $line -Encoding UTF8
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

try {
    if (-not (Test-Path -LiteralPath $ParamsFile)) {
        throw "Update params file not found: $ParamsFile"
    }

    $params = Get-Content -LiteralPath $ParamsFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $sourceDir = [string]$params.sourceDir
    $appRoot = [string]$params.appRoot
    $preserveDir = [string]$params.preserveDir
    $parentPid = [int]$params.parentPid
    $launchCmd = [string]$params.launchCmd
    $tempRoot = [string]$params.tempRoot
    $logFile = [string]$params.logFile

    $preserveNames = @('send-settings.json', 'assign-study-settings.json', 'admin-settings.json', 'pacs.json')
    $skipDirs = @('node_modules', '.git', 'received-dicom')

    Write-Log "Updater started." $logFile
    Write-Log "Source: $sourceDir" $logFile
    Write-Log "Target: $appRoot" $logFile

    if ($parentPid -gt 0) {
        Write-Log "Waiting for app process $parentPid to exit..." $logFile
        try {
            $proc = Get-Process -Id $parentPid -ErrorAction SilentlyContinue
            if ($proc) {
                $proc.WaitForExit(120000)
            }
        } catch {
            Write-Log "Process wait skipped: $($_.Exception.Message)" $logFile
        }
        Start-Sleep -Seconds 2
    }

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

    Write-Log 'Update complete. Relaunching app...' $logFile
    if ($launchCmd -and (Test-Path -LiteralPath $launchCmd)) {
        $launchRoot = Split-Path -Parent $launchCmd
        Start-Process -FilePath $launchCmd -WorkingDirectory $launchRoot
    } else {
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $appRoot
    }

    if ($tempRoot -and (Test-Path -LiteralPath $tempRoot)) {
        Start-Sleep -Seconds 2
        try {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force
        } catch {
            Write-Log "Temp cleanup skipped: $($_.Exception.Message)" $logFile
        }
    }

    Write-Log 'Updater finished successfully.' $logFile
    exit 0
} catch {
    $message = $_.Exception.Message
    try {
        if ($logFile) {
            Write-Log "Update failed: $message" $logFile
        }
    } catch { }
    try {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show(
            "Cognizance Health could not finish the update:`n`n$message`n`nTry running the app as administrator or reinstall from the latest installer.",
            'Update failed',
            'OK',
            'Error'
        ) | Out-Null
    } catch { }
    exit 1
}
