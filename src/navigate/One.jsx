import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MealAnalysis from "../components/MealAnalysis";
import { getFood } from "../services/foodApi";
import { showReminder } from "../services/notifications"; // 🚨 IMPORT

export default function One() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const data = await getFood()
      setItems(data)

      // 🚨 NOTIFICATION LOGIC: No food logged after 2 PM
      const hour = new Date().getHours();
      if (hour >= 14 && data.length === 0) {
        showReminder("Meal Reminder 🍽️", "It's past 2 PM and you haven't logged any food yet today!");
      }
    }
    loadData()
  }, [])

  return (
    <div style={{ padding: '20px', background: '#f4f6f8', minHeight: '100vh' }}>
      <h2>Meal Analysis</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Breakdown of your daily intake.</p>
      
      <MealAnalysis items={items} />

      <button 
        onClick={() => navigate(-1)} 
        style={{ padding: '12px 20px', marginTop: '30px', width: '100%', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold' }}
      >
        ⬅ Go Back
      </button>
    </div>
  )
}