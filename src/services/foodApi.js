const API = '/api/food' // relative URL — Vite proxy forwards to http://127.0.0.1:5000
const STORAGE_KEY = 'food-data'

const readCache = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
const writeCache = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d))

// Guards against HTML error pages: turns "Unexpected token '<'" into a useful message.
async function readJson(res) {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    throw new Error(`Expected JSON, got ${res.status} ${ct} → ${text.slice(0, 80)}`)
  }
  return res.json()
}

const post = async (food) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(food),
  })
  const result = await readJson(res)
  if (!res.ok || result.result !== 'success') throw new Error(result.error || `HTTP ${res.status}`)
}

export const getFood = async () => {
  try {
    const res = await fetch(API)
    const result = await readJson(res)
    if (res.ok && result.result === 'success') {
      const unsynced = readCache().filter((i) => i._unsynced) // keep items not yet in Excel
      const merged = [...result.data, ...unsynced]
      writeCache(merged)
      return merged
    }
    console.error('❌ Load failed:', result.error)
  } catch (err) {
    console.warn('Server offline, using local cache.', err)
  }
  return readCache()
}

export const addFood = async (food) => {
  const newFood = { ...food, id: Date.now() }
  try {
    await post(newFood)
    writeCache([...readCache(), newFood])
    return newFood
  } catch (err) {
    writeCache([...readCache(), { ...newFood, _unsynced: true }])
    console.error('❌ NOT saved to Excel:', err.message)
    throw err // let the UI show an error
  }
}

export const deleteFood = async (id) => {
  const item = readCache().find((i) => i.id === id)
  writeCache(readCache().filter((i) => i.id !== id))
  if (item?._unsynced) return // never reached Excel
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
  const result = await readJson(res)
  if (!res.ok || result.result !== 'success') throw new Error(result.error || 'Delete failed')
}

export const downloadExcel = () => window.open(`${API}/download`, '_blank')

export const saveAllToBackend = async () => {
  const cache = readCache()
  let ok = 0, failed = 0
  for (const item of cache.filter((i) => i._unsynced)) {
    try {
      const { _unsynced, ...clean } = item
      await post(clean)
      item._unsynced = false
      ok++
    } catch {
      failed++
    }
  }
  writeCache(cache)
  alert(failed ? `${failed} item(s) still not saved. Is the server running?` : `Synced ${ok} item(s) to Excel ✅`)
}


// Combined download — both Activity and Water sheets in one workbook
export const downloadFullExcel = () => window.open('/api/download', '_blank')