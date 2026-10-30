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
set USER_CHOICE=
:: 6. Menu Interaktif dengan Auto-Start 10 Detik
echo =====================================================================
echo           SANTAPOS - Multi-Tenant Restaurant POS and SaaS
echo                     All-in-One Unified Launcher
echo =====================================================================
echo.
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
    set CLI_MODE=1
    set USER_CHOICE=%1
    goto process_choice
)

choice /C 1234560 /D 1 /T 10 /M "Pilih opsi [1-6] (Otomatis menjalankan Opsi 1 dalam 10 detik): "
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
goto prompt_next_action

:run_web
echo.
echo =====================================================================
echo   Menjalankan FRONTEND SAJA pada http://localhost:3000...
echo   Tekan Ctrl + C untuk menghentikan server.
echo =====================================================================
echo.
call pnpm dev:web
goto prompt_next_action

:run_api
echo.
echo =====================================================================
echo   Menjalankan BACKEND API SAJA pada http://localhost:5000/api...
echo   Tekan Ctrl + C untuk menghentikan server.
echo =====================================================================
echo.
call pnpm dev:api
goto prompt_next_action

:run_setup
echo.
echo =====================================================================
echo   Menjalankan Install Ulang Dependencies dan Build Shared...
echo =====================================================================
echo.
call pnpm install
call pnpm build
goto prompt_next_action

:run_build
echo.
echo =====================================================================
echo   Menjalankan Verifikasi Production Build...
echo =====================================================================
echo.
call pnpm build
goto prompt_next_action

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
goto prompt_next_action

:prompt_next_action
if not "%CLI_MODE%"=="" exit /b 0

echo.
echo =====================================================================
echo   PILIH TINDAKAN SELANJUTNYA:
echo =====================================================================
echo   [1] Jalankan Semua Aplikasi (Frontend + Backend)  [DEFAULT]
echo   [2] Kembali ke Menu Utama
echo   [0] Keluar dari Launcher
echo =====================================================================
echo.

choice /C 120 /D 1 /T 10 /M "Pilih opsi [1, 2, 0] (Otomatis opsi 1 dalam 10 detik): "
set NEXT_CHOICE=%ERRORLEVEL%

if "%NEXT_CHOICE%"=="1" goto run_all
if "%NEXT_CHOICE%"=="2" goto back_to_menu
if "%NEXT_CHOICE%"=="3" goto exit_launcher
if "%NEXT_CHOICE%"=="0" goto exit_launcher
goto exit_launcher

:back_to_menu
cls
goto show_menu

:exit_launcher
echo.
echo Keluar dari launcher. Sampai jumpa!
exit /b 0
