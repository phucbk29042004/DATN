@echo off
chcp 65001 >nul
title [LogPulse] Dung He Thong va Giai Phong Cong

echo ======================================================================
echo    LOGPULSE - DUNG TAT CA DICH VU VA GIAI PHONG CONG
echo ======================================================================
echo.

echo Dang kiem tra va giai phong cac cong 3000, 4000, 5000, 8000...

powershell -NoProfile -Command "$ports = @(3000, 4000, 5000, 8000); $k = 0; foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { if ($procId -gt 4) { Write-Host \"[+] Dung tien trinh PID $procId (dang chiem cong $p)...\"; Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; $k++; } } } }; if ($k -eq 0) { Write-Host '[INFO] Cac cong 3000, 4000, 5000 da sach se tu truoc.' -ForegroundColor Green } else { Write-Host \"[OK] Da giai phong thanh cong $k tien trinh!\" -ForegroundColor Green }"

echo.
echo ======================================================================
echo   [HOAN TAT] Toan bo dich vu Backend va Frontend da duoc dung sach se.
echo   Ban co the chay lai start_all.bat bat cu luc nao ma khong so loi cong!
echo ======================================================================
echo.
pause
