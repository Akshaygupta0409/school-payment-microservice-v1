import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school-payments';

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    // Connect to MongoDB without deprecated options
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('MongoDB connected successfully');
    
    // Test the connection by getting the connection state
    const connectionState = mongoose.connection.readyState;
    console.log(`MongoDB connection state: ${connectionState}`);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    // Setup connection error handler
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('MongoDB connection failed with error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

export default connectDB;
