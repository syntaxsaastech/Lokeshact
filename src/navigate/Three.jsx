import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { showReminder } from "../services/notifications";
import { fetchWeights, saveWeight, deleteWeight } from '../services/weightApi';

const STORAGE_KEY = 'body-metrics-v2';

export default function Three() {
  // --- Profile ---
  const [heightCm, setHeightCm] = useState(170);
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(25);
  const [goalWeight, setGoalWeight] = useState(70);

  // --- Entry form ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [neck, setNeck] = useState('');

  const [records, setRecords] = useState([]);
  const [view, setView] = useState('all');
  const [loaded, setLoaded] = useState(false); // avoids overwriting the cache before data is loaded

  // --- Load: profile from localStorage, records from Excel (cache is fallback) + reminder ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const cached = saved ? JSON.parse(saved) : {};

    setHeightCm(cached.heightCm || 170);
    setGender(cached.gender || 'male');
    setAge(cached.age || 25);
    setGoalWeight(cached.goalWeight || 70);

    const todayStr = new Date().toISOString().split('T')[0];

    const checkReminder = (recs) => {
      const hasLoggedToday = recs.some((r) => r.date === todayStr);
      if (new Date().getHours() >= 8 && !hasLoggedToday) {
        showReminder("Weight Check ⚖️", "Good morning! Don't forget to log your weight and body metrics today.");
      }
    };

    fetchWeights()
      .then((recs) => {
        setRecords(recs);
        checkReminder(recs);
      })
      .catch((err) => {
        console.error('Server unavailable, using cache:', err);
        const recs = cached.records || [];
        setRecords(recs);
        checkReminder(recs);
      })
      .finally(() => setLoaded(true));
  }, []);

  // --- Save to cache (only after the first load finishes) ---
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      records, heightCm, gender, age, goalWeight
    }));
  }, [loaded, records, heightCm, gender, age, goalWeight]);

  // --- AUTO CALCULATORS ---
  const calculateAll = (w, h, g, a, waistCm, hipCm, neckCm) => {
    if (!w || !h) return { bmi: null, idealWeight: null, bodyFat: null, muscleMass: null, fatMass: null, healthyMin: null, healthyMax: null };

    const hM = h / 100;
    const bmi = +(w / (hM * hM)).toFixed(1);

    // Ideal weight (Devine formula)
    const inchesOver60 = (h / 2.54) - 60;
    const idealWeight = g === 'male'
      ? +(50 + 2.3 * inchesOver60).toFixed(1)
      : +(45.5 + 2.3 * inchesOver60).toFixed(1);

    // Body Fat % (US Navy formula)
    let bodyFat = null;
    if (waistCm && neckCm && (g === 'male' || hipCm)) {
      if (g === 'male') {
        bodyFat = +(495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(h)) - 450).toFixed(1);
      } else {
        bodyFat = +(495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(h)) - 450).toFixed(1);
      }
      if (bodyFat < 2 || bodyFat > 70) bodyFat = null; // sanity check
    }

    // Lean mass
    const muscleMass = bodyFat !== null ? +(w * (1 - bodyFat / 100)).toFixed(1) : null;

    // Healthy weight range (BMI 18.5 – 24.9)
    const healthyMin = +(18.5 * hM * hM).toFixed(1);
    const healthyMax = +(24.9 * hM * hM).toFixed(1);

    // Fat mass
    const fatMass = bodyFat !== null ? +(w * (bodyFat / 100)).toFixed(1) : null;

    return { bmi, idealWeight, bodyFat, muscleMass, fatMass, healthyMin, healthyMax };
  };

  // --- Add new record (auto-calculated) + save to Excel ---
  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!weight) return alert('Please enter your weight.');

    const calc = calculateAll(parseFloat(weight), heightCm, gender, age, parseFloat(waist), parseFloat(hip), parseFloat(neck));

    const newRecord = {
      id: Date.now(),
      date,
      weight: parseFloat(weight),
      waist: waist ? parseFloat(waist) : null,
      hip: hip ? parseFloat(hip) : null,
      neck: neck ? parseFloat(neck) : null,
      ...calc,
    };

    const filtered = records.filter(r => r.date !== date);
    const updated = [...filtered, newRecord].sort((a, b) => new Date(a.date) - new Date(b.date));
    setRecords(updated);

    // 💾 Save to server/data/weight.xlsx
    saveWeight(newRecord).catch((err) => alert('Could not save to Excel: ' + err.message));

    setWeight(''); setWaist(''); setHip(''); setNeck('');
  };

  // --- Delete record + delete from Excel ---
  const handleDelete = (id) => {
    setRecords(records.filter(r => r.id !== id));
    deleteWeight(id).catch((err) => alert('Could not delete from Excel: ' + err.message));
  };

  // --- Live Preview & Latest Data Logic ---
  const latest = records.length > 0 ? records[records.length - 1] : null;

  // If the user is typing in the form, use that. Otherwise, use the latest saved record.
  const previewWeight = parseFloat(weight) || (latest ? latest.weight : 0);
  const previewWaist = parseFloat(waist) || (latest ? latest.waist : null);
  const previewNeck = parseFloat(neck) || (latest ? latest.neck : null);
  const previewHip = parseFloat(hip) || (latest ? latest.hip : null);

  const previewCalc = calculateAll(
    previewWeight,
    heightCm,
    gender,
    age,
    previewWaist,
    previewHip,
    previewNeck
  );

  const first = records.length > 0 ? records[0] : null;
  const currentWeight = latest ? latest.weight : 0;
  const weightChange = first && latest ? (latest.weight - first.weight).toFixed(1) : 0;
  const weightToGoal = latest ? (currentWeight - goalWeight).toFixed(1) : 0;

  const getBmiCategory = (b) => {
    if (!b) return { label: '--', color: '#888' };
    if (b < 18.5) return { label: 'Underweight', color: '#f57c00' };
    if (b < 25) return { label: 'Normal', color: '#2e7d32' };
    if (b < 30) return { label: 'Overweight', color: '#f57c00' };
    return { label: 'Obese', color: '#c62828' };
  };
  const bmiCat = getBmiCategory(previewCalc.bmi);

  const getFatCategory = (bf) => {
    if (!bf) return { label: '--', color: '#888' };
    if (gender === 'male') {
      if (bf < 6) return { label: 'Essential', color: '#f57c00' };
      if (bf < 14) return { label: 'Athletic', color: '#2e7d32' };
      if (bf < 18) return { label: 'Fitness', color: '#2e7d32' };
      if (bf < 25) return { label: 'Average', color: '#f57c00' };
      return { label: 'High', color: '#c62828' };
    } else {
      if (bf < 14) return { label: 'Essential', color: '#f57c00' };
      if (bf < 21) return { label: 'Athletic', color: '#2e7d32' };
      if (bf < 25) return { label: 'Fitness', color: '#2e7d32' };
      if (bf < 32) return { label: 'Average', color: '#f57c00' };
      return { label: 'High', color: '#c62828' };
    }
  };
  const fatCat = getFatCategory(previewCalc.bodyFat);

  const getChartData = () => {
    const now = new Date();
    let f = records;
    if (view === 'week') {
      const d = new Date(); d.setDate(now.getDate() - 7);
      f = records.filter(r => new Date(r.date) >= d);
    } else if (view === 'month') {
      const d = new Date(); d.setMonth(now.getMonth() - 1);
      f = records.filter(r => new Date(r.date) >= d);
    }
    return f.map(r => ({ ...r, displayDate: r.date.slice(5) }));
  };
  const chartData = getChartData();

  const getReport = (days) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const range = records.filter(r => new Date(r.date) >= cutoff);
    if (range.length < 2) return null;
    return {
      start: range[0].weight,
      end: range[range.length - 1].weight,
      change: (range[range.length - 1].weight - range[0].weight).toFixed(1),
      startDate: range[0].date,
      endDate: range[range.length - 1].date,
    };
  };
  const weekReport = getReport(7);
  const monthReport = getReport(30);

  // --- Styles ---
  const cardStyle = { background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 20 };
  const inputStyle = { width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, marginTop: 4, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const statBox = { flex: 1, background: '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center', minWidth: 120 };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 20 }}>⚖️ Weight & Body Metrics </h1>

      {/* PROFILE SETTINGS */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>⚙️ Your Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Height (cm)</label>
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Goal Weight (kg)</label>
            <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* LIVE SUMMARY */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📊 Live Calculation</h3>
        <p style={{ color: '#666', fontSize: 13, marginTop: -8 }}>
          This updates as you type in the "Log Today" form below. If empty, it shows your latest saved data.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={statBox}>
            <div style={labelStyle}>Weight</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{previewWeight ? `${previewWeight}` : '--'} <small style={{ fontSize: 14 }}>kg</small></div>
          </div>
          <div style={statBox}>
            <div style={labelStyle}>BMI</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bmiCat.color }}>{previewCalc.bmi || '--'}</div>
            <div style={{ fontSize: 11, color: bmiCat.color, fontWeight: 700 }}>{bmiCat.label}</div>
          </div>
          <div style={statBox}>
            <div style={labelStyle}>Ideal Weight</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{previewCalc.idealWeight || '--'} <small style={{ fontSize: 14 }}>kg</small></div>
          </div>
          <div style={statBox}>
            <div style={labelStyle}>Body Fat</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: fatCat.color }}>{previewCalc.bodyFat ? `${previewCalc.bodyFat}%` : '--'}</div>
            <div style={{ fontSize: 11, color: fatCat.color, fontWeight: 700 }}>{fatCat.label}</div>
          </div>
          <div style={statBox}>
            <div style={labelStyle}>Muscle (Lean)</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{previewCalc.muscleMass ? `${previewCalc.muscleMass} kg` : '--'}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: '#e3f2fd', borderRadius: 8, fontSize: 13 }}>
          <strong>Healthy Weight Range:</strong> {previewCalc.healthyMin || '--'} kg – {previewCalc.healthyMax || '--'} kg
        </div>

        {first && latest && (
          <div style={{ marginTop: 8, display: 'flex', gap: 20, fontSize: 13 }}>
            <div><strong>Weight Change:</strong> <span style={{ color: weightChange > 0 ? '#c62828' : '#2e7d32', fontWeight: 700 }}>{weightChange > 0 ? '+' : ''}{weightChange} kg</span> (since {first.date})</div>
            <div><strong>To Goal:</strong> <span style={{ color: weightToGoal > 0 ? '#f57c00' : '#2e7d32', fontWeight: 700 }}>{weightToGoal > 0 ? '+' : ''}{weightToGoal} kg</span></div>
          </div>
        )}
      </div>

      {/* LOG ENTRY FORM */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📝 Log Today's Metrics</h3>
        <p style={{ fontSize: 13, color: '#666', marginTop: -8 }}>
          Just enter weight (and optionally waist, hip, neck for accurate body fat).
          Everything else is calculated automatically.
        </p>
        <form onSubmit={handleAddRecord}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Weight (kg) *</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Waist (cm)</label>
              <input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Neck (cm)</label>
              <input type="number" step="0.1" value={neck} onChange={(e) => setNeck(e.target.value)} style={inputStyle} />
            </div>
            {gender === 'female' && (
              <div>
                <label style={labelStyle}>Hip (cm)</label>
                <input type="number" step="0.1" value={hip} onChange={(e) => setHip(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>
          <button type="submit" style={{
            marginTop: 16, width: '100%', padding: 14,
            background: 'linear-gradient(135deg, #42a5f5, #1976d2)',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 16, fontWeight: 800, cursor: 'pointer'
          }}>
            💾 Save Entry (Auto-Calculated)
          </button>
        </form>
      </div>

      {/* CHARTS */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>📈 Progress</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['week', 'month', 'all'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: view === v ? '#1976d2' : '#e3f2fd',
                color: view === v ? 'white' : '#1976d2', fontWeight: 700, fontSize: 12
              }}>{v === 'week' ? '7D' : v === 'month' ? '30D' : 'All'}</button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Add at least 2 entries to see the chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="displayDate" fontSize={11} />
              <YAxis fontSize={11} domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={goalWeight} stroke="#f57c00" strokeDasharray="5 5" label={{ value: `Goal ${goalWeight}kg`, position: 'insideTopLeft', fontSize: 11 }} />
              <Line type="monotone" dataKey="weight" stroke="#1976d2" strokeWidth={3} name="Weight" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="bodyFat" stroke="#8e24aa" strokeWidth={2} name="Fat %" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="muscleMass" stroke="#2e7d32" strokeWidth={2} name="Muscle" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* REPORTS */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📅 Progress Reports</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, background: '#e3f2fd', padding: 16, borderRadius: 12 }}>
            <strong>Last 7 Days</strong>
            {weekReport ? (
              <div style={{ marginTop: 8, fontSize: 14 }}>
                <div>{weekReport.startDate} → {weekReport.endDate}</div>
                <div style={{ marginTop: 4 }}>
                  <b>{weekReport.start} kg</b> → <b>{weekReport.end} kg</b>{' '}
                  <span style={{ color: weekReport.change > 0 ? '#c62828' : '#2e7d32', fontWeight: 800 }}>
                    ({weekReport.change > 0 ? '+' : ''}{weekReport.change} kg)
                  </span>
                </div>
              </div>
            ) : <p style={{ fontSize: 13, color: '#666' }}>Not enough entries.</p>}
          </div>
          <div style={{ flex: 1, minWidth: 240, background: '#f3e5f5', padding: 16, borderRadius: 12 }}>
            <strong>Last 30 Days</strong>
            {monthReport ? (
              <div style={{ marginTop: 8, fontSize: 14 }}>
                <div>{monthReport.startDate} → {monthReport.endDate}</div>
                <div style={{ marginTop: 4 }}>
                  <b>{monthReport.start} kg</b> → <b>{monthReport.end} kg</b>{' '}
                  <span style={{ color: monthReport.change > 0 ? '#c62828' : '#2e7d32', fontWeight: 800 }}>
                    ({monthReport.change > 0 ? '+' : ''}{monthReport.change} kg)
                  </span>
                </div>
              </div>
            ) : <p style={{ fontSize: 13, color: '#666' }}>Not enough entries.</p>}
          </div>
        </div>
      </div>

      {/* HISTORY */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📜 History</h3>
        {records.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center' }}>No entries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Date</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Weight</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>BMI</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Fat %</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Muscle</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Del</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10, fontWeight: 700 }}>{r.date}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{r.weight} kg</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{r.bmi || '--'}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{r.bodyFat ? `${r.bodyFat}%` : '--'}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{r.muscleMass ? `${r.muscleMass} kg` : '--'}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button onClick={() => handleDelete(r.id)} style={{
                        background: '#ffebee', color: '#c62828', border: 'none',
                        padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12
                      }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}