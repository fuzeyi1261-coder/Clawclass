const { app, BrowserWindow, Tray, Menu, ipcMain, screen, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow = null;
let floatWindow = null;
let panelWindow = null;
let tray = null;
let apiServer = null;
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

// 创建悬浮球窗口
function createFloatWindow() {
  const floatSize = 60;
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  floatWindow = new BrowserWindow({
    width: floatSize,
    height: floatSize,
    x: screenWidth - floatSize - 20,
    y: screenHeight / 2 - floatSize / 2,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    floatWindow.loadURL('http://localhost:5173/float.html');
  } else {
    floatWindow.loadFile(path.join(__dirname, '../dist/float.html'));
  }

  floatWindow.once('ready-to-show', () => {
    floatWindow.show();
  });

  floatWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
    }
  });
}

// 创建快速操作面板窗口
function createPanelWindow() {
  panelWindow = new BrowserWindow({
    width: 380,
    height: 520,
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

  if (isDev) {
    panelWindow.loadURL('http://localhost:5173/panel.html');
    panelWindow.webContents.openDevTools({ mode: 'detach' });
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

  apiServer = fork(apiPath, [], { stdio: 'inherit' });

  apiServer.on('error', (err) => {
    console.error('API Server error:', err);
  });

  apiServer.on('exit', (code, signal) => {
    console.log(`API Server exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
      console.error('API Server crashed, restarting...');
      setTimeout(() => startApiServer(), 1000);
    }
  });

  // 等待服务器启动
  setTimeout(() => {
    console.log('API Server started');
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

  // 悬浮球相关
  ipcMain.on('float-click', () => {
    console.log('Float click received');
    console.log('panelWindow exists:', !!panelWindow);
    console.log('floatWindow exists:', !!floatWindow);

    if (panelWindow && floatWindow) {
      const [floatX, floatY] = floatWindow.getPosition();
      const floatSize = 60;

      console.log('Float position:', floatX, floatY);
      console.log('Panel position:', floatX + floatSize + 10, floatY);

      // 在悬浮球右侧显示面板
      panelWindow.setPosition(floatX + floatSize + 10, floatY);
      panelWindow.show();
      console.log('Panel shown');

      // 发送 panel-show 事件给面板
      if (panelWindow.webContents) {
        panelWindow.webContents.send('panel-show');
      }
      panelWindow.focus();
    }
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
  createFloatWindow();
  createPanelWindow();
  createWindow();
  createTray();
  setupIpc();
  startApiServer();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatWindow();
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
  if (floatWindow && !floatWindow.isDestroyed()) {
    floatWindow.close();
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
