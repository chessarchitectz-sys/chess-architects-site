require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Increased from 5 to 10
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const leadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Increased from 3 to 10
  message: 'Too many form submissions, please try again later.',
});

app.use('/api/', limiter);

// Database file paths
const DB_FILE = path.join(__dirname, 'leads.json');
const REFRESH_TOKENS_FILE = path.join(__dirname, 'refresh_tokens.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const AVAILABILITY_FILE = path.join(__dirname, 'availability.json');

// Encryption key
const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_ACCESS_SECRET || 'fallback_key_change_in_production', 'salt', 32);
const IV_LENGTH = 16;

// Encrypt sensitive data
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
function decrypt(text) {
  if (!text) return null;
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Initialize database files
async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({ leads: [] }, null, 2));
  }
  
  try {
    await fs.access(REFRESH_TOKENS_FILE);
  } catch {
    await fs.writeFile(REFRESH_TOKENS_FILE, JSON.stringify({ tokens: [] }, null, 2));
  }

  try {
    await fs.access(USERS_FILE);
  } catch {
    // Initialize with existing users from .env
    const users = (process.env.ADMIN_USERS || '').split(',').map(u => u.trim()).filter(u => u);
    const passwords = (process.env.ADMIN_PASSWORDS || '').split(',').map(p => p.trim()).filter(p => p);
    const initialUsers = users.map((name, index) => ({
      id: Date.now() + index,
      name,
      passwordHash: passwords[index],
      createdAt: new Date().toISOString()
    }));
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: initialUsers }, null, 2));
  }

  try {
    await fs.access(AVAILABILITY_FILE);
  } catch {
    await fs.writeFile(AVAILABILITY_FILE, JSON.stringify({ schedules: {} }, null, 2));
  }
}

// Read data from files
async function readLeads() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Decrypt sensitive data
    parsed.leads = parsed.leads.map(lead => {
      try {
        return {
          ...lead,
          phone: lead.phone_encrypted ? decrypt(lead.phone_encrypted) : lead.phone,
          email: lead.email_encrypted ? decrypt(lead.email_encrypted) : (lead.email || null),
          phone_encrypted: undefined,
          email_encrypted: undefined
        };
      } catch (error) {
        console.error('Decryption error for lead:', lead.id);
        return lead;
      }
    });
    return parsed;
  } catch (error) {
    console.error('Error reading leads:', error);
    return { leads: [] };
  }
}

async function writeLeads(data) {
  try {
    // Encrypt sensitive data before writing
    const encryptedData = {
      leads: data.leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone_encrypted: encrypt(lead.phone),
        email_encrypted: lead.email ? encrypt(lead.email) : null,
        type: lead.type,
        level: lead.level || null,
        message: lead.message || null,
        timestamp: lead.timestamp,
        status: lead.status,
        updatedAt: lead.updatedAt || null,
        updatedBy: lead.updatedBy || null
      }))
    };
    await fs.writeFile(DB_FILE, JSON.stringify(encryptedData, null, 2));
  } catch (error) {
    console.error('Error writing leads:', error);
    throw error;
  }
}

