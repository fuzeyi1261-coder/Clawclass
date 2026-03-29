const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'electron');
const destDir = path.join(__dirname, '..', 'dist-electron');

// 创建目标目录
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 复制Electron文件
const files = ['main.js', 'preload.js', 'api-server.js'];
files.forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

// 复制HTML文件
const htmlFiles = ['float.html', 'panel.html'];
htmlFiles.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(__dirname, '..', 'dist', file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

console.log('Electron files copied successfully!');
