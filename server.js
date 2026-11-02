'use strict';

require('dotenv').config();
const express = require('express');

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const app = express();

const PORT = process.env.PORT || 3000;
console.log(PORT);

const HOST = '0.0.0.0';

// Set DATA_DIR to a persistent writable directory in your hosting panel.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

const isProduction = process.env.NODE_ENV === 'production'|| process.env.NODE_ENV === 'development';

// Configure this to 1 if your hosting provider uses a trusted reverse proxy.
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// Security headers. CSP is disabled here to avoid unexpectedly breaking
// existing frontend pages that may use inline scripts or styles.
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

// Prevent browser/proxy caching of enquiry and health API responses.
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Limit repeated enquiry submissions from the same client.
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many submissions. Please try again later.'
  }
});

app.use('/api/requests', requestLimiter);

// Serve the website's frontend.
app.use(express.static(path.join(__dirname, 'public')));

const clean = (value, maxLength = 500) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

// Serialize file writes so simultaneous enquiries don't overwrite each other.
let writeQueue = Promise.resolve();

async function saveRequest(request) {
  const operation = writeQueue.catch(() => {}).then(async () => {
    const content = await fs.promises.readFile(REQUESTS_FILE, 'utf8');
    const requests = JSON.parse(content);

    if (!Array.isArray(requests)) {
      throw new Error('The requests file does not contain a valid array.');
    }

    requests.push(request);

    const temporaryFile = `${REQUESTS_FILE}.${crypto.randomUUID()}.tmp`;

    try {
      await fs.promises.writeFile(
        temporaryFile,
        JSON.stringify(requests, null, 2) + '\n',
        { encoding: 'utf8', mode: 0o600 }
      );

      await fs.promises.rename(temporaryFile, REQUESTS_FILE);
    } catch (error) {
      await fs.promises.unlink(temporaryFile).catch(() => {});
      throw error;
    }
  });

  writeQueue = operation;
  return operation;
}

// Submit a farmland enquiry.
app.post('/api/requests', async (req, res, next) => {
  try {
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

    if (
      !request.name ||
      !request.phone ||
      !request.crop ||
      !request.area ||
      !request.location
    ) {
      return res.status(400).json({
        message: 'Please fill in your name, phone, farm location, crop, and growing area.'
      });
    }

    if (!/^[+\d()\s.-]{7,30}$/.test(request.phone)) {
      return res.status(400).json({
        message: 'Please enter a valid phone number.'
      });
    }

    if (
      request.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)
    ) {
      return res.status(400).json({
        message: 'Please enter a valid email address or leave it blank.'
      });
    }

    await saveRequest(request);

    return res.status(201).json({
      message: 'Your Herblife farmland enquiry has been received!',
      id: request.id
    });
  } catch (error) {
    next(error);
  }
});

// Health-check endpoint for hosting providers.
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Herblife'
  });
});

// Unknown API routes return JSON rather than the website's HTML page.
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

// Handle malformed JSON and unexpected application errors.
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      message: 'Invalid JSON request.'
    });
  }

  console.error('Application error:', error.message);

  return res.status(500).json({
    message: 'Something went wrong. Please try again later.'
  });
});

// Initialize storage and start the server.
async function startServer() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.promises.access(REQUESTS_FILE);
  } catch {
    await fs.promises.writeFile(REQUESTS_FILE, '[]\n', {
      encoding: 'utf8',
      mode: 0o600
    });
  }

  // Validate the existing data file before accepting requests.
  const existingData = JSON.parse(
    await fs.promises.readFile(REQUESTS_FILE, 'utf8')
  );

  if (!Array.isArray(existingData)) {
    throw new Error('Invalid requests.json: expected an array.');
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Herblife is listening on ${HOST}:${PORT}`);
  });

  server.on('error', (error) => {
    console.error('Server startup/runtime error:', error);
    process.exitCode = 1;
  });

  // Allow time for in-flight requests to finish during shutdown.
  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down Herblife...`);

    server.close((error) => {
      if (error) {
        console.error('Shutdown error:', error);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Could not start Herblife:', error);
  process.exit(1);
});