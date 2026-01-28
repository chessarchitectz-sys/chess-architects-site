# Admin Panel & CRM Guide

## Overview
The Chess Architects Academy website now includes a complete CRM (Customer Relationship Management) system for managing leads from both the Book Demo modal and Contact form.

---

## 🔐 Admin Login

### Accessing the Admin Panel
Navigate to: `http://localhost:5174/admin`

### Default Credentials
- **Username:** `admin`
- **Password:** `chess@2026`

⚠️ **IMPORTANT:** Change these credentials before deploying to production!

---

## 📊 CRM Dashboard Features

### 1. Statistics Overview
The dashboard displays 4 key metrics:
- **Total Leads**: All leads in the database
- **Demo Requests**: Leads from "Book Demo" button
- **Contact Forms**: Leads from contact section
- **New Leads**: Unprocessed leads

### 2. Search & Filters
- **Search Bar**: Search by name, phone number, or email
- **Type Filter**: Filter by Demo Requests or Contact Forms
- **Status Filter**: Filter by New, Contacted, Converted, or Rejected
- **Refresh Button**: Reload leads from database

### 3. Leads Table
Each lead displays:
- **Date & Time**: When the lead was submitted
- **Name**: Lead's full name
- **Contact**: Phone number and email (if provided)
- **Type**: Demo Request or Contact Form
- **Level**: Chess skill level (Beginner, Intermediate, Advanced, Individual)
- **Status**: Dropdown to update lead status
- **Message**: Message from contact form (if applicable)
- **Actions**: 
  - WhatsApp button (opens WhatsApp chat)
  - Delete button (removes lead)

### 4. Status Management
Update lead status by selecting from the dropdown:
- **New**: Freshly submitted (orange)
- **Contacted**: You've reached out (yellow)
- **Converted**: Successfully enrolled (green)
- **Rejected**: Not interested (red)

---

## 💾 Database Structure

### Lead Object
```json
{
  "id": "1706234567890",
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "type": "demo_request",
  "level": "Beginner",
  "message": "Interested in chess classes",
  "timestamp": "2026-01-26T10:30:00.000Z",
  "status": "new"
}
```

### Lead Types
1. **demo_request**: From "Book Demo" modal popup
2. **contact_form**: From contact section at bottom

### Database Location
`server/leads.json`

---

## 🔌 API Endpoints

### 1. Get All Leads
```
GET http://localhost:3001/api/leads
```

### 2. Create New Lead
```
POST http://localhost:3001/api/leads
Body: {
  "name": "string",
  "phone": "string",
  "email": "string" (optional),
  "type": "demo_request" | "contact_form",
  "level": "string" (optional),
  "message": "string" (optional)
}
```

### 3. Update Lead Status
```
PATCH http://localhost:3001/api/leads/:id
Body: {
  "status": "new" | "contacted" | "converted" | "rejected"
}
```

### 4. Delete Lead
```
DELETE http://localhost:3001/api/leads/:id
```

---

## 🚀 How to Use

### Starting the System

#### 1. Start Backend Server
```bash
cd server
node index.js
```
Server runs on: `http://localhost:3001`

#### 2. Start Frontend Dev Server
```bash
npm run dev
```
Website runs on: `http://localhost:5174`

### Accessing Different Pages
- **Main Website**: `http://localhost:5174/`
- **Admin Panel**: `http://localhost:5174/admin`

---

## 📱 Lead Workflow

### For Demo Requests:
1. User clicks "Book Demo" button
2. Modal popup appears
3. User enters name and WhatsApp number
4. Lead saved with type: `demo_request`
5. Admin can view in CRM dashboard
6. Admin can WhatsApp directly from dashboard

### For Contact Forms:
1. User scrolls to Contact section
2. Fills complete form (name, email, phone, level, message)
3. Lead saved with type: `contact_form`
4. Admin can view all details in CRM
5. Admin can update status and manage lead

---

## 🔒 Security Notes

### Before Production:
1. **Change admin credentials** in `src/Admin.jsx` (lines 52-53)
2. **Use environment variables** for sensitive data
3. **Replace JSON database** with proper database (MongoDB/PostgreSQL)
4. **Add JWT authentication** instead of localStorage
5. **Implement HTTPS** for secure communication
6. **Add rate limiting** to prevent spam
7. **Sanitize all inputs** to prevent injection attacks

### Current Security (Development Only):
- Simple username/password authentication
- localStorage for session management
- JSON file database
- No encryption
- No password hashing

⚠️ **This is suitable for development/testing only!**

---

## 🎨 Customization

### Changing Admin Credentials
Edit `src/Admin.jsx` line 52-53:
```javascript
if (loginData.username === 'your-username' && loginData.password === 'your-password') {
```

### Changing Colors
Edit `src/Admin.css`:
- Primary color: `#667eea`
- Accent color: `#764ba2`
- Success: `#4caf50`
- Warning: `#ffd700`
- Error: `#f44336`

---

## 🐛 Troubleshooting

### "Failed to fetch leads"
- Ensure backend server is running on port 3001
- Check console for CORS errors
- Verify `server/leads.json` exists

### "Invalid username or password"
- Check credentials: admin / chess@2026
- Ensure no extra spaces in input

### WhatsApp button not working
- Ensure phone number includes country code
- Format: +919876543210 (no spaces)

### Data not saving
- Check backend server logs
- Verify write permissions for `server/leads.json`
- Check browser console for errors

---

## 📞 Support

For issues or questions, contact the development team or refer to:
- Frontend code: `src/Admin.jsx`, `src/App.jsx`
- Backend code: `server/index.js`
- Database: `server/leads.json`

---

## ✨ Features Summary

✅ Admin authentication with login page
✅ Complete CRM dashboard with statistics
✅ Search and filter functionality
✅ Lead status management (4 statuses)
✅ Direct WhatsApp integration
✅ Delete leads functionality
✅ Responsive design for mobile/tablet
✅ Real-time data updates
✅ Both demo and contact form leads in one place
✅ Beautiful UI matching website theme

---

**Version**: 1.0
**Last Updated**: January 26, 2026
**System**: Chess Architects Academy CRM
