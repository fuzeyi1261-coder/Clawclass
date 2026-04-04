import { useState, useEffect } from 'react';
import { useAppStore, ScoreRule } from '../store/appStore';
import { Copy, Check, Plus, Trash2, Edit2, X, ExternalLink, RefreshCw, Monitor, MonitorOff } from 'lucide-react';
import { useScheduleStore } from '../store/scheduleStore';

const RULE_COLORS = ['#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4', '#84CC16'];

// 检查是否为Electron环境
const isElectron = typeof window !== 'undefined' && window.require !== undefined;

export default function Settings() {
  const { rules, settings, updateSettings, addRule, updateRule, deleteRule, initializeClassData, students, groups, loadData } = useAppStore();
  const { coverConfig, setCoverConfig, loadSchedule } = useScheduleStore();
  const [activeSection, setActiveSection] = useState<'api' | 'rules' | 'cover'>('api');
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [apiBase, setApiBase] = useState(localStorage.getItem('apiBase') || 'http://43.128.40.126:3001');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoreRule | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // 检查是否需要初始化数据
  const needsInitialization = students.length === 0 && groups.length === 0;

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(settings.apiKey || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWebhookSave = () => {
    updateSettings({ webhookUrl: webhookUrl });
  };

  const handleInitializeData = async () => {
    if (confirm('确定要初始化班级数据吗？这将添加6个小组和33名学生到服务器。')) {
      setIsInitializing(true);
      try {
        await initializeClassData();
        alert('数据初始化成功!');
      } catch (error) {
        console.error('Failed to initialize data:', error);
        alert('初始化失败: ' + error.message);
      } finally {
        setIsInitializing(false);
      }
    }
  };

  // 手动测试遮罩
  const testCover = () => {
    if (isElectron) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('cover-show', { 
        message: '测试遮罩', 
        subMessage: '密码: mozi806', 
        duration: 0 
      });
    }
  };

  const hideCover = () => {
    if (isElectron) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('cover-hide');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* 数据初始化提示 */}
      {needsInitialization && (
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-1">
                尚未初始化班级数据
              </p>
              <p className="text-xs text-text-secondary">
                需要先添加小组和学生数据才能使用各项功能
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('api')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'api'
              ? 'bg-primary text-white'
              : 'bg-bg-card text-text-secondary hover:text-text-primary'
          }`}
        >
          API 设置
        </button>
        <button
          onClick={() => setActiveSection('rules')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'rules'
              ? 'bg-primary text-white'
              : 'bg-bg-card text-text-secondary hover:text-text-primary'
          }`}
        >
          加分规则
        </button>
        {isElectron && (
          <button
            onClick={() => setActiveSection('cover')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'cover'
                ? 'bg-primary text-white'
                : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            遮罩设置
          </button>
        )}
      </div>

      {/* API设置 */}
      {activeSection === 'api' && (
        <div className="space-y-4 overflow-y-auto">
          {/* API地址 */}
          <div className="p-4 bg-bg-card rounded-xl">
            <label className="text-xs text-text-muted mb-2 block">API 服务器地址</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                onBlur={() => {
                  localStorage.setItem('apiBase', apiBase);
                  loadData();
                }}
                className="flex-1 h-10 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary"
                placeholder="http://你的服务器IP:3000"
              />
              <a
                href={`${apiBase}/api/students`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 flex items-center gap-1 bg-bg-elevated text-text-secondary rounded-lg hover:text-primary transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            <p className="text-xs text-text-muted mt-2">
              填入你的云服务器地址，如: http://123.456.789.0:3000
            </p>
          </div>

          {/* API Key */}
          <div className="p-4 bg-bg-card rounded-xl">
            <label className="text-xs text-text-muted mb-2 block">API 密钥</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.apiKey || '加载中...'}
                readOnly
                className="flex-1 h-10 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary font-mono"
              />
              <button
                onClick={copyApiKey}
                className="h-10 px-3 flex items-center gap-1 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="text-sm">复制</span>
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              使用此密钥在请求头中验证: X-API-Key
            </p>
          </div>

          {/* Webhook */}
          <div className="p-4 bg-bg-card rounded-xl">
            <label className="text-xs text-text-muted mb-2 block">Webhook 回调 URL</label>
            <div className="space-y-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-webhook-url.com/callback"
                className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleWebhookSave}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">
              分数变化时自动发送POST请求到此URL
            </p>
          </div>

          {/* API文档预览 */}
          <div className="p-4 bg-bg-card rounded-xl">
            <label className="text-xs text-text-muted mb-2 block">API 端点</label>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded">GET</span>
                <span className="text-text-secondary">/api/students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded">POST</span>
                <span className="text-text-secondary">/api/score/add</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded">POST</span>
                <span className="text-text-secondary">/api/score/subtract</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded">GET</span>
                <span className="text-text-secondary">/api/ranking</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 遮罩设置 */}
      {activeSection === 'cover' && isElectron && (
        <div className="space-y-4 overflow-y-auto">
          <div className="p-4 bg-bg-card rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Monitor size={24} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">遮罩模式</p>
                  <p className="text-xs text-text-muted">非上课时间显示全屏遮罩</p>
                </div>
              </div>
              <button
                onClick={() => setCoverConfig({ enabled: !coverConfig.enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  coverConfig.enabled ? 'bg-primary' : 'bg-bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  coverConfig.enabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-4 bg-bg-card rounded-xl">
            <label className="text-xs text-text-muted mb-2 block">解锁密码</label>
            <input
              type="password"
              value={coverConfig.password}
              onChange={(e) => setCoverConfig({ password: e.target.value })}
              className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary font-mono focus:outline-none focus:border-primary"
              placeholder="输入解锁密码"
            />
            <p className="text-xs text-text-muted mt-2">
              默认密码: mozi806
            </p>
          </div>

          <div className="p-4 bg-bg-card rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor size={20} className="text-text-muted" />
                <p className="text-sm text-text-primary">显示下一节课信息</p>
              </div>
              <button
                onClick={() => setCoverConfig({ nextClassInfo: !coverConfig.nextClassInfo })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  coverConfig.nextClassInfo ? 'bg-primary' : 'bg-bg-secondary'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  coverConfig.nextClassInfo ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor size={20} className="text-text-muted" />
                <p className="text-sm text-text-primary">显示作业内容</p>
              </div>
              <button
                onClick={() => setCoverConfig({ homeworkDisplay: !coverConfig.homeworkDisplay })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  coverConfig.homeworkDisplay ? 'bg-primary' : 'bg-bg-secondary'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  coverConfig.homeworkDisplay ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-4 bg-bg-card rounded-xl">
            <p className="text-xs text-text-muted mb-3">测试遮罩</p>
            <div className="flex gap-2">
              <button
                onClick={testCover}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
              >
                显示遮罩
              </button>
              <button
                onClick={hideCover}
                className="flex-1 py-2 bg-bg-secondary text-text-primary rounded-lg text-sm hover:bg-bg-elevated transition-colors"
              >
                隐藏遮罩
              </button>
            </div>
          </div>

          <div className="p-4 bg-bg-card rounded-xl">
            <p className="text-xs text-text-muted mb-3">加载课表</p>
            <button
              onClick={loadSchedule}
              className="w-full py-2 bg-bg-secondary text-text-primary rounded-lg text-sm hover:bg-bg-elevated transition-colors"
            >
              从服务器同步课表
            </button>
          </div>
        </div>
      )}

      {/* 初始化数据按钮 */}
      <div className="mt-auto pt-4 border-t border-border">
        <button
          onClick={handleInitializeData}
          disabled={isInitializing}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={isInitializing ? 'animate-spin' : ''} />
          <span>{isInitializing ? '初始化中...' : '初始化班级数据'}</span>
        </button>
      </div>

      {/* 加分规则 */}
      {activeSection === 'rules' && (
        <div className="space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-secondary">预设快捷分值</p>
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary-hover"
            >
              <Plus size={16} />
              添加规则
            </button>
          </div>

          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-3 p-3 bg-bg-card rounded-xl"
              >
                <span className="text-2xl">{rule.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{rule.name}</div>
                  <div className="text-xs text-text-muted">
                    {rule.type === 'add' ? '加分' : '扣分'}
                  </div>
                </div>
                <div
                  className="text-lg font-bold font-mono"
                  style={{ color: rule.color }}
                >
                  {rule.type === 'add' ? '+' : '-'}{rule.value}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除规则 "${rule.name}" 吗？`)) {
                        deleteRule(rule.id);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 规则弹窗 */}
      {(showRuleModal || editingRule) && (
        <RuleModal
          rule={editingRule}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(null);
          }}
          onSave={(data) => {
            if (editingRule) {
              updateRule(editingRule.id, data);
            } else {
              addRule(data as Omit<ScoreRule, 'id'>);
            }
            setShowRuleModal(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}

interface RuleModalProps {
  rule: ScoreRule | null;
  onClose: () => void;
  onSave: (data: Partial<ScoreRule>) => void;
}

function RuleModal({ rule, onClose, onSave }: RuleModalProps) {
  const [name, setName] = useState(rule?.name || '');
  const [value, setValue] = useState(rule?.value || 1);
  const [icon, setIcon] = useState(rule?.icon || '⭐');
  const [color, setColor] = useState(rule?.color || '#10B981');
  const [type, setType] = useState<'add' | 'subtract'>(rule?.type || 'add');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), value, icon, color, type });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border border-border animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {rule ? '编辑规则' : '添加规则'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 类型选择 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('add')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                type === 'add'
                  ? 'bg-success text-white'
                  : 'bg-bg-card text-text-secondary'
              }`}
            >
              加分
            </button>
            <button
              type="button"
              onClick={() => setType('subtract')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                type === 'subtract'
                  ? 'bg-danger text-white'
                  : 'bg-bg-card text-text-secondary'
              }`}
            >
              扣分
            </button>
          </div>

          {/* 名称 */}
          <div>
            <label className="text-xs text-text-muted mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如: 回答问题"
              className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* 分值 */}
          <div>
            <label className="text-xs text-text-muted mb-1 block">分值</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* 图标 */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">图标</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="⭐"
              className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-xl text-center focus:outline-none focus:border-primary"
            />
          </div>

          {/* 颜色 */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">颜色</label>
            <div className="flex gap-2 flex-wrap">
              {RULE_COLORS.map((c) => (
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

          {/* 按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-bg-card text-text-primary rounded-xl font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
