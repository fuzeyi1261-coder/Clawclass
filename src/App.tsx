import { useState, useEffect } from 'react';
import { useAppStore } from './store/appStore';
import TitleBar from './components/TitleBar';
import ScorePanel from './components/ScorePanel';
import RankingList from './components/RankingList';
import StudentManager from './components/StudentManager';
import Settings from './components/Settings';
import FloatingScore from './components/FloatingScore';
import WeeklySettlement from './components/WeeklySettlement';
import { CoverController } from './components/CoverController';

// 检查是否为Electron环境
const isElectron = typeof window !== 'undefined' && window.require !== undefined;

type Tab = 'score' | 'ranking' | 'settlement' | 'students' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('score');
  const { floatingScores, loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Electron IPC调用
  const handleCoverShow = (message: string, subMessage?: string, duration?: number) => {
    if (isElectron) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('cover-show', { message, subMessage, duration });
    }
  };

  const handleCoverHide = () => {
    if (isElectron) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('cover-hide');
    }
  };

  const handleCoverHomework = (homeworks: Array<{ subject: string; content: string }>) => {
    if (isElectron) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('cover-homework', homeworks);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary rounded-2xl overflow-hidden shadow-2xl border border-border">
      <TitleBar />

      {/* 标签栏 */}
      <div className="flex border-b border-border bg-bg-secondary">
        <TabButton
          active={activeTab === 'score'}
          onClick={() => setActiveTab('score')}
          icon="⚡"
          label="加分"
        />
        <TabButton
          active={activeTab === 'ranking'}
          onClick={() => setActiveTab('ranking')}
          icon="🏆"
          label="排行"
        />
        <TabButton
          active={activeTab === 'settlement'}
          onClick={() => setActiveTab('settlement')}
          icon="📊"
          label="周清算"
        />
        <TabButton
          active={activeTab === 'students'}
          onClick={() => setActiveTab('students')}
          icon="👥"
          label="学生"
        />
        <TabButton
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          icon="⚙️"
          label="设置"
        />
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'score' && <ScorePanel />}
        {activeTab === 'ranking' && <RankingList />}
        {activeTab === 'settlement' && <WeeklySettlement />}
        {activeTab === 'students' && <StudentManager />}
        {activeTab === 'settings' && <Settings />}
      </div>

      {/* 浮动分数动画 */}
      {floatingScores.map((score) => (
        <FloatingScore key={score.id} {...score} />
      ))}

      {/* 遮罩控制器（仅Electron环境） */}
      {isElectron && (
        <CoverController
          onCoverShow={handleCoverShow}
          onCoverHide={handleCoverHide}
          onCoverHomework={handleCoverHomework}
        />
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 relative ${
        active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      {active && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

export default App;
