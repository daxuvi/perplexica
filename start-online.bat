@echo off
chcp 65001 >nul
title Khởi chạy Perplexica (Vane) Online Miễn Phí
echo ======================================================================
echo   KHỞI CHẠY PERPLEXICA (MÃ GỐC GITHUB) + CLOUDFLARE TUNNEL (ONLINE)
echo ======================================================================
echo.

:: 1. Kiểm tra Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Docker Desktop chưa bật. Đang khởi động Docker Desktop...
    if exist "C:\Users\ADMIN\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe" (
        start "" "C:\Users\ADMIN\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    ) else if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    echo [*] Đang chờ Docker Engine khởi động hoàn tất (khoảng 20-30s)...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo [...] Đang chờ Docker sẵn sàng...
        goto wait_docker
    )
    echo [v] Docker đã sẵn sàng!
)

echo.
echo [*] Đang khởi động Perplexica & Cloudflare Tunnel...
docker compose up -d --build

echo.
echo [*] Đang chờ cấp link Cloudflare Tunnel ra Internet...
timeout /t 8 /nobreak >nul

echo.
echo ======================================================================
echo   LINK TRUY CẬP PERPLEXICA CỦA BẠN:
echo ======================================================================
echo   - Trên máy tính này: http://localhost:3000
echo.
echo   - Link Online (Dùng trên điện thoại, máy khác bất kỳ đâu):
powershell -Command "$logs = docker logs perplexica-tunnel 2>&1; $url = ($logs | Select-String 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | ForEach-Object { $_.Matches.Value } | Select-Object -First 1); if ($url) { Write-Host \"    👉 $url\" -ForegroundColor Green } else { Write-Host '    Đang kết nối... Bạn có thể xem lại sau vài giây bằng lệnh: docker logs perplexica-tunnel' -ForegroundColor Yellow }"
echo ======================================================================
echo.
echo [*] Đang mở trình duyệt máy tính...
start http://localhost:3000

echo.
pause
