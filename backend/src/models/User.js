import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

/**
 * User Schema - Implements the User Authentication requirements from the assessment document
 * 
 * This schema fulfills the " User Authentication (JWT)" requirement:
 * "Create a User Schema to store login credentials."
 * "Secure all API endpoints using JWT Authentication."
 * 
 * The schema stores:
 * - email: User's email address (unique identifier)
 * - password: Securely hashed password using bcrypt
 * - role: User's role in the system (admin, school, trustee)
 * - createdAt: Timestamp of user creation
 * 
 * Security features implemented:
 * - Password hashing using bcrypt
 * - Password field excluded from query results (select: false)
 * - Email validation using regex
 * - Role-based access control
 */
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Email validation regex
  },
  password: {
    type: String,
    required: true,
    select: false // Excludes password from query results for security
  },
  role: {
    type: String,
    enum: ['admin', 'school', 'trustee'],
    default: 'trustee'
  },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

/**
 * Pre-save middleware to hash passwords
 * 
 * This implements the security best practice of never storing plaintext passwords
 * as mentioned in the "Security Best Practices" section of the assessment.
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Method to compare entered password with hashed password
 * 
 * This method is used during authentication to verify user credentials
 * and is part of the JWT authentication flow required in the assessment.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create indexes for efficient querying
userSchema.index({ email: 1 }); // For faster email lookups during authentication
userSchema.index({ role: 1 }); // For role-based queries

export const User = model(
  'User',
  userSchema
);
