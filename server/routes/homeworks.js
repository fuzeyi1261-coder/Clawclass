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

// 获取所有作业
router.get('/', (req, res) => {
  try {
    const { subject } = req.query;
    
    let sql = 'SELECT * FROM homeworks ORDER BY created_at DESC';
    let params = [];
    
    if (subject) {
      sql = 'SELECT * FROM homeworks WHERE subject = ? ORDER BY created_at DESC';
      params = [subject];
    }

    const homeworks = db.prepare(sql).all(...params);
    res.json(homeworks);
  } catch (error) {
    console.error('获取作业错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建作业
router.post('/', authMiddleware, (req, res) => {
  try {
    const { subject, content, due_date } = req.body;

    if (!subject) {
      return res.status(400).json({ error: '请填写科目' });
    }

    // content 作为标题和内容（简化版）
    const title = content || subject + '作业';

    const result = db.prepare(`
      INSERT INTO homeworks (subject, title, content, due_date, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(subject, title, content || '', due_date || '', req.user.username);

    const homework = db.prepare('SELECT * FROM homeworks WHERE id = ?').get(result.lastInsertRowid);

    res.json(homework);
  } catch (error) {
    console.error('创建作业错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新作业
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { subject, title, content, due_date } = req.body;

    db.prepare(`
      UPDATE homeworks 
      SET subject = ?, title = ?, content = ?, due_date = ?
      WHERE id = ?
    `).run(subject, title, content || '', due_date || '', id);

    const homework = db.prepare('SELECT * FROM homeworks WHERE id = ?').get(id);
    res.json(homework);
  } catch (error) {
    console.error('更新作业错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除作业
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM homeworks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除作业错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有科目列表
router.get('/subjects', (req, res) => {
  const subjects = [
    '语文', '数学', '英语', '物理', '道法',
    '历史', '地理', '生物', '美术', '体育',
    '心理', '信息', '音乐'
  ];
  res.json(subjects);
});

module.exports = router;
