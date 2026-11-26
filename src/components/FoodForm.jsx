import { useState, useEffect } from 'react'
import Papa from 'papaparse'

export default function FoodForm({ onAdd }) {
  const [csvData, setCsvData] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  const [cart, setCart] = useState([]) 

  const [meal, setMeal] = useState('Lunch')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))

  // 1. Load CSV
  useEffect(() => {
    Papa.parse('/fooditem.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanedData = results.data.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey !== 'pk' && cleanKey !== '__parsed_extra') {
              newRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            }
          });
          return newRow;
        }).filter(row => row.name);
        setCsvData(cleanedData)
      }
    })
  }, [])

  // 2. Add food to the Cart (STRICT MATCH)
  const addToCart = (foodName, isCustom = false) => {
    const food = csvData.find(f => f.name && f.name.toLowerCase() === foodName.toLowerCase())
    
    if (food && !isCustom) {
      setCart([...cart, { ...food, cartId: Date.now() + Math.random() }]) 
    } else {
      setCart([...cart, { 
        name: foodName, 
        quantity: '1', 
        calories: 0, protein: 0, sodium: 0, potassium: 0, sugar: 0, fiber: 0, calcium: 0, iron: 0, 
        cartId: Date.now() + Math.random() 
      }])
    }
    setSearchText('') 
    setShowDropdown(false) 
  }

  // 3. Handle Typing Commas and Pressing Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (!searchText.trim()) return;

      const items = searchText.split(',').map(i => i.trim()).filter(i => i !== '')
      
      items.forEach(item => {
        const exactMatch = csvData.find(f => f.name && f.name.toLowerCase() === item.toLowerCase())
        
        if (exactMatch) {
           setCart(prev => [...prev, { ...exactMatch, cartId: Date.now() + Math.random() }])
        } else {
           setCart(prev => [...prev, { 
             name: item, quantity: '1', 
             calories: 0, protein: 0, sodium: 0, potassium: 0, sugar: 0, fiber: 0, calcium: 0, iron: 0, 
             cartId: Date.now() + Math.random() 
           }])
        }
      })

      setSearchText('')
      setShowDropdown(false)
    }
  }

  // 4. Remove from Cart
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  // 5. Update Cart Item
  const updateCartItem = (cartId, field, value) => {
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, [field]: value } : item
    ))
  }

  // 6. Submit the Whole Cart
  const handleSubmit = (e) => {
    e.preventDefault()
    if (cart.length === 0) return alert("Please add some food to the plate first!")

    cart.forEach(item => {
      onAdd({
        name: item.name,
        meal: meal,
        quantity: item.quantity || '1',
        date: date,
        time: time,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        sodium: Number(item.sodium) || 0,
        potassium: Number(item.potassium) || 0,
        sugar: Number(item.sugar) || 0,
        fiber: Number(item.fiber) || 0,
        calcium: Number(item.calcium) || 0,
        iron: Number(item.iron) || 0
      })
    })

    setCart([])
    setSearchText('')
  }

  const filteredFoods = csvData.filter(f => {
    if (!f || !f.name) return false; 
    return f.name.toLowerCase().includes(searchText.toLowerCase());
  })

  const cartTotals = cart.reduce((acc, item) => ({
    calories: acc.calories + (Number(item.calories) || 0),
    protein: acc.protein + (Number(item.protein) || 0),
  }), { calories: 0, protein: 0 })

  return (
    <>
      {/* CSS directly injected here */}
      <style>{`
        .food-form { display: flex; flex-direction: column; gap: 15px; font-family: inherit; }
        .form-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 5px; color: #333; }
        
        .form-row { display: flex; gap: 10px; }
        .form-row select, .form-row input { flex: 1; min-width: 0; padding: 14px; border-radius: 10px; border: 1.5px solid #e0e0e0; font-size: 15px; background: #fafafa; outline: none; }
        .form-row select:focus, .form-row input:focus { border-color: #4CAF50; background: #fff; }
        
        .search-wrapper { position: relative; }
        .search-input { width: 100%; padding: 15px; font-size: 16px; border: 2px solid #2196f3; border-radius: 12px; outline: none; box-sizing: border-box; }
        
        .dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #eee; border-radius: 12px; max-height: 220px; overflow-y: auto; z-index: 10; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-top: 5px; }
        .dropdown-item { padding: 14px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 15px; display: flex; justify-content: space-between; align-items: center; }
        .dropdown-item:active { background: #f0f5f0; }
        .dropdown-item strong { color: #333; }
        .dropdown-item span { color: #888; font-size: 12px; }
        
        .dropdown-add-manual { padding: 14px; background: #e3f2fd; cursor: pointer; font-size: 14px; font-weight: bold; color: #1976d2; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
        .dropdown-add-manual:active { background: #bbdefb; }
        
        .plate-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; color: #333; }
        .empty-plate { color: #888; font-size: 14px; text-align: center; padding: 20px 0; }
        
        .cart-item { display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #eee; }
        .cart-item-info { flex: 1; }
        .cart-item-name { display: block; font-size: 15px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .cart-inputs { display: flex; gap: 8px; align-items: center; }
        .cart-inputs input { width: 65px; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 6px; outline: none; text-align: center; background: white; }
        .cart-inputs span { font-size: 12px; color: #666; }
        
        .btn-remove { background: #ffebee; color: #c62828; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-remove:active { background: #ffcdd2; }
        
        .cart-totals-box { margin-top: 20px; padding: 16px; background: #e8f5e9; border-radius: 14px; border: 2px solid #4CAF50; }
        .cart-totals-text { margin: 0 0 12px 0; font-weight: bold; color: #2E7D32; font-size: 15px; }
        .btn-primary { padding: 16px; font-size: 16px; font-weight: 600; color: white; background: #4CAF50; border: none; border-radius: 12px; cursor: pointer; width: 100%; transition: transform 0.1s; box-shadow: 0 4px 10px -2px rgba(76, 175, 80, 0.4); }
        .btn-primary:active { background: #2E7D32; transform: scale(0.98); }
      `}</style>

      <form className="food-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Add Food to {meal}</h2>
        
        <div className="form-row">
          <select value={meal} onChange={(e) => setMeal(e.target.value)}>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* SEARCH BOX */}
        <div className="search-wrapper">
          <input 
            className="search-input"
            placeholder="Type 'Idli, Rasam' and press Enter..." 
            value={searchText} 
            onChange={(e) => { setSearchText(e.target.value); setShowDropdown(true); }} 
            onKeyDown={handleKeyDown}
            onClick={() => setShowDropdown(true)}
          />
          
          {showDropdown && searchText && !searchText.includes(',') && (
            <div className="dropdown">
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food, index) => (
                  <div 
                    key={index} 
                    className="dropdown-item"
                    onClick={() => addToCart(food.name, false)}
                  >
                    <strong>{food.name}</strong> 
                    <span>{food.calories} cal</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '14px', color: '#888', fontSize: '14px' }}>Not found in CSV.</div>
              )}
              
              <div 
                className="dropdown-add-manual"
                onClick={() => addToCart(searchText, true)}
              >
                + Add "{searchText}" manually
              </div>
            </div>
          )}
        </div>

        {/* THE PLATE / CART LIST */}
        <div>
          <h3 className="plate-title">Plate ({cart.length} items)</h3>
          {cart.length === 0 ? (
            <p className="empty-plate">Search above to add food.</p>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-info">
                  <strong className="cart-item-name">{item.name}</strong>
                  <div className="cart-inputs">
                    <input 
                      type="text" 
                      value={item.quantity} 
                      onChange={(e) => updateCartItem(item.cartId, 'quantity', e.target.value)}
                    />
                    <input 
                      type="number" 
                      value={item.calories} 
                      onChange={(e) => updateCartItem(item.cartId, 'calories', e.target.value)}
                      placeholder="Cal"
                    />
                    <span>kcal</span>
                  </div>
                </div>

                <button 
                  type="button"
                  className="btn-remove"
                  onClick={() => removeFromCart(item.cartId)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* CART TOTALS & SUBMIT */}
        {cart.length > 0 && (
          <div className="cart-totals-box">
            <p className="cart-totals-text">Total: {cartTotals.calories.toFixed(0)} kcal | {cartTotals.protein.toFixed(1)}g Protein</p>
            <button type="submit" className="btn-primary">
              ✓ Add {cart.length} Items to {meal}
            </button>
          </div>
        )}
      </form>
    </>
  )
}