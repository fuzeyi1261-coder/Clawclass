// src/store/assignmentStore.ts
import { create } from 'zustand';
import { Octokit } from '@octokit/rest';

interface Assignment {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentState {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  
  // GitHub Gist 配置
  gistToken: string;
  gistId: string;
  
  // 操作方法
  loadAssignments: () => Promise<void>;
  createAssignment: (title: string, content: string) => Promise<void>;
  updateAssignment: (id: string, title: string, content: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  
  // 配置方法
  setGistToken: (token: string) => void;
  setGistId: (id: string) => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,
  gistToken: '',
  gistId: '',
  
  setGistToken: (token: string) => set({ gistToken: token }),
  setGistId: (id: string) => set({ gistId: id }),
  
  getOctokit: () => {
    const { gistToken } = get();
    if (!gistToken) {
      throw new Error('GitHub Gist Token 未配置');
    }
    return new Octokit({ auth: gistToken });
  },
  
  loadAssignments: async () => {
    const { gistId, gistToken } = get();
    if (!gistId || !gistToken) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const octokit = get().getOctokit();
      const gist = await octokit.rest.gists.get({
        gist_id: gistId,
      });
      
      const file = gist.data.files['assignments.json'];
      if (!file?.content) {
        set({ assignments: [], isLoading: false });
        return;
      }
      
      const assignments = JSON.parse(file.content);
      set({ assignments, isLoading: false });
    } catch (error) {
      set({ error: '加载作业失败', isLoading: false });
      console.error('加载作业失败:', error);
    }
  },
  
  createAssignment: async (title: string, content: string) => {
    const { gistId, assignments } = get();
    if (!gistId) {
      throw new Error('Gist ID 未配置');
    }
    
    set({ isLoading: true });
    try {
      const octokit = get().getOctokit();
      const newAssignment: Assignment = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedAssignments = [newAssignment, ...assignments];
      await octokit.rest.gists.update({
        gist_id: gistId,
        files: {
          'assignments.json': {
            content: JSON.stringify(updatedAssignments, null, 2),
          },
        },
      });
      
      set({ assignments: updatedAssignments, isLoading: false });
    } catch (error) {
      set({ error: '创建作业失败', isLoading: false });
      console.error('创建作业失败:', error);
      throw error;
    }
  },
  
  updateAssignment: async (id: string, title: string, content: string) => {
    const { gistId, assignments } = get();
    if (!gistId) return;
    
    set({ isLoading: true });
    try {
      const octokit = get().getOctokit();
      const updatedAssignments = assignments.map((assignment) =>
        assignment.id === id
          ? { ...assignment, title, content, updatedAt: new Date().toISOString() }
          : assignment
      );
      
      await octokit.rest.gists.update({
        gist_id: gistId,
        files: {
          'assignments.json': {
            content: JSON.stringify(updatedAssignments, null, 2),
          },
        },
      });
      
      set({ assignments: updatedAssignments, isLoading: false });
    } catch (error) {
      set({ error: '更新作业失败', isLoading: false });
      throw error;
    }
  },
  
  deleteAssignment: async (id: string) => {
    const { gistId, assignments } = get();
    if (!gistId) return;
    
    set({ isLoading: true });
    try {
      const octokit = get().getOctokit();
      const updatedAssignments = assignments.filter((assignment) => assignment.id !== id);
      
      await octokit.rest.gists.update({
        gist_id: gistId,
        files: {
          'assignments.json': {
            content: JSON.stringify(updatedAssignments, null, 2),
          },
        },
      });
      
      set({ assignments: updatedAssignments, isLoading: false });
    } catch (error) {
      set({ error: '删除作业失败', isLoading: false });
      throw error;
    }
  },
}));
