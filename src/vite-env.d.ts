/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    startDrag: () => void;
    moveWindow: (x: number, y: number) => void;
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
  };
}
