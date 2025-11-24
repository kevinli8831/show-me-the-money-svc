@echo off
chcp 65001 >nul
echo ========================================
echo   Show Me The Money Backend ???...
echo ========================================

docker compose pull
docker compose up -d --force-recreate
echo.
echo ???API ??? http://localhost:3000
echo ????? Ngrok / Tailscale ???
echo.
pause
