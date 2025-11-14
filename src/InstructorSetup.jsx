import React, { useEffect, useState } from 'react';
import { database } from './firebase';
import { ref, set, update, onValue, get } from 'firebase/database';

const defaultOptions = {
  A: { label: 'Economy', price: 40 },
  B: { label: 'Standard', price: 50 },
  C: { label: 'Premium', price: 60 },
  D: { label: 'VIP', price: 75 }
};

const defaultConfig = {
  fixedCost: 1000,
  variableCost: 10,
  baseDemand: 1200,
  priceSensitivity: 8
};

export default function InstructorSetup() {
  const [numRounds, setNumRounds] = useState(5);
  const [config, setConfig] = useState(defaultConfig);
  const [pricingOptions, setPricingOptions] = useState(defaultOptions);
  const [status, setStatus] = useState('idle');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const gameRef = ref(database, 'game');
    const offGame = onValue(gameRef, (snap) => {
      const val = snap.val() || {};
      setStatus(val.status || 'idle');
      setNumRounds(val.numRounds || numRounds);
      setConfig(val.config || config);
      setPricingOptions(val.pricingOptions || pricingOptions);
    });

    const teamsRef = ref(database, 'teams');
    const offTeams = onValue(teamsRef, (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([k, v]) => ({ key: k, ...v }));
      list.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      setTeams(list);
    });

    return () => { offGame(); offTeams(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveConfiguration = async () => {
    try {
      setBusy(true);
      setError('');
      const gameObj = {
        status: 'idle',
        numRounds: Number(numRounds) || 1,
        config: {
          fixedCost: Number(config.fixedCost) || 0,
          variableCost: Number(config.variableCost) || 0,
          baseDemand: Number(config.baseDemand) || 0,
          priceSensitivity: Number(config.priceSensitivity) || 0
        },
        pricingOptions: {
          A: { label: pricingOptions.A?.label || 'A', price: Number(pricingOptions.A?.price) || 0 },
          B: { label: pricingOptions.B?.label || 'B', price: Number(pricingOptions.B?.price) || 0 },
          C: { label: pricingOptions.C?.label || 'C', price: Number(pricingOptions.C?.price) || 0 },
          D: { label: pricingOptions.D?.label || 'D', price: Number(pricingOptions.D?.price) || 0 }
        }
      };
      await set(ref(database, 'game'), gameObj);
    } catch (e) {
      console.error(e);
      setError('Failed to save configuration.');
    } finally {
      setBusy(false);
    }
  };

  const startGame = async () => {
    try {
      setBusy(true);
      setError('');
      const gameSnap = await get(ref(database, 'game'));
      const game = gameSnap.val();
      if (!game || !game.config || !game.pricingOptions || !game.numRounds) {
        setError('Game configuration incomplete. Please save configuration first.');
        return;
      }
      await update(ref(database, 'game'), {
        status: 'active',
        startedAt: Date.now()
      });
    } catch (e) {
      console.error(e);
      setError('Failed to start game.');
    } finally {
      setBusy(false);
    }
  };

  const resetSession = async () => {
    try {
      setBusy(true);
      setError('');
      // Preserve last config if present
      const curr = (await get(ref(database, 'game'))).val() || {};
      const preserved = {
        status: 'idle',
        numRounds: curr.numRounds || numRounds,
        config: curr.config || config,
        pricingOptions: curr.pricingOptions || pricingOptions
      };
      await set(ref(database, 'teams'), null);
      await set(ref(database, 'leaderboard'), null);
      await set(ref(database, 'game'), preserved);
    } catch (e) {
      console.error(e);
      setError('Failed to reset session.');
    } finally {
      setBusy(false);
    }
  };

  const bindOption = (key, field, val) => {
    setPricingOptions((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: field === 'price' ? Number(val) : val }
    }));
  };

  return (
    <div>
      <h2 className="title">Instructor Console</h2>
      <p className="muted">Configure market parameters, pricing options, and control the session.</p>

      <div className="grid">
        <div className="card">
          <h3>Market Settings</h3>
          <label>Number of Rounds</label>
          <input type="number" min="1" value={numRounds} onChange={e => setNumRounds(e.target.value)} />

          <label>Fixed Cost</label>
          <input type="number" value={config.fixedCost} onChange={e => setConfig({ ...config, fixedCost: Number(e.target.value) })} />

          <label>Variable Cost (per unit)</label>
          <input type="number" value={config.variableCost} onChange={e => setConfig({ ...config, variableCost: Number(e.target.value) })} />

          <label>Base Demand</label>
          <input type="number" value={config.baseDemand} onChange={e => setConfig({ ...config, baseDemand: Number(e.target.value) })} />

          <label>Price Sensitivity</label>
          <input type="number" value={config.priceSensitivity} onChange={e => setConfig({ ...config, priceSensitivity: Number(e.target.value) })} />
        </div>

        <div className="card">
          <h3>Pricing Options (A–D)</h3>
          {(['A','B','C','D']).map((k) => (
            <div key={k} className="row" style={{alignItems:'center'}}>
              <div style={{minWidth:32, fontWeight:700}}>{k}</div>
              <div style={{flex:2}}>
                <label>Label</label>
                <input value={pricingOptions[k]?.label || ''} onChange={e => bindOption(k, 'label', e.target.value)} />
              </div>
              <div style={{flex:1}}>
                <label>Price</label>
                <input type="number" value={pricingOptions[k]?.price ?? 0} onChange={e => bindOption(k, 'price', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{marginTop:12}}>
        <button className="btn" onClick={saveConfiguration} disabled={busy}>Save Configuration</button>
        <button className="btn secondary" onClick={startGame} disabled={busy}>Start Game</button>
        <button className="btn danger" onClick={resetSession} disabled={busy}>Reset Session</button>
        <span className="pill">Status: {status}</span>
      </div>
      {error && <p className="error" style={{marginTop:10}}>{error}</p>}

      <div style={{marginTop:18}}>
        <h3>Live Teams</h3>
        <div className="grid">
          {teams.map((t) => (
            <div key={t.key} className="leaderboard-row">
              <div>{t.name}</div>
              <div className="muted">{new Date(t.joinedAt || 0).toLocaleTimeString()}</div>
            </div>
          ))}
          {teams.length === 0 && <div className="muted">No teams yet.</div>}
        </div>
      </div>
    </div>
  );
}
