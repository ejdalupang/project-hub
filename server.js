const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Storage: JSONBin (cloud) or local file (dev) ──────────────────────────────
const JSONBIN_KEY    = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const DATA_FILE      = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const useCloud       = JSONBIN_KEY && JSONBIN_BIN_ID;

async function readData() {
  if (useCloud) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const json = await res.json();
    return json.record || { projects: [] };
  }
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { projects: [] }; }
}

async function writeData(data) {
  if (useCloud) {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
      body: JSON.stringify(data)
    });
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  res.json(await readData());
});

app.post('/api/data', async (req, res) => {
  await writeData(req.body);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Project Hub running at http://localhost:${PORT}`);
  console.log(`Storage: ${useCloud ? 'JSONBin (cloud)' : 'local file'}`);
});
