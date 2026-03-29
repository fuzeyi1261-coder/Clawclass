# GitHub Actions 工作流说明

## 可用的工作流

### 1. Windows x86 (32位) 构建
- 文件: `.github/workflows/build-win32.yml`
- 平台: Windows x86 (32位/ia32)
- 触发条件:
  - 推送到 main 分支（相关文件变更时）
  - Pull Request 到 main 分支
  - 手动触发 (workflow_dispatch)

### 2. 本地构建命令

#### Windows x86 (32位)
```bash
npm run dist:win:x86
```

#### Windows x64 (64位)
```bash
npm run dist:win:x64
```

#### macOS
```bash
npm run dist:mac
```

## 已修复的问题

### PostCSS 配置错误
- **问题**: `postcss.config.js` 和 `tailwind.config.js` 使用 ES Module 语法 (`export default`)
- **原因**: 在 Windows GitHub Actions 环境下，Node.js 默认使用 CommonJS 模式
- **解决**: 改为 CommonJS 语法 (`module.exports`)
- **影响**: 解决了 GitHub Actions 构建失败的问题

## 构建产物

安装包会输出到 `release/` 目录：
- **NSIS 安装包**: `班级积分系统 Setup 1.0.0.exe`
- **便携版**: `班级积分系统-便携版-1.0.0.exe`
