# 班级积分系统 - 使用说明

## 启动应用

### 开发模式

```bash
npm run dev
```

这将同时启动:
1. Vite 开发服务器 (前端)
2. Electron 应用 (桌面应用)
3. API 服务器 (后端数据存储)

### 测试 API 连接

```bash
npm run test:api
```

## 功能说明

### 1. 主窗口 (积分管理)
- **加分标签页**: 查看小组和学生,进行加减分操作
- **排行标签页**: 查看学生和小组的积分排名
- **周清算标签页**: 清算本周积分,重置为0
- **学生标签页**: 管理学生信息(添加/编辑/删除)
- **设置标签页**: 配置应用设置

### 2. 悬浮球 (快速操作)
- 点击悬浮球打开快速操作面板
- 在面板中快速选择小组或学生进行加减分
- 支持随机抽人功能

### 3. 系统托盘
- 右键托盘图标可以显示/隐藏窗口
- 点击托盘图标切换窗口显示状态

## API 服务器

API 服务器运行在 `http://localhost:3001`,提供以下端点:

### 数据获取
- `GET /api/students` - 获取学生列表
- `GET /api/groups` - 获取小组列表(包含动态计算的分数)
- `GET /api/rules` - 获取积分规则
- `GET /api/settings` - 获取应用设置
- `GET /api/scores` - 获取积分记录

### 数据操作
- `POST /api/students` - 添加学生
- `PUT /api/students/:id` - 更新学生
- `DELETE /api/students/:id` - 删除学生
- `POST /api/groups` - 添加小组
- `PUT /api/groups/:id` - 更新小组
- `DELETE /api/groups/:id` - 删除小组
- `POST /api/score/add` - 加分
- `POST /api/score/subtract` - 扣分

## 数据存储

数据存储在 `data/database.json` 文件中,包含:
- 学生数据 (students)
- 小组数据 (groups)
- 积分规则 (rules)
- 积分记录 (scores)
- 应用设置 (settings)

## 小组分数计算

小组分数 = 组内所有成员的分数之和

小组分数是动态计算的,不会单独存储。每次查询 `/api/groups` 时会实时计算小组的分数。

## 故障排查

### API 连接失败 (ERR_CONNECTION_REFUSED)

**问题**: 应用启动时显示 API 连接失败错误

**解决方案**:
1. 确认使用 `npm run dev` 启动应用
2. 检查端口 3001 是否被其他程序占用
3. 查看 Electron 控制台日志(按 F12)
4. 运行 `npm run test:api` 测试 API 连接

### 数据未同步

**问题**: 网页版和应用程序数据不一致

**解决方案**:
1. 确保 API 服务器正在运行
2. 重新加载应用数据
3. 检查 `data/database.json` 文件是否存在

### 页面崩溃或渲染异常

**问题**: 点击某些按钮时应用崩溃

**解决方案**:
1. 打开开发者工具查看错误日志
2. 检查浏览器控制台是否有 JavaScript 错误
3. 尝试重新启动应用

## 键盘快捷键

- `Cmd/Ctrl + Shift + S`: 显示/隐藏主窗口
- `Escape`: 关闭面板或返回上一级

## 初始数据

应用内置了 6 个小组和 33 名学生的初始数据:
- 一组 (6人)
- 二组 (5人)
- 三组 (5人)
- 四组 (5人)
- 五组 (6人)
- 六组 (6人)

可以通过主窗口的"学生"标签页或快速操作面板的"+"按钮添加这些初始数据。

## 安全提示

警告: 应用在开发模式下禁用了 `webSecurity` 和 `allowRunningInsecureContent`,这些设置会在打包后自动启用,以提高安全性。
