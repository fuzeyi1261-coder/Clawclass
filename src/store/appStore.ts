import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:3001';

// 检查 API 服务器是否可用
async function checkApiServer(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
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
      const [studentsRes, groupsRes, rulesRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/students`),
        fetch(`${API_BASE}/api/groups`),
        fetch(`${API_BASE}/api/rules`),
        fetch(`${API_BASE}/api/settings`),
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
      const res = await fetch(`${API_BASE}/api/students`, {
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
      const res = await fetch(`${API_BASE}/api/students/${id}`, {
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
      await fetch(`${API_BASE}/api/students/${id}`, { method: 'DELETE' });
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  },

  addGroup: async (group) => {
    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
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
      const res = await fetch(`${API_BASE}/api/groups/${id}`, {
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
      await fetch(`${API_BASE}/api/groups/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`${API_BASE}/api/score/add`, {
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
      const res = await fetch(`${API_BASE}/api/score/subtract`, {
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
      const res = await fetch(`${API_BASE}/api/rules`, {
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
      const res = await fetch(`${API_BASE}/api/rules/${id}`, {
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
      await fetch(`${API_BASE}/api/rules/${id}`, { method: 'DELETE' });
      set((state) => ({
        rules: state.rules.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  },

  updateSettings: async (settings) => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
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
    const { addGroup, addStudent, loadData } = get();

    const groups = [
      { id: '1', name: '一组', color: '#C084FC', lightColor: '#F3E8FF' },
      { id: '2', name: '二组', color: '#60A5FA', lightColor: '#DBEAFE' },
      { id: '3', name: '三组', color: '#4ADE80', lightColor: '#DCFCE7' },
      { id: '4', name: '四组', color: '#FB923C', lightColor: '#FED7AA' },
      { id: '5', name: '五组', color: '#FACC15', lightColor: '#FEF9C3' },
      { id: '6', name: '六组', color: '#F87171', lightColor: '#FEE2E2' },
    ];

    const students = [
      { id: '1', name: '朱子墨', groupId: '1', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '2', name: '刘家齐', groupId: '1', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '3', name: '黎敏中', groupId: '1', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '4', name: '刘祖恩', groupId: '1', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '5', name: '周玥希', groupId: '1', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '6', name: '王英哲', groupId: '1', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '7', name: '吴书帆', groupId: '2', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '8', name: '况寺琦', groupId: '2', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '9', name: '向梓轩', groupId: '2', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '10', name: '付泽宜', groupId: '2', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '11', name: '黄子轩', groupId: '2', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '12', name: '张乐水', groupId: '3', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '13', name: '涂钰晨', groupId: '3', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '14', name: '陈昱成', groupId: '3', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '15', name: '郑惜羽', groupId: '3', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '16', name: '王荣豪', groupId: '3', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '17', name: '张煜萱', groupId: '4', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '18', name: '计明恩', groupId: '4', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '19', name: '张锦宸', groupId: '4', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '20', name: '黎祯昊', groupId: '4', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '21', name: '孔令卓', groupId: '4', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '22', name: '谢逸橙', groupId: '5', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '23', name: '朱泓烨', groupId: '5', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '24', name: '邓泽人', groupId: '5', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '25', name: '张智依', groupId: '5', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '26', name: '周家瑞', groupId: '5', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '27', name: '袁艺', groupId: '5', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '28', name: '东昱瑾', groupId: '6', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '29', name: '宿煜然', groupId: '6', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '30', name: '刘雨辰', groupId: '6', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '31', name: '浮予佳', groupId: '6', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '32', name: '孙翌宸', groupId: '6', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
      { id: '33', name: '郑羽晴', groupId: '6', score: 0, weeklyScore: 0, createdAt: new Date().toISOString() },
    ];

    // 创建小组
    for (const group of groups) {
      await addGroup(group);
    }

    // 创建学生 - 使用 addStudent 方法以确保状态同步
    for (const student of students) {
      await addStudent({
        name: student.name,
        groupId: student.groupId,
        createdAt: student.createdAt
      });
    }

    // 重新加载数据以更新UI
    await loadData();
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
