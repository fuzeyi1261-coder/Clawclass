const { app, BrowserWindow, Tray, Menu, ipcMain, screen, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow = null;
let floatLeftWindow = null;  // 左侧悬浮球
let floatRightWindow = null; // 右侧悬浮球
let panelWindow = null;
let coverWindow = null;       // 全屏遮罩窗口
let tray = null;
let apiServer = null;
let isCoverModeActive = false;
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

  // 悬浮球配置
const FLOAT_SIZE = 50;  // 正方形大小
const FLOAT_MARGIN = 10; // 通用间距
const FLOAT_MARGIN_LEFT = 100; // 左侧悬浮球距离屏幕边缘
const FLOAT_MARGIN_RIGHT = 8;  // 右侧悬浮球距离屏幕边缘
const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 400;
const FLOAT_Y_OFFSET = 100; // 距离屏幕底部的距离（往上一点点）

// 创建悬浮球窗口（两个）
function createFloatWindows() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const floatY = screenHeight - FLOAT_MARGIN - FLOAT_SIZE - FLOAT_Y_OFFSET;

  // 左侧悬浮球（右侧圆角）
  floatLeftWindow = new BrowserWindow({
    width: FLOAT_SIZE,
    height: FLOAT_SIZE,
    x: FLOAT_MARGIN,
    y: floatY,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    movable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // macOS: 限制在当前桌面
  if (process.platform === 'darwin') {
    floatLeftWindow.setVisibleOnAllWorkspaces(false);
    floatLeftWindow.setWindowButtonVisibility(false);
  }

  // Windows: 设置为最高层级以保持在PPT等全屏应用上方
  if (process.platform === 'win32') {
    // 使用 screen-saver 层级，这是 Windows 上的最高层级
    floatLeftWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  // 右侧悬浮球（左侧圆角）
  floatRightWindow = new BrowserWindow({
    width: FLOAT_SIZE,
    height: FLOAT_SIZE,
    x: screenWidth - FLOAT_MARGIN_RIGHT - FLOAT_SIZE,
    y: floatY,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    movable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // macOS: 限制在当前桌面
  if (process.platform === 'darwin') {
    floatRightWindow.setVisibleOnAllWorkspaces(false);
    floatRightWindow.setWindowButtonVisibility(false);
  }

  // Windows: 设置为最高层级以保持在PPT等全屏应用上方
  if (process.platform === 'win32') {
    floatRightWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  if (isDev) {
    floatLeftWindow.loadURL('http://localhost:5173/float.html?side=left');
    floatRightWindow.loadURL('http://localhost:5173/float.html?side=right');
  } else {
    floatLeftWindow.loadFile(path.join(__dirname, '../dist/float.html'));
    floatRightWindow.loadFile(path.join(__dirname, '../dist/float.html'));
  }

  floatLeftWindow.once('ready-to-show', () => {
    floatLeftWindow.show();
    // Windows: 显示后再次设置置顶
    if (process.platform === 'win32') {
      floatLeftWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  floatRightWindow.once('ready-to-show', () => {
    floatRightWindow.show();
    // Windows: 显示后再次设置置顶
    if (process.platform === 'win32') {
      floatRightWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  floatLeftWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
    }
  });

  floatRightWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
    }
  });
}

// 创建快速操作面板窗口
function createPanelWindow() {
  panelWindow = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // macOS: 限制在当前桌面
  if (process.platform === 'darwin') {
    panelWindow.setVisibleOnAllWorkspaces(false);
  }

  // Windows: 设置为最高层级以保持在PPT等全屏应用上方
  if (process.platform === 'win32') {
    panelWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  if (isDev) {
    panelWindow.loadURL('http://localhost:5173/panel.html');
  } else {
    panelWindow.loadFile(path.join(__dirname, '../dist/panel.html'));
  }

  panelWindow.on('blur', () => {
    panelWindow.hide();
  });

  panelWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      panelWindow.hide();
    }
  });
}

// 创建全屏遮罩窗口
function createCoverWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().bounds;

  coverWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    x: 0,
    y: 0,
    frame: false,
    transparent: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    fullscreenable: false, // 禁止全屏切换
    show: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // macOS: 限制在当前桌面
  if (process.platform === 'darwin') {
    coverWindow.setVisibleOnAllWorkspaces(false);
  }

  // macOS: 设置为最高层级（仅在需要时激活）
  if (process.platform === 'darwin') {
    // 默认不设置为 screen-saver，只有在激活遮罩时才设置
  }

  if (isDev) {
    coverWindow.loadURL('http://localhost:5173/cover.html');
  } else {
    coverWindow.loadFile(path.join(__dirname, '../dist/cover.html'));
  }

  coverWindow.on('close', (event) => {
    if (isCoverModeActive) {
      event.preventDefault();
    }
  });

  coverWindow.on('closed', () => {
    coverWindow = null;
  });
}

// 显示/隐藏遮罩窗口
function showCoverWindow(message, subMessage = '', duration = 0) {
  if (!coverWindow) return;

  coverWindow.webContents.send('cover-show', { message, subMessage, duration });

  // macOS: 只有在激活遮罩时才设置为最高层级
  if (process.platform === 'darwin') {
    coverWindow.setLevel('screen-saver');
  }

  coverWindow.show();
  coverWindow.focus();
  isCoverModeActive = true;
}

function hideCoverWindow() {
  if (!coverWindow || coverWindow.isDestroyed()) return;

  // 标记为非活跃状态，允许关闭
  isCoverModeActive = false;

  // macOS: 恢复为正常层级
  if (process.platform === 'darwin') {
    coverWindow.setLevel('normal');
  }

  // 如果在全屏模式，先退出
  if (coverWindow.isFullScreen()) {
    coverWindow.setFullScreen(false);
    // 延迟1秒确保全屏退出完成
    setTimeout(() => {
      coverWindow.hide();
      showMainWindow();
    }, 1000);
  } else {
    coverWindow.hide();
    showMainWindow();
  }
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

// 创建主窗口
function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 360,
    minHeight: 500,
    x: screenWidth - 440,
    y: Math.floor((screenHeight - 680) / 2),
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: false,
    alwaysOnTop: true,
    show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        preload: path.join(__dirname, 'preload.js'),
      },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建系统托盘
function createTray() {
  const iconSize = 16;
  const icon = nativeImage.createEmpty();

  // 创建一个简单的图标
  const canvas = Buffer.alloc(iconSize * iconSize * 4);
  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      const idx = (y * iconSize + x) * 4;
      const cx = iconSize / 2, cy = iconSize / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < iconSize / 2 - 1) {
        canvas[idx] = 99;     // R
        canvas[idx + 1] = 102; // G
        canvas[idx + 2] = 241; // B
        canvas[idx + 3] = 255; // A
      } else {
        canvas[idx + 3] = 0; // transparent
      }
    }
  }

  const trayIcon = nativeImage.createFromBuffer(canvas, { width: iconSize, height: iconSize });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '隐藏窗口',
      click: () => {
        if (mainWindow) mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('班级积分系统');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// 启动API服务器
function startApiServer() {
  const apiPath = path.join(__dirname, 'api-server.js');

  console.log('Starting API server from:', apiPath);

  apiServer = fork(apiPath, [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    detached: false
  });

  // 监听服务器输出，使用 try-catch 防止 EPIPE
  apiServer.stdout?.on('data', (data) => {
    try {
      process.stdout.write('[API Server] ' + data.toString().trim() + '\n');
    } catch (e) {}
  });
  apiServer.stderr?.on('data', (data) => {
    try {
      process.stderr.write('[API Server Error] ' + data.toString().trim() + '\n');
    } catch (e) {}
  });

  apiServer.on('exit', (code, signal) => {
    console.log(`API Server exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
      console.error('API Server crashed, restarting...');
      setTimeout(() => startApiServer(), 1000);
    }
  });

  // 等待服务器启动
  const startupTimeout = setTimeout(() => {
    try {
      if (apiServer && !apiServer.killed && apiServer.exitCode === null) {
        console.log('API Server started');
      }
    } catch (e) {
      // 忽略启动检查中的错误
    }
  }, 2000);
}

// IPC处理
function setupIpc() {
  // 窗口控制
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.hide();
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // 悬浮球相关 - 根据点击的悬浮球决定弹窗位置
  ipcMain.on('float-click', (event, side) => {
    console.log('Float click received from:', side);

    if (!panelWindow) return;

    // 隐藏已显示的弹窗
    if (panelWindow.isVisible()) {
      panelWindow.hide();
      return;
    }

    const floatY = screen.getPrimaryDisplay().workAreaSize.height - FLOAT_MARGIN - FLOAT_SIZE - FLOAT_Y_OFFSET;
    let panelX, panelY;

    if (side === 'left') {
      // 左侧按钮：弹窗在左边打开，底部对齐
      // 弹窗右侧与按钮左侧对齐
      panelX = FLOAT_MARGIN_LEFT + FLOAT_SIZE + 10;
      panelY = floatY + FLOAT_SIZE - PANEL_HEIGHT; // 底部对齐
    } else {
      // 右侧按钮：弹窗在右边打开，底部对齐
      // 弹窗左侧与按钮右侧对齐
      const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
      panelX = screenWidth - FLOAT_MARGIN_RIGHT - FLOAT_SIZE - PANEL_WIDTH - 10;
      panelY = floatY + FLOAT_SIZE - PANEL_HEIGHT; // 底部对齐
    }

    // 确保弹窗不会超出屏幕
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    panelX = Math.max(0, Math.min(panelX, screenWidth - PANEL_WIDTH));
    panelY = Math.max(0, Math.min(panelY, screenHeight - PANEL_HEIGHT));

    console.log('Panel will show at:', panelX, panelY);

    // Windows: 显示前重新设置置顶层级
    if (process.platform === 'win32') {
      panelWindow.setAlwaysOnTop(true, 'screen-saver');
    }

    panelWindow.setPosition(panelX, panelY);
    panelWindow.show();

    // 发送 panel-show 事件给面板
    if (panelWindow.webContents) {
      panelWindow.webContents.send('panel-show');
    }
    panelWindow.focus();
  });

  ipcMain.on('panel-hide', () => {
    if (panelWindow) {
      panelWindow.hide();
    }
  });

  // 拖拽窗口
  ipcMain.on('start-drag', () => {
    // 桌面端拖拽由CSS处理
  });

  // 移动窗口
  ipcMain.on('move-window', (event, x, y) => {
    if (mainWindow) {
      const [currentX, currentY] = mainWindow.getPosition();
      mainWindow.setPosition(currentX + x, currentY + y);
    }
  });

  // 遮罩窗口控制
  ipcMain.on('cover-show', (event, { message, subMessage, duration }) => {
    showCoverWindow(message, subMessage, duration);
  });

  ipcMain.on('cover-hide', () => {
    hideCoverWindow();
  });

  ipcMain.on('cover-homework', (event, homeworks) => {
    if (coverWindow) {
      coverWindow.webContents.send('cover-homework', homeworks);

      // macOS: 设置为最高层级
      if (process.platform === 'darwin') {
        coverWindow.setLevel('screen-saver');
      }

      coverWindow.show();
      coverWindow.focus();
      isCoverModeActive = true;
    }
  });

  ipcMain.handle('cover-verify-password', (event, password) => {
    // 密码验证：mozi806
    if (password === 'mozi806') {
      hideCoverWindow();
      return { success: true };
    }
    return { success: false, error: '密码错误' };
  });

  ipcMain.on('cover-unlock', () => {
    hideCoverWindow();
  });
}

// 注册全局快捷键
function registerShortcuts() {
  // Ctrl+Shift+S 快速显示/隐藏
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  createFloatWindows();
  createPanelWindow();
  createCoverWindow();
  createWindow();
  createTray();
  setupIpc();
  startApiServer();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatWindows();
      createPanelWindow();
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// 退出前清理
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (apiServer) {
    apiServer.kill();
  }
  if (floatLeftWindow && !floatLeftWindow.isDestroyed()) {
    floatLeftWindow.close();
  }
  if (floatRightWindow && !floatRightWindow.isDestroyed()) {
    floatRightWindow.close();
  }
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
