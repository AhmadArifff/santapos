@echo off
title Santapos Monorepo - All-in-One Launcher
color 0F
cls

echo =====================================================================
echo           SANTAPOS - Multi-Tenant Restaurant POS and SaaS
echo                     All-in-One Unified Launcher
echo =====================================================================
echo.

:: 1. Cek Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan! Silakan install Node.js terlebih dahulu.
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Cek pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 goto install_pnpm
goto check_modules

:install_pnpm
echo [INFO] pnpm belum terpasang. Memasang pnpm via npm...
call npm install -g pnpm
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal memasang pnpm otomatis. Silakan jalankan: npm install -g pnpm
    pause
    exit /b 1
)
echo [OK] pnpm berhasil dipasang!
echo.

:check_modules
:: 3. AUTO-SETUP: Cek node_modules
if exist "node_modules" goto check_env
echo =====================================================================
echo   [SETUP AWAL] Mendeteksi instalasi pertama kali...
echo   Menginstall dependencies workspace (pnpm install)
echo =====================================================================
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Menyetujui build packages native...
    call pnpm approve-builds --all
    call pnpm install
)
echo [OK] Dependencies berhasil diinstall!
echo.

:check_env
:: 4. AUTO-SETUP: Cek file Environment (.env)
if exist "apps\api\.env" goto check_web_env
if exist ".env.example" (
    echo [INFO] Menyiapkan file konfigurasi apps\api\.env dari template...
    copy ".env.example" "apps\api\.env" >nul
    echo [OK] apps\api\.env berhasil dibuat.
)

:check_web_env
if exist "apps\web\.env.local" goto check_shared
if exist "apps\web\.env.vercel.example" (
    echo [INFO] Menyiapkan file konfigurasi apps\web\.env.local dari template...
    copy "apps\web\.env.vercel.example" "apps\web\.env.local" >nul
    echo [OK] apps\web\.env.local berhasil dibuat.
)

:check_shared
:: 5. AUTO-SETUP: Cek build package internal @santapos/shared
if exist "packages\shared\dist\index.js" goto show_menu
echo [INFO] Membangun package internal @santapos/shared...
call pnpm --filter @santapos/shared build
echo [OK] @santapos/shared siap digunakan!
echo.

:show_menu
:: 6. Menu Interaktif dengan Auto-Start 5 Detik
echo =====================================================================
echo   PILIH MODE MENJALANKAN APLIKASI:
echo =====================================================================
echo   [1] Jalankan Semua (Frontend + Backend)  [DEFAULT / OTOMATIS]
echo   [2] Jalankan Frontend Saja (Next.js 16)
echo   [3] Jalankan Backend API Saja (Express + Database)
echo   [4] Install Ulang Dependencies (pnpm install dan build)
echo   [5] Verifikasi Production Build (Turbo Build Test)
echo   [6] Migrasi Database, Seed Akun User dan Setup Storage Supabase
echo   [0] Keluar
echo =====================================================================
echo.
echo   - Web App dan Self-Order : http://localhost:3000
echo   - Backend REST API       : http://localhost:5000/api
echo   - Superadmin Portal      : http://localhost:3000/superadmin
echo.

if not "%1"=="" (
    set USER_CHOICE=%1
    goto process_choice
)

choice /C 1234560 /D 1 /T 5 /M "Pilih opsi [1-6] (Otomatis menjalankan Opsi 1 dalam 5 detik): "
set USER_CHOICE=%ERRORLEVEL%

:process_choice
if "%USER_CHOICE%"=="1" goto run_all
if "%USER_CHOICE%"=="2" goto run_web
if "%USER_CHOICE%"=="3" goto run_api
if "%USER_CHOICE%"=="4" goto run_setup
if "%USER_CHOICE%"=="5" goto run_build
if "%USER_CHOICE%"=="6" goto run_db_setup
if "%USER_CHOICE%"=="7" goto exit_launcher
if "%USER_CHOICE%"=="0" goto exit_launcher

:run_all
echo.
echo =====================================================================
echo   Menjalankan FRONTEND + BACKEND secara bersamaan...
echo   Tekan Ctrl + C untuk menghentikan server kapan saja.
echo =====================================================================
echo.
call pnpm dev
goto done

:run_web
echo.
echo =====================================================================
echo   Menjalankan FRONTEND SAJA pada http://localhost:3000...
echo   Tekan Ctrl + C untuk menghentikan server.
echo =====================================================================
echo.
call pnpm dev:web
goto done

:run_api
echo.
echo =====================================================================
echo   Menjalankan BACKEND API SAJA pada http://localhost:5000/api...
echo   Tekan Ctrl + C untuk menghentikan server.
echo =====================================================================
echo.
call pnpm dev:api
goto done

:run_setup
echo.
echo =====================================================================
echo   Menjalankan Install Ulang Dependencies dan Build Shared...
echo =====================================================================
echo.
call pnpm install
call pnpm build
echo.
echo Setup ulang selesai! Silakan tekan tombol apa saja untuk kembali.
pause
goto done

:run_build
echo.
echo =====================================================================
echo   Menjalankan Verifikasi Production Build...
echo =====================================================================
echo.
call pnpm build
echo.
pause
goto done

:run_db_setup
echo.
echo =====================================================================
echo   Menjalankan Migrasi Database, Seed Akun User dan Setup Supabase...
echo =====================================================================
echo.
call pnpm db:setup
echo.
echo =====================================================================
echo   Database dan Storage Supabase siap digunakan!
echo =====================================================================
echo.
if "%1"=="" pause
goto done

:exit_launcher
echo Keluar.
exit /b 0

:done
if "%1"=="" pause
exit /b 0
