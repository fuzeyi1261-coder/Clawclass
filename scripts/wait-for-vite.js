const http = require('http');

const maxAttempts = 30;
const delay = 1000;

function checkServer(attempt = 1) {
  if (attempt > maxAttempts) {
    console.log('Vite server not responding, starting Electron anyway...');
    process.exit(0);
  }

  const req = http.get('http://localhost:5173', (res) => {
    if (res.statusCode === 200) {
      console.log('Vite server is ready!');
      process.exit(0);
    } else {
      setTimeout(() => checkServer(attempt + 1), delay);
    }
  });

  req.on('error', () => {
    setTimeout(() => checkServer(attempt + 1), delay);
  });
}

console.log('Waiting for Vite server...');
checkServer();
