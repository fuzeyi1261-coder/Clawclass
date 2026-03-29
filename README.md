# 课堂加分器 🎓

一款悬浮球式的课堂实时加减分工具，让老师在上课时无需切换页面，5秒内完成给学生或小组的加分/扣分操作。

## 功能特性

- 🎯 **悬浮球设计** - 始终悬浮在屏幕边缘，点击展开操作盘
- ⚡ **极速加减分** - 3步/5秒完成加分操作
- 📊 **实时排行榜** - 学生/小组排行，金/银/铜高亮
- 👥 **学生/小组管理** - 完整的增删改查功能
- 🔌 **RESTful API** - 支持第三方接入
- 💾 **本地数据存储** - SQLite数据库持久化

## 技术栈

- **桌面框架**: Electron 28
- **前端**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **后端**: Express.js
- **数据存储**: JSON文件

## 快速开始

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产构建

```bash
# 构建macOS应用
npm run dist:mac

# 构建Windows应用
npm run dist:win
```

## 使用说明

### 首次使用 - 数据初始化

**重要**：首次使用时需要先初始化班级数据，否则主窗口无法显示人员名单。

初始化方法：
1. 打开主窗口，点击"设置"标签页
2. 滚动到底部，点击"初始化班级数据"按钮
3. 确认后系统将自动添加 6 个小组和 33 名学生

或者在任意功能页面（加分、排行、学生）的空状态提示中点击"初始化班级数据"按钮。

详细说明请查看 [数据初始化说明.md](./数据初始化说明.md)

### 加分流程

1. 点击悬浮球打开主窗口
2. 选择"学生"或"小组"标签
3. 点击目标学生/小组
4. 点击分值按钮（+1/+3/+5/+10）
5. 确认完成

### 快捷键

- `Ctrl+Shift+S` (Windows) / `Cmd+Shift+S` (Mac): 快速显示/隐藏窗口

### API接口

```
GET  /api/students       # 获取学生列表
POST /api/students       # 添加学生
GET  /api/groups         # 获取小组列表
POST /api/score/add      # 加分
POST /api/score/subtract # 扣分
GET  /api/ranking        # 获取排行榜
```

API地址: http://localhost:3001

## 项目结构

```
Claw/
├── electron/           # Electron主进程
│   ├── main.js        # 主窗口、托盘
│   ├── preload.js     # 预加载脚本
│   └── api-server.js  # API服务器
├── src/               # React前端
│   ├── components/    # UI组件
│   ├── store/         # 状态管理
│   └── App.tsx       # 主应用
├── dist/              # 前端构建产物
└── release/           # 应用打包输出
```

## 许可证

MIT
