const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(express.json());

// 数据存储路径
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.json');

// 初始化数据库
function initDB() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      students: [],
      groups: [],
      scores: [],
      rules: [
        { id: '1', name: '回答问题', value: 1, icon: '✅', color: '#10B981', type: 'add' },
        { id: '2', name: '优秀表现', value: 3, icon: '⭐', color: '#F59E0B', type: 'add' },
        { id: '3', name: '出色完成', value: 5, icon: '🏆', color: '#6366F1', type: 'add' },
        { id: '4', name: '突出贡献', value: 10, icon: '🌟', color: '#8B5CF6', type: 'add' },
        { id: '5', name: '违纪扣分', value: -1, icon: '❌', color: '#EF4444', type: 'subtract' },
        { id: '6', name: '迟到扣分', value: -3, icon: '⏰', color: '#F97316', type: 'subtract' },
        { id: '7', name: '抄袭扣分', value: -5, icon: '📝', color: '#DC2626', type: 'subtract' },
        { id: '8', name: '严重违规', value: -10, icon: '🚫', color: '#991B1B', type: 'subtract' },
      ],
      settings: {
        apiKey: uuidv4(),
        webhookUrl: '',
        theme: 'dark',
      }
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

initDB();

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Key验证
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const db = initDB();
  if (!apiKey || apiKey !== db.settings.apiKey) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }
  next();
}

// 路由

// 获取学生列表
app.get('/api/students', (req, res) => {
  const db = initDB();
  res.json(db.students);
});

// 添加学生
app.post('/api/students', (req, res) => {
  const db = initDB();

  // 检查是否已存在同名学生
  const existingStudent = db.students.find(s => s.name === req.body.name);
  if (existingStudent) {
    return res.status(400).json({ error: '学生已存在' });
  }

  const student = {
    id: req.body.id || uuidv4(),
    name: req.body.name,
    groupId: req.body.groupId || null,
    score: req.body.score || 0,
    weeklyScore: req.body.weeklyScore || 0,
    createdAt: new Date().toISOString(),
  };
  db.students.push(student);
  saveDB(db);
  res.json(student);
});

// 更新学生
app.put('/api/students/:id', (req, res) => {
  const db = initDB();
  const index = db.students.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  db.students[index] = { ...db.students[index], ...req.body };
  saveDB(db);
  res.json(db.students[index]);
});

// 删除学生
app.delete('/api/students/:id', (req, res) => {
  const db = initDB();
  const index = db.students.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  db.students.splice(index, 1);
  saveDB(db);
  res.json({ success: true });
});

// 获取小组列表
app.get('/api/groups', (req, res) => {
  const db = initDB();
  
  // 计算每个小组的总分(组内所有成员的分数之和)
  const groups = db.groups.map(group => {
    const members = db.students.filter(s => s.groupId === group.id);
    const totalScore = members.reduce((sum, member) => sum + (member.score || 0), 0);
    const totalWeeklyScore = members.reduce((sum, member) => sum + (member.weeklyScore || 0), 0);
    return {
      ...group,
      score: totalScore,
      weeklyScore: totalWeeklyScore
    };
  });
  
  res.json(groups);
});

// 添加小组
app.post('/api/groups', (req, res) => {
  const db = initDB();

  // 检查是否已存在同名小组
  const existingGroup = db.groups.find(g => g.name === req.body.name);
  if (existingGroup) {
    return res.status(400).json({ error: '小组已存在' });
  }

  const group = {
    id: req.body.id || uuidv4(),
    name: req.body.name,
    color: req.body.color || '#6366F1',
    lightColor: req.body.lightColor || '#E0E7FF',
    createdAt: new Date().toISOString(),
  };
  db.groups.push(group);
  saveDB(db);
  res.json(group);
});

// 更新小组
app.put('/api/groups/:id', (req, res) => {
  const db = initDB();
  const index = db.groups.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Group not found' });

  db.groups[index] = { ...db.groups[index], ...req.body };
  saveDB(db);
  res.json(db.groups[index]);
});

