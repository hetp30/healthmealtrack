const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // Health Profile
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [20, 'Weight must be at least 20kg'],
    max: [300, 'Weight cannot exceed 300kg']
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height cannot exceed 250cm']
  },
  
  // Health Conditions
  healthConditions: [{
    condition: {
      type: String,
      enum: [
        'diabetes', 'bp', 'cholesterol', 'kidney', 'heart', 'thyroid',
        'obesity', 'pcos', 'lactose', 'gluten', 'anemia', 'ibs',
        'osteoporosis', 'gout', 'allergies', 'none'
      ]
    },
    details: {
      type: String,
      trim: true
    }
  }],
  
  // Custom Health Conditions
  customConditions: {
    type: String,
    trim: true
  },
  
  // Medications and Allergies
  medications: {
    type: String,
    trim: true
  },
  allergies: {
    type: String,
    trim: true
  },
  
  // Health Metrics
  healthMetrics: {
    bmi: {
      type: Number,
      default: function() {
        if (this.weight && this.height) {
          return (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
        }
        return null;
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Gamification
  points: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  achievements: [{
    id: String,
    title: String,
    description: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      healthAlerts: { type: Boolean, default: true }
    },
    privacy: {
      shareData: { type: Boolean, default: false },
      publicProfile: { type: Boolean, default: false }
    },
    units: {
      weight: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
      height: { type: String, enum: ['cm', 'ft'], default: 'cm' }
    }
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'healthConditions.condition': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to calculate BMI
userSchema.pre('save', function(next) {
  if (this.isModified('weight') || this.isModified('height')) {
    this.healthMetrics.bmi = (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
    this.healthMetrics.lastUpdated = new Date();
  }
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addPoints = function(amount) {
  this.points += amount;
  return this.save();
};

userSchema.methods.updateStreak = function() {
  const today = new Date().toDateString();
  const lastLogin = this.lastLogin.toDateString();
  
  if (lastLogin === today) {
    return; // Already logged today
  }
  
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastLogin === yesterday) {
    this.streak++;
  } else {
    this.streak = 1;
  }
  
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.unlockAchievement = function(achievement) {
  const existingAchievement = this.achievements.find(a => a.id === achievement.id);
  if (!existingAchievement) {
    this.achievements.push(achievement);
    this.points += achievement.points || 0;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
userSchema.statics.findByHealthCondition = function(condition) {
  return this.find({
    'healthConditions.condition': condition,
    isActive: true
  });
};

userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .select('name points streak')
    .sort({ points: -1, streak: -1 })
    .limit(limit);
};

// Virtual fields
userSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    age: this.age,
    gender: this.gender,
    weight: this.weight,
    height: this.height,
    healthConditions: this.healthConditions,
    customConditions: this.customConditions,
    medications: this.medications,
    allergies: this.allergies,
    healthMetrics: this.healthMetrics,
    points: this.points,
    streak: this.streak,
    achievements: this.achievements,
    preferences: this.preferences
  };
});

// JSON transformation
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 