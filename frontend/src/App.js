
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('https://omigame-8izt.onrender.com'); // Replace with your deployed backend URL

const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
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
  const [playerName, setPlayerName] = useState('');
  const [userName, setUserName] = useState('');

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
    if (!playerName) {
      alert('Please enter your name to play!');
      return;
    }

    setUserName(playerName);
    socket.emit('join-room', roomCode, playerName);
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

  const renderCardImage = (card) => {
    const [rank, suit] = card.split('');
    return `/assets/cards/${rank}${suit}.png`; // Assuming images are stored in assets folder
  };

  if (!joined) {
    return (
      <div className="lobby">
        <h1>Join Omi Room</h1>
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Enter Room Code"
        />
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter Your Name"
        />
        <button onClick={joinRoom}>Join Game</button>
      </div>
    );
  }

  return (
    <div className="game">
      <h2>Room: {roomCode}</h2>
      <p>Players: {players.join(', ')}</p>
      <p>Trump Suit: {trump || 'Not selected yet'}</p>
      <p>Current Turn: {currentTurn}</p>

      <div className="hand">
        <h3>Your Hand:</h3>
        {hand.map((card, i) => (
          <img
            key={i}
            className="card"
            src={renderCardImage(card)}
            alt={card}
            onClick={() => playCard(card)}
          />
        ))}
      </div>

      <div className="table">
        <h3>Cards on Table:</h3>
        {tableCards.map((card, i) => (
          <img
            key={i}
            className="card"
            src={renderCardImage(card)}
            alt={card}
          />
        ))}
      </div>

      <div className="scoreboard">
        <h3>Score:</h3>
        <p>Team A: {score.teamA} pts</p>
        <p>Team B: {score.teamB} pts</p>
      </div>

      {winner && (
        <div className="winner">
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

