const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'clawclass-secret-key-2024';

// 登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 验证 token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token 无效' });
  }
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token 无效' });
  }
});

// 获取所有用户（仅调试用）
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    console.error('获取用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 重置/确保用户存在（管理员功能）
router.post('/ensure-users', (req, res) => {
  try {
    const users = [
      { username: 'panel', password: 'panel123', role: 'panel' },  // 面板专用账号
      { username: '语文', password: 'mozi806847293', role: 'teacher' },
      { username: '数学', password: 'mozi806152847', role: 'teacher' },
      { username: '英语', password: 'mozi806394721', role: 'teacher' },
      { username: '物理', password: 'mozi806582639', role: 'teacher' },
      { username: '道法', password: 'mozi806217894', role: 'teacher' },
      { username: '历史', password: 'mozi806763541', role: 'teacher' },
      { username: '地理', password: 'mozi806428956', role: 'teacher' },
      { username: '生物', password: 'mozi806915326', role: 'teacher' },
      { username: '美术', password: 'mozi806671284', role: 'teacher' },
      { username: '体育', password: 'mozi806349128', role: 'teacher' },
      { username: '心理', password: 'mozi806582917', role: 'teacher' },
      { username: '信息', password: 'mozi806724639', role: 'teacher' },
      { username: '音乐', password: 'mozi806138572', role: 'teacher' },
    ];

    const stmt = db.prepare('INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)');
    
    users.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      stmt.run(user.username, hashedPassword, user.role);
    });

    res.json({ success: true, message: '用户已重置，包含 panel 账号' });
  } catch (error) {
    console.error('重置用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
