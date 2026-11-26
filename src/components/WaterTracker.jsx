import { useState, useEffect } from 'react';

const GLASS_ML = 250;
const STORAGE_KEY = 'water-tracker-v2'; // Stored in your browser's permanent cache
const HISTORY_KEY = 'water-history-v1'; // New cache key for history

export default function WaterTracker() {
  const [ml, setMl] = useState(0);
  const [goalLiters, setGoalLiters] = useState(2);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('2');
  const [mounted, setMounted] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Helper to get today's date
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 1. Load from cache when the app starts or refreshes
  useEffect(() => {
    const today = getTodayStr();

    const saved = localStorage.getItem(STORAGE_KEY);
    const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    let currentMl = 0;
    let currentGoal = 2;

    if (saved) {
      const data = JSON.parse(saved);
      currentGoal = data.goalLiters || 2;
      setGoalLiters(currentGoal);
      setGoalInput(String(currentGoal));
      
      // --- NEW LOGIC: Check if it's a new day ---
      if (data.date === today) {
        // Same day: keep the water value
        currentMl = data.ml || 0;
        setMl(currentMl);
      } else {
        // New day (past 12 AM): Save yesterday's value to history automatically
        if (data.ml > 0) {
          const alreadyLogged = savedHistory.some(item => item.date === data.date);
          if (!alreadyLogged) {
            const newEntry = {
              date: data.date,
              time: '12:00 AM',
              amount: data.ml
            };
            savedHistory.unshift(newEntry); // Add to top of history
            localStorage.setItem(HISTORY_KEY, JSON.stringify(savedHistory));
          }
        }
        // Reset bottle to 0 for the new day
        currentMl = 0;
        setMl(0);
      }
    }

    setHistory(savedHistory);
    setMounted(true);
  }, []);

  // Helper function to save state instantly to cache
  const saveToCache = (newMl, newGoal) => {
    const today = getTodayStr();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ml: newMl, 
      goalLiters: newGoal, 
      date: today 
    }));
  };

  // 2. Save to cache whenever values change
  useEffect(() => {
    if (!mounted) return;
    saveToCache(ml, goalLiters);
  }, [ml, goalLiters, mounted]);

  // 3. Actions that update state AND immediately save to cache
  const addGlass = () => {
    const newMl = ml + GLASS_ML;
    setMl(newMl);
    saveToCache(newMl, goalLiters);
  };

  const removeGlass = () => {
    const newMl = Math.max(ml - GLASS_ML, 0);
    setMl(newMl);
    saveToCache(newMl, goalLiters);
  };

  const startEditGoal = () => {
    setGoalInput(String(goalLiters));
    setEditingGoal(true);
  };

  const saveGoal = () => {
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0 && val <= 10) {
      setGoalLiters(val);
      saveToCache(ml, val);
    }
    setEditingGoal(false);
  };

  const cancelGoal = () => setEditingGoal(false);

  // Calculations
  const liters = (ml / 1000).toFixed(2);
  const goalMl = goalLiters * 1000;
  const percent = Math.min((ml / goalMl) * 100, 100);
  const isComplete = ml >= goalMl;
  const glasses = Math.floor(ml / GLASS_ML);

  const BODY_TOP = 80;
  const BODY_HEIGHT = 110;
  const waterHeight = (percent / 100) * BODY_HEIGHT;
  const waterY = BODY_TOP + (BODY_HEIGHT - waterHeight);

  if (!mounted) return null;

  return (
    <div className="water-card">
      <style>{`
        .water-card {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(33,150,243,0.15);
          max-width: 420px;
          margin: 20px auto;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .water-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 8px;
        }
        .water-title {
          font-size: 18px;
          font-weight: 800;
          color: #0d47a1;
          margin: 0;
        }
        .header-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .history-toggle-btn {
          background: #ffffffaa;
          border: none;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: #1565c0;
          cursor: pointer;
          transition: background 0.15s;
        }
        .history-toggle-btn:hover { background: #ffffff; }
        .history-toggle-btn.active { background: #1565c0; color: white; }

        .goal-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: #1565c0;
          cursor: pointer;
          transition: background 0.15s;
          border: none;
        }
        .goal-controls:hover { background: #f5fbff; }
        .goal-controls span { display: flex; align-items: center; gap: 4px; }
        .goal-controls .edit-icon { font-size: 11px; opacity: 0.6; }
        .goal-edit-box {
          display: flex;
          align-items: center;
          gap: 4px;
          background: white;
          padding: 4px 6px;
          border-radius: 20px;
          font-size: 12px;
        }
        .goal-input {
          width: 50px;
          border: 1px solid #90caf9;
          border-radius: 8px;
          padding: 4px 6px;
          font-size: 12px;
          font-weight: 700;
          color: #1565c0;
          text-align: center;
          outline: none;
          font-family: inherit;
        }
        .goal-input:focus { border-color: #1976d2; }
        .goal-small-btn {
          background: #e3f2fd;
          border: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          color: #1565c0;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .goal-small-btn.save { background: #c8e6c9; color: #2E7D32; }
        .water-body { display: flex; gap: 24px; align-items: center; }
        .bottle-wrapper {
          position: relative;
          width: 110px;
          height: 200px;
          flex-shrink: 0;
        }
        .bottle-svg {
          width: 100%; height: 100%;
          filter: drop-shadow(0 6px 10px rgba(33,150,243,0.2));
          overflow: visible;
        }
        .water-fill {
          transition: y 0.6s cubic-bezier(0.4,0,0.2,1),
                      height 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .water-wave { animation: waveMove 2.5s linear infinite; }
        @keyframes waveMove {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100px); }
        }
        .bottle-percent {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 20px;
          font-weight: 800;
          color: #0d47a1;
          text-shadow: 0 1px 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.6);
          pointer-events: none;
          z-index: 2;
        }
        .water-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .water-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #1976d2;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }
        .water-stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0d47a1;
          line-height: 1;
        }
        .water-stat-value small {
          font-size: 13px;
          font-weight: 700;
          color: #1976d2;
          margin-left: 3px;
        }
        .glasses-dots {
          display: flex;
          gap: 6px;
          margin-top: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .glass-dot {
          width: 22px;
          height: 26px;
          border-radius: 4px;
          background: #ffffffaa;
          border: 2px solid #90caf9;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .glass-dot.filled {
          background: linear-gradient(180deg, #64b5f6, #1976d2);
          border-color: #1565c0;
          box-shadow: 0 3px 8px rgba(33,150,243,0.5);
          transform: translateY(-2px);
        }
        .water-buttons {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        .water-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 22px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
        }
        .water-btn:active { transform: scale(0.95); }
        .water-btn-add {
          background: linear-gradient(135deg, #42a5f5, #1976d2);
          color: white;
          box-shadow: 0 6px 16px rgba(33,150,243,0.5);
        }
        .water-btn-remove {
          background: white;
          color: #1976d2;
          border: 2px solid #90caf9;
        }
        .water-complete {
          margin-top: 14px;
          padding: 10px;
          background: linear-gradient(135deg, #66bb6a, #43a047);
          color: white;
          border-radius: 12px;
          text-align: center;
          font-weight: 700;
          font-size: 14px;
          animation: pop 0.4s ease-out;
          box-shadow: 0 6px 16px rgba(76,175,80,0.4);
        }
        @keyframes pop {
          0%   { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1);    opacity: 1; }
        }

        /* History Section Styles */
        .history-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 2px dashed #90caf9;
        }
        .history-title {
          font-size: 14px;
          font-weight: 800;
          color: #0d47a1;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 150px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 8px 12px;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .history-date { font-size: 12px; font-weight: 700; color: #333; }
        .history-time { font-size: 10px; color: #888; }
        .history-badge {
          background: #e8f5e9;
          color: #2E7D32;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 12px;
        }
        .no-history {
          font-size: 12px;
          color: #666;
          text-align: center;
          font-style: italic;
          padding: 10px;
        }
      `}</style>

      <div className="water-header">
        <h3 className="water-title">💧 Water Tracker</h3>

        <div className="header-actions">
          <button 
            className={`history-toggle-btn ${showHistory ? 'active' : ''}`} 
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'History'}
          </button>

          {editingGoal ? (
            <div className="goal-edit-box">
              <input
                className="goal-input"
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveGoal();
                  if (e.key === 'Escape') cancelGoal();
                }}
                autoFocus
              />
              <span style={{ fontSize: '12px', color: '#1565c0', fontWeight: 700 }}>L</span>
              <button className="goal-small-btn save" onClick={saveGoal}>✓</button>
              <button className="goal-small-btn" onClick={cancelGoal}>✕</button>
            </div>
          ) : (
            <button className="goal-controls" onClick={startEditGoal} title="Edit goal">
              <span>
                Goal: {goalLiters}L <span className="edit-icon">✏️</span>
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="water-body">
        <div className="bottle-wrapper">
          <svg className="bottle-svg" viewBox="0 0 100 200">
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4fc3f7" />
                <stop offset="100%" stopColor="#0288d1" />
              </linearGradient>
              <clipPath id="bottleClip">
                <path d="M 35 25 L 35 45 Q 18 55 18 82 L 18 175 Q 18 192 35 192 L 65 192 Q 82 192 82 175 L 82 82 Q 82 55 65 45 L 65 25 Z" />
              </clipPath>
            </defs>

            <path
              d="M 35 25 L 35 45 Q 18 55 18 82 L 18 175 Q 18 192 35 192 L 65 192 Q 82 192 82 175 L 82 82 Q 82 55 65 45 L 65 25"
              fill="#fafafa"
              stroke="#90caf9"
              strokeWidth="2.5"
            />

            <rect x="33" y="12" width="34" height="16" rx="4" fill="#1976d2" />
            <rect x="33" y="12" width="34" height="6" rx="3" fill="#42a5f5" opacity="0.6" />

            <g clipPath="url(#bottleClip)">
              <rect
                className="water-fill"
                x="0"
                y={waterY}
                width="100"
                height={waterHeight}
                fill="url(#waterGrad)"
              />
              {percent > 0 && percent < 100 && (
                <g transform={`translate(0, ${waterY})`}>
                  <path
                    className="water-wave"
                    d="M 0 0 Q 25 -6 50 0 Q 75 6 100 0 Q 125 -6 150 0 Q 175 6 200 0 L 200 20 L 0 20 Z"
                    fill="#4fc3f7"
                    opacity="0.85"
                  />
                </g>
              )}
            </g>

            <path
              d="M 26 90 L 26 168"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>

          <div className="bottle-percent">{Math.round(percent)}%</div>
        </div>

        <div className="water-info">
          <div>
            <div className="water-stat-label">Today</div>
            <div className="water-stat-value">{ml}<small>ml</small></div>
          </div>
          <div>
            <div className="water-stat-label">Total</div>
            <div className="water-stat-value">{liters}<small>L</small></div>
          </div>
          <div>
            <div className="water-stat-label">Goal</div>
            <div className="water-stat-value">{goalLiters}<small>L</small></div>
          </div>
        </div>
      </div>

      <div className="glasses-dots">
        {Array.from({ length: Math.max(Math.ceil(goalMl / GLASS_ML), glasses) }).map((_, i) => (
          <div key={i} className={`glass-dot ${i < glasses ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="water-buttons">
        <button className="water-btn water-btn-remove" onClick={removeGlass}>−</button>
        <button className="water-btn water-btn-add" onClick={addGlass}>+</button>
      </div>

      {isComplete && (
        <div className="water-complete">
          🎉 Goal reached! {liters}L of water today. Great job!
        </div>
      )}

      {showHistory && (
        <div className="history-section">
          <div className="history-title">📜 Past Days (Auto-saved at 12 AM)</div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="no-history">No history yet. Tomorrow at 12 AM, today's data will appear here.</div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="history-item">
                  <div>
                    <div className="history-date">{item.date}</div>
                    <div className="history-time">Saved at {item.time}</div>
                  </div>
                  <div className="history-badge">{item.amount} ml</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}