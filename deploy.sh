#!/bin/bash
# 一键部署脚本 - 在 Linux 服务器上运行
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=== Fashion Agent 部署 ==="

# 1. 检查 .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "[!] 请编辑 $BACKEND_DIR/.env 填入 ANTHROPIC_API_KEY，然后重新运行此脚本"
  exit 1
fi

# 2. 安装后端依赖
echo "[1/3] 安装 Python 依赖..."
cd "$BACKEND_DIR"
pip install -r requirements.txt -q

# 3. 构建前端
echo "[2/3] 构建前端..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build

# 4. 启动后端（前台运行，可配合 systemd 或 screen 使用）
echo "[3/3] 启动后端服务..."
cd "$BACKEND_DIR"
echo "访问地址: http://$(hostname -I | awk '{print $1}'):8000"
python main.py
