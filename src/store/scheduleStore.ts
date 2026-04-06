import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ScheduleItem {
  weekday: number;
  period: number;
  subject: string;
  start_time?: string;
  end_time?: string;
}

interface CoverConfig {
  enabled: boolean;
  password: string;
  nextClassInfo: boolean;
  homeworkDisplay: boolean;
}

interface ScheduleStore {
  schedule: ScheduleItem[];
  coverConfig: CoverConfig;
  isClassTime: boolean;
  currentClass: ScheduleItem | null;
  nextClass: ScheduleItem | null;
  homeworkList: Array<{ subject: string; title: string; content: string }>;
  
  // 方法
  loadSchedule: () => Promise<void>;
  setCoverConfig: (config: Partial<CoverConfig>) => void;
  checkCurrentTime: () => void;
  loadHomeworks: () => Promise<void>;
}

const getApiBase = () => {
  // 优先使用远程服务器
  return 'http://mozi.zd2025.com:3001';
};

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedule: [],
  coverConfig: {
    enabled: true,
    password: 'mozi806',
    nextClassInfo: true,
    homeworkDisplay: true,
  },
  isClassTime: false,
  currentClass: null,
  nextClass: null,
  homeworkList: [],

  loadSchedule: async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/schedule`);
      const data = await res.json();
      set({ schedule: data });
      get().checkCurrentTime();
    } catch (error) {
      console.error('加载课表失败:', error);
    }
  },

  setCoverConfig: (config) => {
    set((state) => ({
      coverConfig: { ...state.coverConfig, ...config }
    }));
  },

  checkCurrentTime: () => {
    const { schedule } = get();
    const now = new Date();
    const weekday = now.getDay(); // 0=周日, 1=周一...
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // 查找当前正在上的课
    const currentLesson = schedule.find(item => {
      if (item.weekday !== weekday) return false;
      if (!item.start_time || !item.end_time) return false;
      
      const [startH, startM] = item.start_time.split(':').map(Number);
      const [endH, endM] = item.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      return currentTime >= startMinutes && currentTime < endMinutes;
    });

    // 查找下一节课
    let nextLesson = null;
    const todaySchedule = schedule
      .filter(item => item.weekday === weekday)
      .sort((a, b) => a.period - b.period);
    
    for (const item of todaySchedule) {
      if (!item.start_time) continue;
      const [startH, startM] = item.start_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      
      if (startMinutes > currentTime) {
        nextLesson = item;
        break;
      }
    }

    const isClassTime = !!currentLesson;
    
    set({
      isClassTime,
      currentClass: currentLesson || null,
      nextClass: nextLesson || null,
    });
  },

  loadHomeworks: async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/homeworks`);
      const data = await res.json();
      set({ homeworkList: data });
    } catch (error) {
      console.error('加载作业失败:', error);
    }
  },
}));

// 启动定时检查
let checkInterval: number | null = null;

export function startScheduleCheck() {
  if (checkInterval) return;
  
  const store = useScheduleStore.getState();
  store.loadSchedule();
  store.loadHomeworks();
  
  // 每分钟检查一次
  checkInterval = window.setInterval(() => {
    const state = useScheduleStore.getState();
    state.checkCurrentTime();
  }, 60000);
}

export function stopScheduleCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
