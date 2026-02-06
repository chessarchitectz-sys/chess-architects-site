const request = require('supertest');
const { Pool } = require('pg');

// Mock database for testing
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Authentication API Tests', () => {
  let app;
  let pool;

  beforeAll(() => {
    // Mock environment variables
    process.env.JWT_ACCESS_SECRET = 'test_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.CORS_ORIGIN = '*';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'ab', // Too short
          password: '123'  // Too short
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // User not found

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invaliduser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return tokens on successful login', async () => {
      const mockUser = {
        id: 1,
        username: 'mpandit',
        password_hash: '$2b$10$validhash'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'mpandit',
          password: 'MithiChArch@123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn', '15m');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Refresh token required');
    });

    it('should return 403 for invalid refresh token', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // Token not found

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid_token'
        });

      expect(response.status).toBe(403);
    });
  });
});

describe('Leads API Tests', () => {
  let app;
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('POST /api/leads', () => {
    it('should create lead with valid data', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Test User',
          phone: '1234567890',
          email: 'test@test.com'
        }]
      });

      const response = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User',
          phone: '1234567890',
          email: 'test@test.com',
          message: 'Test message',
          location: 'Mumbai',
          demoDate: '2026-02-01',
          demoTime: '10:00 AM'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 400 for invalid phone number', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User',
          phone: '123', // Invalid
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User',
          phone: '1234567890',
          email: 'invalid-email' // Invalid
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/leads', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/leads');

      expect(response.status).toBe(401);
    });

    it('should return leads with valid token', async () => {
      const mockLeads = [
        { id: 1, name: 'User 1', phone: '1234567890' },
        { id: 2, name: 'User 2', phone: '0987654321' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockLeads });

      const response = await request(app)
        .get('/api/leads')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('leads');
      expect(Array.isArray(response.body.leads)).toBe(true);
    });
  });
});

describe('Availability API Tests', () => {
  let app;
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('GET /api/availability/:username', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/availability/mpandit');

      expect(response.status).toBe(401);
    });

    it('should return availability for valid user', async () => {
      const mockAvailability = [
        { username: 'mpandit', day_of_week: 'Monday', time_slot: '10:00 AM', status: 'available' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockAvailability });

      const response = await request(app)
        .get('/api/availability/mpandit')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('availability');
    });
  });

  describe('POST /api/availability', () => {
    it('should save availability with valid data', async () => {
      pool.connect.mockResolvedValueOnce({
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      });

      const response = await request(app)
        .post('/api/availability')
        .set('Authorization', 'Bearer valid_token')
        .send({
          availability: {
            Monday: { '10:00 AM': 'available' },
            Tuesday: { '2:00 PM': 'unavailable' }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});

describe('Rate Limiting Tests', () => {
  let app;

  it('should rate limit login attempts', async () => {
    // Make 11 requests (limit is 10)
    const requests = [];
    for (let i = 0; i < 11; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'test' })
      );
    }

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter(r => r.status === 429);
    
    expect(tooManyRequests.length).toBeGreaterThan(0);
  });

  it('should rate limit form submissions', async () => {
    // Make 11 requests (limit is 10/minute)
    const requests = [];
    for (let i = 0; i < 11; i++) {
      requests.push(
        request(app)
          .post('/api/leads')
          .send({
            name: 'Test',
            phone: '1234567890',
            email: 'test@test.com'
          })
      );
    }

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter(r => r.status === 429);
    
    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
