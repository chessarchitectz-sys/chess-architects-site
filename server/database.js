const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        message TEXT,
        location TEXT,
        demo_date TEXT,
        demo_time TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Availability table (stores weekly schedule for each user)
    await client.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        day_of_week VARCHAR(20) NOT NULL,
        time_slot VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'unset',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, day_of_week, time_slot)
      )
    `);

    // Refresh tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_availability_username ON availability(username);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_username ON refresh_tokens(username);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed initial admin users (only if users table is empty)
async function seedAdminUsers() {
  const bcrypt = require('bcryptjs');
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log('📝 Seeding admin users...');
      
      const users = [
        { username: 'mpandit', password: 'MithiChArch@123' },
        { username: 'pburli', password: 'PranavChArch@123' },
        { username: 'amadkar', password: 'AtharvaChArch@123' },
        { username: 'nchanav', password: 'NameetChArch@123' },
        { username: 'ppatil', password: 'PruthvirajChArch@123' }
      ];

      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
          [user.username, hashedPassword]
        );
      }

      console.log(`✅ Seeded ${users.length} admin users`);
    }
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  }
}

// Database query helpers
const db = {
  // Generic query method
  query: (text, params) => pool.query(text, params),

  // Users
  getUserByUsername: async (username) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  },

  createUser: async (username, passwordHash) => {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, passwordHash]
    );
    return result.rows[0];
  },

  // Leads
  getAllLeads: async () => {
    const result = await pool.query(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );
    return result.rows;
  },

  createLead: async (leadData) => {
    const { name, email, phone, message, location, demoDate, demoTime } = leadData;
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, message, location, demo_date, demo_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new') RETURNING *`,
      [name, email, phone, message, location, demoDate, demoTime]
    );
    return result.rows[0];
  },

  updateLeadStatus: async (id, status) => {
    const result = await pool.query(
      'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  // Availability
  getAvailability: async (username) => {
    const result = await pool.query(
      'SELECT * FROM availability WHERE username = $1',
      [username]
    );
    return result.rows;
  },

  saveAvailability: async (username, schedule) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing availability for user
      await client.query('DELETE FROM availability WHERE username = $1', [username]);
      
      // Insert new availability
      for (const [day, times] of Object.entries(schedule)) {
        for (const [time, status] of Object.entries(times)) {
          if (status !== 'unset') {
            await client.query(
              'INSERT INTO availability (username, day_of_week, time_slot, status) VALUES ($1, $2, $3, $4)',
              [username, day, time, status]
            );
          }
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Refresh Tokens
  saveRefreshToken: async (username, token, expiresAt) => {
    await pool.query(
      'INSERT INTO refresh_tokens (username, token, expires_at) VALUES ($1, $2, $3)',
      [username, token, expiresAt]
    );
  },

  getRefreshToken: async (token) => {
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [token]
    );
    return result.rows[0];
  },

  deleteRefreshToken: async (token) => {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  },

  cleanupExpiredTokens: async () => {
    await pool.query('DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP');
  }
};

module.exports = {
  pool,
  db,
  initDatabase,
  seedAdminUsers
};
