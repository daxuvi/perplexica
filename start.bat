@echo off
chcp 65001 >nul
echo ========================================================
echo   KHOI CHAY PERPLEXICA (VANE) - AI SEARCH ENGINE
echo ========================================================
echo.

:: Kiem tra Docker Daemon
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Desktop chua bat. Dang khoi dong Docker Desktop...
    if exist "C:\Users\ADMIN\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe" (
        start "" "C:\Users\ADMIN\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    ) else (
        echo [!] Khong tim thay Docker Desktop, vui long mo Docker Desktop thu cong!
    )
    echo [*] Dang doi Docker Engine khoi dong... (mat khoang 15-30s)
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo [...] Dang cho Docker Engine...
        goto wait_docker
    )
    echo [v] Docker da san sang!
)

echo.
echo [*] Dang khoi chay container Perplexica...
docker compose up -d --build

echo.
echo [v] Perplexica da chay thanh cong tai: http://localhost:3000
echo [*] Dang mo trinh duyet...
start http://localhost:3000

echo.
echo ========================================================
echo Nhan phim bat ky de thoat cua so nay. Container van chay ngam.
pause >nul
