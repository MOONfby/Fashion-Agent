# Fashion Agent

基于 Claude AI 的女性时尚穿搭建议助手，支持多模态输入（文字 + 图片），跨会话记忆用户画像。

## 功能特性

- **多轮对话穿搭咨询** — 描述场合、上传照片，获取个性化搭配建议
- **图片理解** — 上传全身照分析体型肤色，或上传参考图获取相似风格建议
- **用户画像持久化** — 身高、体型、风格偏好等信息跨会话记忆
- **照片分析建档** — 上传照片自动分析并填充用户画像

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TailwindCSS |
| 后端 | Python + FastAPI + SQLAlchemy |
| AI | Claude API（claude-sonnet-4-6，多模态） |
| 数据库 | SQLite |

## 项目结构

```
Fashion Agent/
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 配置（读取 .env）
│   ├── database.py             # SQLite 连接
│   ├── models.py               # 数据库模型
│   ├── schemas.py              # Pydantic 数据结构
│   ├── routers/
│   │   ├── chat.py             # 对话接口
│   │   └── profile.py          # 用户画像接口
│   ├── services/
│   │   ├── claude_service.py   # Claude API 封装
│   │   └── profile_service.py  # 画像业务逻辑
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   └── ProfilePanel.jsx
│   │   └── services/api.js
│   ├── package.json
│   └── vite.config.js
├── deploy.sh                   # 一键部署脚本
├── fashion-agent.service       # systemd 服务文件
└── .env.example
```

## 部署到 Linux 服务器

### 前置条件

- Python 3.10+
- Node.js 18+
- Anthropic API Key（[获取地址](https://console.anthropic.com/)）

### 步骤

**1. 克隆仓库**

```bash
git clone https://github.com/your-username/fashion-agent.git
cd fashion-agent
```

**2. 配置环境变量**

```bash
cp .env.example backend/.env
nano backend/.env
```

填入以下内容：

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**3. 一键部署（构建前端 + 启动后端）**

```bash
chmod +x deploy.sh
./deploy.sh
```

完成后访问 `http://服务器IP:8000`

---

### 后台常驻运行（systemd）

```bash
# 先执行一次 deploy.sh 完成构建，Ctrl+C 退出后继续

# 编辑 service 文件，修改路径和用户名
nano fashion-agent.service

# 安装并启动服务
sudo cp fashion-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable fashion-agent
sudo systemctl start fashion-agent

# 查看状态 / 日志
sudo systemctl status fashion-agent
sudo journalctl -u fashion-agent -f
```

> 如需开放端口：`sudo ufw allow 8000`

---

## 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # 填入 API Key
python main.py             # http://localhost:8000

# 前端（另开终端）
cd frontend
npm install
npm run dev                # http://localhost:5173
```

本地开发时前端通过 Vite proxy 自动转发 `/api` 请求到后端，无需额外配置。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 发送消息（支持图片） |
| GET | `/api/chat/history` | 获取历史对话 |
| DELETE | `/api/chat/history` | 清空历史对话 |
| GET | `/api/profile` | 获取用户画像 |
| PUT | `/api/profile` | 更新用户画像 |
| POST | `/api/profile/analyze-photo` | 上传照片分析体型 |
| GET | `/health` | 健康检查 |

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `ANTHROPIC_API_KEY` | ✅ | — | Claude API 密钥 |
| `DATABASE_URL` | | `sqlite:///./fashion_agent.db` | 数据库路径 |
| `CLAUDE_MODEL` | | `claude-sonnet-4-6` | 使用的模型 |
| `MAX_IMAGE_SIZE_MB` | | `5` | 最大图片大小 |