// 删除小组
app.delete('/api/groups/:id', (req, res) => {
  const db = initDB();
  const index = db.groups.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Group not found' });

  db.groups.splice(index, 1);
  saveDB(db);
  res.json({ success: true });
});

// 加分
app.post('/api/score/add', (req, res) => {
  const db = initDB();
  const { studentId, groupId, value, reason } = req.body;

  const scoreRecord = {
    id: uuidv4(),
    studentId,
    groupId,
    value: Math.abs(value),
    reason: reason || '',
    type: 'add',
    createdAt: new Date().toISOString(),
  };

  db.scores.push(scoreRecord);

  // 更新学生分数
  if (studentId) {
    const studentIndex = db.students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
      db.students[studentIndex].score = (db.students[studentIndex].score || 0) + Math.abs(value);
      db.students[studentIndex].weeklyScore = (db.students[studentIndex].weeklyScore || 0) + Math.abs(value);
    }
  }

  // 小组分数动态计算,不需要存储

  saveDB(db);

  // Webhook通知
  if (db.settings.webhookUrl) {
    fetch(db.settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'score.added', data: scoreRecord }),
    }).catch(() => {});
  }

  res.json(scoreRecord);
});

// 扣分
app.post('/api/score/subtract', (req, res) => {
  const db = initDB();
  const { studentId, groupId, value, reason } = req.body;

  const scoreRecord = {
    id: uuidv4(),
    studentId,
    groupId,
    value: -Math.abs(value),
    reason: reason || '',
    type: 'subtract',
    createdAt: new Date().toISOString(),
  };

  db.scores.push(scoreRecord);

  // 更新学生分数
  if (studentId) {
    const studentIndex = db.students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
      db.students[studentIndex].score = (db.students[studentIndex].score || 0) - Math.abs(value);
      db.students[studentIndex].weeklyScore = (db.students[studentIndex].weeklyScore || 0) - Math.abs(value);
    }
  }

  // 小组分数动态计算,不需要存储

  saveDB(db);

  res.json(scoreRecord);
});

// 获取排行榜
app.get('/api/ranking', (req, res) => {
  const db = initDB();
  const { type = 'student', period = 'all' } = req.query;

  let ranking = [];

  if (type === 'student') {
    ranking = [...db.students].sort((a, b) => (b.score || 0) - (a.score || 0));
  } else if (type === 'group') {
    ranking = [...db.groups].sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  res.json(ranking);
});

// 获取分数记录
app.get('/api/scores', (req, res) => {
  const db = initDB();
  const { studentId, groupId, limit = 50 } = req.query;

  let scores = [...db.scores].reverse();

  if (studentId) {
    scores = scores.filter(s => s.studentId === studentId);
  }
  if (groupId) {
    scores = scores.filter(s => s.groupId === groupId);
  }

  res.json(scores.slice(0, parseInt(limit)));
});

// 获取/更新设置
app.get('/api/settings', (req, res) => {
  const db = initDB();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = initDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json(db.settings);
});

// 获取规则
app.get('/api/rules', (req, res) => {
  const db = initDB();
  res.json(db.rules);
});

// 添加规则
app.post('/api/rules', (req, res) => {
  const db = initDB();
  const rule = {
    id: uuidv4(),
    ...req.body,
  };
  db.rules.push(rule);
  saveDB(db);
  res.json(rule);
});

// 更新规则
app.put('/api/rules/:id', (req, res) => {
  const db = initDB();
  const index = db.rules.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rule not found' });

  db.rules[index] = { ...db.rules[index], ...req.body };
  saveDB(db);
  res.json(db.rules[index]);
});

// 删除规则
app.delete('/api/rules/:id', (req, res) => {
  const db = initDB();
  const index = db.rules.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rule not found' });

  db.rules.splice(index, 1);
  saveDB(db);
  res.json({ success: true });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
