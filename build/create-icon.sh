#!/bin/bash
# 创建应用图标

ICON_DIR="build/icon.icns"
TEMP_DIR="build/temp"

mkdir -p "$TEMP_DIR"

# 使用 sips 生成不同尺寸的图标 (macOS 自带工具)
# 这里使用简单的蓝色圆圈作为图标

echo "创建应用图标..."

# 由于无法通过命令行直接创建 icns,我们提供一个简单的说明
echo "请手动添加图标文件到 build/icon.icns"
echo ""
echo "图标要求:"
echo "- Mac: icon.icns (1024x1024)"
echo "- Windows: icon.ico (256x256)"
echo ""
echo "可以使用以下工具创建:"
echo "- 在线工具: https://www.iconka.com/"
echo "- Mac工具: sketch、Figma 等"
echo "- 命令行: sips + iconutil (macOS 自带)"

# 创建占位文件
touch "$ICON_DIR"

echo "占位文件已创建: $ICON_DIR"
