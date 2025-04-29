import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const login = async function(req, res) {
  console.log('Login attempt with data:', JSON.stringify(req.body));
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    console.log('Finding user with email:', email);
    // Explicitly select the password field which is excluded by default
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found, comparing password');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('Password matched, generating token');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    console.log('Login successful for user:', email);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
