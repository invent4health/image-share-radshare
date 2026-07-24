@echo off
setlocal EnableExtensions

rem Cognizance Health launcher — desktop shortcut target
set "ROOT=%~dp0"
set "APP_DIR=%ROOT%app"

if not exist "%APP_DIR%\package.json" (
    mshta "javascript:alert('Cognizance Health is not installed correctly.\n\nThe application folder is missing.\nPlease reinstall.');close()"
    exit /b 1
)

rem Refresh PATH so npm/node from Chocolatey install are visible
set "PATH=C:\Program Files\nodejs;C:\ProgramData\chocolatey\bin;%PATH%"

cd /d "%APP_DIR%"

where npm.cmd >nul 2>&1
if errorlevel 1 (
    mshta "javascript:alert('Node.js was not found.\n\nPlease reinstall Cognizance Health.');close()"
    exit /b 1
)

rem Run the app without opening a visible command window
set "COGNIZANCE_REQUIRE_LICENSE=1"
powershell -NoProfile -WindowStyle Hidden -Command ^
  "$env:COGNIZANCE_REQUIRE_LICENSE='1'; $env:PATH='C:\Program Files\nodejs;C:\ProgramData\chocolatey\bin;' + $env:PATH; $p = New-Object System.Diagnostics.ProcessStartInfo; $p.FileName='cmd.exe'; $p.Arguments='/c npm run dev'; $p.WorkingDirectory='%APP_DIR%'; $p.UseShellExecute=$false; $p.CreateNoWindow=$true; $p.WindowStyle=[System.Diagnostics.ProcessWindowStyle]::Hidden; [void][System.Diagnostics.Process]::Start($p)"

endlocal
