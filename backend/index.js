const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

const PORT = 5000;

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const fullDeck = () => suits.flatMap(suit => ranks.map(rank => `${rank}${suit}`));

let rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        trump: null,
        hands: {},
        table: [],
        scores: { A: 0, B: 0 },
        roundScore: { A: 0, B: 0 },
        turnIndex: 0,
      };
    }

    const room = rooms[roomCode];
    if (room.players.length >= 4) return;

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
    const room = rooms[roomCode];
    room.table.push({ player: socket.id, card });
    io.to(roomCode).emit('update-table', room.table.map(x => x.card));

    if (room.table.length === 4) {
      const winner = determineTrickWinner(room);
      room.turnIndex = room.players.indexOf(winner);
      room.table = [];

      const team = getTeam(winner, room);
      room.roundScore[team]++;

      if (room.roundScore[team] >= 5) {
        const isTrumpCaller = team === getTeam(room.players[0], room);
        const roundPoints = room.roundScore[team] === 8 ? 3 : isTrumpCaller ? 1 : 2;
        room.scores[team] += roundPoints;
        io.to(roomCode).emit('update-score', {
          teamA: room.scores.A,
          teamB: room.scores.B,
        });

        if (room.scores[team] >= 10) {
          io.to(roomCode).emit('game-winner', `Team ${team}`);
        }

        dealCards(roomCode);
        return;
      }
    }

    room.turnIndex = (room.turnIndex + 1) % 4;
    io.to(roomCode).emit('update-turn', room.players[room.turnIndex]);
  });

  socket.on('reset-game', () => {
    const roomCode = getRoom(socket);
    if (!roomCode) return;
    rooms[roomCode].scores = { A: 0, B: 0 };
    dealCards(roomCode);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const code in rooms) {
      const room = rooms[code];
      room.players = room.players.filter(p => p !== socket.id);
      if (room.players.length === 0) delete rooms[code];
    }
  });
});

function dealCards(roomCode) {
  const room = rooms[roomCode];
  const deck = fullDeck().sort(() => Math.random() - 0.5);
  room.hands = {};
  room.trump = null;
  room.roundScore = { A: 0, B: 0 };

  for (let i = 0; i < 4; i++) {
    room.hands[room.players[i]] = deck.slice(i * 8, (i + 1) * 8);
    io.to(room.players[i]).emit('deal-cards', room.hands[room.players[i]]);
  }

  room.turnIndex = 0;
  io.to(roomCode).emit('trump-called', null);
}

function determineTrickWinner(room) {
  const leadSuit = room.table[0].card.slice(-1);
  const trump = room.trump;

  const sorted = [...room.table].sort((a, b) => {
    const suitA = a.card.slice(-1);
    const suitB = b.card.slice(-1);
    const rankA = ranks.indexOf(a.card.slice(0, -1));
    const rankB = ranks.indexOf(b.card.slice(0, -1));

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

server.listen(PORT, () => console.log(`Omi server running on port ${PORT}`));
