const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5000;

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const fullDeck = () => suits.flatMap(suit => ranks.map(rank => `${rank}${suit}`));

let rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) rooms[roomCode] = { players: [], deck: [], hands: {}, turnIndex: 0, trump: null, scores: { A: 0, B: 0 } };
    
    const room = rooms[roomCode];
    room.players.push(socket.id);

    io.to(roomCode).emit('update-players', room.players);

    if (room.players.length === 4) {
      dealCards(roomCode);
    }
  });

  socket.on('call-trump', (suit) => {
    const roomCode = getRoom(socket);
    if (!roomCode) return;
    rooms[roomCode].trump = suit;
    io.to(roomCode).emit('trump-called', suit);
    io.to(roomCode).emit('update-turn', rooms[roomCode].players[rooms[roomCode].turnIndex]);
  });

  socket.on('play-card', (card) => {
    const roomCode = getRoom(socket);
    if (!roomCode) return;
    const room = rooms[roomCode];
    room.deck.push(card);
    io.to(roomCode).emit('update-deck', room.deck);

    if (room.deck.length === 4) {
      const winner = determineTrickWinner(room);
      room.turnIndex = room.players.indexOf(winner);
      room.deck = [];

      const team = getTeam(winner, room);
      if (room.scores[team] === 8) room.scores[team] += 3; // Clean sweep (extra points)
      else room.scores[team] += 2;

      io.to(roomCode).emit('update-scores', room.scores);

      if (room.scores[team] >= 10) {
        io.to(roomCode).emit('game-winner', `Team ${team} wins!`);
        resetGame(roomCode);
      }
      return;
    }

    room.turnIndex = (room.turnIndex + 1) % 4;
    io.to(roomCode).emit('update-turn', room.players[room.turnIndex]);
  });

  socket.on('reset-game', () => {
    const roomCode = getRoom(socket);
    if (!roomCode) return;
    resetGame(roomCode);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      room.players = room.players.filter(player => player !== socket.id);
      if (room.players.length === 0) delete rooms[roomCode];
    }
  });
});

function resetGame(roomCode) {
  const room = rooms[roomCode];
  room.scores = { A: 0, B: 0 };
  room.trump = null;
  dealCards(roomCode);
}

function dealCards(roomCode) {
  const room = rooms[roomCode];
  const deck = fullDeck().sort(() => Math.random() - 0.5);
  room.hands = {};

  for (let i = 0; i < 4; i++) {
    room.hands[room.players[i]] = deck.slice(i * 8, (i + 1) * 8);
    io.to(room.players[i]).emit('deal-cards', room.hands[room.players[i]]);
  }

  room.turnIndex = 0;
  io.to(roomCode).emit('trump-called', null);
}

function determineTrickWinner(room) {
  const leadSuit = room.deck[0].slice(-1);
  const trump = room.trump;

  const sorted = [...room.deck].sort((a, b) => {
    const suitA = a.slice(-1);
    const suitB = b.slice(-1);
    const rankA = ranks.indexOf(a.slice(0, -1));
    const rankB = ranks.indexOf(b.slice(0, -1));

    if (suitA === trump && suitB !== trump) return -1;
    if (suitA !== trump && suitB === trump) return 1;
    if (suitA === suitB) return rankB - rankA;
    if (suitA === leadSuit) return -1;
    if (suitB === leadSuit) return 1;
    return 0;
  });

  return sorted[0].player;
}

function getTeam(playerId, room) {
  const idx = room.players.indexOf(playerId);
  return idx % 2 === 0 ? 'A' : 'B';
}

function getRoom(socket) {
  const roomsList = Array.from(socket.rooms);
  return roomsList.find(r => r !== socket.id);
}

server.listen(PORT, () => {
  console.log(`Omi server running on port ${PORT}`);
});
