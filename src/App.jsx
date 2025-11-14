import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Landing from './Landing.jsx';
import WaitingRoom from './WaitingRoom.jsx';
import InstructorSetup from './InstructorSetup.jsx';
import Game from './Game.jsx';

export default function App() {
  return (
    <div className="container">
      <header style={{marginBottom:16}}>
        <div className="row" style={{alignItems:'center', justifyContent:'space-between'}}>
          <h1 className="title">SoundWave Live</h1>
          <nav className="row" style={{gap:8}}>
            <Link to="/" className="pill">Home</Link>
            <Link to="/waiting" className="pill">Waiting</Link>
            <Link to="/game" className="pill">Game</Link>
            <Link to="/instructor" className="pill">Instructor</Link>
          </nav>
        </div>
        <p className="subtitle">A real-time multi-team pricing simulation (React + Firebase).</p>
      </header>

      <div className="card">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/waiting" element={<WaitingRoom />} />
          <Route path="/game" element={<Game />} />
          <Route path="/instructor" element={<InstructorSetup />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}
