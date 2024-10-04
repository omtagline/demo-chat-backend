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
  socket.on('file-upload',(data)=>{
    const {roomId,fileData,fileName,fileType}=data
    io.to(roomId).emit('file-upload', {
      fileName,
      fileData,
      fileType,
      sender: socket.id // Optionally send the sender's socket ID
    });
  })


  //for webrtc
   // Listen for offers from clients
   socket.on('offer', (data) => {
    console.log('Received offer from', socket.id);
    socket.to(data.roomId).emit('offer', {
      offer: data.offer,
      from: socket.id,
    });
  });

  // Listen for answers from clients
  socket.on('answer', (data) => {
    console.log(data);
    console.log('Received answer from', socket.id);
    socket.to(data.roomId).emit('answer', {
      answer: data.answer,
      from: socket.id,
    });
  });

  // Listen for ICE candidates from clients
  socket.on('ice-candidate', (data) => {
    console.log('Received ICE candidate from', socket.id);
    socket.to(data.roomId).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
    });
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

