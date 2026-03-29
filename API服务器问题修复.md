# API 服务器问题修复说明

## 问题描述

运行应用时出现以下错误：
```
:3001/api/health:1 Failed to load resource: server responded with a status of 404 (Not Found)
API server available: false
```

## 问题原因

API 服务器缺少 `/api/health` 健康检查端点，导致前端无法正确检测服务器状态。

## 解决方案

### 1. 添加健康检查端点

在 `electron/api-server.js` 中添加了健康检查端点：

```javascript
// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 2. 更新构建输出

将更新后的 `api-server.js` 复制到 `dist-electron` 目录。

### 3. 添加测试和启动脚本

- `scripts/test-api-server.js` - API 服务器测试脚本
- `scripts/start-api-server.js` - 独立启动 API 服务器
- `package.json` 添加了相应的 npm 脚本

## 如何使用

### 开发模式

API 服务器会随 Electron 主进程自动启动，无需手动操作。

### 独立测试 API 服务器

如果需要单独测试 API 服务器：

```bash
# 启动 API 服务器
npm run start:api

# 在另一个终端测试 API
npm run test:api
```

### 测试端点

测试脚本会自动测试以下端点：

1. `/api/health` - 健康检查
2. `/api/students` - 获取学生列表
3. `/api/groups` - 获取小组列表
4. `/api/rules` - 获取规则列表
5. `/api/settings` - 获取设置

## 完整的 API 端点列表

### 健康检查
- `GET /api/health` - 检查服务器状态

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 添加学生
- `PUT /api/students/:id` - 更新学生
- `DELETE /api/students/:id` - 删除学生

### 小组管理
- `GET /api/groups` - 获取小组列表（自动计算分数）
- `POST /api/groups` - 添加小组
- `PUT /api/groups/:id` - 更新小组
- `DELETE /api/groups/:id` - 删除小组

### 分数管理
- `POST /api/score/add` - 加分
- `POST /api/score/subtract` - 扣分
- `GET /api/scores` - 获取分数记录

### 排行榜
- `GET /api/ranking` - 获取排行榜
  - 查询参数：`type=student|group`, `period=all|weekly`

### 规则管理
- `GET /api/rules` - 获取规则列表
- `POST /api/rules` - 添加规则
- `PUT /api/rules/:id` - 更新规则
- `DELETE /api/rules/:id` - 删除规则

### 设置管理
- `GET /api/settings` - 获取设置
- `PUT /api/settings` - 更新设置

## 注意事项

1. **端口**：API 服务器运行在 `http://localhost:3001`
2. **数据存储**：数据保存在 `data/database.json`
3. **CORS**：已启用 CORS，支持跨域请求
4. **自动重启**：如果服务器崩溃，会自动重启

## 故障排除

### API 服务器无法启动

1. 检查端口 3001 是否被占用
2. 检查 `data` 目录是否有写权限
3. 查看 Electron 控制台的错误信息

### 健康检查失败

1. 确认 API 服务器正在运行
2. 访问 http://localhost:3001/api/health 检查
3. 如果返回 404，说明没有使用更新后的代码

### 数据无法保存

1. 检查 `data/database.json` 文件权限
2. 确认磁盘空间充足
3. 查看服务器日志了解详细错误
