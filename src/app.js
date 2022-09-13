const { makeid } = require('./utils');
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

const { db } = require("./db");
const { collection, setDoc, getDoc, doc } = require('firebase/firestore');

const state = {};
const clientRooms = {};

io.on("connection", (socket) => {
  socket.on("message", (msg) => {
    socket.emit("response", "Hello from server")
  })

  socket.on("new-game", handleNewGame);
  socket.on("join-game", handleJoinGame);
  socket.on("keydown", handleKeydown);

  socket.on("signup", (userData) => {
    var _userData = JSON.parse(userData);

    setDoc(doc(collection(db, "users"), _userData.userId), { 
      password: _userData.password,
      level: 0
    }).then((docRef) => {
      socket.emit('credentials', _userData.userId);
    })
  })

  socket.on("check-username", (userData) => {
    var _userData = JSON.parse(userData);

    getDoc(doc(db, "users", _userData.userId))
    .then((docSnap) => {
      if (docSnap.exists()) {
        socket.emit('username-in-use', JSON.stringify(_userData));
      } else {
        socket.emit('username-available', JSON.stringify(_userData));
      }
    })
  })

  socket.on("login", (userData) => {
    var _userData = JSON.parse(userData);

    getDoc(doc(db, "users", _userData.userId))
    .then((docSnap) => {
      if (docSnap.exists()) {
        if (docSnap.data().password === _userData.password) {
          socket.emit('credentials', _userData.userId);
        } else {
          socket.emit('invalid-password', JSON.stringify(_userData));  
        }
      } else {
        socket.emit('username-dont-exists', JSON.stringify(_userData));
      }
    })
  })

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    
    state[roomName] = initGame();
    socket.number = 1;
    socket.emit('init', 1);
  }

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];
    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      socket.emit("unknown-code");
      return;
      //TODO: Set the max number for the room
    } else if (numClients > 1) {
      socket.emit("too-many-players");
      return;
    }

    clientRooms[socket.id] = roomName;
    socket.join(roomName);

    //TODO: Set the socket number for the player number 
    //(numClients+1). Replace emit too
    socket.number = 2;
    socket.emit('init', 2);

    startGameInterval(roomName)
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);
    if (!winner) {
      emitGameState(roomName, winner);
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000/FRAME_RATE)
}

function emitGameState(room, gameState) {
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

httpServer.listen(3000);

// const io = require('socket.io')({
//     cors: {
//         origin: "http://localhost:4200",
//         methods: ["GET", "POST"]
//     }
// });
// const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
// const { FRAME_RATE } = require('./constants');
// const { makeid } = require('./utils');

// const state = {};
// const clientRooms = {};

// io.on('connection', client => {
//   client.on('keydown', handleKeydown);
//   client.on('newGame', handleNewGame);
//   client.on('joinGame', handleJoinGame);

//   function handleJoinGame(roomName) {
//     const room = io.sockets.adapter.rooms[roomName];

//     let allUsers;
//     if (room) {
//       allUsers = room.sockets;
//     }

//     let numClients = 0;
//     if (allUsers) {
//       numClients = Object.keys(allUsers).length;
//     }

//     if (numClients === 0) {
//       client.emit('unknownCode');
//       return;
//     } else if (numClients > 1) {
//       client.emit('tooManyPlayers');
//       return;
//     }

//     clientRooms[client.id] = roomName;

//     client.join(roomName);
//     client.number = 2;
//     client.emit('init', 2);
    
//     startGameInterval(roomName);
//   }

//   function handleNewGame() {
//     let roomName = makeid(5);
//     clientRooms[client.id] = roomName;
//     client.emit('gameCode', roomName);

//     state[roomName] = initGame();

//     client.join(roomName);
//     client.number = 1;
//     client.emit('init', 1);
//   }

//   function handleKeydown(keyCode) {
//     const roomName = clientRooms[client.id];
//     if (!roomName) {
//       return;
//     }
//     try {
//       keyCode = parseInt(keyCode);
//     } catch(e) {
//       console.error(e);
//       return;
//     }

//     const vel = getUpdatedVelocity(keyCode);

//     if (vel) {
//       state[roomName].players[client.number - 1].vel = vel;
//     }
//   }
// });

// function startGameInterval(roomName) {
//   const intervalId = setInterval(() => {
//     const winner = gameLoop(state[roomName]);
    
//     if (!winner) {
//       emitGameState(roomName, state[roomName])
//     } else {
//       emitGameOver(roomName, winner);
//       state[roomName] = null;
//       clearInterval(intervalId);
//     }
//   }, 1000 / FRAME_RATE);
// }

// function emitGameState(room, gameState) {
//   // Send this event to everyone in the room.
//   io.sockets.in(room)
//     .emit('gameState', JSON.stringify(gameState));
// }

// function emitGameOver(room, winner) {
//   io.sockets.in(room)
//     .emit('gameOver', JSON.stringify({ winner }));
// }

// io.listen(process.env.PORT || 3000);