import { useState, useEffect } from 'react'
import Papa from 'papaparse'

export default function CaloriesFinder() {
  const [csvData, setCsvData] = useState([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [cart, setCart] = useState([])
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    Papa.parse('/cal.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey !== 'pk' && cleanKey !== '__parsed_extra') {
              newRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            }
          });

          if (newRow.meal && newRow.meal.match(/\d/) && !newRow.meal.toLowerCase().includes('breakfast') && !newRow.meal.toLowerCase().includes('lunch') && !newRow.meal.toLowerCase().includes('dinner') && !newRow.meal.toLowerCase().includes('snack')) {
             return {
               name: newRow.name,
               meal: 'Lunch',
               quantity: newRow.meal,
               calories: newRow.quantity,
               protein: newRow.calories,
               sodium: newRow.protein,
               potassium: newRow.sodium,
               sugar: newRow.potassium,
               fiber: newRow.sugar,
               calcium: newRow.fiber,
               iron: newRow.calcium,
             }
          }

          if (!newRow.meal || !['breakfast', 'lunch', 'dinner', 'snack'].includes(newRow.meal.toLowerCase())) {
            newRow.meal = 'Snack';
          } else {
            newRow.meal = newRow.meal.charAt(0).toUpperCase() + newRow.meal.slice(1);
          }

          return newRow;
        }).filter(row => row.name);
        
        setCsvData(cleaned)
      }
    })
  }, [])

  const addToCart = (food) => {
    setCart([...cart, { ...food, cartId: Date.now() + Math.random() }])
    setSearch('')
    setShowDropdown(false)
  }

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  const updateCartItem = (cartId, field, value) => {
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, [field]: value } : item
    ))
  }

  const filteredFoods = csvData.filter(f => {
    if (!f || !f.name) return false; 
    return f.name.toLowerCase().includes(search.toLowerCase());
  })

  const totals = cart.reduce((acc, item) => ({
    calories: acc.calories + (Number(item.calories) || 0),
    protein: acc.protein + (Number(item.protein) || 0),
    sodium: acc.sodium + (Number(item.sodium) || 0),
    potassium: acc.potassium + (Number(item.potassium) || 0),
    sugar: acc.sugar + (Number(item.sugar) || 0),
    fiber: acc.fiber + (Number(item.fiber) || 0),
    calcium: acc.calcium + (Number(item.calcium) || 0),
    iron: acc.iron + (Number(item.iron) || 0),
  }), { calories: 0, protein: 0, sodium: 0, potassium: 0, sugar: 0, fiber: 0, calcium: 0, iron: 0 })

  return (
    <>
      {/* CSS directly injected here so no external file is needed */}
      <style>{`
        .finder-container { padding: 10px; font-family: inherit; }
        .finder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .finder-header h2 { font-size: 1.2rem; font-weight: 600; margin: 0; color: #333; }
        .btn-toggle { padding: 8px 12px; background: #2196f3; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .btn-toggle:active { background: #1976d2; }
        
        .finder-desc { font-size: 13px; color: #666; margin-bottom: 15px; }
        
        .search-wrapper { position: relative; margin-bottom: 20px; }
        .search-input { width: 100%; padding: 15px; font-size: 16px; border: 2px solid #2196f3; border-radius: 12px; outline: none; box-sizing: border-box; }
        
        .dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #eee; border-radius: 12px; max-height: 220px; overflow-y: auto; z-index: 10; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-top: 5px; }
        .dropdown-item { padding: 14px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 15px; display: flex; justify-content: space-between; align-items: center; }
        .dropdown-item:active { background: #f0f5f0; }
        .dropdown-item strong { color: #333; }
        .dropdown-item span { color: #888; font-size: 12px; }
        
        .plate-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; color: #333; }
        .empty-plate { color: #888; font-size: 14px; text-align: center; padding: 20px 0; }
        
        .cart-item { display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #eee; }
        .cart-item-info { flex: 1; }
        .cart-item-name { display: block; font-size: 15px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .cart-inputs { display: flex; gap: 8px; align-items: center; }
        .cart-inputs span { font-size: 12px; color: #666; }
        .cart-inputs input { width: 60px; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 6px; outline: none; text-align: center; }
        .btn-remove { background: #ffebee; color: #c62828; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-remove:active { background: #ffcdd2; }
        
        .totals-box { background: #e8f5e9; padding: 15px; border-radius: 14px; border: 2px solid #4CAF50; margin-top: 20px; }
        .totals-title { margin: 0 0 15px 0; font-size: 1.1rem; color: #2E7D32; font-weight: 600; }
        .totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
        .totals-item { background: white; padding: 10px; border-radius: 8px; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
        .totals-item b { color: #1e1b1a; }
        
        .text-data-box { background: #f5f5f5; padding: 15px; border-radius: 12px; max-height: 400px; overflow-y: auto; font-size: 13px; font-family: monospace; border: 1px solid #ddd; }
        .text-data-item { border-bottom: 1px solid #ddd; padding: 10px 0; }
        .text-data-item:last-child { border-bottom: none; }
      `}</style>

      <div className="finder-container">
        <div className="finder-header">
          <h2>🔍 Calories Finder</h2>
          <button className="btn-toggle" onClick={() => setShowText(!showText)}>
            {showText ? 'Hide Text Data' : 'Show Text Data'}
          </button>
        </div>

        {/* TEXT VIEW */}
        {showText ? (
          <div className="text-data-box">
            <p><strong>Total Items Loaded: {csvData.length}</strong></p>
            {csvData.map((item, idx) => (
              <div key={idx} className="text-data-item">
                <div><strong>Name:</strong> {item.name}</div>
                <div><strong>Meal:</strong> {item.meal} | <strong>Qty:</strong> {item.quantity}</div>
                <div><strong>Calories:</strong> {item.calories} | <strong>Protein:</strong> {item.protein}g</div>
                <div><strong>Sodium:</strong> {item.sodium}mg | <strong>Sugar:</strong> {item.sugar}g</div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="finder-desc">
              Search foods, add them to your analysis list, and see the total nutrition.
            </p>

            <div className="search-wrapper">
              <input 
                type="text" 
                className="search-input"
                placeholder="Search any food (e.g., rice)..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                onClick={() => setShowDropdown(true)}
              />
              
              {showDropdown && search && (
                <div className="dropdown">
                  {filteredFoods.length > 0 ? (
                    filteredFoods.map((food, idx) => (
                      <div 
                        key={idx} 
                        className="dropdown-item"
                        onClick={() => addToCart(food)}
                      >
                        <strong>{food.name}</strong> 
                        <span>{food.calories} cal ({food.meal})</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '14px', color: '#888', fontSize: '14px' }}>No match found.</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 className="plate-title">Your Analysis Plate ({cart.length} items)</h3>
              {cart.length === 0 ? (
                <p className="empty-plate">Search above to add food.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="cart-item">
                    <div className="cart-item-info">
                      <strong className="cart-item-name">{item.name}</strong>
                      <div className="cart-inputs">
                        <span>Qty:</span>
                        <input 
                          type="text" 
                          value={item.quantity || ''} 
                          onChange={(e) => updateCartItem(item.cartId, 'quantity', e.target.value)}
                        />
                        <span style={{ marginLeft: '6px' }}>Cal:</span>
                        <input 
                          type="number" 
                          value={item.calories || 0} 
                          onChange={(e) => updateCartItem(item.cartId, 'calories', e.target.value)}
                        />
                      </div>
                    </div>
                    <button className="btn-remove" onClick={() => removeFromCart(item.cartId)}>
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="totals-box">
                <h4 className="totals-title">📊 Total Nutrition Analysis</h4>
                <div className="totals-grid">
                  <div className="totals-item">🔥 Calories: <b>{totals.calories.toFixed(1)}</b></div>
                  <div className="totals-item">🍗 Protein: <b>{totals.protein.toFixed(1)}g</b></div>
                  <div className="totals-item">🧂 Sodium: <b>{totals.sodium.toFixed(1)}mg</b></div>
                  <div className="totals-item">🍌 Potassium: <b>{totals.potassium.toFixed(1)}mg</b></div>
                  <div className="totals-item">🍬 Sugar: <b>{totals.sugar.toFixed(1)}g</b></div>
                  <div className="totals-item">🌾 Fiber: <b>{totals.fiber.toFixed(1)}g</b></div>
                  <div className="totals-item">🦴 Calcium: <b>{totals.calcium.toFixed(1)}mg</b></div>
                  <div className="totals-item">🩸 Iron: <b>{totals.iron.toFixed(1)}mg</b></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}