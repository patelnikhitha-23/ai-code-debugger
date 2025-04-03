const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const { PythonShell } = require('python-shell');

const app = express();
app.use(cors());
const server = app.listen(5000, () => console.log('Server running on port 5000'));
const io = socketIo(server);

io.on('connection', (socket) => {
  socket.on('debug-code', async ({ code, language }) => {
    // Send code to Python AI service (or call OpenAI API)
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      scriptPath: './ai-service',
      args: [code, language],
    };

    PythonShell.run('analyze.py', options, (err, results) => {
      if (err) throw err;
      socket.emit('ai-fix', { explanation: results[0] });
    });
  });
});