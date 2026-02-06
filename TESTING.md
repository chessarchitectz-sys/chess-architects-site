# Chess Architects Academy - Test Suite

Comprehensive test suite for the Chess Architects Academy application.

## Test Coverage

### Frontend Tests (`src/test/`)
- ✅ **Geolocation Pricing Tests** - Verifies correct pricing display for different countries
- ✅ **Pricing Plan Features Tests** - Validates all plan features are displayed correctly

### Backend Tests (`server/__tests__/`)
- ✅ **Authentication API Tests** - Login, logout, token refresh
- ✅ **Leads API Tests** - Form submissions, lead management
- ✅ **Availability API Tests** - Coach availability scheduling
- ✅ **Rate Limiting Tests** - Protection against abuse
- ✅ **Database Operations Tests** - CRUD operations, data integrity

## Running Tests

### Frontend Tests

```bash
# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Backend Tests

```bash
# Navigate to server directory
cd server

# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Files

### Frontend
- `src/test/Pricing.test.jsx` - Pricing and geolocation tests
- `src/test/setup.js` - Test configuration and mocks

### Backend
- `server/__tests__/api.test.js` - API endpoint tests
- `server/__tests__/database.test.js` - Database operation tests

## What's Being Tested

### 1. Geolocation Pricing ✅
- Indian users see ₹ prices
- Singapore users see S$ prices
- UAE users see AED prices
- Defaults to ₹ if location detection fails
- Defaults to ₹ for unsupported countries

### 2. Authentication ✅
- Login with valid credentials
- Invalid credentials handling
- Token refresh mechanism
- Logout functionality
- Rate limiting on login attempts

### 3. Leads Management ✅
- Form submission validation
- Phone number validation
- Email validation
- Lead retrieval (authenticated)
- Lead status updates
- Rate limiting on form submissions

### 4. Availability System ✅
- Saving coach availability
- Retrieving availability by username
- 3-state toggle (unset/available/unavailable)
- Multi-coach support

### 5. Database Operations ✅
- Table existence verification
- CRUD operations
- Data integrity
- Expired token cleanup
- Status updates

### 6. Security ✅
- JWT token validation
- Rate limiting enforcement
- Input sanitization
- SQL injection prevention
- XSS protection

## Test Data

### Test Admin Users
- Username: `mpandit` / Password: `MithiChArch@123`
- Username: `pburli` / Password: `PranavChArch@123`
- Username: `amadkar` / Password: `AtharvaChArch@123`
- Username: `nchanav` / Password: `NameetChArch@123`
- Username: `ppatil` / Password: `PruthvirajChArch@123`

### Mock API Responses
Tests use mocked geolocation API responses:
- `{ country_code: 'IN' }` - India
- `{ country_code: 'SG' }` - Singapore
- `{ country_code: 'AE' }` - UAE

## Coverage Goals

Target test coverage: **80%+**

- Frontend: 80%+ code coverage
- Backend: 85%+ code coverage
- Critical paths: 100% coverage

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    npm test
    cd server && npm test
```

## Best Practices

✅ **Test Isolation** - Each test is independent  
✅ **Mocking** - External APIs and database mocked  
✅ **Cleanup** - Test data cleaned after each test  
✅ **Fast Execution** - Tests run in seconds  
✅ **Clear Assertions** - Easy to understand what's being tested  

## Troubleshooting

### Frontend Tests Not Running
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend Tests Failing
```bash
# Ensure test database is running
docker-compose up -d

# Check environment variables
cat server/.env
```

### Coverage Reports
Coverage reports are generated in:
- Frontend: `coverage/`
- Backend: `server/coverage/`

Open `coverage/index.html` in browser to view detailed reports.

## Adding New Tests

### Frontend Test Template
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('New Feature', () => {
  it('should do something', () => {
    // Arrange
    // Act  
    // Assert
  })
})
```

### Backend Test Template
```javascript
describe('New API Endpoint', () => {
  it('should handle request correctly', async () => {
    // Arrange
    // Act
    const response = await request(app).get('/api/endpoint')
    // Assert
    expect(response.status).toBe(200)
  })
})
```

## Questions?

Contact the development team or check the main README.md for more information.
