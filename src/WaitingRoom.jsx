import React, { useEffect, useState, useRef } from 'react';
import { database } from './firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

export default function WaitingRoom() {
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    const teamsQ = query(ref(database, 'teams'), orderByChild('joinedAt'));
    const offTeams = onValue(teamsQ, (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val)
        .map(([k, v]) => ({ key: k, ...v }))
        .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      setTeams(list);
    });

    const statusRef = ref(database, 'game/status');
    const offStatus = onValue(statusRef, (snap) => {
      const s = snap.val() || 'idle';
      setStatus(s);
      if (s === 'active') {
        // 5-second countdown
        setCountdown(5);
      } else {
        setCountdown(null);
      }
    });

    return () => {
      offTeams();
      offStatus();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Manage countdown
  useEffect(() => {
    if (countdown === null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return c;
        if (c <= 1) {
          clearInterval(timerRef.current);
          navigate('/game');
          return null;
        }
        return c - 1;
      });
    }, 1000);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [countdown, navigate]);

  return (
    <div>
      <h2 className="title">Waiting Room</h2>
      <p className="muted">Teams Joined:</p>
      <div className="grid">
        {teams.map((t) => (
          <div key={t.key} className="leaderboard-row" title={t.name}>
            <div style={{fontWeight:700}}>{t.name}</div>
            <div className="muted">{new Date(t.joinedAt || 0).toLocaleTimeString()}</div>
          </div>
        ))}
        {teams.length === 0 && <div className="muted">No teams yet. Share the URL with your class.</div>}
      </div>

      <div style={{marginTop:18}}>
        <span className="pill">Game Status: {status}</span>
        {status !== 'active' && <p className="muted">Waiting for instructor to start…</p>}
        {status === 'active' && countdown !== null && (
          <h3 className="success">Starting in {countdown}…</h3>
        )}
      </div>
    </div>
  );
}
