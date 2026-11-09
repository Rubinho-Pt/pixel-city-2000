@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instala Node.js 22 ou superior e volta a abrir este ficheiro.
 pause
 exit /b 1
)
start "" "http://localhost:3000"
node server.mjs
pause
