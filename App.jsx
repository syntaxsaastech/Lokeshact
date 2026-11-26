import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import FoodForm from './src/components/FoodForm'
import FoodList from './src/components/FoodList'
import BottomNav from './src/components/BottomNav'
import CaloriesFinder from './src/components/CaloriesFinder'
import { getFood, addFood, deleteFood, downloadExcel, saveAllToBackend } from './src/services/foodApi'

import One from './src/navigate/One'
import Two from './src/navigate/Two'
import Three from './src/navigate/Three'

export default function App() {
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('add')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      const serverData = await getFood()
      setItems(serverData)
    }
    loadData()
  }, [])

  const handleAdd = async (entry) => {
    await addFood(entry)
    const updatedItems = await getFood()
    setItems(updatedItems)
    setTab('list')
  }

  const handleDelete = async (id) => {
    await deleteFood(id)
    const updatedItems = await getFood()
    setItems(updatedItems)
  }

  return (
    <>
      <style>{`
        .top-nav-glass {
          position: sticky;
          top: 0;
          z-index: 60;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          color: #333;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eaeaea;
        }
        .nav-logo {
          font-size: 1.2rem;
          font-weight: 800;
          color: #4CAF50;
          cursor: pointer;
          margin: 0;
        }
        .nav-menu-btn {
          background: #f0f0f0;
          border: none;
          color: #333;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .nav-menu-btn:active {
          background: #e0e0e0;
          transform: scale(0.92);
        }
        .nav-dropdown {
          position: absolute;
          top: 70px;
          right: 16px;
          background: white;
          color: #333;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          min-width: 180px;
          z-index: 100;
          animation: menuFade 0.2s ease;
        }
        @keyframes menuFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-dropdown div {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.1s;
        }
        .nav-dropdown div:active {
          background: #f9f9f9;
        }

        .app-header-custom {
          padding: 16px 16px 0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-custom {
          border: none;
          padding: 10px 18px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          transition: transform 0.1s;
          font-family: inherit;
        }
        .btn-custom:active {
          transform: scale(0.95);
        }
        .btn-save { background: #e8f5e9; color: #2E7D32; }
        .btn-excel { background: #e3f2fd; color: #1565C0; }
      `}</style>

      <div className="app">
        <nav className="top-nav-glass">
          <h1 onClick={() => navigate('/')} className="nav-logo">🍽️ Daily Food</h1>
          
          <button onClick={() => setMenuOpen(!menuOpen)} className="nav-menu-btn">☰</button>

          {menuOpen && (
            <div className="nav-dropdown">
              <div onClick={() => { navigate('/one'); setMenuOpen(false); }}>1️⃣ Meal </div>
              <div onClick={() => { navigate('/two'); setMenuOpen(false); }}>2️⃣ Water </div>
              <div onClick={() => { navigate('/three'); setMenuOpen(false); }}>3️⃣ Weight </div>
            </div>
          )}
        </nav>

        <Routes>
          <Route path="/one" element={<One />} />
          <Route path="/two" element={<Two />} />
          <Route path="/three" element={<Three />} />
          
          <Route path="/" element={
            <>
              <header className="app-header-custom">
                <button className="btn-custom btn-save" onClick={saveAllToBackend}>💾 Save to Server</button>
                <button className="btn-custom btn-excel" onClick={downloadExcel}>📥 Excel</button>
              </header>

              <main className="app-main">
                {tab === 'add' && <FoodForm onAdd={handleAdd} />}
                {tab === 'list' && <FoodList items={items} onDelete={handleDelete} />}
                {tab === 'finder' && <CaloriesFinder />}
              </main>

              <BottomNav active={tab} onChange={setTab} counts={items.filter(i => i.date === new Date().toISOString().split('T')[0]).length} />
            </>
          } />
        </Routes>
      </div>
    </>
  )
}