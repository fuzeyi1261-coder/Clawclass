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

// 获取积分列表
router.get('/', (req, res) => {
  try {
    const { type, id } = req.query;
    
    let sql = `
      SELECT s.*, 
             st.name as student_name, st.group_id,
             g.name as group_name,
             s.created_at
      FROM scores s
      LEFT JOIN students st ON s.student_id = st.id
      LEFT JOIN groups g ON s.group_id = g.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `;

    const scores = db.prepare(sql).all();
    res.json(scores);
  } catch (error) {
    console.error('获取积分错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取学生积分排行
router.get('/ranking', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.*, g.name as group_name
      FROM students s
      LEFT JOIN groups g ON s.group_id = g.id
      ORDER BY s.total_score DESC
    `).all();

    // 小组积分 = 成员积分总和（实时计算）
    const groups = db.prepare(`
      SELECT g.id, g.name, 
             (SELECT COALESCE(SUM(total_score), 0) FROM students WHERE group_id = g.id) as total_score,
             (SELECT COUNT(*) FROM students WHERE group_id = g.id) as member_count
      FROM groups g
      ORDER BY total_score DESC
    `).all();

    res.json({ students, groups });
  } catch (error) {
    console.error('获取排行错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加积分（给学生）- 移除登录要求
router.post('/student', (req, res) => {
  try {
    const { student_id, score, reason } = req.body;

    if (!student_id || score === undefined) {
      return res.status(400).json({ error: '请选择学生并输入分数' });
    }

    // 添加积分记录
    db.prepare(`
      INSERT INTO scores (student_id, score, reason, created_by)
      VALUES (?, ?, ?, ?)
    `).run(student_id, score, reason || '', 'panel');

    // 更新学生总积分
    db.prepare(`
      UPDATE students SET total_score = total_score + ? WHERE id = ?
    `).run(score, student_id);

    // 获取更新后的学生信息
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);

    res.json(student);
  } catch (error) {
    console.error('添加积分错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加积分（给小组）- 移除登录要求
router.post('/group', (req, res) => {
  try {
    const { group_id, score, reason } = req.body;

    if (!group_id || score === undefined) {
      return res.status(400).json({ error: '请选择小组并输入分数' });
    }

    // 给小组每个成员都加减分
    const members = db.prepare('SELECT id FROM students WHERE group_id = ?').all(group_id);
    
    members.forEach(member => {
      // 添加积分记录
      db.prepare(`
        INSERT INTO scores (student_id, group_id, score, reason, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(member.id, group_id, score, reason || '', 'panel');

      // 更新学生总积分
      db.prepare(`
        UPDATE students SET total_score = total_score + ? WHERE id = ?
      `).run(score, member.id);
    });

    // 小组积分 = 成员积分总和（实时计算）
    const totalScore = db.prepare(`
      SELECT COALESCE(SUM(total_score), 0) as sum FROM students WHERE group_id = ?
    `).get(group_id);

    // 更新小组总积分
    db.prepare(`
      UPDATE groups SET total_score = ? WHERE id = ?
    `).run(totalScore.sum, group_id);

    // 获取更新后的小组信息
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(group_id);

    res.json(group);
  } catch (error) {
    console.error('添加积分错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 批量加减分
router.post('/batch', (req, res) => {
  try {
    const { scores, reason } = req.body;
    // scores: [{ student_id, score }] 或 [{ group_id, score }]

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: '请提供有效的加分列表' });
    }

    scores.forEach(({ student_id, group_id, score }) => {
      if (group_id) {
        // 给小组每个成员加分
        const members = db.prepare('SELECT id FROM students WHERE group_id = ?').all(group_id);
        members.forEach(member => {
          db.prepare(`
            INSERT INTO scores (student_id, group_id, score, reason, created_by)
            VALUES (?, ?, ?, ?, ?)
          `).run(member.id, group_id, score, reason || '', 'panel');
          db.prepare(`UPDATE students SET total_score = total_score + ? WHERE id = ?`).run(score, member.id);
        });
        // 更新小组总分
        const totalScore = db.prepare(`SELECT COALESCE(SUM(total_score), 0) as sum FROM students WHERE group_id = ?`).get(group_id);
        db.prepare(`UPDATE groups SET total_score = ? WHERE id = ?`).run(totalScore.sum, group_id);
      } else if (student_id) {
        db.prepare(`
          INSERT INTO scores (student_id, score, reason, created_by)
          VALUES (?, ?, ?, ?)
        `).run(student_id, score, reason || '', 'panel');
        db.prepare(`UPDATE students SET total_score = total_score + ? WHERE id = ?`).run(score, student_id);
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('批量加分错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 撤销积分
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // 获取积分记录
    const scoreRecord = db.prepare('SELECT * FROM scores WHERE id = ?').get(id);

    if (!scoreRecord) {
      return res.status(404).json({ error: '记录不存在' });
    }

    // 如果是小组积分，需要给每个成员都撤销
    if (scoreRecord.group_id && scoreRecord.student_id === null) {
      const members = db.prepare('SELECT id FROM students WHERE group_id = ?').all(scoreRecord.group_id);
      
      members.forEach(member => {
        db.prepare(`
          UPDATE students SET total_score = total_score - ? WHERE id = ?
        `).run(scoreRecord.score, member.id);
      });
      
      // 重新计算小组总积分
      const totalScore = db.prepare(`
        SELECT COALESCE(SUM(total_score), 0) as sum FROM students WHERE group_id = ?
      `).get(scoreRecord.group_id);
      db.prepare('UPDATE groups SET total_score = ? WHERE id = ?').run(totalScore.sum, scoreRecord.group_id);
    } else if (scoreRecord.student_id) {
      // 给学生撤销积分
      db.prepare(`
        UPDATE students SET total_score = total_score - ? WHERE id = ?
      `).run(scoreRecord.score, scoreRecord.student_id);
      
      // 如果有小组，也要更新小组总积分
      if (scoreRecord.group_id) {
        const totalScore = db.prepare(`
          SELECT COALESCE(SUM(total_score), 0) as sum FROM students WHERE group_id = ?
        `).get(scoreRecord.group_id);
        db.prepare('UPDATE groups SET total_score = ? WHERE id = ?').run(totalScore.sum, scoreRecord.group_id);
      }
    }

    // 删除记录
    db.prepare('DELETE FROM scores WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    console.error('撤销积分错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
