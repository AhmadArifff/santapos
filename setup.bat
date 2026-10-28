@echo off
title Santapos Monorepo - Setup & Install
cls

echo =====================================================================
echo         SANTAPOS - Setup & Installation Monorepo
echo =====================================================================
echo.

where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm tidak ditemukan! Silakan install: npm install -g pnpm
    pause
    exit /b 1
)

echo [1/4] Menginstall semua dependencies pnpm workspace...
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Memerlukan approve builds untuk package native...
    call pnpm approve-builds --all
    call pnpm install
)

echo.
echo [2/4] Menyiapkan file konfigurasi environment...
if not exist "apps\api\.env" (
    copy ".env.example" "apps\api\.env" >nul
    echo [OK] apps\api\.env berhasil dibuat.
)
if not exist "apps\web\.env.local" (
    copy "apps\web\.env.vercel.example" "apps\web\.env.local" >nul
    echo [OK] apps\web\.env.local berhasil dibuat.
)

echo.
echo [3/4] Melakukan build awal pada internal packages (@santapos/shared, ui, config)...
call pnpm build

echo.
echo [4/4] Setup selesai!
echo =====================================================================
echo   Untuk menjalankan aplikasi sekarang, silakan klik dua kali:
echo   - dev.bat : Menjalankan Frontend dan Backend secara bersamaan
echo =====================================================================
echo.
pause
