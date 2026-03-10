const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check / DB check logic
const healthCheck = async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'online', database: 'connected' });
  } catch (err) {
    console.error("Health Check Error:", err);
    res.status(503).json({ status: 'online', database: 'disconnected', error: err.message });
  }
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Routes
app.use('/api', apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
