import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from './firebase';
import { ref, get, set } from 'firebase/database';

function sanitizeTeamKey(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[.#$/\[\]]/g, '_');
}

export default function Landing() {
  const [teamName, setTeamName] = useState(localStorage.getItem('teamName') || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name = teamName.trim();
    if (!name) {
      setError('Please enter a team name.');
      return;
    }
    const teamKey = sanitizeTeamKey(name);
    if (!teamKey) {
      setError('Team name invalid.');
      return;
    }

    try {
      setBusy(true);
      const teamRef = ref(database, `teams/${teamKey}`);
      const snap = await get(teamRef);
      if (snap.exists()) {
        setError('This team name is taken. Please choose another.');
        setBusy(false);
        return;
      }

      const now = Date.now();
      await set(teamRef, {
        name,
        joinedAt: now,
        totalProfit: 0,
        history: []
      });

      // Persist identity locally for other screens
      localStorage.setItem('teamKey', teamKey);
      localStorage.setItem('teamName', name);

      navigate('/waiting');
    } catch (err) {
      console.error(err);
      setError('Failed to join. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="title">Join the Game</h2>
      <p className="muted">Enter a unique team name to join the session lobby.</p>
      <form onSubmit={handleSubmit} className="grid">
        <div>
          <label htmlFor="teamName">Team Name</label>
          <input
            id="teamName"
            placeholder="e.g., Team Alpha"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={busy}
          />
        </div>
        <div>
          <label>&nbsp;</label>
          <button className="btn" type="submit" disabled={busy}>Join Lobby</button>
        </div>
      </form>
      {error && <p className="error" style={{marginTop:12}}>{error}</p>}
      <p className="muted" style={{marginTop:16}}>
        Your team key is derived and sanitized: spaces → <code>_</code>, and <code>[.#$/[]]</code> → <code>_</code>.
      </p>
    </div>
  );
}
