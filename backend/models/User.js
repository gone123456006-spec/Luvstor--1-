const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true, // Allows null/undefined values to not trigger usage errors
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  interests: {
    type: [String],
    default: []
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },
  preference: {
    type: String,
    enum: ['same', 'opposite', 'both'],
    default: 'both'
  },

  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['offline', 'online', 'searching', 'chatting'],
    default: 'offline'
  },
  lastTyping: {
    type: Date,
    default: null
  },
  roomId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified AND exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
