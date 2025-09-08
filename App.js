import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Configure dotenv first
dotenv.config();

// Initialize Express app
const app = express();

// Connect to database
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Initialize database connection
initializeDatabase();

// ✅ CORS Configuration - UPDATED
const corsOptions = {
  origin: [
    // 'http://localhost:3000',
    // 'http://localhost:5173',
    'https://ho-ho-india-front-end.vercel.app',
    // 'https://hohoindiabackend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // ✅ Updated CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files serving
app.use('/uploads', express.static('uploads'));

// Routes imports
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';

// Routes middleware
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Test route for debugging
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err.stack);
  
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : 'Something went wrong!'
  });
});

export default app;
