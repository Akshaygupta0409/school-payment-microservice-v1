import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import connectDB from './config/db.js';
import indexRouter from './routes/index.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import transactionsRouter from './routes/transactions.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request body:', JSON.stringify(req.body));
  next();
});

// Connect DB
connectDB();

// Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
//app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/transactions', transactionsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Error stack:', err.stack);
  
  // Check for specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      details: err.message,
      errors: err.errors
    });
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate key error', 
      details: err.message 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    message: 'Server Error', 
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});

export default app;
