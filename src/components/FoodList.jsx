import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import FoodItem from './FoodItem'
import HistoryView from './HistoryView'
import ProgressBar from './ProgressBar'
import { showReminder } from '../services/notifications'
import { getFood } from '../services/foodApi'

export default function FoodList({ items, onDelete, onRestore }) {
  const [activeTab, setActiveTab] = useState('today')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const [limits, setLimits] = useState({
    calories: 2000, protein: 50, sodium: 2300, potassium: 3500, sugar: 50, fiber: 30, calcium: 1000, iron: 18
  })
  
  // Undo State
  const [undoItem, setUndoItem] = useState(null)
  const undoTimerRef = useRef(null)
  const hasAlertedRef = useRef(false)

  useEffect(() => {
    Papa.parse('/limits.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedLimits = {}
        results.data.forEach(row => {
          if (row.nutrient) parsedLimits[row.nutrient.trim()] = Number(row.limit)
        })
        setLimits(prev => ({ ...prev, ...parsedLimits }))
      }
    })
  }, [])

  const filtered = items.filter((i) => i.date === selectedDate)

  const totals = filtered.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    sodium: acc.sodium + (item.sodium || 0),
    potassium: acc.potassium + (item.potassium || 0),
    sugar: acc.sugar + (item.sugar || 0),
    fiber: acc.fiber + (item.fiber || 0),
    calcium: acc.calcium + (item.calcium || 0),
    iron: acc.iron + (item.iron || 0),
  }), { calories: 0, protein: 0, sodium: 0, potassium: 0, sugar: 0, fiber: 0, calcium: 0, iron: 0 })

  // Limit Reminder
  useEffect(() => {
    if (filtered.length === 0) return;
    const exceeded = [];
    if (totals.sugar > limits.sugar) exceeded.push('Sugar');
    if (totals.sodium > limits.sodium) exceeded.push('Sodium');
    
    if (exceeded.length > 0 && !hasAlertedRef.current) {
      showReminder("Limit Exceeded!", `You exceeded: ${exceeded.join(', ')}.`);
      hasAlertedRef.current = true; 
    }
    if (exceeded.length === 0) hasAlertedRef.current = false;
  }, [totals, limits, filtered.length])

  // Handle Delete with Undo
  const handleDeleteWithUndo = (item) => {
    onDelete(item.id) // Hide immediately
    setUndoItem(item) // Store for undo
    
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)

    undoTimerRef.current = setTimeout(() => {
      setUndoItem(null)
    }, 5000)
  }

  const handleUndo = () => {
    if (undoItem) {
      const currentData = getFood()
      const newData = [...currentData, undoItem]
      localStorage.setItem('food-data', JSON.stringify(newData))
      
      onDelete(null)
      window.location.reload()
      
      setUndoItem(null)
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }

  const groupedItems = {
    Breakfast: filtered.filter(i => i.meal === 'Breakfast'),
    Lunch: filtered.filter(i => i.meal === 'Lunch'),
    Dinner: filtered.filter(i => i.meal === 'Dinner'),
    Snack: filtered.filter(i => i.meal === 'Snack'),
  }

  return (
    <>
      {/* CSS directly injected here */}
      <style>{`
        .food-list-container { padding-bottom: 80px; font-family: inherit; }
        
        .tab-buttons { display: flex; gap: 10px; margin-bottom: 16px; }
        .tab-btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease; }
        .tab-btn.active { background: #4CAF50; color: white; box-shadow: 0 4px 10px -2px rgba(76, 175, 80, 0.4); }
        .tab-btn.inactive { background: #f0f0f0; color: #666; }
        
        .date-picker-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; background: white; padding: 12px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .date-picker-row strong { font-size: 14px; color: #444; }
        .date-picker-row input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; font-family: inherit; outline: none; font-size: 14px; }
        
        .progress-box { background: #e8f5e9; padding: 16px; border-radius: 14px; margin-bottom: 20px; border: 1px solid #c8e6c9; }
        .progress-title { margin: 0 0 12px 0; font-size: 15px; color: #2E7D32; font-weight: 600; }
        
        .meal-section { margin-bottom: 24px; }
        .meal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 12px; }
        .meal-title { font-size: 1.1rem; font-weight: 600; color: #333; margin: 0; text-transform: capitalize; }
        .meal-calories { color: #4CAF50; font-size: 14px; font-weight: 700; }
        
        .empty-state { text-align: center; padding: 40px 20px; background: #fafafa; border-radius: 16px; border: 1px dashed #ccc; }
        .empty-state p:first-child { font-size: 40px; margin-bottom: 10px; }
        .empty-state p:last-child { color: #888; font-size: 14px; }
        
        .undo-bar { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 440px; background: #333; color: white; padding: 14px 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; box-shadow: 0 8px 20px rgba(0,0,0,0.25); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .undo-text { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 10px; }
        .undo-btn { background: transparent; color: #4CAF50; border: none; font-weight: 700; font-size: 14px; cursor: pointer; text-transform: uppercase; padding: 8px; }
        .undo-btn:active { opacity: 0.7; }
      `}</style>

      <div className="food-list-container">
        {/* TABS */}
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'today' ? 'active' : 'inactive'}`} 
            onClick={() => setActiveTab('today')}
          >
            Today's List
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : 'inactive'}`} 
            onClick={() => setActiveTab('history')}
          >
            📊 History Chart
          </button>
        </div>

        {activeTab === 'history' ? (
          <HistoryView items={items} onDelete={(id) => handleDeleteWithUndo(items.find(i => i.id === id))} />
        ) : (
          <>
            {/* DATE PICKER */}
            <div className="date-picker-row">
              <strong>Date:</strong>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>🍽️</p>
                <p>No food added for {selectedDate}.</p>
              </div>
            ) : (
              <>
                {/* PROGRESS BOX */}
                <div className="progress-box">
                  <h4 className="progress-title">Daily Progress</h4>
                  <ProgressBar label="🔥 Calories" current={totals.calories} max={limits.calories} unit="kcal" color="#4CAF50" />
                  <ProgressBar label="🍗 Protein" current={totals.protein} max={limits.protein} unit="g" color="#2196f3" />
                  <ProgressBar label="🧂 Sodium" current={totals.sodium} max={limits.sodium} unit="mg" color="#ff9800" />
                  <ProgressBar label="🍬 Sugar" current={totals.sugar} max={limits.sugar} unit="g" color="#e91e63" />
                </div>

                {/* MEAL SECTIONS */}
                {Object.entries(groupedItems).map(([mealName, mealItems]) => {
                  if (mealItems.length === 0) return null;
                  const mealTotals = mealItems.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
                  
                  return (
                    <div key={mealName} className="meal-section">
                      <div className="meal-header">
                        <h3 className="meal-title">{mealName}</h3>
                        <span className="meal-calories">{mealTotals.toFixed(0)} cal</span>
                      </div>
                      {mealItems.map((item) => (
                        <FoodItem key={item.id} item={item} onDelete={() => handleDeleteWithUndo(item)} />
                      ))}
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* UNDO POPUP BAR */}
        {undoItem && (
          <div className="undo-bar">
            <span className="undo-text">"{undoItem.name}" deleted.</span>
            <button className="undo-btn" onClick={handleUndo}>
              Undo
            </button>
          </div>
        )}
      </div>
    </>
  )
}