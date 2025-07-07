const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Import services and models
const googleVisionService = require('../services/googleVision');
const User = require('../models/User');
const Meal = require('../models/Meal');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/analysis/meal
 * @desc    Analyze meal image with Google Vision API
 * @access  Private
 */
router.post('/meal', 
  upload.single('image'),
  [
    body('mealType')
      .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
      .withMessage('Invalid meal type'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const { mealType, description } = req.body;
      const userId = req.user.id;

      // Get user profile for health analysis
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Upload image to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      
      // Create meal record with pending status
      const meal = new Meal({
        userId,
        mealType,
        description,
        imageUrl: cloudinaryResult.secure_url,
        imagePublicId: cloudinaryResult.public_id,
        'aiAnalysis.analysisStatus': 'processing'
      });

      await meal.save();

      // Start async analysis
      analyzeMealAsync(meal._id, req.file.buffer, user);

      // Return immediate response
      res.status(202).json({
        success: true,
        message: 'Meal analysis started',
        mealId: meal._id,
        imageUrl: cloudinaryResult.secure_url
      });

    } catch (error) {
      console.error('Meal analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process meal analysis',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/analysis/meal/:mealId
 * @desc    Get meal analysis results
 * @access  Private
 */
router.get('/meal/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.id;

    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.json({
      success: true,
      meal: {
        id: meal._id,
        mealType: meal.mealType,
        description: meal.description,
        imageUrl: meal.imageUrl,
        consumedAt: meal.consumedAt,
        aiAnalysis: meal.aiAnalysis,
        category: meal.category,
        riskLevel: meal.riskLevel,
        totalCalories: meal.totalCalories
      }
    });

  } catch (error) {
    console.error('Get meal analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal analysis',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/analysis/feedback/:mealId
 * @desc    Submit feedback for meal analysis
 * @access  Private
 */
router.post('/feedback/:mealId',
  [
    body('accuracy')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Accuracy must be between 1 and 5'),
    body('helpful')
      .optional()
      .isBoolean()
      .withMessage('Helpful must be a boolean'),
    body('comments')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Comments must be less than 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { mealId } = req.params;
      const userId = req.user.id;
      const { accuracy, helpful, comments } = req.body;

      const meal = await Meal.findOne({ _id: mealId, userId });
      if (!meal) {
        return res.status(404).json({
          success: false,
          message: 'Meal not found'
        });
      }

      // Update feedback
      meal.userFeedback = {
        accuracy,
        helpful,
        comments
      };

      await meal.save();

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/analysis/status
 * @desc    Get analysis queue status
 * @access  Private
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get pending and processing meals
    const pendingMeals = await Meal.countDocuments({
      userId,
      'aiAnalysis.analysisStatus': 'pending'
    });

    const processingMeals = await Meal.countDocuments({
      userId,
      'aiAnalysis.analysisStatus': 'processing'
    });

    res.json({
      success: true,
      status: {
        pending: pendingMeals,
        processing: processingMeals,
        total: pendingMeals + processingMeals
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analysis status',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/analysis/meal/:mealId
 * @desc    Delete meal and its analysis
 * @access  Private
 */
router.delete('/meal/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.id;

    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (meal.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(meal.imagePublicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
      }
    }

    // Delete meal from database
    await Meal.findByIdAndDelete(mealId);

    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });

  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal',
      error: error.message
    });
  }
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Object} Cloudinary upload result
 */
async function uploadToCloudinary(imageBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'healthymealtrack',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
}

/**
 * Async function to analyze meal with Google Vision API
 * @param {string} mealId - Meal ID
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} user - User object
 */
async function analyzeMealAsync(mealId, imageBuffer, user) {
  try {
    console.log(`Starting analysis for meal ${mealId}`);

    // Perform Google Vision analysis
    const analysisResults = await googleVisionService.analyzeMealImage(imageBuffer, user);

    // Update meal with analysis results
    const meal = await Meal.findById(mealId);
    if (!meal) {
      console.error(`Meal ${mealId} not found for analysis update`);
      return;
    }

    meal.aiAnalysis = {
      ...meal.aiAnalysis,
      ...analysisResults,
      analyzedAt: new Date()
    };

    await meal.save();

    // Add points to user for meal upload
    await user.addPoints(10);

    // Check for achievements
    await checkAndUnlockAchievements(user);

    console.log(`Analysis completed for meal ${mealId}`);

  } catch (error) {
    console.error(`Analysis failed for meal ${mealId}:`, error);

    // Mark meal as failed
    try {
      const meal = await Meal.findById(mealId);
      if (meal) {
        meal.aiAnalysis.analysisStatus = 'failed';
        meal.aiAnalysis.analysisError = error.message;
        await meal.save();
      }
    } catch (updateError) {
      console.error('Failed to update meal status:', updateError);
    }
  }
}

/**
 * Check and unlock achievements for user
 * @param {Object} user - User object
 */
async function checkAndUnlockAchievements(user) {
  try {
    const achievements = [
      {
        id: 'first_meal',
        condition: () => user.meals && user.meals.length === 1,
        points: 50,
        title: 'First Meal',
        description: 'Uploaded your first meal'
      },
      {
        id: 'week_streak',
        condition: () => user.streak >= 7,
        points: 200,
        title: 'Week Warrior',
        description: '7-day meal logging streak'
      },
      {
        id: 'month_streak',
        condition: () => user.streak >= 30,
        points: 500,
        title: 'Monthly Master',
        description: '30-day meal logging streak'
      }
    ];

    for (const achievement of achievements) {
      if (achievement.condition() && !user.achievements.find(a => a.id === achievement.id)) {
        await user.unlockAchievement(achievement);
        console.log(`Achievement unlocked: ${achievement.title}`);
      }
    }
  } catch (error) {
    console.error('Achievement check error:', error);
  }
}

module.exports = router; 