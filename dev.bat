@echo off
title Santapos Monorepo - Local Development
cls

echo =====================================================================
echo           SANTAPOS - Multi-Tenant Restaurant POS & SaaS
echo =====================================================================
echo.

:: 1. Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm tidak ditemukan di PATH sistem Anda!
    echo Silakan install pnpm terlebih dahulu: npm install -g pnpm
    echo.
    pause
    exit /b 1
)

:: 2. Check environment files
if not exist "apps\api\.env" (
    if exist ".env.example" (
        echo [INFO] apps\api\.env belum ada. Menyalin dari .env.example...
        copy ".env.example" "apps\api\.env" >nul
        echo [OK] apps\api\.env berhasil dibuat. Silakan sesuaikan isinya jika diperlukan.
    )
)

if not exist "apps\web\.env.local" (
    if exist "apps\web\.env.vercel.example" (
        echo [INFO] apps\web\.env.local belum ada. Menyalin template...
        copy "apps\web\.env.vercel.example" "apps\web\.env.local" >nul
        echo [OK] apps\web\.env.local berhasil dibuat.
    )
)

:: 3. Ensure shared package is built
if not exist "packages\shared\dist\index.js" (
    echo [INFO] Membangun package @santapos/shared...
    call pnpm --filter @santapos/shared build
)

echo.
echo =====================================================================
echo   Aplikasi akan berjalan pada alamat berikut:
echo   - Web App & Self-Order : http://localhost:3000
echo   - Backend REST API     : http://localhost:5000/api
echo   - Superadmin Portal    : http://localhost:3000/superadmin
echo   - Onboarding Wizard    : http://localhost:3000/onboarding
echo =====================================================================
echo.
echo Menjalankan 'pnpm dev' (Tekan Ctrl+C untuk menghentikan)...
echo.

call pnpm dev
pause
