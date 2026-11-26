import { useState } from 'react'
import FoodItem from './FoodItem'

export default function HistoryView({ items, onDelete }) {
  const [view, setView] = useState('year') // 'year', 'month', 'day'
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const availableYears = [...new Set(items.map(i => i.date.split('-')[0]))].sort((a, b) => b - a)
  if (!availableYears.includes(new Date().getFullYear().toString())) {
    availableYears.unshift(new Date().getFullYear().toString())
  }

  const calculateTotals = (foodArray) => {
    return foodArray.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      sodium: acc.sodium + (item.sodium || 0),
      potassium: acc.potassium + (item.potassium || 0),
      sugar: acc.sugar + (item.sugar || 0),
      fiber: acc.fiber + (item.fiber || 0),
      calcium: acc.calcium + (item.calcium || 0),
      iron: acc.iron + (item.iron || 0),
    }), { calories: 0, protein: 0, sodium: 0, potassium: 0, sugar: 0, fiber: 0, calcium: 0, iron: 0 })
  }

  return (
    <>
      {/* CSS directly injected here */}
      <style>{`
        .history-container { font-family: inherit; animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .history-title { font-size: 1.1rem; font-weight: 600; color: #333; margin: 0; }
        
        .year-select { padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; font-weight: bold; font-family: inherit; font-size: 14px; outline: none; background: white; }
        
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        
        .grid-btn { padding: 16px 10px; border: none; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: transform 0.15s, filter 0.15s; box-shadow: 0 4px 10px -4px rgba(0,0,0,0.05); }
        .grid-btn:active { transform: scale(0.95); filter: brightness(0.95); }
        
        .btn-month { background: #f0f4c3; color: #333; }
        .btn-day { background: #e1bee7; color: #333; }
        
        .grid-btn strong { font-size: 15px; }
        .grid-btn span { font-size: 12px; color: #555; font-weight: 500; }
        
        .btn-back { background: #f0f0f0; border: none; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #555; cursor: pointer; margin-bottom: 16px; display: inline-flex; align-items: center; gap: 5px; transition: background 0.15s; }
        .btn-back:active { background: #e0e0e0; }
        
        .no-data-text { color: #888; font-size: 14px; text-align: center; padding: 20px 0; }
        
        .totals-box { background: #e8f5e9; padding: 16px; border-radius: 14px; margin-bottom: 20px; margin-top: 10px; border: 1px solid #c8e6c9; }
        .totals-title { margin: 0 0 12px 0; font-size: 15px; color: #2E7D32; font-weight: 600; }
        .totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #444; }
        .totals-grid div { background: white; padding: 8px 10px; border-radius: 8px; border: 1px solid #f0f0f0; }
        .totals-grid b { color: #111; }
        
        .meal-group { margin-bottom: 20px; }
        .meal-group-title { border-bottom: 2px solid #eee; padding-bottom: 6px; font-size: 15px; color: #333; margin-bottom: 12px; }
      `}</style>

      <div className="history-container">
        
        {/* ================= YEAR VIEW ================= */}
        {view === 'year' && (
          <>
            <div className="history-header">
              <h3 className="history-title">Select a Month</h3>
              <select 
                className="year-select"
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="grid-3">
              {months.map((month, index) => {
                const monthStr = String(index + 1).padStart(2, '0')
                const monthFoods = items.filter(i => i.date && i.date.startsWith(`${selectedYear}-${monthStr}`))
                const totals = calculateTotals(monthFoods)

                return (
                  <button
                    key={month}
                    className="grid-btn btn-month"
                    onClick={() => { setSelectedMonth(monthStr); setView('month') }}
                  >
                    <strong>{month}</strong>
                    <span>🔥 {totals.calories.toFixed(0)}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ================= MONTH VIEW ================= */}
        {view === 'month' && (
          <>
            <button className="btn-back" onClick={() => setView('year')}>← Back to Year</button>
            <h3 className="history-title" style={{ marginBottom: '16px' }}>
              {months[parseInt(selectedMonth) - 1]} {selectedYear}
            </h3>
            
            {[...new Set(
              items
                .filter(i => i.date && i.date.startsWith(`${selectedYear}-${selectedMonth}`))
                .map(i => i.date.split('-')[2])
            )].sort().length === 0 ? (
              <p className="no-data-text">No data for this month.</p>
            ) : (
              <div className="grid-3" style={{ marginTop: '15px' }}>
                {[...new Set(
                  items
                    .filter(i => i.date && i.date.startsWith(`${selectedYear}-${selectedMonth}`))
                    .map(i => i.date.split('-')[2])
                )].sort().map(day => {
                  const dayFoods = items.filter(i => i.date === `${selectedYear}-${selectedMonth}-${day}`) 
                  const totals = calculateTotals(dayFoods)
                  return (
                    <button
                      key={day}
                      className="grid-btn btn-day"
                      onClick={() => { setSelectedDay(day); setView('day') }}
                    >
                      <strong>Day {day}</strong>
                      <span>🔥 {totals.calories.toFixed(0)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ================= DAY VIEW ================= */}
        {view === 'day' && (() => {
          const fullDate = `${selectedYear}-${selectedMonth}-${selectedDay}` 
          const dayFoods = items.filter(i => i.date === fullDate)
          const totals = calculateTotals(dayFoods)
          const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

          return (
            <>
              <button className="btn-back" onClick={() => setView('month')}>← Back to Month</button>
              <h3 className="history-title" style={{ marginBottom: '16px' }}>📅 {fullDate}</h3>

              <div className="totals-box">
                <h4 className="totals-title">Daily Totals</h4>
                <div className="totals-grid">
                  <div>🔥 Calories: <b>{totals.calories.toFixed(1)}</b></div>
                  <div>🍗 Protein: <b>{totals.protein.toFixed(1)}g</b></div>
                  <div>🧂 Sodium: <b>{totals.sodium.toFixed(1)}mg</b></div>
                  <div>🍌 Potassium: <b>{totals.potassium.toFixed(1)}mg</b></div>
                  <div>🍬 Sugar: <b>{totals.sugar.toFixed(1)}g</b></div>
                  <div>🌾 Fiber: <b>{totals.fiber.toFixed(1)}g</b></div>
                  <div>🦴 Calcium: <b>{totals.calcium.toFixed(1)}mg</b></div>
                  <div>🩸 Iron: <b>{totals.iron.toFixed(1)}mg</b></div>
                </div>
              </div>

              {meals.map(mealType => {
                const mealFoods = dayFoods.filter(f => f.meal === mealType)
                if (mealFoods.length === 0) return null

                return (
                  <div key={mealType} className="meal-group">
                    <h4 className="meal-group-title">{mealType}</h4>
                    {mealFoods.map(item => (
                      <FoodItem key={item.id} item={item} onDelete={onDelete} />
                    ))}
                  </div>
                )
              })}
            </>
          )
        })()}

      </div>
    </>
  )
}