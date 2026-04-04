# 班级积分系统 - 部署指南

## 📁 项目结构

```
Clawclass/
├── server/                 # API 服务器
│   ├── index.js           # 主入口
│   ├── database.js        # 数据库初始化
│   ├── routes/            # API 路由
│   │   ├── auth.js        # 认证
│   │   ├── homeworks.js   # 作业管理
│   │   ├── scores.js      # 积分管理
│   │   ├── schedule.js    # 课表管理
│   │   └── students.js    # 学生管理
│   └── public/            # 前端页面
│       ├── teacher.html   # 教师端
│       └── student.html   # 学生端
│
├── electron/              # Electron 主进程
│   ├── main.js           # 主窗口管理
│   ├── preload.js        # 预加载脚本
│   └── api-server.js     # 内置 API 服务器
│
├── float.html            # 悬浮球窗口
├── panel.html           # 快速操作面板
└── src/                 # React 前端源码
```

---

## 🚀 服务器部署（云服务器）

### 1. 环境要求
- Node.js 18+
- Linux 服务器（CentOS/Ubuntu/Debian）
- 端口 3000 开放

### 2. 安装步骤

```bash
# 1. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 上传项目到服务器
scp -r ./server user@your-server:/home/user/

# 3. 进入服务器目录
cd /home/user/server

# 4. 安装依赖
npm install

# 5. 启动服务器
npm start

# 6. 保持后台运行（使用 PM2）
npm install -g pm2
pm2 start index.js --name clawclass
pm2 save
pm2 startup
```

### 3. 配置域名（可选）

```nginx
# /etc/nginx/sites-available/clawclass
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 配置 HTTPS（使用 Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 👩‍🏫 教师账号

| 科目 | 账号 | 密码 |
|------|------|------|
| 语文 | 语文 | mozi806847293 |
| 数学 | 数学 | mozi806152847 |
| 英语 | 英语 | mozi806394721 |
| 物理 | 物理 | mozi806582639 |
| 道法 | 道法 | mozi806217894 |
| 历史 | 历史 | mozi806763541 |
| 地理 | 地理 | mozi806428956 |
| 生物 | 生物 | mozi806915326 |
| 美术 | 美术 | mozi806671284 |
| 体育 | 体育 | mozi806349128 |
| 心理 | 心理 | mozi806582917 |
| 信息 | 信息 | mozi806724639 |
| 音乐 | 音乐 | mozi806138572 |

---

## 🌐 访问地址

部署后，访问地址：

- **首页**：`http://your-server:3000/`
- **教师端**：`http://your-server:3000/teacher`
- **学生端**：`http://your-server:3000/student`

---

## 📱 桌面应用配置

修改 `electron/api-server.js`，将 API 地址改为你的服务器地址：

```javascript
const API_BASE = 'http://your-server:3000';
```

---

## 🔧 常用命令

```bash
# 启动服务器
cd server && npm start

# 查看服务器状态
pm2 status

# 查看服务器日志
pm2 logs clawclass

# 重启服务器
pm2 restart clawclass

# 停止服务器
pm2 stop clawclass
```

---

## ⚠️ 注意事项

1. **防火墙**：确保服务器的 3000 端口已开放
2. **数据库**：SQLite 数据库文件位于 `server/data/clawclass.db`
3. **备份**：定期备份数据库文件
4. **安全**：建议使用 HTTPS 访问
