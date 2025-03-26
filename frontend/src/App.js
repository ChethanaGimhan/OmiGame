import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://omigame-8izt.onrender.com'); // Replace with backend URL

const App = () => {
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {
    socket.emit('join-room', roomCode);
    setJoined(true);
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
      {/* Game UI */}
    </div>
  );
};

export default App;
