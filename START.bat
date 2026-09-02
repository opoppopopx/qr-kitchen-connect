@echo off
chcp 65001 >nul
title TableOrder - Dev Server
cd /d "%~dp0"

echo ========================================
echo   TableOrder - เริ่มระบบสำหรับนักพัฒนา
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [x] ไม่พบ Node.js
  echo     ติดตั้งก่อนที่ https://nodejs.org  (เลือกเวอร์ชัน LTS)
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    echo [i] ไม่พบไฟล์ .env - คัดลอกจาก .env.example ให้แล้ว
    copy /y ".env.example" ".env" >nul
  )
)

if not exist "node_modules" (
  echo [1/2] ติดตั้งแพ็กเกจครั้งแรก ^(ใช้เวลาสักครู่^)...
  call npm install
  if errorlevel 1 (
    echo [x] ติดตั้งไม่สำเร็จ
    pause
    exit /b 1
  )
) else (
  echo [1/2] แพ็กเกจพร้อมใช้งานแล้ว
)

echo [2/2] เปิดเว็บที่ http://localhost:8080
start "" http://localhost:8080
echo.
echo ปิดหน้าต่างนี้หรือกด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์
echo.
call npm run dev

pause
