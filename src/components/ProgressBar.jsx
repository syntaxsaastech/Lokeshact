export default function ProgressBar({ label, current, max, unit, color }) {
  // SAFETY CHECK
  const safeCurrent = Number(current) || 0;
  const safeMax = Number(max) || 1; 
  
  const percentage = Math.min((safeCurrent / safeMax) * 100, 100)
  const isOverLimit = safeCurrent > safeMax

  return (
    <>
      <style>{`
        .progress-container {
          margin-bottom: 14px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
          color: #444;
        }

        .progress-header strong {
          color: #222;
        }

        .progress-header span {
          font-weight: 500;
        }

        .progress-track {
          width: 100%;
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
        }

        .progress-warning {
          color: #ff5252;
          font-size: 11px;
          margin-top: 4px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          animation: pulseWarning 1.5s infinite;
        }

        @keyframes pulseWarning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div className="progress-container">
        <div className="progress-header">
          <span><strong>{label}</strong></span>
          <span>{safeCurrent.toFixed(1)} / {safeMax} {unit}</span>
        </div>
        
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ 
              width: `${percentage}%`, 
              background: isOverLimit ? '#ff5252' : color, 
            }} 
          />
        </div>
        
        {isOverLimit && (
          <div className="progress-warning">
            ⚠️ Limit exceeded!
          </div>
        )}
      </div>
    </>
  )
}