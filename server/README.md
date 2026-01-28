# Chess Architects Academy - Backend Server

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

### 3. Database

Leads are stored in `leads.json` file in the server directory.

### API Endpoints

#### Save Lead
- **POST** `/api/leads`
- Body: `{ name, phone, type, timestamp }`
- Response: `{ success: true, lead: {...} }`

#### Get All Leads
- **GET** `/api/leads`
- Response: `{ leads: [...] }`

### Lead Structure
```json
{
  "id": "1234567890",
  "name": "John Doe",
  "phone": "+919876543210",
  "type": "demo_request",
  "timestamp": "2026-01-26T...",
  "status": "new"
}
```
