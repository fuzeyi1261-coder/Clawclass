import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// 从 localStorage 获取 API 地址，没有则使用默认值（远程服务器）
const getApiBase = () => localStorage.getItem('apiBase') || 'http://43.128.40.126:3001';

// 检查 API 服务器是否可用
async function checkApiServer(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBase()}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2秒超时
    });
    return response.ok;
  } catch (error) {
    console.log('API server not available:', error);
    return false;
  }
}

export interface Student {
  id: string;
  name: string;
  groupId?: string;
  score: number;
  weeklyScore: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  lightColor?: string;
  score?: number;
  weeklyScore?: number;
  createdAt: string;
}

export interface ScoreRule {
  id: string;
  name: string;
  value: number;
  icon: string;
  color: string;
  type: 'add' | 'subtract';
}

export interface ScoreRecord {
  id: string;
  studentId?: string;
  groupId?: string;
  value: number;
  reason: string;
  type: 'add' | 'subtract';
  createdAt: string;
  weekNumber?: number;
}

export interface WeeklySettlement {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  studentScores: Record<string, { weeklyScore: number; totalScore: number; rank: number }>;
  groupScores: Record<string, { weeklyScore: number; totalScore: number; rank: number }>;
  createdAt: string;
}

export interface FloatingScore {
  id: string;
  value: number;
  name: string;
}

interface AppState {
  students: Student[];
  groups: Group[];
  rules: ScoreRule[];
  scores: ScoreRecord[];
  weeklySettlements: WeeklySettlement[];
  currentWeek: number;
  settings: {
    apiKey: string;
    webhookUrl: string;
    theme: string;
  };
  floatingScores: FloatingScore[];
  loading: boolean;

  // Actions
  loadData: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'score' | 'weeklyScore' | 'createdAt'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addGroup: (group: Omit<Group, 'id' | 'score' | 'weeklyScore' | 'createdAt'>) => Promise<void>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addScore: (studentId: string | null, groupId: string | null, value: number, reason?: string) => Promise<void>;
  subtractScore: (studentId: string | null, groupId: string | null, value: number, reason?: string) => Promise<void>;
  addRule: (rule: Omit<ScoreRule, 'id'>) => Promise<void>;
  updateRule: (id: string, data: Partial<ScoreRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppState['settings']>) => Promise<void>;
  addFloatingScore: (value: number, name: string) => void;
  initializeClassData: () => Promise<void>;
  settleWeeklyScores: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  students: [],
  groups: [],
  rules: [],
  scores: [],
  weeklySettlements: [],
  currentWeek: 1,
  settings: {
    apiKey: '',
    webhookUrl: '',
    theme: 'dark',
  },
  floatingScores: [],
  loading: false,

  loadData: async () => {
    set({ loading: true });

    // 首先检查 API 服务器是否可用
    const isApiAvailable = await checkApiServer();
    console.log('API server available:', isApiAvailable);

    try {
      const apiBase = getApiBase();
      const [studentsRes, groupsRes, rulesRes, settingsRes] = await Promise.all([
        fetch(`${apiBase}/api/students`),
        fetch(`${apiBase}/api/groups`),
        fetch(`${apiBase}/api/rules`),
        fetch(`${apiBase}/api/settings`),
      ]);

      // 检查响应状态
      if (!studentsRes.ok || !groupsRes.ok || !rulesRes.ok || !settingsRes.ok) {
        throw new Error('API request failed');
      }

      const [students, groups, rules, settings] = await Promise.all([
        studentsRes.json(),
        groupsRes.json(),
        rulesRes.json(),
        settingsRes.json(),
      ]);

      set({ students, groups, rules, settings, loading: false });
    } catch (error) {
      console.error('Failed to load data:', error);
      // 使用初始化数据作为后备
      console.log('Falling back to initial data');
      set({ loading: false });
    }
  },

