@echo off
TITLE FactoryAI Shopfloor Server
echo ===================================================
echo Starte FactoryAI Backend & Frontend unter Windows...
echo ===================================================

cd backend
call npm install
npm start
pause
