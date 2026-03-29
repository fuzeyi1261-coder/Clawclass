import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';

interface WeeklySettlementProps {
  onClose?: () => void;
}

export default function WeeklySettlement({ onClose }: WeeklySettlementProps) {
  const { students, groups, weeklySettlements, settleWeeklyScores, initializeClassData } = useAppStore();
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);

  const handleSettle = async () => {
    if (confirm('确定要开始周清算吗？这将重置本周分数，但保留累计分数。')) {
      await settleWeeklyScores();
      alert('周清算完成！');
    }
  };

  const handleInitialize = async () => {
    if (confirm('确定要初始化班级数据吗？这将创建6个小组和32名学生。')) {
      await initializeClassData();
      alert('初始化完成！');
    }
  };

  const getSelectedSettlement = () => {
    if (!selectedSettlement) return null;
    return weeklySettlements.find((s) => s.id === selectedSettlement);
  };

  const currentSettlement = getSelectedSettlement();

  return (
    <div className="h-full flex flex-col bg-bg-primary text-text-primary p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📊 周清算</h2>
        <div className="flex gap-2">
          <button
            onClick={handleInitialize}
            className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors text-sm font-medium"
          >
            初始化数据
          </button>
          <button
            onClick={handleSettle}
            className="px-4 py-2 bg-success hover:bg-green-600 rounded-lg transition-colors text-sm font-medium"
          >
            开始清算
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-danger hover:bg-red-600 rounded-lg transition-colors text-sm font-medium"
            >
              关闭
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* 历史记录列表 */}
        <div className="w-64 flex-shrink-0 bg-bg-card rounded-xl p-3 overflow-y-auto">
          <h3 className="text-sm font-bold text-text-secondary mb-2">历史记录</h3>
          {weeklySettlements.length === 0 ? (
            <p className="text-xs text-text-muted">暂无周清算记录</p>
          ) : (
            <div className="space-y-2">
              {weeklySettlements.slice().reverse().map((settlement) => (
                <button
                  key={settlement.id}
                  onClick={() => setSelectedSettlement(settlement.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedSettlement === settlement.id
                      ? 'bg-primary-light border border-primary'
                      : 'bg-bg-secondary hover:bg-bg-elevated'
                  }`}
                >
                  <div className="font-bold text-sm">第 {settlement.weekNumber} 周</div>
                  <div className="text-xs text-text-muted mt-1">
                    {new Date(settlement.endDate).toLocaleDateString('zh-CN')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 详细内容 */}
        <div className="flex-1 bg-bg-card rounded-xl p-4 overflow-y-auto">
          {!currentSettlement ? (
            <div className="h-full flex items-center justify-center text-text-muted">
              <p>选择一个周清算记录查看详情</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 周信息 */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">第 {currentSettlement.weekNumber} 周</h3>
                <p className="text-sm text-text-secondary">
                  清算时间: {new Date(currentSettlement.endDate).toLocaleString('zh-CN')}
                </p>
              </div>

              {/* 小组排名 */}
              <div>
                <h3 className="text-lg font-bold mb-3">👥 小组排名</h3>
                <div className="space-y-2">
                  {Object.entries(currentSettlement.groupScores)
                    .sort(([, a], [, b]) => a.rank - b.rank)
                    .map(([groupId, data]) => {
                      const group = groups.find((g) => g.id === groupId);
                      const rankBadge = data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : data.rank === 3 ? '🥉' : `#${data.rank}`;

                      return (
                        <div
                          key={groupId}
                          className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                          style={{ borderLeft: `4px solid ${group?.color || '#ccc'}` }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{rankBadge}</span>
                            <span className="font-medium">{group?.name || '未知小组'}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              本周: {data.weeklyScore > 0 ? '+' : ''}{data.weeklyScore}
                            </div>
                            <div className="text-sm text-text-secondary">累计: {data.totalScore}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 个人排名 */}
              <div>
                <h3 className="text-lg font-bold mb-3">🏆 个人排名</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(currentSettlement.studentScores)
                    .sort(([, a], [, b]) => a.rank - b.rank)
                    .map(([studentId, data]) => {
                      const student = students.find((s) => s.id === studentId);
                      const group = groups.find((g) => g.id === student?.groupId);
                      const rankBadge = data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : data.rank === 3 ? '🥉' : `${data.rank}`;

                      return (
                        <div
                          key={studentId}
                          className="flex items-center justify-between p-2 bg-bg-secondary rounded-lg"
                          style={{ borderLeft: `3px solid ${group?.color || '#ccc'}` }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base flex-shrink-0">{rankBadge}</span>
                            <span className="text-sm truncate">{student?.name || '未知学生'}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-primary">
                              {data.weeklyScore > 0 ? '+' : ''}{data.weeklyScore}
                            </div>
                            <div className="text-xs text-text-muted">∑{data.totalScore}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
