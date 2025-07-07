const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic meal information
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  
  // Image data
  imageUrl: {
    type: String,
    required: true
  },
  imagePublicId: String, // For Cloudinary deletion
  
  // User description
  description: {
    type: String,
    trim: true
  },
  
  // AI Analysis Results
  aiAnalysis: {
    // Recognized foods
    recognizedFoods: [{
      name: String,
      confidence: Number,
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      }
    }],
    
    // Nutritional information
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
      cholesterol: { type: Number, default: 0 },
      saturatedFat: { type: Number, default: 0 },
      transFat: { type: Number, default: 0 },
      vitaminA: { type: Number, default: 0 },
      vitaminC: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      iron: { type: Number, default: 0 }
    },
    
    // Health risk analysis
    healthRisks: [{
      type: {
        type: String,
        enum: ['high_carbs', 'high_sugar', 'high_sodium', 'high_potassium', 'high_fat', 'high_calories']
      },
      severity: {
        type: String,
        enum: ['low', 'warning', 'danger']
      },
      message: String,
      value: Number,
      threshold: Number
    }],
    
    // Recommendations
    recommendations: [{
      type: String,
      message: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    
    // Analysis metadata
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    analysisError: String,
    processingTime: Number, // in milliseconds
    analyzedAt: Date
  },
  
  // User feedback
  userFeedback: {
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    helpful: {
      type: Boolean
    },
    comments: String
  },
  
  // Meal rating
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Tags and categories
  tags: [String],
  category: {
    type: String,
    enum: ['healthy', 'moderate', 'unhealthy', 'unknown']
  },
  
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  consumedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
mealSchema.index({ userId: 1, consumedAt: -1 });
mealSchema.index({ userId: 1, mealType: 1 });
mealSchema.index({ 'aiAnalysis.analysisStatus': 1 });
mealSchema.index({ category: 1 });
mealSchema.index({ tags: 1 });

// Pre-save middleware
mealSchema.pre('save', function(next) {
  // Auto-categorize based on health risks
  if (this.aiAnalysis && this.aiAnalysis.healthRisks) {
    const dangerRisks = this.aiAnalysis.healthRisks.filter(risk => risk.severity === 'danger');
    const warningRisks = this.aiAnalysis.healthRisks.filter(risk => risk.severity === 'warning');
    
    if (dangerRisks.length > 0) {
      this.category = 'unhealthy';
    } else if (warningRisks.length > 0) {
      this.category = 'moderate';
    } else if (this.aiAnalysis.healthRisks.length === 0) {
      this.category = 'healthy';
    }
  }
  
  next();
});

// Instance methods
mealSchema.methods.updateAnalysis = function(analysisData) {
  this.aiAnalysis = {
    ...this.aiAnalysis,
    ...analysisData,
    analyzedAt: new Date()
  };
  this.aiAnalysis.analysisStatus = 'completed';
  return this.save();
};

mealSchema.methods.markAsFailed = function(error) {
  this.aiAnalysis.analysisStatus = 'failed';
  this.aiAnalysis.analysisError = error;
  return this.save();
};

// Static methods
mealSchema.statics.getUserMeals = function(userId, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    mealType, 
    startDate, 
    endDate,
    category 
  } = options;
  
  let query = { userId };
  
  if (mealType) query.mealType = mealType;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.consumedAt = {};
    if (startDate) query.consumedAt.$gte = new Date(startDate);
    if (endDate) query.consumedAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ consumedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
};

mealSchema.statics.getNutritionalSummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        consumedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        'aiAnalysis.analysisStatus': 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalCalories: { $sum: '$aiAnalysis.nutrition.calories' },
        totalProtein: { $sum: '$aiAnalysis.nutrition.protein' },
        totalCarbs: { $sum: '$aiAnalysis.nutrition.carbs' },
        totalFat: { $sum: '$aiAnalysis.nutrition.fat' },
        totalSodium: { $sum: '$aiAnalysis.nutrition.sodium' },
        totalSugar: { $sum: '$aiAnalysis.nutrition.sugar' },
        mealCount: { $sum: 1 },
        healthyMeals: {
          $sum: { $cond: [{ $eq: ['$category', 'healthy'] }, 1, 0] }
        }
      }
    }
  ]);
};

mealSchema.statics.getHealthTrends = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        consumedAt: { $gte: startDate },
        'aiAnalysis.analysisStatus': 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$consumedAt' }
        },
        calories: { $sum: '$aiAnalysis.nutrition.calories' },
        protein: { $sum: '$aiAnalysis.nutrition.protein' },
        carbs: { $sum: '$aiAnalysis.nutrition.carbs' },
        fat: { $sum: '$aiAnalysis.nutrition.fat' },
        sodium: { $sum: '$aiAnalysis.nutrition.sodium' },
        sugar: { $sum: '$aiAnalysis.nutrition.sugar' },
        riskCount: { $sum: { $size: '$aiAnalysis.healthRisks' } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Virtual fields
mealSchema.virtual('totalCalories').get(function() {
  return this.aiAnalysis?.nutrition?.calories || 0;
});

mealSchema.virtual('riskLevel').get(function() {
  if (!this.aiAnalysis?.healthRisks) return 'unknown';
  
  const dangerRisks = this.aiAnalysis.healthRisks.filter(risk => risk.severity === 'danger');
  const warningRisks = this.aiAnalysis.healthRisks.filter(risk => risk.severity === 'warning');
  
  if (dangerRisks.length > 0) return 'high';
  if (warningRisks.length > 0) return 'medium';
  return 'low';
});

// JSON transformation
mealSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.totalCalories = doc.totalCalories;
    ret.riskLevel = doc.riskLevel;
    return ret;
  }
});

module.exports = mongoose.model('Meal', mealSchema); 