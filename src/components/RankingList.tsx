import { useState, useMemo } from 'react';
import { useAppStore, Group } from '../store/appStore';
import { Trophy, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';

type RankingType = 'student' | 'group';

export default function RankingList() {
  const { students, groups, initializeClassData } = useAppStore();
  const [rankingType, setRankingType] = useState<RankingType>('student');

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

  const ranking = useMemo(() => {
    const list = rankingType === 'student' ? students : groupsWithScores;
    return [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [students, groupsWithScores, rankingType]);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 1:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 2:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-bg-card border-border';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return String(index + 1);
    }
  };

  const getRankTextColor = (index: number) => {
    switch (index) {
      case 0:
        return 'rank-gold';
      case 1:
        return 'rank-silver';
      case 2:
        return 'rank-bronze';
      default:
        return 'text-text-secondary';
    }
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const list = rankingType === 'student' ? students : groupsWithScores;
    const totalScore = list.reduce((sum, item) => sum + (item.score || 0), 0);
    const avgScore = list.length > 0 ? Math.round(totalScore / list.length) : 0;
    const maxScore = list.length > 0 ? Math.max(...list.map((item) => item.score || 0)) : 0;
    const minScore = list.length > 0 ? Math.min(...list.map((item) => item.score || 0)) : 0;
    return { totalScore, avgScore, maxScore, minScore, count: list.length };
  }, [students, groupsWithScores, rankingType]);

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* 切换按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => setRankingType('student')}
          className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
            rankingType === 'student'
              ? 'bg-primary text-white shadow-glow'
              : 'bg-bg-card text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={16} />
          <span className="text-sm font-medium">学生排行</span>
        </button>
        <button
          onClick={() => setRankingType('group')}
          className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
            rankingType === 'group'
              ? 'bg-primary text-white shadow-glow'
              : 'bg-bg-card text-text-secondary hover:text-text-primary'
          }`}
        >
          <Trophy size={16} />
          <span className="text-sm font-medium">小组排行</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-bg-card rounded-xl">
          <div className="text-xs text-text-muted">总人数</div>
          <div className="text-xl font-bold text-text-primary">{stats.count}</div>
        </div>
        <div className="p-3 bg-bg-card rounded-xl">
          <div className="text-xs text-text-muted">平均分</div>
          <div className="text-xl font-bold text-primary">{stats.avgScore}</div>
        </div>
        <div className="p-3 bg-bg-card rounded-xl">
          <div className="text-xs text-text-muted">最高分</div>
          <div className="text-xl font-bold text-success">{stats.maxScore}</div>
        </div>
        <div className="p-3 bg-bg-card rounded-xl">
          <div className="text-xs text-text-muted">最低分</div>
          <div className="text-xl font-bold text-danger">{stats.minScore}</div>
        </div>
      </div>

      {/* 排行榜 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {ranking.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">暂无数据</p>
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
          ranking.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] ${getRankStyle(index)}`}
            >
              {/* 排名 */}
              <div className={`w-8 text-center font-bold ${getRankTextColor(index)}`}>
                {getRankIcon(index)}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {item.name}
                </div>
                {'color' in item && (
                  <div className="text-xs text-text-muted">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: item.color }}
                    />
                    {(item as any).memberCount || 0}人
                  </div>
                )}
              </div>

              {/* 分数 */}
              <div className="text-right">
                <div className={`text-lg font-bold font-mono ${
                  (item.score || 0) > 0 ? 'text-success' :
                  (item.score || 0) < 0 ? 'text-danger' : 'text-text-secondary'
                }`}>
                  {item.score || 0}
                </div>
                {index > 0 && (
                  <div className="flex items-center justify-end gap-1 text-xs text-text-muted">
                    {ranking[index - 1].score !== undefined && item.score !== undefined && (
                      <>
                        {ranking[index - 1].score - item.score > 0 ? (
                          <TrendingDown size={12} className="text-danger" />
                        ) : ranking[index - 1].score - item.score < 0 ? (
                          <TrendingUp size={12} className="text-success" />
                        ) : (
                          <Minus size={12} />
                        )}
                        <span>{Math.abs((ranking[index - 1].score || 0) - (item.score || 0))}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
