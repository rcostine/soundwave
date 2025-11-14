// src/InstructorSetup.jsx
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useMemo, useState } from 'react';
import { database } from './firebase';
import { ref, onValue, get, set } from 'firebase/database';

const ANCHOR = 50;

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function computeRoundOutcome(config, price) {
  const { baseDemand, priceSensitivity, fixedCost, variableCost } = config;
  const raw = baseDemand - priceSensitivity * (price - ANCHOR);
  const base = Math.max(0, raw);
  const noiseFactor = 1 + ((Math.random() * 0.2) - 0.1); // ε ~ U(-0.1, +0.1)
  const demand = Math.floor(clamp(base * noiseFactor, 0, Number.MAX_SAFE_INTEGER));
  const revenue = price * demand;
  const cost = fixedCost + variableCost * demand;
  const profit = revenue - cost;
  return { demand, revenue, cost, profit };
}

export default function Game() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');

  const teamKey = localStorage.getItem('teamKey') || '';
  const teamName = localStorage.getItem('teamName') || '';

  const ready = useMemo(() => {
    return !!(game && game.status === 'active' && game.config && game.pricingOptions && game.numRounds);
  }, [game]);

  useEffect(() => {
    // Subscribe to /game and /leaderboard
    const offGame = onValue(ref(database, 'game'), (snap) => {
      setGame(snap.val());
      setLoading(false);
    });

    const offLb = onValue(ref(database, 'leaderboard'), (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([k, v]) => ({ key: k, ...(v || {}) }));
      list.sort((a, b) => (b.totalProfit || 0) - (a.totalProfit || 0));
      setLeaderboard(list);
    });

    // Load existing team state if any (resume)
    const teamRef = ref(database, `teams/${teamKey}`);
    get(teamRef).then((snap) => {
      const val = snap.val();
      if (val && Array.isArray(val.history)) {
        setHistory(val.history);
        setTotalProfit(val.totalProfit || 0);
        setRound((val.history?.length || 0) + 1);
      }
    }).catch(() => {});

    return () => { offGame(); offLb(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseOption = async (optionKey) => {
    try {
      setError('');
      if (!teamKey || !teamName) {
        setError('Missing team identity. Please return to Home and join.');
        return;
      }
      if (!ready) {
        setError('Waiting for instructor…');
        return;
      }
      if (round > game.numRounds) return;

      const opt = game.pricingOptions?.[optionKey];
      if (!opt) {
        setError('Invalid option.');
        return;
      }
      const price = Number(opt.price) || 0;
      const outcome = computeRoundOutcome(game.config, price);

      const entry = {
        round,
        optionKey,
        price,
        demand: outcome.demand,
        revenue: outcome.revenue,
        cost: outcome.cost,
        profit: outcome.profit
      };

      const newHistory = [...history, entry];
      const newTotal = (totalProfit || 0) + outcome.profit;

      // Persist to /teams/{teamKey} and /leaderboard/{teamKey}
      await set(ref(database, `teams/${teamKey}`), {
        name: teamName,
        joinedAt: Date.now(), // harmless refresh
        totalProfit: newTotal,
        history: newHistory
      });

      await set(ref(database, `leaderboard/${teamKey}`), {
        name: teamName,
        totalProfit: newTotal
      });

      setHistory(newHistory);
      setTotalProfit(newTotal);
      setRound((r) => r + 1);
    } catch (e) {
      console.error(e);
      setError('Failed to submit choice. Please try again.');
    }
  };

  if (loading) {
    return <div className="muted">Loading…</div>;
  }

  if (!ready) {
    return (
      <div>
        <h2 className="title">Game</h2>
        <p className="warn">Waiting for instructor… or configuration is incomplete.</p>
        {!teamKey && <p className="error">No team selected. Go to Home and join.</p>}
      </div>
    );
  }

  const isOver = round > game.numRounds;

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 className="title">Round {isOver ? game.numRounds : round} / {game.numRounds}</h2>
          <p className="muted">Team: <strong>{teamName || 'Unknown'}</strong></p>
          <p className="muted">Total Profit: <strong>${totalProfit.toLocaleString()}</strong></p>
        </div>
        <div>
          <span className="pill">Fixed: ${game.config.fixedCost}</span>
          <span className="pill">Var/unit: ${game.config.variableCost}</span>
          <span className="pill">Base Dem: {game.config.baseDemand}</span>
          <span className="pill">Sensitivity: {game.config.priceSensitivity}</span>
        </div>
      </div>

      {!isOver ? (
        <>
          <h3>Choose a Pricing Option</h3>
          <div className="option-grid">
            {(['A','B','C','D']).map((k) => {
              const opt = game.pricingOptions[k];
              return (
                <button key={k} className="option-btn" onClick={() => chooseOption(k)}>
                  <div style={{fontSize:14, opacity:.8}}>Option {k}</div>
                  <div style={{fontSize:20, fontWeight:800}}>{opt?.label || k}</div>
                  <div className="muted">Price: ${opt?.price ?? 0}</div>
                </button>
              );
            })}
          </div>

          <div style={{marginTop:18}}>
            <h3>Round History</h3>
            {history.length === 0 && <div className="muted">No rounds played yet.</div>}
            {history.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Round</th><th>Option</th><th>Price</th><th>Demand</th><th>Revenue</th><th>Cost</th><th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.round}>
                      <td>{h.round}</td>
                      <td>{h.optionKey}</td>
                      <td>${h.price}</td>
                      <td>{h.demand}</td>
                      <td>${h.revenue.toLocaleString()}</td>
                      <td>${h.cost.toLocaleString()}</td>
                      <td style={{fontWeight:700}}>${h.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Game Over</h3>
          <p className="success">Well played! Here’s your full round history and the live leaderboard.</p>
          <div style={{marginTop:12}}>
            <h4>Your History</h4>
            <table>
              <thead>
                <tr>
                  <th>Round</th><th>Option</th><th>Price</th><th>Demand</th><th>Revenue</th><th>Cost</th><th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.round}>
                    <td>{h.round}</td>
                    <td>{h.optionKey}</td>
                    <td>${h.price}</td>
                    <td>{h.demand}</td>
                    <td>${h.revenue.toLocaleString()}</td>
                    <td>${h.cost.toLocaleString()}</td>
                    <td style={{fontWeight:700}}>${h.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{marginTop:18}}>
        <h3>Live Leaderboard</h3>
        <div className="grid">
          {leaderboard.map((row, i) => (
            <div key={row.key} className="leaderboard-row">
              <div>#{i+1} — <strong>{row.name}</strong></div>
              <div>${(row.totalProfit || 0).toLocaleString()}</div>
            </div>
          ))}
          {leaderboard.length === 0 && <div className="muted">No entries yet.</div>}
        </div>
      </div>

      {error && <p className="error" style={{marginTop:12}}>{error}</p>}
    </div>
  );
}
