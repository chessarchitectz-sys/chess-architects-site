const { Pool } = require('pg');

describe('Database Operations Tests', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chess_architects_test'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const client = await pool.connect();
      expect(client).toBeDefined();
      client.release();
    });

    it('should execute simple query', async () => {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows.length).toBe(1);
    });
  });

  describe('Users Table', () => {
    it('should have users table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    it('should insert and retrieve user', async () => {
      const username = 'testuser_' + Date.now();
      const passwordHash = '$2b$10$testHash';

      // Insert
      await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        [username, passwordHash]
      );

      // Retrieve
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].username).toBe(username);

      // Cleanup
      await pool.query('DELETE FROM users WHERE username = $1', [username]);
    });
  });

  describe('Leads Table', () => {
    it('should have leads table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'leads'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    it('should insert and retrieve lead', async () => {
      const leadData = {
        name: 'Test Lead',
        phone: '1234567890',
        email: 'test@test.com',
        message: 'Test message'
      };

      // Insert
      const insertResult = await pool.query(
        `INSERT INTO leads (name, phone, email, message, status) 
         VALUES ($1, $2, $3, $4, 'new') RETURNING *`,
        [leadData.name, leadData.phone, leadData.email, leadData.message]
      );

      expect(insertResult.rows.length).toBe(1);
      expect(insertResult.rows[0].name).toBe(leadData.name);

      // Cleanup
      await pool.query('DELETE FROM leads WHERE id = $1', [insertResult.rows[0].id]);
    });

    it('should update lead status', async () => {
      // Insert test lead
      const insertResult = await pool.query(
        `INSERT INTO leads (name, phone, status) 
         VALUES ('Test', '1234567890', 'new') RETURNING *`
      );

      const leadId = insertResult.rows[0].id;

      // Update status
      await pool.query(
        'UPDATE leads SET status = $1 WHERE id = $2',
        ['contacted', leadId]
      );

      // Verify
      const result = await pool.query('SELECT status FROM leads WHERE id = $1', [leadId]);
      expect(result.rows[0].status).toBe('contacted');

      // Cleanup
      await pool.query('DELETE FROM leads WHERE id = $1', [leadId]);
    });
  });

  describe('Availability Table', () => {
    it('should have availability table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'availability'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    it('should insert and retrieve availability', async () => {
      const username = 'mpandit';
      const day = 'Monday';
      const time = '10:00 AM';

      // Insert
      await pool.query(
        `INSERT INTO availability (username, day_of_week, time_slot, status) 
         VALUES ($1, $2, $3, 'available')
         ON CONFLICT (username, day_of_week, time_slot) 
         DO UPDATE SET status = 'available'`,
        [username, day, time]
      );

      // Retrieve
      const result = await pool.query(
        'SELECT * FROM availability WHERE username = $1 AND day_of_week = $2',
        [username, day]
      );

      expect(result.rows.length).toBeGreaterThan(0);

      // Cleanup
      await pool.query(
        'DELETE FROM availability WHERE username = $1 AND day_of_week = $2 AND time_slot = $3',
        [username, day, time]
      );
    });
  });

  describe('Refresh Tokens Table', () => {
    it('should have refresh_tokens table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'refresh_tokens'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    it('should insert and retrieve refresh token', async () => {
      const username = 'mpandit';
      const token = 'test_token_' + Date.now();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Insert
      await pool.query(
        'INSERT INTO refresh_tokens (username, token, expires_at) VALUES ($1, $2, $3)',
        [username, token, expiresAt]
      );

      // Retrieve
      const result = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = $1',
        [token]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].username).toBe(username);

      // Cleanup
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    });

    it('should cleanup expired tokens', async () => {
      const username = 'mpandit';
      const token = 'expired_token_' + Date.now();
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      // Insert expired token
      await pool.query(
        'INSERT INTO refresh_tokens (username, token, expires_at) VALUES ($1, $2, $3)',
        [username, token, expiresAt]
      );

      // Cleanup expired
      await pool.query('DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP');

      // Verify deleted
      const result = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = $1',
        [token]
      );

      expect(result.rows.length).toBe(0);
    });
  });
});
