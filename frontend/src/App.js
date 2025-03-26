import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://omigame-8izt.onrender.com'); // Replace with live backend URL

const App = () => {
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [hand, setHand] = useState([]);
  const [turn, setTurn] = useState('');
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });

  useEffect(() => {
    socket.on('update-players', setPlayers);
    socket.on('deal-cards', setHand);
    socket.on('update-turn', setTurn);
    socket.on('update-scores', setScore);

    return () => socket.disconnect();
  }, []);

  const joinRoom = () => {
    socket.emit('join-room', roomCode);
    setJoined(true);
  };

  const playCard = (card) => {
    socket.emit('play-card', card);
    setHand(prev => prev.filter(c => c !== card));
  };

  const callTrump = (suit) => {
    socket.emit('call-trump', suit);
  };

  if (!joined) {
    return (
      <div>
        <h1>Join Omi Room</h1>
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Enter Room Code"
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Room: {roomCode}</h2>
      <h3>Players: {players.join(', ')}</h3>
      <h3>Your Hand:</h3>
      <div>
        {hand.map((card, i) => (
          <button key={i} onClick={() => playCard(card)}>{card}</button>
        ))}
      </div>

      <h3>Turn: {turn}</h3>
      <h3>Score:</h3>
      <p>Team A: {score.teamA}</p>
      <p>Team B: {score.teamB}</p>

      {/* Call Trump */}
      <h4>Call Trump:</h4>
      <button onClick={() => callTrump('♠')}>♠</button>
      <button onClick={() => callTrump('♥')}>♥</button>
      <button onClick={() => callTrump('♦')}>♦</button>
      <button onClick={() => callTrump('♣')}>♣</button>
    </div>
  );
};

export default App;
