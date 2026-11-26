import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import WaterTracker from "../components/WaterTracker";
import { showReminder } from "../services/notifications"; // 🚨 IMPORT

export default function Two() {
  const navigate = useNavigate()

  useEffect(() => {
    // 🚨 NOTIFICATION LOGIC: Check water intake after 5 PM
    const hour = new Date().getHours();
    if (hour >= 17) {
      const savedWater = JSON.parse(localStorage.getItem('water-tracker-v2') || '{}');
      const currentMl = savedWater.ml || 0;
      
      if (currentMl < 1000) {
        showReminder("Hydration Check 💧", `You've only had ${currentMl}ml of water today. Time to drink up!`);
      }
    }
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f4f6f8', minHeight: '100vh' }}>
      <h2>My Day</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Track your daily habits.</p>

      <WaterTracker />

      <button
        onClick={() => navigate(-1)}
        style={{ padding: '12px 20px', marginTop: '30px', width: '100%', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold' }}
      >
        ⬅ Go Back
      </button>
    </div>
  )
}