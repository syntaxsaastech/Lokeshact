export default function BottomNav({ active, onChange, counts }) {
  return (
    <nav className="bottom-nav">
      <button
        className={active === 'add' ? 'active' : ''}
        onClick={() => onChange('add')}
      >
        <span>➕</span>
        <small>Add</small>
      </button>
      <button
        className={active === 'list' ? 'active' : ''}
        onClick={() => onChange('list')}
      >
        <span>📋</span>
        <small>List ({counts})</small>
      </button>
      <button
        className={active === 'finder' ? 'active' : ''}
        onClick={() => onChange('finder')}
      >
        <span>🔍</span>
        <small>Cal Finder</small>
      </button>
    </nav>
  )
}