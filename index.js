const { Server } = require('socket.io');
const io = new Server();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();
app.use(cors());
const port = process.env.PORT 

const emailToSocketMapping = new Map();
const channelsMap=[]
app.use(bodyParser.json());

io.on('connection', (socket) => {
  console.log('New client connected');

  // Event: User joins a room
  socket.on('join-room', (data) => {
    const { roomId, email } = data;
    emailToSocketMapping.set(roomId, email);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-joined', { email });
    
  });

  // Event: User joins a chat
  socket.on('join-chat', (data) => {
    const { roomId, email } = data;
    emailToSocketMapping.set(roomId, email);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-chat', { email });
  });

  // New Event 1: User sends a message
  socket.on('send-message', (data) => {
    const { roomId, message, email } = data;
    socket.broadcast.to(roomId).emit('receive-message', { email, message });
  });


  // New Event 2: User leaves a room
  socket.on('leave-room', (data) => {
    const { roomId, email } = data;
    socket.leave(roomId);
    socket.broadcast.to(roomId).emit('user-left', { email });
  });

  // New Event 3: User typing indicator
  socket.on('typing', (data) => {
    const { roomId, email } = data;
    socket.broadcast.to(roomId).emit('user-typing', { email });
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/',(req,res)=>{
  res.send('<h1>Hello api is working</h1>')
})


app.post("/channel",(req,res)=>{
  const {name} = req.body;
  const roomId=  Math.floor(100000 + Math.random() * 900000);
  console.log(name);
  // if (channelsMap.includes(roomId)) {
    channelsMap.push({roomId,name})
    res.send({message:"Channel created successfully"})    
  // }
  // res.send({message:'internal Server Error'})
})

app.get("/channel",(req,res)=>{
  // console.log(req);
  // const {roomId,name} = req.body;
  res.send({message:"Channel get successfully",data:channelsMap})
})

app.delete("/channel/:id",(req,res)=>{
  const id= req.params;
  channelsMap=channelsMap.filter(p=>p!==id)
  res.send({message:"Channel deleted successfully"})
})

app.listen(port, () => {
  console.log('Listening on port 8000');
});

io.listen(port+1, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});



