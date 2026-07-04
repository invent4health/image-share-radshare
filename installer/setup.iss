; Cognizance Health — Windows installer (Inno Setup 6)
; Build: ISCC.exe setup.iss
; Requires: Inno Setup 6 — https://jrsoftware.org/isinfo.php

#define MyAppName "Cognizance Health"
#define MyAppPublisher "Cognizance Health Private Limited"
#define MyAppURL "https://github.com/invent4health/image-share-radshare"
#define MyAppVersion "1.0.0"

[Setup]
AppId={{B8E4F2A1-9C3D-4E5F-A1B2-3D4E5F6A7B8C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=CognizanceHealth-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
UninstallDisplayIcon={app}\launch-app.cmd
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce

[Files]
Source: "scripts\install-dependencies.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "scripts\launch-app.cmd"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\launch-app.cmd"; WorkingDir: "{app}"; Comment: "Launch {#MyAppName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\launch-app.cmd"; WorkingDir: "{app}"; Tasks: desktopicon; Comment: "Launch {#MyAppName}"

[Run]
Filename: "{app}\launch-app.cmd"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent unchecked

[UninstallDelete]
Type: filesandordirs; Name: "{app}\app"
Type: files; Name: "{app}\install.log"
Type: files; Name: "{app}\install-status.txt"

[Code]
var
  StatusFile: String;
  LogFile: String;

procedure SetWizardStatus(const Msg: String);
begin
  WizardForm.StatusLabel.Caption := Msg;
  WizardForm.ProgressGauge.Style := npbstMarquee;
end;

function RunHiddenPowerShell(const ScriptPath, Args: String): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec(
    ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'),
    '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + ScriptPath + '" ' + Args,
    '',
    SW_HIDE,
    ewWaitUntilTerminated,
    ResultCode
  ) and (ResultCode = 0);
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpInstalling then
    SetWizardStatus('Installing Cognizance Health. This may take several minutes...');
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  InstallDir, PsScript, PsArgs, ErrMsg: String;
  Ok: Boolean;
  Lines: TArrayOfString;
begin
  if CurStep = ssPostInstall then
  begin
    InstallDir := ExpandConstant('{app}');
    StatusFile := InstallDir + '\install-status.txt';
    LogFile := InstallDir + '\install.log';

    PsScript := InstallDir + '\install-dependencies.ps1';
    PsArgs := '-InstallDir "' + InstallDir + '" -LogFile "' + LogFile + '" -StatusFile "' + StatusFile + '"';

    SetWizardStatus('Installing Cognizance Health. This may take several minutes...');

    Ok := RunHiddenPowerShell(PsScript, PsArgs);

    if not Ok then
    begin
      ErrMsg := 'Installation failed.';
      if FileExists(StatusFile) and LoadStringsFromFile(StatusFile, Lines) then
      begin
        if GetArrayLength(Lines) > 0 then
          ErrMsg := Trim(Lines[GetArrayLength(Lines) - 1]);
      end;
      MsgBox(ErrMsg + #13#10#13#10 +
        'See install.log in the installation folder for details:' + #13#10 +
        LogFile, mbError, MB_OK);
      Abort;
    end;

    WizardForm.ProgressGauge.Style := npbstNormal;
    WizardForm.ProgressGauge.Position := WizardForm.ProgressGauge.Max;
    SetWizardStatus('Installation complete.');
  end;
end;
