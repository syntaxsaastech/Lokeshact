import { useState, useEffect } from 'react';

export default function MealAnalysis({ items }) {
  const [activeTab, setActiveTab] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the time every minute to keep the advice accurate
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Filter items for TODAY
  const today = new Date().toISOString().split('T')[0];
  const todayItems = items ? items.filter(i => i && i.date === today) : [];

  // 2. Calculate Totals
  const totalCalories = todayItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);

  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const colors = {
    Breakfast: '#FFA726',
    Lunch: '#66BB6A',
    Dinner: '#42A5F5',
    Snack: '#EF5350'
  };

  const mealData = meals.map(meal => {
    const mealItems = todayItems.filter(i => i.meal === meal);
    const cals = mealItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
    const carbs = mealItems.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
    const protein = mealItems.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
    const fats = mealItems.reduce((sum, i) => sum + (Number(i.fats) || 0), 0);
    
    return {
      name: meal,
      count: mealItems.length,
      calories: cals,
      percentage: totalCalories > 0 ? (cals / totalCalories) * 100 : 0,
      carbs: carbs.toFixed(1),
      protein: protein.toFixed(1),
      fats: fats.toFixed(1),
      color: colors[meal]
    };
  });

  // 3. 🚨 NEW: TIME-BASED & DATA AUTOMATION AI ADVICE 🚨
  const getAIAdvice = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Check if meals have been eaten
    const hasBreakfast = mealData.find(m => m.name === 'Breakfast').count > 0;
    const hasLunch = mealData.find(m => m.name === 'Lunch').count > 0;
    const hasDinner = mealData.find(m => m.name === 'Dinner').count > 0;
    
    // Total Protein calculation (assuming a 50g goal)
    const totalProtein = mealData.reduce((sum, m) => sum + Number(m.protein), 0);
    const proteinGoal = 50;

    // Time Boundaries
    const isBreakfastTime = timeInMinutes >= 480 && timeInMinutes <= 570; // 8:00 AM to 9:30 AM
    const isLunchTime = timeInMinutes >= 750 && timeInMinutes <= 840;     // 12:30 PM to 2:00 PM
    const isDinnerTime = timeInMinutes >= 1170 && timeInMinutes <= 1290;  // 7:30 PM to 9:30 PM
    const isLateNight = timeInMinutes > 1290;                             // After 9:30 PM

    // 1. Time-Based Alerts
    if (isBreakfastTime && !hasBreakfast) {
      return "⏰ It's breakfast time (8:00 - 9:30 AM) and you haven't logged anything! Try having Idli, Dosa, or Oats to start your day right.";
    }
    if (isLunchTime && !hasLunch) {
      return "⏰ It's lunch time (12:30 - 2:00 PM)! Don't skip your meal. Add Rice, Chapati, and some Dal/Curry.";
    }
    if (isDinnerTime && !hasDinner) {
      return "⏰ It's dinner time (7:30 - 9:30 PM). Try to eat a light dinner with protein like Paneer or Chicken.";
    }
    if (isLateNight && !hasDinner) {
      return "⚠️ It's getting late (after 9:30 PM) and you haven't had dinner. Eating very late can affect digestion. Maybe have a light snack like Milk or Curd.";
    }

    // 2. Protein Alert
    if (totalProtein < (proteinGoal - 15)) {
      return `💪 You need more protein! You've only had ${totalProtein.toFixed(1)}g out of ${proteinGoal}g. Try adding Paneer, Eggs, or Chicken.`;
    }

    // 3. Calorie Limit Alert
    if (totalCalories > 2000) {
      return "⚠️ You've exceeded your 2000 kcal limit. Try a light walk or drink plenty of water.";
    }

    // 4. Biggest Meal Insight
    const biggestMeal = [...mealData].sort((a, b) => b.calories - a.calories)[0];
    if (biggestMeal && biggestMeal.calories > 0) {
      if (biggestMeal.name === 'Snack' && biggestMeal.percentage > 30) {
        return "🍎 You are snacking a lot today. Try to replace snacks with fruits or nuts to balance your main meals.";
      }
      return `🍲 ${biggestMeal.name} is your biggest meal today (${biggestMeal.percentage.toFixed(0)}% of your calories).`;
    }

    return "✅ You're doing great! Keep logging your food to see more detailed insights.";
  };

  // 4. Donut Chart Math
  let cumulativePercent = 0;
  const donutSegments = mealData.filter(m => m.calories > 0).map(m => {
    const strokeDasharray = `${(m.percentage / 100) * 251.2} 251.2`;
    const strokeDashoffset = -((cumulativePercent / 100) * 251.2);
    cumulativePercent += m.percentage;
    return { ...m, strokeDasharray, strokeDashoffset };
  });

  return (
    <>
      <style>{`
        .meal-analysis-container { padding: 16px; background: #fff; border-radius: 16px; margin-top: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .insight-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 500; color: #1565c0; }
        .chart-row { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .donut-chart { width: 140px; height: 140px; transform: rotate(-90deg); }
        .donut-chart circle { fill: none; stroke-width: 20; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
        .donut-center { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px; height: 140px; }
        .donut-center span:first-child { font-size: 20px; font-weight: 800; color: #333; }
        .donut-center span:last-child { font-size: 12px; color: #888; }
        
        .legend-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .legend-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 8px; background: #fafafa; border: 1px solid #eee; cursor: pointer; }
        .legend-item:active { background: #f0f0f0; }
        .legend-color { width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; }
        .legend-info { display: flex; align-items: center; flex: 1; }
        .legend-name { font-weight: 600; font-size: 14px; color: #333; }
        .legend-stats { text-align: right; font-size: 12px; color: #666; }
        .legend-cals { font-weight: 700; color: #222; font-size: 14px; }
        
        .macros-row { display: flex; justify-content: space-between; font-size: 11px; color: #777; margin-top: 4px; background: #fff; padding: 4px 8px; border-radius: 4px; }
        .macro-item { display: flex; gap: 4px; }
        .macro-item b { color: #333; }
      `}</style>

      <div className="meal-analysis-container">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>📊 Meal Analysis</h3>
        
        {/* AI Insight Box (Now shows Time & Data Advice) */}
        <div className="insight-box">
          {getAIAdvice()}
        </div>

        {/* Donut Chart */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <svg viewBox="0 0 100 100" className="donut-chart">
            <circle cx="50" cy="50" r="40" stroke="#f0f0f0" />
            {donutSegments.map((seg, i) => (
              <circle
                key={i}
                cx="50" cy="50" r="40"
                stroke={seg.color}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
              />
            ))}
          </svg>
          <div className="donut-center">
            <span>{totalCalories.toFixed(0)}</span>
            <span>kcal</span>
          </div>
        </div>

        {/* Legend & Macros */}
        <div className="legend-list">
          {mealData.map(meal => (
            <div key={meal.name} className="legend-item">
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="legend-info">
                  <div className="legend-color" style={{ background: meal.color }}></div>
                  <span className="legend-name">{meal.name}</span>
                </div>
                {meal.count > 0 && (
                  <div className="macros-row">
                    <span className="macro-item">C: <b>{meal.carbs}g</b></span>
                    <span className="macro-item">P: <b>{meal.protein}g</b></span>
                    <span className="macro-item">F: <b>{meal.fats}g</b></span>
                  </div>
                )}
              </div>
              <div className="legend-stats">
                <div className="legend-cals">{meal.calories.toFixed(0)} kcal</div>
                <div>{meal.percentage.toFixed(0)}% • {meal.count} items</div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </>
  );
}