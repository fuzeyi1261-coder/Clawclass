const express = require('express');
const router = express.Router();
const { db } = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clawclass-secret-key-2024';

// 中间件：验证 token
function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '请先登录' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '登录已过期' });
  }
}

// 中间件：只有数学老师可以管理课表
function mathTeacherOnly(req, res, next) {
  console.log('mathTeacherOnly check - user:', req.user);
  if (req.user.username !== '数学') {
    return res.status(403).json({ error: '只有数学老师可以管理课表', yourUsername: req.user.username });
  }
  next();
}

// 获取课表
router.get('/', (req, res) => {
  try {
    const { weekday } = req.query;
    
    let sql = 'SELECT * FROM schedule ORDER BY weekday, period';
    let params = [];

    if (weekday !== undefined) {
      sql = 'SELECT * FROM schedule WHERE weekday = ? ORDER BY period';
      params = [weekday];
    }

    const schedule = db.prepare(sql).all(...params);
    res.json(schedule);
  } catch (error) {
    console.error('获取课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加/更新课表（仅数学老师）
router.post('/', authMiddleware, mathTeacherOnly, (req, res) => {
  try {
    const { weekday, period, subject, start_time, end_time } = req.body;

    if (weekday === undefined || !period || !subject) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 检查是否已存在
    const existing = db.prepare(
      'SELECT * FROM schedule WHERE weekday = ? AND period = ?'
    ).get(weekday, period);

    if (existing) {
      // 更新
      db.prepare(`
        UPDATE schedule SET subject = ?, start_time = ?, end_time = ? WHERE weekday = ? AND period = ?
      `).run(subject, start_time || null, end_time || null, weekday, period);
    } else {
      // 新增
      db.prepare(`
        INSERT INTO schedule (weekday, period, subject, start_time, end_time) VALUES (?, ?, ?, ?, ?)
      `).run(weekday, period, subject, start_time || null, end_time || null);
    }

    const schedule = db.prepare('SELECT * FROM schedule ORDER BY weekday, period').all();
    res.json(schedule);
  } catch (error) {
    console.error('添加课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 批量更新课表（仅数学老师）
router.post('/batch', authMiddleware, mathTeacherOnly, (req, res) => {
  try {
    const { schedule } = req.body;

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: '课表数据格式错误' });
    }

    // 清空现有课表并重新插入
    db.prepare('DELETE FROM schedule').run();

    const stmt = db.prepare(`
      INSERT INTO schedule (weekday, period, subject, start_time, end_time) VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of schedule) {
      if (item.subject) {
        stmt.run(item.weekday, item.period, item.subject, item.start_time || null, item.end_time || null);
      }
    }

    const result = db.prepare('SELECT * FROM schedule ORDER BY weekday, period').all();
    res.json(result);
  } catch (error) {
    console.error('批量更新课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除课表（仅数学老师）
router.delete('/:id', authMiddleware, mathTeacherOnly, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM schedule WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取星期名称
router.get('/weekdays', (req, res) => {
  const weekdays = [
    { id: 1, name: '周一' },
    { id: 2, name: '周二' },
    { id: 3, name: '周三' },
    { id: 4, name: '周四' },
    { id: 5, name: '周五' },
    { id: 6, name: '周六' },
    { id: 0, name: '周日' },
  ];
  res.json(weekdays);
});

module.exports = router;
