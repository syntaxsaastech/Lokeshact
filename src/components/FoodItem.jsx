import { useState } from 'react'

const mealEmoji = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snack: '🍎' }

export default function FoodItem({ item, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <style>{`
        .food-item-card {
          margin-bottom: 10px;
          border: 1px solid #eeeeee;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 4px 10px -4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .food-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          cursor: pointer;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .food-item-header:active {
          background: #f0f5f0;
        }

        .food-item-header.open {
          background: #f0f8ff;
          border-bottom: 1px solid #eeeeee;
        }

        .food-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .food-item-emoji {
          font-size: 24px;
        }

        .food-item-title {
          margin: 0;
          font-weight: 600;
          font-size: 15px;
          color: #222;
        }

        .food-item-subtitle {
          margin: 0;
          font-size: 12px;
          color: #888;
          margin-top: 2px;
        }

        .food-item-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .food-item-calories {
          font-weight: 700;
          color: #4CAF50;
          font-size: 14px;
        }

        .food-item-arrow {
          color: #aaa;
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .food-item-details {
          padding: 16px;
          background: #ffffff;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .food-item-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          font-size: 13px;
          color: #555;
        }

        .food-item-grid div {
          background: #fafafa;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        .food-item-grid b {
          color: #222;
        }

        .btn-remove-item {
          margin-top: 16px;
          background: #ffebee;
          color: #c62828;
          border: none;
          padding: 12px;
          border-radius: 10px;
          width: 100%;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.15s ease, transform 0.1s ease;
        }

        .btn-remove-item:active {
          background: #ffcdd2;
          transform: scale(0.97);
        }
      `}</style>

      <div className="food-item-card">
        
        {/* CLICKABLE HEADER */}
        <div 
          className={`food-item-header ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)} 
        >
          <div className="food-item-left">
            <span className="food-item-emoji">{mealEmoji[item.meal] || '🍽️'}</span>
            <div>
              <p className="food-item-title">{item.name}</p>
              <p className="food-item-subtitle">{item.quantity} • {item.time}</p>
            </div>
          </div>
          
          <div className="food-item-right">
            <span className="food-item-calories">{item.calories} cal</span>
            <span className="food-item-arrow">{isOpen ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* EXPANDED NUTRITION DETAILS */}
        {isOpen && (
          <div className="food-item-details">
            <div className="food-item-grid">
              <div>🍗 Protein: <b>{item.protein || 0}g</b></div>
              <div>🧂 Sodium: <b>{item.sodium || 0}mg</b></div>
              <div>🍌 Potassium: <b>{item.potassium || 0}mg</b></div>
              <div>🍬 Sugar: <b>{item.sugar || 0}g</b></div>
              <div>🌾 Fiber: <b>{item.fiber || 0}g</b></div>
              <div>🦴 Calcium: <b>{item.calcium || 0}mg</b></div>
              <div>🩸 Iron: <b>{item.iron || 0}mg</b></div>
            </div>
            
            <button 
              className="btn-remove-item"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
            >
              Remove Item
            </button>
          </div>
        )}
      </div>
    </>
  )
}