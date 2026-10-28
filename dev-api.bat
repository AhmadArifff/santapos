@echo off
title Santapos API (Backend Only)
cls

echo =====================================================================
echo         SANTAPOS - Backend REST API (Node.js + Express)
echo =====================================================================
echo.

where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm tidak ditemukan! Silakan install: npm install -g pnpm
    pause
    exit /b 1
)

if not exist "apps\api\.env" (
    if exist ".env.example" (
        echo [INFO] apps\api\.env belum ada. Menyalin dari .env.example...
        copy ".env.example" "apps\api\.env" >nul
    )
)

echo Menjalankan Backend API pada http://localhost:5000/api...
echo.
call pnpm dev:api
pause
