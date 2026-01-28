const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to the JSON database file
const DB_FILE = path.join(__dirname, 'leads.json');

// Initialize database file if it doesn't exist
async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({ leads: [] }, null, 2));
  }
}

// Read leads from database
async function readLeads() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { leads: [] };
  }
}

// Write leads to database
async function writeLeads(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// POST endpoint to save leads
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, email, type, level, message, timestamp } = req.body;

    // Validate input
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Read existing leads
    const db = await readLeads();

    // Create new lead
    const newLead = {
      id: Date.now().toString(),
      name,
      phone,
      email: email || null,
      type: type || 'demo_request',
      level: level || null,
      message: message || null,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new'
    };

    // Add to database
    db.leads.push(newLead);

    // Save to file
    await writeLeads(db);

    console.log('New lead saved:', newLead);

    res.status(201).json({
      success: true,
      message: 'Lead saved successfully',
      lead: newLead
    });
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoint to retrieve all leads
app.get('/api/leads', async (req, res) => {
  try {
    const db = await readLeads();
    res.json({ leads: db.leads });
  } catch (error) {
    console.error('Error reading leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH endpoint to update lead status
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const db = await readLeads();
    const leadIndex = db.leads.findIndex(lead => lead.id === id);

    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    db.leads[leadIndex].status = status;
    await writeLeads(db);

    console.log('Lead updated:', db.leads[leadIndex]);

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: db.leads[leadIndex]
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE endpoint to remove lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readLeads();
    
    const leadIndex = db.leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const deletedLead = db.leads.splice(leadIndex, 1)[0];
    await writeLeads(db);

    console.log('Lead deleted:', deletedLead);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Leads database: ${DB_FILE}`);
  });
});
