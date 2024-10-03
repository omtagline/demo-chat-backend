const { Server } = require('socket.io');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 8000;

// Create an HTTP server and pass it to both Express and Socket.io
const server = http.createServer(app);

// Initialize the Socket.io server using the same HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  }
});

// Maps and collections
const emailToSocketMapping = new Map();
let channelsMap = [];

// Socket.io events
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-room', (data) => {
    const { roomId, email } = data;
    emailToSocketMapping.set(roomId, email);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-joined', { email });
  });

  socket.on('join-chat', (data) => {
    const { roomId, email } = data;
    emailToSocketMapping.set(roomId, email);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-chat', { email });
  });

  socket.on('send-message', (data) => {
    const { roomId, message, email } = data;
    socket.broadcast.to(roomId).emit('receive-message', { email, message });
  });

  socket.on('leave-room', (data) => {
    const { roomId, email } = data;
    socket.leave(roomId);
    socket.broadcast.to(roomId).emit('user-left', { email });
  });

  socket.on('typing', (data) => {
    const { roomId, email } = data;
    socket.broadcast.to(roomId).emit('user-typing', { email });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API routes
app.get('/', (req, res) => {
  res.send('<h1>Hello, the API is working!</h1>');
});

app.post("/channel", (req, res) => {
  const { name } = req.body;
  const roomId = Math.floor(100000 + Math.random() * 900000);
  channelsMap.push({ roomId, name });
  res.send({ message: "Channel created successfully", roomId });
});

app.get("/channel", (req, res) => {
  res.send({ message: "Channels retrieved successfully", data: channelsMap });
});

app.delete("/channel/:id", (req, res) => {
  const id = req.params.id;
  channelsMap = channelsMap.filter(channel => channel.roomId !== parseInt(id));
  res.send({ message: "Channel deleted successfully" });
});

// Start the server
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});