@echo off
cd /d "%~dp0"
echo.
echo  ========================================
echo   LOCALHOST LINKS
echo  ========================================
echo   Frontend app: http://localhost:5173
echo   Backend API:  http://localhost:4000
echo   Open in browser: http://localhost:5173
echo  ========================================
echo.
call npm.cmd run dev:frontend
pause
