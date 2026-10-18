@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js staat nog niet op deze computer.
  echo Download en installeer het via https://nodejs.org en dubbelklik daarna opnieuw op dit bestand.
  start https://nodejs.org
  pause
  exit /b
)
echo SpaceVerbs start... Laat dit venster open zolang je SpaceVerbs gebruikt.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node --disable-warning=ExperimentalWarning server.js
pause
