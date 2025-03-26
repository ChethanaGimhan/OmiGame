import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://omigame-8izt.onrender.com'); // Replace with live backend URL

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const App = () => {
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [hand, setHand] = useState([]);
  const [trump, setTrump] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [tableCards, setTableCards] = useState([]);
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.on('update-players', setPlayers);
    socket.on('deal-cards', setHand);
    socket.on('trump-called', setTrump);
    socket.on('update-turn', setCurrentTurn);
    socket.on('update-table', (cards) => {
      setTableCards(cards);
    });
    socket.on('update-score', setScore);
    socket.on('game-winner', setWinner);

    return () => socket.disconnect();
  }, []);

  const joinRoom = () => {
    socket.emit('join-room', roomCode);
    setJoined(true);
  };

  const callTrump = (suit) => {
    socket.emit('call-trump', suit);
  };

  const playCard = (card) => {
    socket.emit('play-card', card);
    setHand(prev => prev.filter(c => c !== card));
  };

  const resetGame = () => {
    socket.emit('reset-game');
    setWinner(null);
  };

  if (!joined) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <h1>Join Omi Room</h1>
        <input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="Enter Room Code" />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Room: {roomCode}</h2>
      <p>Players: {players.join(', ')}</p>
      <p>Trump Suit: {trump || 'Not selected yet'}</p>
      <p>Current Turn: {currentTurn}</p>

      <h3>Your Hand:</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {hand.map((card, i) => (
          <button key={i} onClick={() => playCard(card)}>{card}</button>
        ))}
      </div>

      <h3>Cards on Table:</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {tableCards.map((card, i) => (
          <div key={i} style={{ border: '1px solid black', padding: 10 }}>{card}</div>
        ))}
      </div>

      <h3>Score:</h3>
      <p>Team A: {score.teamA} pts</p>
      <p>Team B: {score.teamB} pts</p>

      {winner && (
        <div style={{ marginTop: 20, padding: 10, background: 'lightgreen' }}>
          <h2>{winner} wins the game! 🎉</h2>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}

      {!trump && (
        <div>
          <h4>Call Trump:</h4>
          {suits.map(suit => (
            <button key={suit} onClick={() => callTrump(suit)}>{suit}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;

