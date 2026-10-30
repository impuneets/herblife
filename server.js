const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, '[]\n', 'utf8');

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
app.post('/api/requests', (req, res) => {
  const body = req.body || {};
  const request = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    name: clean(body.name, 100),
    phone: clean(body.phone, 30),
    email: clean(body.email, 150),
    location: clean(body.location, 180),
    crop: clean(body.crop, 80),
    area: clean(body.area, 80),
    season: clean(body.season, 80),
    method: clean(body.method, 80),
    notes: clean(body.notes, 1500),
    status: 'new'
  };

  if (!request.name || !request.phone || !request.crop || !request.area || !request.location) {
    return res.status(400).json({ message: 'Please fill in your name, phone, farm location, crop, and growing area.' });
  }
  if (!/^[+\d()\s.-]{7,30}$/.test(request.phone)) {
    return res.status(400).json({ message: 'Please enter a valid phone number.' });
  }
  if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    return res.status(400).json({ message: 'Please enter a valid email address or leave it blank.' });
  }

  try {
    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    requests.push(request);
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2) + '\n', 'utf8');
    return res.status(201).json({ message: 'Your Herblife farmland enquiry has been received!', id: request.id });
  } catch (error) {
    console.error('Could not save request:', error);
    return res.status(500).json({ message: 'We could not save your request right now. Please try again later.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`Herblife website is running at http://localhost:${PORT}`));
