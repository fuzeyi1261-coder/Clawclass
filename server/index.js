require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const homeworksRoutes = require('./routes/homeworks');
const scoresRoutes = require('./routes/scores');
const scheduleRoutes = require('./routes/schedule');
const studentsRoutes = require('./routes/students');
const groupsRoutes = require('./routes/groups');
const classRoutes = require('./routes/class');
const unlockRoutes = require('./routes/unlock');
const healthRoutes = require('./routes/health');
const settingsRoutes = require('./routes/settings');
const rulesRoutes = require('./routes/rules');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库
initDatabase();

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/homeworks', homeworksRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/class', classRoutes);
app.use('/api/unlock', unlockRoutes);
app.use('/api', healthRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/rules', rulesRoutes);

// 根路由 - 提供前端页面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>班级积分系统</title>
      <style>
        body { 
          font-family: 'Segoe UI', sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        h1 { color: #333; margin-bottom: 30px; }
        .links a {
          display: block;
          padding: 15px 30px;
          margin: 10px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-size: 18px;
          transition: transform 0.2s;
        }
        .links a:hover {
          transform: scale(1.05);
        }
        .note {
          margin-top: 20px;
          color: #666;
          font-size: 14px;
        }
        .beian {
          margin-top: 30px;
          color: #999;
          font-size: 12px;
        }
        .beian a {
          color: #999;
          text-decoration: none;
        }
        .beian a:hover {
          color: #667eea;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏆 班级积分系统</h1>
        <div class="links">
          <a href="/teacher">👩‍🏫 教师入口</a>
          <a href="/student">👨‍🎓 学生入口</a>
          <a href="/early-bird">🌅 Early Bird 记录</a>
        </div>
        <p class="note">服务器运行中...</p>
        <p class="beian">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow">鄂ICP备2025093833号</a>
        </p>
      </div>
    </body>
    </html>
  `);
});

// 教师端页面
app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/teacher.html'));
});

// 学生端页面
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student.html'));
});

// Early Bird 记录页面
app.get('/early-bird', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'Early Bird 记录.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Early Bird 文件错误:', err);
      res.status(404).send('文件未找到: ' + filePath);
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║     班级积分系统 API 服务器                    ║
║     运行地址: http://localhost:${PORT}           ║
║     教师端: http://localhost:${PORT}/teacher    ║
║     学生端: http://localhost:${PORT}/student     ║
╚═══════════════════════════════════════════════╝
  `);
});
