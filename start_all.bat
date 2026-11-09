@echo off
chcp 65001 >nul
title [LogPulse] Khoi Dong He Thong Giam Sat va Phan Tich Log

echo ======================================================================
echo    LOGPULSE - KHOI DONG TOAN BO HE THONG (ALL-IN-ONE LAUNCHER)
echo ======================================================================
echo.

:: 1. Kiem tra va Khoi dong Redis Server (Port 6379)
echo [1/4] Kiem tra Redis Server (Port 6379)...
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue; if ($c) { exit 0 } else { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo       [OK] Redis Server dang chay san tren cong 6379.
) else (
    echo       [+] Dang bat Redis Server...
    if exist "D:\Redis\redis-server.exe" (
        start "Redis Server" /min "D:\Redis\redis-server.exe"
    ) else (
        start "Redis Server" /min redis-server
    )
    ping 127.0.0.1 -n 3 >nul
)

:: 2. Kiem tra va Khoi dong OpenSearch Database (Port 9200)
echo [2/4] Kiem tra OpenSearch Database (Port 9200)...
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 9200 -ErrorAction SilentlyContinue; if ($c) { exit 0 } else { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo       [OK] OpenSearch Cluster dang chay san tren cong 9200.
) else (
    echo       [+] Dang khoi dong OpenSearch Cluster, vui long doi giay lat...
    if exist "D:\opensearch-2.19.6\bin\opensearch.bat" (
        start "OpenSearch Cluster" "D:\opensearch-2.19.6\bin\opensearch.bat"
    )
    echo       [*] Dang doi OpenSearch hoan tat khoi dong tren cong 9200...
    powershell -NoProfile -Command "$ready = $false; for ($i=1; $i -le 35; $i++) { $c = Get-NetTCPConnection -LocalPort 9200 -ErrorAction SilentlyContinue; if ($c) { $ready = $true; break }; Start-Sleep -Seconds 1 }; if ($ready) { exit 0 } else { exit 1 }"
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] OpenSearch da san sang tiep nhan ket noi!
    ) else (
        echo       [!] OpenSearch mat nhieu thoi gian hon du kien, tiep tuc khoi dong cac dich vu tiep theo...
    )
)

:: 3. Khoi dong Backend Services
echo [3/4] Dang khoi dong Backend Services (Collector, Parser Worker, Search API)...
start "LogPulse Backend Pipeline" cmd /k "cd /d d:\DATN\BE && node index.js"
ping 127.0.0.1 -n 4 >nul

:: 4. Khoi dong Frontend React Dashboard
echo [4/4] Dang khoi dong Frontend Dashboard (React Vite)...
start "LogPulse Frontend Dashboard" cmd /k "cd /d d:\DATN\FE && npm run dev"
ping 127.0.0.1 -n 4 >nul

echo.
echo ======================================================================
echo   [THANH CONG] Toan bo he thong LogPulse da duoc khoi chay!
echo   - Giao dien Web:     http://localhost:3000
echo   - Search API:        http://localhost:5000
echo   - Log Collector:     http://localhost:4000
echo   - OpenSearch Node:   http://localhost:9200
echo   - Redis Queue:       localhost:6379
echo.
echo   * Tai khoan dang nhap: admin / admin123 (hoac nut Quick Login)
echo   * De phat log mau: Mo terminal tai d:\DATN\BE va go: npm run stream:real
echo   * De dung he thong: Nhan dup chuot vao file stop_all.bat
echo ======================================================================
echo.

:: Tu dong mo trinh duyet Web
ping 127.0.0.1 -n 3 >nul
start http://localhost:3000

echo Cua so nay se duoc giu lai de ban tien theo doi thong tin.
pause
