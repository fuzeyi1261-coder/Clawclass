#!/bin/bash

# 修复依赖问题脚本

echo "开始修复依赖..."

# 删除 node_modules 和 lock 文件
echo "删除旧的依赖..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf dist

# 清理 npm 缓存
echo "清理 npm 缓存..."
npm cache clean --force

# 安装依赖
echo "安装依赖..."
npm install

# 验证安装
echo "验证安装..."
if [ -d "node_modules" ]; then
    echo "✅ 依赖安装成功！"
    echo "现在可以运行: npm run build"
else
    echo "❌ 依赖安装失败"
    exit 1
fi
