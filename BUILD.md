# 打包说明

## Mac 上打包

在 Mac 上打包 Mac 版本:

```bash
npm run dist:mac
```

打包完成后,可执行文件会在 `release/mac-arm64/` 目录下。

## Mac 上打包 Windows 版本

在 Mac 上打包 Windows exe 需要使用 Docker 或 WSL,因为 electron-builder 需要目标平台的本地工具链。

### 方法 1: 使用 Docker (推荐)

1. 安装 Docker
2. 运行:

```bash
# 使用 Docker 打包 Windows 版本
docker run --rm -it \
  -v ${PWD}:/project \
  -w /project \
  electronuserland/builder:wine \
  npm run dist:win
```

### 方法 2: 使用 Windows 电脑

在 Windows 电脑上运行:

```bash
# 安装依赖
npm install

# 打包
npm run dist:win
```

### 方法 3: 手动编译(不推荐)

也可以在 Mac 上编译,但需要安装 Wine 和相关工具链,配置复杂。

## 文件说明

- `dist/` - 前端资源文件 (HTML, CSS, JS)
- `dist-electron/` - Electron 主进程文件
- `release/` - 打包后的可执行文件
  - `mac-arm64/` - Mac 版本 (dmg)
  - `win-arm64-unpacked/` - Windows 未打包版本
  - `*.exe` - Windows 安装程序
  - `*.exe` - Windows 便携版

## 开发运行

```bash
npm run dev
```

## 构建生产版本

```bash
npm run build
```

这会构建前端资源并复制 Electron 文件到 dist-electron。
