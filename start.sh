#!/usr/bin/env bash
# TableOrder – one-command dev start (macOS / Linux)
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[x] ไม่พบ Node.js — ติดตั้งจาก https://nodejs.org (LTS)"
  exit 1
fi

[ -f .env ] || { [ -f .env.example ] && cp .env.example .env && echo "[i] สร้าง .env จาก .env.example แล้ว"; }

if [ ! -d node_modules ]; then
  echo "[1/2] ติดตั้งแพ็กเกจครั้งแรก..."
  npm install
else
  echo "[1/2] แพ็กเกจพร้อมใช้งานแล้ว"
fi

echo "[2/2] เปิดเว็บที่ http://localhost:8080"
npm run dev
