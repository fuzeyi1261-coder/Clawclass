import { useState, useMemo } from 'react';
import { useAppStore, Student, Group } from '../store/appStore';
import { Search, Users, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type TargetType = 'student' | 'group';

export default function ScorePanel() {
  const { students, groups, addScore, subtractScore, initializeClassData } = useAppStore();
  const [targetType, setTargetType] = useState<TargetType>('group');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'subtract'; value: number } | null>(null);
  const [showRandomPicker, setShowRandomPicker] = useState(false);

  // 计算小组分数(组内所有成员的分数之和)
  const groupsWithScores = useMemo(() => {
    if (groups.length === 0 || students.length === 0) {
      return [];
    }
    return groups.map(group => {
      const members = students.filter(s => s.groupId === group.id);
      const totalScore = members.reduce((sum, member) => sum + (member.score || 0), 0);
      const totalWeeklyScore = members.reduce((sum, member) => sum + (member.weeklyScore || 0), 0);
      return {
        ...group,
        score: totalScore,
        weeklyScore: totalWeeklyScore,
        memberCount: members.length
      };
    });
  }, [students, groups]);

  const groupColors = groups.reduce((acc, group) => {
    acc[group.id] = group.color;
    return acc;
  }, {} as Record<string, string>);

  const handleScoreClick = (type: 'add' | 'subtract', value: number) => {
    const targetId = selectedStudent ? selectedStudent.id : selectedGroup?.id;
    if (!targetId) return;

    setPendingAction({ type, value });
    setShowConfirm(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    if (selectedStudent) {
      if (pendingAction.type === 'add') {
        await addScore(selectedStudent.id, null, pendingAction.value);
      } else {
        await subtractScore(selectedStudent.id, null, pendingAction.value);
      }
    } else if (selectedGroup) {
      if (pendingAction.type === 'add') {
        await addScore(null, selectedGroup.id, pendingAction.value);
      } else {
        await subtractScore(null, selectedGroup.id, pendingAction.value);
      }
    }

    setShowConfirm(false);
    setPendingAction(null);
    setSelectedStudent(null);
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleRandomPick = () => {
    if (students.length === 0) return;
    const randomIndex = Math.floor(Math.random() * students.length);
    const randomStudent = students[randomIndex];
    setSelectedStudent(randomStudent);
    setSelectedGroup(groups.find(g => g.id === randomStudent.groupId) || null);
  };

  const getGroupMemberCount = (groupId: string) => {
    return students.filter(s => s.groupId === groupId).length;
  };

  const getGroupStudents = (groupId: string) => {
    return students.filter(s => s.groupId === groupId);
  };

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">
      {/* 顶部操作栏 */}
      <div className="flex gap-2">
        <button
          onClick={handleRandomPick}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg flex items-center justify-center gap-2 transition-all text-white font-medium shadow-lg hover:shadow-xl"
        >
          <span className="text-lg">🎲</span>
          <span className="text-sm">随机抽人</span>
        </button>
        <button
          onClick={() => {
            setSelectedGroup(null);
            setSelectedStudent(null);
          }}
          className="py-2 px-4 bg-bg-card text-text-secondary hover:bg-bg-elevated rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          <span>✕</span>
        </button>
      </div>

      {/* 已选信息 */}
      {selectedGroup && !selectedStudent && (
        <div className="p-4 rounded-xl animate-scale-in" style={{ backgroundColor: selectedGroup.lightColor || `${selectedGroup.color}20` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedGroup.color }}></div>
            <span className="text-xl font-bold">{selectedGroup.name}</span>
            <span className="text-sm text-text-secondary">({getGroupMemberCount(selectedGroup.id)}人)</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-text-secondary">本周:</span>
            <span className="text-2xl font-mono font-bold" style={{ color: selectedGroup.color }}>
              {(selectedGroup.weeklyScore || 0) > 0 ? '+' : ''}{selectedGroup.weeklyScore || 0}
            </span>
            <span className="text-sm text-text-muted ml-2">累计: {selectedGroup.score || 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleScoreClick('add', 3)}
              className="py-2 rounded-lg font-bold text-white transition-all hover:scale-105"
              style={{ backgroundColor: selectedGroup.color }}
            >
              +3×{getGroupMemberCount(selectedGroup.id)}
            </button>
            <button
              onClick={() => handleScoreClick('subtract', 2)}
              className="py-2 rounded-lg font-bold text-white bg-danger hover:bg-red-600 transition-all hover:scale-105"
            >
              -2×{getGroupMemberCount(selectedGroup.id)}
            </button>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="p-4 rounded-xl animate-scale-in bg-bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="text-lg font-bold">{selectedStudent.name}</div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: groupColors[selectedStudent.groupId || ''] }}></div>
                {groups.find(g => g.id === selectedStudent.groupId)?.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div>
              <span className="text-xs text-text-muted">本周</span>
              <div className="text-xl font-mono font-bold text-primary">{selectedStudent.weeklyScore}</div>
            </div>
            <div>
              <span className="text-xs text-text-muted">累计</span>
              <div className="text-xl font-mono font-bold text-success">{selectedStudent.score}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleScoreClick('add', 3)}
              className="py-2 rounded-lg font-bold text-white bg-success hover:bg-green-600 transition-all hover:scale-105"
            >
              +3
            </button>
            <button
              onClick={() => handleScoreClick('subtract', 2)}
              className="py-2 rounded-lg font-bold text-white bg-danger hover:bg-red-600 transition-all hover:scale-105"
            >
              -2
            </button>
          </div>
        </div>
      )}

      {/* 小组卡片列表 */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">暂无小组</p>
            <p className="text-xs mt-1 mb-3">请先初始化班级数据</p>
            <button
              onClick={async () => {
                if (confirm('确定要初始化班级数据吗？这将添加6个小组和33名学生。')) {
                  await initializeClassData();
                }
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
            >
              初始化班级数据
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {groupsWithScores.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`p-3 rounded-xl transition-all text-left ${
                  selectedGroup?.id === group.id
                    ? 'ring-2 ring-primary shadow-lg'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: group.lightColor || `${group.color}20`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }}></div>
                  <span className="font-bold text-sm">{group.name}</span>
                  <span className="text-xs text-text-secondary">({group.memberCount}人)</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-text-secondary">本周</span>
                  <span className="font-mono font-bold" style={{ color: group.color }}>
                    {(group.weeklyScore || 0) > 0 ? '+' : ''}{group.weeklyScore || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">累计</span>
                  <span className="font-mono">{group.score || 0}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 选中小组成员 */}
      {selectedGroup && !selectedStudent && (
        <div className="max-h-40 overflow-y-auto bg-bg-card rounded-xl p-3">
          <p className="text-xs text-text-muted mb-2">点击组员进行操作</p>
          <div className="grid grid-cols-3 gap-2">
            {getGroupStudents(selectedGroup.id).map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-elevated transition-all text-center"
              >
                <div className="text-xs truncate">{student.name}</div>
                <div className="text-xs font-mono text-primary mt-1">{student.weeklyScore}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      {showConfirm && pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-bg-secondary p-6 rounded-2xl max-w-xs w-full mx-4 shadow-2xl border border-border animate-scale-in">
            <div className="text-center">
              <div className={`text-5xl font-bold mb-4 ${
                pendingAction.type === 'add' ? 'text-success' : 'text-danger'
              }`}>
                {pendingAction.type === 'add' ? '+' : '-'}{pendingAction.value}
              </div>
              <p className="text-text-primary mb-2">
                给 <span className="font-semibold">{selectedStudent?.name || selectedGroup?.name}</span>
              </p>
              <p className="text-text-secondary text-sm mb-6">
                {pendingAction.type === 'add' ? '加分' : '扣分'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelConfirm}
                className="flex-1 py-3 bg-bg-card text-text-primary rounded-xl font-medium hover:bg-bg-elevated transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${
                  pendingAction.type === 'add'
                    ? 'bg-success hover:bg-success/80'
                    : 'bg-danger hover:bg-danger/80'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

