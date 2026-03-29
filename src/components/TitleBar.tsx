import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, Check } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      moveWindow: (x: number, y: number) => void;
    };
  }
}

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const copyApiInfo = async () => {
    const info = `API地址: http://localhost:3001\nAPI密钥: ${localStorage.getItem('apiKey') || '未设置'}`;
    await navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-10 flex items-center justify-between px-3 bg-bg-secondary border-b border-border drag-region">
      {/* 左侧标题 */}
      <div className="flex items-center gap-2 no-drag">
        <span className="text-lg">🎓</span>
        <span className="text-sm font-semibold text-text-primary">课堂加分器</span>
      </div>

      {/* 中间API信息 */}
      <div className="flex items-center gap-2 no-drag">
        <button
          onClick={copyApiInfo}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-card rounded transition-colors"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          <span>API</span>
        </button>
      </div>

      {/* 窗口控制 */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary"
        >
          <Square size={14} />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-danger transition-colors text-text-secondary hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
