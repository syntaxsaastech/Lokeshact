const express = require('express')
const cors = require('cors')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, 'data')
const FILE = path.join(DATA_DIR, 'food-data.xlsx')
const COLUMNS = [
  'id', 'date', 'time', 'name', 'meal', 'quantity', 'calories',
  'protein', 'sodium', 'potassium', 'sugar', 'fiber', 'calcium', 'iron'
]
const NUMERIC = ['calories', 'protein', 'sodium', 'potassium', 'sugar', 'fiber', 'calcium', 'iron']

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

let queue = Promise.resolve()
const enqueue = (task) => {
  const run = queue.then(task)
  queue = run.catch(() => {})
  return run
}

// "calories_kcal" -> "calories", "bodyFat" -> "bodyfat", "protein_g" -> "protein"
const normHeader = (v) => String(v ?? '').trim().toLowerCase().replace(/_(kcal|g|mg)$/, '')

const getHeaderMap = (ws) => {
  const map = {}
  ws.getRow(1).eachCell((cell, col) => {
    map[normHeader(cell.value)] = col
  })
  return map
}

// FIX: try exact, lowercase, and normalized keys so bodyFat matches bodyfat
const findCol = (map, name) => {
  return map[name] ?? map[name.toLowerCase()] ?? map[normHeader(name)]
}

async function openSheet() {
  const wb = new ExcelJS.Workbook()
  if (fs.existsSync(FILE)) await wb.xlsx.readFile(FILE)
  let ws = wb.getWorksheet('Activity') || wb.worksheets[0]
  if (!ws) ws = wb.addWorksheet('Activity')

  const map = getHeaderMap(ws)
  let dirty = false
  COLUMNS.forEach((c) => {
    if (!findCol(map, c)) {
      const col = Math.max(0, ...Object.values(map)) + 1
      ws.getRow(1).getCell(col).value = c
      map[c] = col
      dirty = true
    }
  })
  ws.getRow(1).font = { bold: true }
  Object.values(map).forEach((col) => (ws.getColumn(col).width = 14))
  return { wb, ws, map, dirty }
}

const cellValue = (row, map, name) => {
  const col = findCol(map, name)
  if (!col) return ''
  let v = row.getCell(col).value
  if (v && typeof v === 'object' && v.result !== undefined) v = v.result
  if (v instanceof Date) {
    const iso = v.toISOString()
    return name === 'time' ? iso.slice(11, 16) : iso.slice(0, 10)
  }
  return v ?? ''
}

const ensureIds = (ws, map) => {
  let changed = false
  let next = Date.now()
  const idCol = findCol(map, 'id')
  if (!idCol) return false
  ws.eachRow((row, n) => {
    if (n > 1 && !row.getCell(idCol).value) {
      row.getCell(idCol).value = next++
      changed = true
    }
  })
  return changed
}