  addStudent: async (student) => {
    try {
      const res = await fetch(`${getApiBase()}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      const newStudent = await res.json();
      set((state) => ({ students: [...state.students, newStudent] }));
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  },

  updateStudent: async (id, data) => {
    try {
      const res = await fetch(`${getApiBase()}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updated : s)),
      }));
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  },

  deleteStudent: async (id) => {
    try {
      await fetch(`${getApiBase()}/api/students/${id}`, { method: 'DELETE' });
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  },

  addGroup: async (group) => {
    try {
      const res = await fetch(`${getApiBase()}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group),
      });
      const newGroup = await res.json();
      set((state) => ({ groups: [...state.groups, newGroup] }));
    } catch (error) {
      console.error('Failed to add group:', error);
    }
  },

  updateGroup: async (id, data) => {
    try {
      const res = await fetch(`${getApiBase()}/api/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? updated : g)),
      }));
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  },

  deleteGroup: async (id) => {
    try {
      await fetch(`${getApiBase()}/api/groups/${id}`, { method: 'DELETE' });
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  },

  addScore: async (studentId, groupId, value, reason) => {
    const { students, groups, addFloatingScore } = get();

    try {
      const res = await fetch(`${getApiBase()}/api/score/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, groupId, value, reason }),
      });
      const record = await res.json();

      // 更新本地状态
      if (studentId) {
        const student = students.find((s) => s.id === studentId);
        if (student) {
          addFloatingScore(value, student.name);
          set((state) => ({
            students: state.students.map((s) =>
              s.id === studentId ? { ...s, score: s.score + value, weeklyScore: s.weeklyScore + value } : s
            ),
          }));
        }
      }

      if (groupId) {
        const group = groups.find((g) => g.id === groupId);
        if (group) {
          set((state) => ({
            groups: state.groups.map((g) =>
              g.id === groupId ? { ...g, score: (g.score || 0) + value, weeklyScore: (g.weeklyScore || 0) + value } : g
            ),
          }));
        }
      }

      set((state) => ({ scores: [record, ...state.scores] }));
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  },

  subtractScore: async (studentId, groupId, value, reason) => {
    const { students, groups, addFloatingScore } = get();

    try {
      const res = await fetch(`${getApiBase()}/api/score/subtract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, groupId, value, reason }),
      });
      const record = await res.json();

      // 更新本地状态
      if (studentId) {
        const student = students.find((s) => s.id === studentId);
        if (student) {
          addFloatingScore(-value, student.name);
          set((state) => ({
            students: state.students.map((s) =>
              s.id === studentId ? { ...s, score: s.score - value, weeklyScore: s.weeklyScore - value } : s
            ),
          }));
        }
      }

      if (groupId) {
        const group = groups.find((g) => g.id === groupId);
        if (group) {
          set((state) => ({
            groups: state.groups.map((g) =>
              g.id === groupId ? { ...g, score: (g.score || 0) - value, weeklyScore: (g.weeklyScore || 0) - value } : g
            ),
          }));
        }
      }

      set((state) => ({ scores: [record, ...state.scores] }));
    } catch (error) {
      console.error('Failed to subtract score:', error);
    }
  },

  addRule: async (rule) => {
    try {
      const res = await fetch(`${getApiBase()}/api/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const newRule = await res.json();
      set((state) => ({ rules: [...state.rules, newRule] }));
    } catch (error) {
      console.error('Failed to add rule:', error);
    }
  },

  updateRule: async (id, data) => {
    try {
      const res = await fetch(`${getApiBase()}/api/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((state) => ({
        rules: state.rules.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  },

  deleteRule: async (id) => {
    try {
      await fetch(`${getApiBase()}/api/rules/${id}`, { method: 'DELETE' });
      set((state) => ({
        rules: state.rules.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  },

  updateSettings: async (settings) => {
    try {
      const res = await fetch(`${getApiBase()}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const updated = await res.json();
      set({ settings: updated });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  },

  addFloatingScore: (value, name) => {
    const id = uuidv4();
    set((state) => ({
      floatingScores: [...state.floatingScores, { id, value, name }],
    }));

    // 1.5秒后移除
    setTimeout(() => {
      set((state) => ({
        floatingScores: state.floatingScores.filter((f) => f.id !== id),
      }));
    }, 1500);
  },

  initializeClassData: async () => {
    try {
      // 使用新的班级初始化API
      const res = await fetch(`${getApiBase()}/api/class/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('初始化失败');
      }

      const data = await res.json();
      console.log('班级数据初始化成功:', data);

      // 重新加载数据以更新UI
      await get().loadData();
    } catch (error) {
      console.error('初始化班级数据失败:', error);
      throw error;
    }
  },

  settleWeeklyScores: async () => {
    const { students, groups, currentWeek, weeklySettlements } = get();

    const studentScores: Record<string, { weeklyScore: number; totalScore: number; rank: number }> = {};
    const groupScores: Record<string, { weeklyScore: number; totalScore: number; rank: number }> = {};

    // 计算学生排名
    const sortedStudents = [...students].sort((a, b) => b.weeklyScore - a.weeklyScore);
    sortedStudents.forEach((student, index) => {
      studentScores[student.id] = {
        weeklyScore: student.weeklyScore,
        totalScore: student.score,
        rank: index + 1,
      };
    });

    // 计算小组排名
    const sortedGroups = [...groups].sort((a, b) => (b.weeklyScore || 0) - (a.weeklyScore || 0));
    sortedGroups.forEach((group, index) => {
      groupScores[group.id] = {
        weeklyScore: group.weeklyScore || 0,
        totalScore: group.score || 0,
        rank: index + 1,
      };
    });

    const settlement: WeeklySettlement = {
      id: uuidv4(),
      weekNumber: currentWeek,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      studentScores,
      groupScores,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      weeklySettlements: [...state.weeklySettlements, settlement],
      currentWeek: currentWeek + 1,
      students: state.students.map((s) => ({ ...s, weeklyScore: 0 })),
      groups: state.groups.map((g) => ({ ...g, weeklyScore: 0 })),
    }));
  },
}));
