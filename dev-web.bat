@echo off
title Santapos Web (Frontend Only)
cls

echo =====================================================================
echo         SANTAPOS - Web Frontend (Next.js 16 + Turbopack)
echo =====================================================================
echo.

where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm tidak ditemukan! Silakan install: npm install -g pnpm
    pause
    exit /b 1
)

if not exist "packages\shared\dist\index.js" (
    echo [INFO] Membangun package @santapos/shared...
    call pnpm --filter @santapos/shared build
)

echo Menjalankan Web Frontend pada http://localhost:3000...
echo.
call pnpm dev:web
pause
