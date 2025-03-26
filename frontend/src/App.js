

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

  const [teams, setTeams] = useState([]); // To manage team assignments

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
    const rank = card.slice(0, card.length - 1);
    const suit = card.slice(-1).toLowerCase();
    return `/assets/cards/${rank}_of_${suit}.png`; // '10_of_spades.png', 'A_of_hearts.png'
  };

  const assignTeams = (players) => {
    // Assign teams in pairs (e.g., 1 and 3 -> Team A, 2 and 4 -> Team B)
    setTeams([
      { team: 'A', members: [players[0], players[2]] },
      { team: 'B', members: [players[1], players[3]] },
    ]);
  };

  useEffect(() => {
    if (players.length === 4) {
      assignTeams(players);
    }
  }, [players]);

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
      <h3>Players: {players.join(', ')}</h3>
      <p>Trump Suit: {trump || 'Not selected yet'}</p>
      <p>Current Turn: {currentTurn}</p>

      {/* Display player names in positions (top, right, bottom, left) */}
      <div className="player-info">
        {players.map((player, idx) => (
          <div
            key={idx}
            className={`player-name player-${idx + 1}`}
            style={{
              color: teams[0].members.includes(player) ? 'blue' : 'green', // Assign colors based on team
            }}
          >
            {player}
          </div>
        ))}
      </div>

      <div className="hand">
        <h3>Your Hand:</h3>
        {hand.map((card, i) => (
          <img
            key={i}
            className="card"
            src={renderCardImage(card)}  // Dynamically load the card images
            alt={card}
            onClick={() => playCard(card)}
          />
        ))}
      </div>

      {/* Only allow the first player to call the trump */}
      {currentTurn === playerName && !trump && (
        <div>
          <h4>Call Trump:</h4>
          {suits.map(suit => (
            <button key={suit} onClick={() => callTrump(suit)}>{suit}</button>
          ))}
        </div>
      )}

      <div className="table">
        <h3>Cards on Table:</h3>
        {tableCards.map((card, i) => (
          <img
            key={i}
            className="card"
            src={renderCardImage(card)}  // Dynamically load the card images
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
    </div>
  );
};

export default App;


