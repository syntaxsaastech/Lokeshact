// Add this route so React can load data from the Excel file
app.get('/api/read-excel', (req, res) => {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return res.json({ success: true, data: [] }); // Return empty if no file yet
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Add an ID to each row so React can delete them properly
    const dataWithIds = rows.map((row, index) => ({
      ...row,
      id: row.id || (Date.now() + index) 
    }));

    res.json({ success: true, data: dataWithIds });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});