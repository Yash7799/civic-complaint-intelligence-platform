// server.js updated: add simple admin authentication (session + bcrypt), protect admin and modify endpoints
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_in_production';

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

function ensureColumn(column, definition) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(complaints)`, [], (err, rows) => {
      if (err) return reject(err);
      const exists = rows.some(r => r.name === column);
      if (exists) return resolve();
      db.run(`ALTER TABLE complaints ADD COLUMN ${column} ${definition}`, (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
}

// create complaints table + additional columns if needed
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
  `, async (err) => {
    if (err) console.error(err);
    try {
      await ensureColumn('status', "TEXT DEFAULT 'open'");
      await ensureColumn('department', "TEXT DEFAULT ''");
      await ensureColumn('priority', "TEXT DEFAULT ''");
    } catch (e) {
      console.error('Error ensuring columns', e);
    }
  });
});

// Simple admin user storage (data/admin.json)
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
function ensureAdminUser() {
  if (fs.existsSync(ADMIN_FILE)) return;
  // create default admin: username: admin password: admin123 (please change)
  const pw = 'admin123';
  const hash = bcrypt.hashSync(pw, 10);
  const admin = { username: 'admin', passwordHash: hash };
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));
  console.log('Created default admin user: username=admin password=admin123 — change this in data/admin.json or set up env vars');
}
ensureAdminUser();

function verifyAdminCredentials(username, password) {
  if (!fs.existsSync(ADMIN_FILE)) return false;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  if (admin.username !== username) return false;
  return bcrypt.compareSync(password, admin.passwordHash);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname)));

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  // if AJAX request, return 401 JSON
  if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
    return res.status(401).json({ error: 'Not authorized' });
  }
  // otherwise redirect to login
  return res.redirect('/admin-login.html');
}

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

// API: list complaints (public read)
app.get('/api/complaints', (req, res) => {
  db.all('SELECT * FROM complaints ORDER BY created_at DESC LIMIT 1000', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    rows = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [], status: r.status || 'open' }));
    res.json(rows);
  });
});

// API: assign department (protected)
app.post('/api/complaints/:id/assign', requireAuth, (req, res) => {
  const id = req.params.id;
  const { department } = req.body;
  db.run('UPDATE complaints SET department = ? WHERE id = ?', [department || '', id], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ success: true });
  });
});

// API: update status (protected)
app.post('/api/complaints/:id/status', requireAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  db.run('UPDATE complaints SET status = ? WHERE id = ?', [status || 'open', id], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ success: true });
  });
});

// Authentication endpoints
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (verifyAdminCredentials(username, password)) {
    req.session.isAdmin = true;
    req.session.adminUser = username;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Serve admin UI (protected)
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve admin login page
app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
