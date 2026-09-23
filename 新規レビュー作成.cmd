@echo off
chcp 65001 > nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\create-review.ps1"
echo.
pause
