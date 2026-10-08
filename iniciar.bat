@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js nao encontrado. Instale em https://nodejs.org e tente de novo. & pause & exit /b 1)
if not exist node_modules (echo Instalando dependencias... & call npm install)
start "" cmd /c "timeout /t 10 >nul & start http://localhost:3000"
call npm run dev
