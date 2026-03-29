import { useState } from 'react';
import { useAppStore, Student, Group } from '../store/appStore';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

export default function StudentManager() {
  const { students, groups, addStudent, updateStudent, deleteStudent, addGroup, deleteGroup, updateGroup } = useAppStore();
  const [activeSection, setActiveSection] = useState<'students' | 'groups'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | Group | null>(null);

  const filteredItems = activeSection === 'students'
    ? students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* 切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('students')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'students'
              ? 'bg-primary text-white'
              : 'bg-bg-card text-text-secondary hover:text-text-primary'
          }`}
        >
          学生 ({students.length})
        </button>
        <button
          onClick={() => setActiveSection('groups')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'groups'
              ? 'bg-primary text-white'
              : 'bg-bg-card text-text-secondary hover:text-text-primary'
          }`}
        >
          小组 ({groups.length})
        </button>
      </div>

      {/* 搜索和添加 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 bg-primary text-white rounded-lg flex items-center gap-1 hover:bg-primary-hover transition-colors"
        >
          <Plus size={18} />
          <span>添加</span>
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p className="text-sm">暂无{activeSection === 'students' ? '学生' : '小组'}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              点击添加
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-bg-card rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{item.name}</div>
                {activeSection === 'students' && (
                  <div className="text-xs text-text-muted">
                    分数: <span className="font-mono text-primary">{(item as Student).score || 0}</span>
                  </div>
                )}
                {'color' in item && (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: (item as Group).color }}
                    />
                    {(item as Group).name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingItem(item)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`确定删除${activeSection === 'students' ? '学生' : '小组'} "${item.name}" 吗？`)) {
                      activeSection === 'students'
                        ? deleteStudent(item.id)
                        : deleteGroup(item.id);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      {(showAddModal || editingItem) && (
        <AddEditModal
          type={activeSection}
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              activeSection === 'students'
                ? updateStudent(editingItem.id, data)
                : (editingItem as Group).name && updateGroup(editingItem.id, data);
            } else {
              activeSection === 'students'
                ? addStudent(data as Omit<Student, 'id' | 'score' | 'createdAt'>)
                : addGroup(data as Omit<Group, 'id' | 'score' | 'createdAt'>);
            }
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

interface AddEditModalProps {
  type: 'students' | 'groups';
  item: Student | Group | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

function AddEditModal({ type, item, onClose, onSave }: AddEditModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [groupId, setGroupId] = useState(
    item && 'groupId' in item ? (item as Student).groupId || '' : ''
  );
  const [color, setColor] = useState(
    item && 'color' in item ? (item as Group).color || '#6366F1' : '#6366F1'
  );

  const groups = useAppStore((s) => s.groups);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === 'students') {
      onSave({ name: name.trim(), groupId: groupId || undefined });
    } else {
      onSave({ name: name.trim(), color });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border border-border animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {item ? '编辑' : '添加'}{type === 'students' ? '学生' : '小组'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名称 */}
          <div>
            <label className="text-xs text-text-muted mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入名称"
              className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          {/* 小组选择 (学生时) */}
          {type === 'students' && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">所属小组</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">无</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 颜色选择 (小组时) */}
          {type === 'groups' && (
            <div>
              <label className="text-xs text-text-muted mb-2 block">颜色</label>
              <div className="flex gap-2 flex-wrap">
                {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-bg-card text-text-primary rounded-xl font-medium hover:bg-bg-elevated transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
