require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db, initDatabase, seedAdminUsers } = require('./database');

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
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const leadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many form submissions, please try again later.',
});

app.use('/api/', limiter);

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

      // Get user from database
      const user = await db.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(username);
      const refreshToken = generateRefreshToken(username);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
      await db.saveRefreshToken(username, refreshToken, expiresAt);

      // Clean up expired tokens periodically
      await db.cleanupExpiredTokens();

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

    const tokenRecord = await db.getRefreshToken(refreshToken);

    if (!tokenRecord) {
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
      await db.deleteRefreshToken(refreshToken);
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
    body('message').optional().trim().isLength({ max: 1000 }),
    body('location').optional().trim(),
    body('demoDate').optional().trim(),
    body('demoTime').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, phone, email, message, location, demoDate, demoTime } = req.body;

      const lead = await db.createLead({
        name: sanitizeInput(name),
        phone: sanitizeInput(phone),
        email: email ? sanitizeInput(email) : null,
        message: message ? sanitizeInput(message) : null,
        location: location ? sanitizeInput(location) : null,
        demoDate: demoDate || null,
        demoTime: demoTime || null
      });

      console.log('✅ New lead saved:', { id: lead.id });

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
    const leads = await db.getAllLeads();
    res.json({ leads });
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

      const lead = await db.updateLeadStatus(id, status);

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      res.json({
        success: true,
        message: 'Lead updated successfully',
        lead
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
    
    await db.query('DELETE FROM leads WHERE id = $1', [id]);

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

// GET /api/users - Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, created_at FROM users ORDER BY username');
    res.json({ users: result.rows.map(u => ({ id: u.id, name: u.username, createdAt: u.created_at })) });
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

      // Check if user already exists
      const existingUser = await db.getUserByUsername(name);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Add new user
      await db.createUser(name, passwordHash);

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
    const rows = await db.getAvailability(username);
    
    // Convert database rows to nested object structure
    const availability = {};
    rows.forEach(row => {
      if (!availability[row.day_of_week]) {
        availability[row.day_of_week] = {};
      }
      availability[row.day_of_week][row.time_slot] = row.status;
    });
    
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
    
    await db.saveAvailability(username, availability);
    
    res.json({ success: true, message: 'Availability saved successfully' });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).json({ error: 'Failed to save availability' });
  }
});

// GET /api/health - Health check endpoint
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
async function startServer() {
  try {
    // Initialize database tables
    await initDatabase();
    
    // Seed admin users
    await seedAdminUsers();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`💾 Using PostgreSQL database`);
      console.log(`🔒 Security features enabled:`);
      console.log(`   ✅ JWT Authentication with Refresh Tokens`);
      console.log(`   ✅ Rate Limiting (500 req/15min, 10 forms/min)`);
      console.log(`   ✅ Helmet Security Headers`);
      console.log(`   ✅ Input Validation & Sanitization`);
      console.log(`   ✅ CORS Protection`);
      console.log(`\n⚠️  Remember to set DATABASE_URL in production!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
