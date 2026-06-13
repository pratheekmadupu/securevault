require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const fileController = require('./src/controllers/fileController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
app.use(morgan('dev'));

// Payload size configuration (supports Base64 ciphertext payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SecureVault Backend operational.' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Public unauthenticated route for shared file decryption
app.get('/api/shared/:shareId', fileController.getSharedFile);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Global Error Handler (safe error reporting without leakages)
app.use((err, req, res, next) => {
  console.error('Unhandled System Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An internal security exception occurred.',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ SecureVault Server initialized on port ${PORT}`);
});