app.get('/api/food', (req, res) => {
  enqueue(async () => {
    const { wb, ws, map, dirty } = await openSheet()
    if (ensureIds(ws, map) || dirty) await wb.xlsx.writeFile(FILE)

    const data = []
    ws.eachRow((row, n) => {
      if (n > 1) {
        const obj = {}
        COLUMNS.forEach((c) => (obj[c] = cellValue(row, map, c)))
        data.push(obj)
      }
    })
    res.json({ result: 'success', data })
  }).catch((err) => {
    console.error('GET failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.get('/api/food/download', (req, res) => {
  if (!fs.existsSync(FILE)) return res.status(404).send('No data yet')
  res.download(FILE, 'food-data.xlsx')
})

app.post('/api/food', (req, res) => {
  enqueue(async () => {
    const d = req.body || {}
    if (!d.name) return res.status(400).json({ result: 'error', error: 'name is required' })

    const { wb, ws, map } = await openSheet()
    const width = Math.max(...Object.values(map))
    const row = new Array(width).fill(null)
    COLUMNS.forEach((c) => {
      const v = c === 'id' ? d.id ?? Date.now() : d[c]
      const col = findCol(map, c)
      if (!col) return
      row[col - 1] = NUMERIC.includes(c) ? Number(v) || 0 : v ?? ''
    })
    ws.addRow(row)
    await wb.xlsx.writeFile(FILE)
    console.log('Saved row ->', FILE, '| data rows:', ws.rowCount - 1)
    res.json({ result: 'success', rows: ws.rowCount - 1 })
  }).catch((err) => {
    console.error('POST failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.delete('/api/food/:id', (req, res) => {
  enqueue(async () => {
    const { wb, ws, map } = await openSheet()
    const idCol = findCol(map, 'id')
    let target = -1
    ws.eachRow((row, n) => {
      if (n > 1 && String(row.getCell(idCol).value) === String(req.params.id)) target = n
    })
    if (target === -1) return res.status(404).json({ result: 'error', error: 'Not found' })
    ws.spliceRows(target, 1)
    await wb.xlsx.writeFile(FILE)
    res.json({ result: 'success' })
  }).catch((err) => {
    console.error('DELETE failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

// ─── Water intake ────────────────────────────────────────────────
const WATER_COLUMNS = ['id', 'date', 'time', 'amount_ml', 'total_ml', 'goal_ml']
const WATER_NUMERIC = ['amount_ml', 'total_ml', 'goal_ml']
const WATER_SHEET = 'Water'

async function openWaterSheet() {
  const wb = new ExcelJS.Workbook()
  if (fs.existsSync(FILE)) await wb.xlsx.readFile(FILE)
  let ws = wb.getWorksheet(WATER_SHEET)
  if (!ws) ws = wb.addWorksheet(WATER_SHEET)

  const map = getHeaderMap(ws)
  let dirty = false
  WATER_COLUMNS.forEach((c) => {
    if (!findCol(map, c)) {
      const col = Math.max(0, ...Object.values(map)) + 1
      ws.getRow(1).getCell(col).value = c
      map[c] = col
      dirty = true
    }
  })
  ws.getRow(1).font = { bold: true }
  Object.values(map).forEach((col) => (ws.getColumn(col).width = 14))
  return { wb, ws, map, dirty }
}

app.get('/api/water', (req, res) => {
  enqueue(async () => {
    const { wb, ws, map, dirty } = await openWaterSheet()
    if (ensureIds(ws, map) || dirty) await wb.xlsx.writeFile(FILE)

    const data = []
    ws.eachRow((row, n) => {
      if (n > 1) {
        const obj = {}
        WATER_COLUMNS.forEach((c) => (obj[c] = cellValue(row, map, c)))
        data.push(obj)
      }
    })
    res.json({ result: 'success', data })
  }).catch((err) => {
    console.error('GET /api/water failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.post('/api/water', (req, res) => {
  enqueue(async () => {
    const d = req.body || {}
    if (d.total_ml == null) return res.status(400).json({ result: 'error', error: 'total_ml is required' })

    const { wb, ws, map } = await openWaterSheet()
    const width = Math.max(...Object.values(map))
    const row = new Array(width).fill(null)

    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const timeStr = now.toTimeString().slice(0, 5)

    WATER_COLUMNS.forEach((c) => {
      let v
      if (c === 'id') v = d.id ?? Date.now()
      else if (c === 'date') v = d.date ?? dateStr
      else if (c === 'time') v = d.time ?? timeStr
      else v = d[c]
      const col = findCol(map, c)
      if (!col) return
      row[col - 1] = WATER_NUMERIC.includes(c) ? Number(v) || 0 : v ?? ''
    })
    ws.addRow(row)
    await wb.xlsx.writeFile(FILE)
    console.log('Saved water row ->', FILE, '| data rows:', ws.rowCount - 1)
    res.json({ result: 'success', rows: ws.rowCount - 1 })
  }).catch((err) => {
    console.error('POST /api/water failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.delete('/api/water/:id', (req, res) => {
  enqueue(async () => {
    const { wb, ws, map } = await openWaterSheet()
    const idCol = findCol(map, 'id')
    let target = -1
    ws.eachRow((row, n) => {
      if (n > 1 && String(row.getCell(idCol).value) === String(req.params.id)) target = n
    })
    if (target === -1) return res.status(404).json({ result: 'error', error: 'Not found' })
    ws.spliceRows(target, 1)
    await wb.xlsx.writeFile(FILE)
    res.json({ result: 'success' })
  }).catch((err) => {
    console.error('DELETE /api/water failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.get('/api/download', (req, res) => {
  if (!fs.existsSync(FILE)) return res.status(404).send('No data yet')
  res.download(FILE, 'food-data.xlsx')
})

// ─── Weight & Body Metrics ─────────────────────────────────
const WEIGHT_FILE = path.join(DATA_DIR, 'weight.xlsx')
const WEIGHT_COLUMNS = [
  'id', 'date', 'weight', 'waist', 'neck', 'hip',
  'bmi', 'bodyFat', 'muscleMass', 'idealWeight', 'healthyMin', 'healthyMax'
]
const WEIGHT_NUMERIC = [
  'weight', 'waist', 'neck', 'hip',
  'bmi', 'bodyFat', 'muscleMass', 'idealWeight', 'healthyMin', 'healthyMax'
]

async function openWeightSheet() {
  const wb = new ExcelJS.Workbook()
  if (fs.existsSync(WEIGHT_FILE)) await wb.xlsx.readFile(WEIGHT_FILE)
  let ws = wb.getWorksheet('Weight') || wb.worksheets[0]
  if (!ws) ws = wb.addWorksheet('Weight')

  const map = getHeaderMap(ws)
  let dirty = false
  WEIGHT_COLUMNS.forEach((c) => {
    // FIX: check for lowercase key so we don't add duplicate bodyFat columns
    if (!findCol(map, c)) {
      const col = Math.max(0, ...Object.values(map)) + 1
      ws.getRow(1).getCell(col).value = c
      map[c] = col
      dirty = true
    }
  })
  ws.getRow(1).font = { bold: true }
  Object.values(map).forEach((col) => (ws.getColumn(col).width = 14))
  return { wb, ws, map, dirty }
}

app.get('/api/weight', (req, res) => {
  enqueue(async () => {
    const { wb, ws, map, dirty } = await openWeightSheet()
    if (ensureIds(ws, map) || dirty) await wb.xlsx.writeFile(WEIGHT_FILE)

    const data = []
    ws.eachRow((row, n) => {
      if (n > 1) {
        const obj = {}
        WEIGHT_COLUMNS.forEach((c) => (obj[c] = cellValue(row, map, c)))
        data.push(obj)
      }
    })
    res.json({ result: 'success', data })
  }).catch((err) => {
    console.error('GET /api/weight failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.post('/api/weight', (req, res) => {
  enqueue(async () => {
    const d = req.body || {}
    if (d.weight == null) return res.status(400).json({ result: 'error', error: 'weight is required' })

    const { wb, ws, map } = await openWeightSheet()

    const dateCol = findCol(map, 'date')
    let existingRowNum = -1
    if (dateCol) {
      ws.eachRow((row, n) => {
        if (n > 1 && String(row.getCell(dateCol).value) === String(d.date)) {
          existingRowNum = n
        }
      })
    }

    const width = Math.max(...Object.values(map))
    const rowData = new Array(width).fill(null)

    WEIGHT_COLUMNS.forEach((c) => {
      const v = c === 'id' ? d.id ?? Date.now() : d[c]
      const col = findCol(map, c)
      if (!col) {
        console.warn(`Column "${c}" not found in Excel — skipping`)
        return
      }
      rowData[col - 1] = WEIGHT_NUMERIC.includes(c) ? (Number(v) || 0) : (v ?? '')
    })

    if (existingRowNum !== -1) {
      ws.spliceRows(existingRowNum, 1, rowData)
    } else {
      ws.addRow(rowData)
    }

    await wb.xlsx.writeFile(WEIGHT_FILE)
    console.log('Saved weight row ->', WEIGHT_FILE)
    res.json({ result: 'success' })
  }).catch((err) => {
    console.error('POST /api/weight failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.delete('/api/weight/:id', (req, res) => {
  enqueue(async () => {
    const { wb, ws, map } = await openWeightSheet()
    const idCol = findCol(map, 'id')
    let target = -1
    ws.eachRow((row, n) => {
      if (n > 1 && String(row.getCell(idCol).value) === String(req.params.id)) target = n
    })
    if (target === -1) return res.status(404).json({ result: 'error', error: 'Not found' })
    ws.spliceRows(target, 1)
    await wb.xlsx.writeFile(WEIGHT_FILE)
    res.json({ result: 'success' })
  }).catch((err) => {
    console.error('DELETE /api/weight failed:', err)
    res.status(500).json({ result: 'error', error: err.message })
  })
})

app.listen(5000, () => console.log('Excel API on http://localhost:5000 | files: food-data.xlsx & weight.xlsx'))