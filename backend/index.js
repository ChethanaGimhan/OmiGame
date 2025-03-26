socket.on('join-room', (roomCode, playerName) => {
  socket.playerName = playerName;
  socket.join(roomCode);

  if (!rooms[roomCode]) {
    rooms[roomCode] = {
      players: [],
      playerNames: [],
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
  room.playerNames.push(playerName);
  io.to(roomCode).emit('update-players', room.playerNames);

  // Deal 4 cards to each player when all players are ready
  if (room.players.length === 4) {
    dealCards(roomCode);
  }
});

// Trump call logic
socket.on('call-trump', (suit) => {
  const roomCode = getRoom(socket);
  if (!roomCode || rooms[roomCode].trump) return; // Ensure trump is only called once
  rooms[roomCode].trump = suit;
  io.to(roomCode).emit('trump-called', suit);
  io.to(roomCode).emit('update-turn', rooms[roomCode].playerNames[rooms[roomCode].turnIndex]);
});