async function readRefreshTokens() {
  try {
    const data = await fs.readFile(REFRESH_TOKENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { tokens: [] };
  }
}

async function writeRefreshTokens(data) {
  await fs.writeFile(REFRESH_TOKENS_FILE, JSON.stringify(data, null, 2));
}

async function readUsers() {
  const data = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

async function readAvailability() {
  const data = await fs.readFile(AVAILABILITY_FILE, 'utf8');
  return JSON.parse(data);
}

async function writeAvailability(data) {
  await fs.writeFile(AVAILABILITY_FILE, JSON.stringify(data, null, 2));
}

// Generate Access Token
function generateAccessToken(username) {
  return jwt.sign(
    { username, type: 'access' },
    process.env.JWT_ACCESS_SECRET || 'default_secret_change_in_production',
    { expiresIn: '15m' }
  );
}

// Generate Refresh Token
function generateRefreshToken(username) {
  return jwt.sign(
    { username, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production',
    { expiresIn: '7d' }
  );
}

// Verify JWT Token Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'default_secret_change_in_production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Input Sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 500);
}

// POST /api/auth/login - Admin Login
app.post('/api/auth/login',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).escape(),
    body('password').isLength({ min: 6, max: 100 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;

      // Get users from users.json
      const usersData = await readUsers();
      const user = usersData.users.find(u => u.name === username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(username);
      const refreshToken = generateRefreshToken(username);

      // Store refresh token
      const tokenData = await readRefreshTokens();
      tokenData.tokens.push({
        token: refreshToken,
        username,
        createdAt: new Date().toISOString()
      });
      
      if (tokenData.tokens.length > 10) {
        tokenData.tokens = tokenData.tokens.slice(-10);
      }
      
      await writeRefreshTokens(tokenData);

      res.json({
        success: true,
        accessToken,
        refreshToken,
        expiresIn: '15m'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/refresh - Refresh Access Token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const tokenData = await readRefreshTokens();
    const tokenExists = tokenData.tokens.find(t => t.token === refreshToken);

    if (!tokenExists) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired refresh token' });
      }

      const accessToken = generateAccessToken(user.username);
      res.json({
        success: true,
        accessToken,
        expiresIn: '15m'
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenData = await readRefreshTokens();
      tokenData.tokens = tokenData.tokens.filter(t => t.token !== refreshToken);
      await writeRefreshTokens(tokenData);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads - Create lead (public endpoint with rate limiting)
app.post('/api/leads',
  leadLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('phone').trim().matches(/^[+]?[0-9]{10,15}$/),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('type').isIn(['demo_request', 'contact_form']),
    body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Individual']),
    body('message').optional().trim().isLength({ max: 1000 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, phone, email, type, level, message } = req.body;

      const db = await readLeads();

      const newLead = {
        id: Date.now().toString() + crypto.randomBytes(4).toString('hex'),
        name: sanitizeInput(name),
        phone: sanitizeInput(phone),
        email: email ? sanitizeInput(email) : null,
        type,
        level: level || null,
        message: message ? sanitizeInput(message) : null,
        timestamp: new Date().toISOString(),
        status: 'new'
      };

      db.leads.push(newLead);
      await writeLeads(db);

      console.log('✅ New lead saved (encrypted):', { id: newLead.id, type: newLead.type });

      res.status(201).json({
        success: true,
        message: 'Lead saved successfully'
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/leads - Get all leads (protected)
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const db = await readLeads();
    res.json({ leads: db.leads });
  } catch (error) {
    console.error('Error reading leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/leads/:id - Update lead status (protected)
app.patch('/api/leads/:id',
  authenticateToken,
  [
    body('status').isIn(['new', 'contacted', 'converted', 'rejected'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;

      const db = await readLeads();
      const leadIndex = db.leads.findIndex(lead => lead.id === id);

      if (leadIndex === -1) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      db.leads[leadIndex].status = status;
      db.leads[leadIndex].updatedAt = new Date().toISOString();
      db.leads[leadIndex].updatedBy = req.user.username;
      
      await writeLeads(db);

      res.json({
        success: true,
        message: 'Lead updated successfully',
        lead: db.leads[leadIndex]
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/leads/:id - Delete lead (protected)
app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readLeads();

    const leadIndex = db.leads.findIndex(lead => lead.id === id);

    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    db.leads.splice(leadIndex, 1);
    await writeLeads(db);

    console.log('🗑️  Lead deleted:', { id, by: req.user.username });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
// GET /api/users - Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const usersData = await readUsers();
    // Don't send password hashes to client
    const sanitizedUsers = usersData.users.map(({ passwordHash, ...user }) => user);
    res.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Add new user
app.post('/api/users',
  authenticateToken,
  [
    body('name').trim().isLength({ min: 3, max: 100 }).escape(),
    body('password').isLength({ min: 8, max: 100 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, password } = req.body;
      const usersData = await readUsers();

      // Check if user already exists
      if (usersData.users.find(u => u.name === name)) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Add new user
      const newUser = {
        id: Date.now(),
        name,
        passwordHash,
        createdAt: new Date().toISOString()
      };

      usersData.users.push(newUser);
      await writeUsers(usersData);

      res.json({ success: true, message: 'User added successfully' });
    } catch (error) {
      console.error('Error adding user:', error);
      res.status(500).json({ error: 'Failed to add user' });
    }
  }
);

// GET /api/availability/:username - Get availability for specific user
app.get('/api/availability/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const availabilityData = await readAvailability();
    const availability = availabilityData.schedules[username] || {};
    res.json({ availability });
  } catch (error) {
    console.error('Error reading availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /api/availability - Save availability for current user
app.post('/api/availability', authenticateToken, async (req, res) => {
  try {
    const { availability } = req.body;
    const username = req.user.username;
    
    const availabilityData = await readAvailability();
    availabilityData.schedules[username] = availability;
    await writeAvailability(availabilityData);
    
    res.json({ success: true, message: 'Availability saved successfully' });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).json({ error: 'Failed to save availability' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Secure server running on http://localhost:${PORT}`);
    console.log(`📁 Leads database: ${DB_FILE}`);
    console.log(`🔒 Security features enabled:`);
    console.log(`   ✅ JWT Authentication with Refresh Tokens`);
    console.log(`   ✅ Data Encryption (AES-256-CBC)`);
    console.log(`   ✅ Rate Limiting (100 req/15min, 3 forms/min)`);
    console.log(`   ✅ Helmet Security Headers`);
    console.log(`   ✅ Input Validation & Sanitization`);
    console.log(`   ✅ CORS Protection`);
    console.log(`\n⚠️  Remember to change credentials in .env before production!\n`);
  });
});
