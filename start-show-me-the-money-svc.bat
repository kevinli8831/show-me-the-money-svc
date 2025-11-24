@echo off
echo ========================================
echo   Show Me The Money Backend ...
echo ========================================
cd /d %~dp0
docker compose pull
docker compose up -d
echo.
echo ??!???????????:
echo   ??: http://localhost:3000
echo   ??: ?? Ngrok / Tailscale ??
echo.
pause