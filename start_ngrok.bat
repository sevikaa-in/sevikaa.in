@echo off
title Sevikaa Ngrok Public Tunnel (Port 3000)
echo ===================================================
echo   Starting Sevikaa Ngrok Public Tunnel on Port 3000
echo   Public Domain: https://reselect-posh-sixties.ngrok-free.dev
echo ===================================================
echo.
ngrok config add-authtoken 3HzNeiU36Nlbnb7vfkVN4ey6mdu_5E6NE3KQidvKJjivLsXJC
echo.
echo Launching tunnel...
ngrok http --url=reselect-posh-sixties.ngrok-free.dev 3000
pause
