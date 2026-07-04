@echo off
setlocal EnableDelayedExpansion

rem Local DICOM receiver for testing the app's Send button.
rem In the app, add/use a PACS entry like:
rem   IP: 127.0.0.1
rem   Port: 11112
rem   AE Title: RADSHARE
rem
rem Each time you run this script, a new subfolder is created using the
rem start date and time (day-month-year_hour-minute-AM/PM). All images
rem received during this session are saved into that folder.

set "AE_TITLE=RADSHARE"
set "PORT=11112"
set "BASE_DIR=%~dp0received-dicom"
set "STORESCP=C:\ProgramData\chocolatey\bin\storescp.exe"

for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format 'dd-MM-yyyy_hh-mm-tt'"') do set "SESSION_FOLDER=%%T"
set "OUTPUT_DIR=%BASE_DIR%\%SESSION_FOLDER%"

if not exist "%BASE_DIR%" mkdir "%BASE_DIR%"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

if not exist "%STORESCP%" (
  for /f "delims=" %%I in ('where storescp 2^>nul') do (
    set "STORESCP=%%I"
    goto :found_storescp
  )
)

:found_storescp
if not exist "%STORESCP%" (
  echo storescp.exe was not found.
  echo Install DCMTK first, or update this BAT file with the correct storescp.exe path.
  pause
  exit /b 1
)

echo Starting local DICOM receiver...
echo AE Title : %AE_TITLE%
echo Port     : %PORT%
echo Session  : %SESSION_FOLDER%
echo Output   : %OUTPUT_DIR%
echo.
echo All images received in this session go into the folder above.
echo Run this script again later to create a new dated folder.
echo.
echo Keep this window open while using the app's Send button.
echo Press Ctrl+C to stop the server.
echo.
echo Live logs:
echo - Association/request messages will print below.
echo - Received files are saved into the session folder.
echo.

"%STORESCP%" -v -d -aet "%AE_TITLE%" -od "%OUTPUT_DIR%" +xa %PORT%

echo.
echo storescp stopped.
echo.
echo Received folder contents:
dir "%OUTPUT_DIR%"
pause
