const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure folders exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 8 * 1024 * 1024 } });

// DB init
const dbPath = path.join(DATA_DIR, 'complaints.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      contact TEXT,
      title TEXT,
      description TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      images TEXT,
      created_at TEXT
    )
  `);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname)));

// API: submit complaint
app.post('/api/complaints', upload.array('images', 6), (req, res) => {
  try {
    const { name, email, title, description, address, lat, lng } = req.body;
    const contact = email || '';
    const images = (req.files || []).map(f => `/uploads/${f.filename}`);
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`INSERT INTO complaints (name, contact, title, description, address, lat, lng, images, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(name, contact, title, description, address, lat || null, lng || null, JSON.stringify(images), created_at, function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      const id = this.lastID;
      res.json({ success: true, id, images });
    });
    stmt.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: list complaints (admin)
app.get('/api/complaints', (req, res) => {
  db.all('SELECT * FROM complaints ORDER BY created_at DESC LIMIT 200', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    // parse images JSON
    rows = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json(rows);
  });
});

// Serve uploads and frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
