@echo off
title Santapos Monorepo - Build Verification
cls

echo =====================================================================
echo         SANTAPOS - Production Build Verification
echo =====================================================================
echo.

where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm tidak ditemukan! Silakan install: npm install -g pnpm
    pause
    exit /b 1
)

echo Menjalankan 'pnpm build' untuk seluruh 5 packages...
echo.
call pnpm build

if %ERRORLEVEL% equ 0 (
    echo.
    echo =====================================================================
    echo   [BERHASIL] Seluruh package dan 26 halaman Next.js berhasil di-build!
    echo =====================================================================
) else (
    echo.
    echo [GAGAL] Terjadi kesalahan saat build. Periksa pesan error di atas.
)

echo.
pause
