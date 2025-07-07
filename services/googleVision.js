const vision = require('@google-cloud/vision');
const axios = require('axios');

class GoogleVisionService {
  constructor() {
    // Initialize Google Vision client
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
    
    // Nutrition API configuration
    this.nutritionApiKey = process.env.NUTRITION_API_KEY;
    this.nutritionApiUrl = 'https://api.edamam.com/api/nutrition-data';
  }

  /**
   * Analyze image for food recognition and nutritional information
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} userProfile - User's health profile
   * @returns {Object} Analysis results
   */
  async analyzeMealImage(imageBuffer, userProfile) {
    try {
      console.log('Starting Google Vision analysis...');
      const startTime = Date.now();

      // Step 1: Google Vision API for food recognition
      const visionResults = await this.performVisionAnalysis(imageBuffer);
      
      // Step 2: Extract food items
      const recognizedFoods = this.extractFoodItems(visionResults);
      
      // Step 3: Get nutritional data for recognized foods
      const nutritionData = await this.getNutritionalData(recognizedFoods);
      
      // Step 4: Analyze health risks based on user profile
      const healthAnalysis = this.analyzeHealthRisks(nutritionData, userProfile);
      
      // Step 5: Generate recommendations
      const recommendations = this.generateRecommendations(healthAnalysis, userProfile);
      
      const processingTime = Date.now() - startTime;
      
      return {
        recognizedFoods,
        nutrition: nutritionData,
        healthRisks: healthAnalysis.risks,
        warnings: healthAnalysis.warnings,
        recommendations,
        processingTime,
        analysisStatus: 'completed'
      };
      
    } catch (error) {
      console.error('Google Vision analysis error:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Perform Google Vision API analysis
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Object} Vision API results
   */
  async performVisionAnalysis(imageBuffer) {
    try {
      // Convert buffer to base64
      const imageBase64 = imageBuffer.toString('base64');
      
      // Prepare request
      const request = {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'LABEL_DETECTION',
            maxResults: 20
          },
          {
            type: 'OBJECT_LOCALIZATION',
            maxResults: 10
          },
          {
            type: 'TEXT_DETECTION',
            maxResults: 5
          }
        ]
      };

      // Perform analysis
      const [result] = await this.client.annotateImage(request);
      
      return result;
      
    } catch (error) {
      console.error('Vision API error:', error);
      throw new Error(`Vision API failed: ${error.message}`);
    }
  }

  /**
   * Extract food items from vision results
   * @param {Object} visionResults - Google Vision API results
   * @returns {Array} Recognized food items
   */
  extractFoodItems(visionResults) {
    const foodItems = [];
    const foodKeywords = [
      'food', 'dish', 'meal', 'cuisine', 'ingredient', 'fruit', 'vegetable',
      'meat', 'fish', 'chicken', 'beef', 'pork', 'lamb', 'rice', 'pasta',
      'bread', 'cake', 'dessert', 'soup', 'salad', 'sandwich', 'pizza',
      'burger', 'steak', 'sushi', 'curry', 'noodles', 'potato', 'tomato',
      'onion', 'garlic', 'carrot', 'broccoli', 'spinach', 'lettuce',
      'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
      'milk', 'cheese', 'yogurt', 'egg', 'butter', 'oil', 'sauce'
    ];

    // Extract from label annotations
    if (visionResults.labelAnnotations) {
      visionResults.labelAnnotations.forEach(label => {
        if (label.score > 0.7 && this.isFoodRelated(label.description)) {
          foodItems.push({
            name: label.description.toLowerCase(),
            confidence: label.score,
            source: 'label'
          });
        }
      });
    }

    // Extract from localized object annotations
    if (visionResults.localizedObjectAnnotations) {
      visionResults.localizedObjectAnnotations.forEach(obj => {
        if (obj.score > 0.7 && this.isFoodRelated(obj.name)) {
          foodItems.push({
            name: obj.name.toLowerCase(),
            confidence: obj.score,
            source: 'object',
            boundingBox: obj.boundingPoly
          });
        }
      });
    }

    // Remove duplicates and sort by confidence
    const uniqueFoods = this.removeDuplicates(foodItems);
    return uniqueFoods.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Check if a label is food-related
   * @param {string} label - Label to check
   * @returns {boolean} True if food-related
   */
  isFoodRelated(label) {
    const foodKeywords = [
      'food', 'dish', 'meal', 'cuisine', 'ingredient', 'fruit', 'vegetable',
      'meat', 'fish', 'chicken', 'beef', 'pork', 'lamb', 'rice', 'pasta',
      'bread', 'cake', 'dessert', 'soup', 'salad', 'sandwich', 'pizza',
      'burger', 'steak', 'sushi', 'curry', 'noodles', 'potato', 'tomato',
      'onion', 'garlic', 'carrot', 'broccoli', 'spinach', 'lettuce',
      'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
      'milk', 'cheese', 'yogurt', 'egg', 'butter', 'oil', 'sauce',
      'cooking', 'kitchen', 'restaurant', 'dining', 'plate', 'bowl'
    ];

    const lowerLabel = label.toLowerCase();
    return foodKeywords.some(keyword => lowerLabel.includes(keyword));
  }

  /**
   * Remove duplicate food items
   * @param {Array} foodItems - Array of food items
   * @returns {Array} Unique food items
   */
  removeDuplicates(foodItems) {
    const seen = new Set();
    return foodItems.filter(item => {
      const key = item.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get nutritional data for recognized foods
   * @param {Array} recognizedFoods - Array of recognized food items
   * @returns {Object} Combined nutritional data
   */
  async getNutritionalData(recognizedFoods) {
    try {
      const nutritionPromises = recognizedFoods.map(food => 
        this.getFoodNutrition(food.name)
      );

      const nutritionResults = await Promise.allSettled(nutritionPromises);
      
      // Combine all nutritional data
      const combinedNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        potassium: 0,
        cholesterol: 0,
        saturatedFat: 0,
        transFat: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0
      };

      nutritionResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const food = recognizedFoods[index];
          const nutrition = result.value;
          
          // Add nutrition data weighted by confidence
          const weight = food.confidence || 1;
          Object.keys(combinedNutrition).forEach(key => {
            if (nutrition[key]) {
              combinedNutrition[key] += (nutrition[key] * weight);
            }
          });
        }
      });

      return combinedNutrition;
      
    } catch (error) {
      console.error('Nutrition API error:', error);
      // Return fallback nutrition data
      return this.getFallbackNutrition(recognizedFoods);
    }
  }

  /**
   * Get nutrition data for a specific food item
   * @param {string} foodName - Name of the food
   * @returns {Object} Nutritional data
   */
  async getFoodNutrition(foodName) {
    try {
      // Try Edamam API first
      if (this.nutritionApiKey) {
        const response = await axios.get(this.nutritionApiUrl, {
          params: {
            app_id: process.env.EDAMAM_APP_ID,
            app_key: this.nutritionApiKey,
            ingr: foodName
          },
          timeout: 5000
        });

        if (response.data && response.data.totalNutrients) {
          return this.parseEdamamResponse(response.data);
        }
      }

      // Fallback to local nutrition database
      return this.getLocalNutritionData(foodName);
      
    } catch (error) {
      console.error(`Nutrition API error for ${foodName}:`, error.message);
      return this.getLocalNutritionData(foodName);
    }
  }

  /**
   * Parse Edamam API response
   * @param {Object} response - Edamam API response
   * @returns {Object} Parsed nutrition data
   */
  parseEdamamResponse(response) {
    const nutrients = response.totalNutrients;
    return {
      calories: nutrients.ENERC_KCAL?.quantity || 0,
      protein: nutrients.PROCNT?.quantity || 0,
      carbs: nutrients.CHOCDF?.quantity || 0,
      fat: nutrients.FAT?.quantity || 0,
      fiber: nutrients.FIBTG?.quantity || 0,
      sugar: nutrients.SUGAR?.quantity || 0,
      sodium: nutrients.NA?.quantity || 0,
      potassium: nutrients.K?.quantity || 0,
      cholesterol: nutrients.CHOLE?.quantity || 0,
      saturatedFat: nutrients.FASAT?.quantity || 0,
      transFat: nutrients.FATRN?.quantity || 0,
      vitaminA: nutrients.VITA_RAE?.quantity || 0,
      vitaminC: nutrients.VITC?.quantity || 0,
      calcium: nutrients.CA?.quantity || 0,
      iron: nutrients.FE?.quantity || 0
    };
  }

  /**
   * Get nutrition data from local database
   * @param {string} foodName - Name of the food
   * @returns {Object} Nutrition data
   */
  getLocalNutritionData(foodName) {
    const nutritionDB = {
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1, potassium: 35 },
      'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, potassium: 256 },
      'fish': { calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 61, potassium: 384 },
      'vegetables': { calories: 25, protein: 2, carbs: 5, fat: 0.2, fiber: 2, sugar: 2, sodium: 20, potassium: 200 },
      'bread': { calories: 79, protein: 3.1, carbs: 14, fat: 1.1, fiber: 1.2, sugar: 1.2, sodium: 140, potassium: 35 },
      'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.8, sodium: 6, potassium: 44 },
      'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6, potassium: 421 },
      'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5, potassium: 237 },
      'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.7, sodium: 4, potassium: 146 },
      'garlic': { calories: 4, protein: 0.2, carbs: 1, fat: 0, fiber: 0.1, sugar: 0.1, sodium: 1, potassium: 12 },
      'oil': { calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 0, potassium: 0 },
      'salt': { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 581, potassium: 0 },
      'sugar': { calories: 16, protein: 0, carbs: 4, fat: 0, fiber: 0, sugar: 4, sodium: 0, potassium: 0 },
      'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5, sodium: 44, potassium: 150 },
      'cheese': { calories: 113, protein: 7, carbs: 0.4, fat: 9, fiber: 0, sugar: 0.1, sodium: 174, potassium: 28 },
      'egg': { calories: 74, protein: 6.3, carbs: 0.4, fat: 5, fiber: 0, sugar: 0.4, sodium: 70, potassium: 67 },
      'meat': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0, sodium: 72, potassium: 318 },
      'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sugar: 1.8, sodium: 2, potassium: 369 }
    };

    // Find best match
    const lowerFoodName = foodName.toLowerCase();
    for (const [key, nutrition] of Object.entries(nutritionDB)) {
      if (lowerFoodName.includes(key) || key.includes(lowerFoodName)) {
        return nutrition;
      }
    }

    // Default nutrition for unknown foods
    return { calories: 50, protein: 2, carbs: 8, fat: 1, fiber: 1, sugar: 1, sodium: 10, potassium: 50 };
  }

  /**
   * Get fallback nutrition data
   * @param {Array} recognizedFoods - Array of recognized foods
   * @returns {Object} Fallback nutrition data
   */
  getFallbackNutrition(recognizedFoods) {
    const totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      potassium: 0,
      cholesterol: 0,
      saturatedFat: 0,
      transFat: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 0,
      iron: 0
    };

    recognizedFoods.forEach(food => {
      const nutrition = this.getLocalNutritionData(food.name);
      const weight = food.confidence || 1;
      
      Object.keys(totalNutrition).forEach(key => {
        totalNutrition[key] += (nutrition[key] || 0) * weight;
      });
    });

    return totalNutrition;
  }

  /**
   * Analyze health risks based on nutrition and user profile
   * @param {Object} nutrition - Nutritional data
   * @param {Object} userProfile - User's health profile
   * @returns {Object} Health analysis results
   */
  analyzeHealthRisks(nutrition, userProfile) {
    const risks = [];
    const warnings = [];

    if (!userProfile) {
      return { risks, warnings };
    }

    const conditions = userProfile.healthConditions || [];

    // Check for diabetes
    if (conditions.some(c => c.condition === 'diabetes')) {
      if (nutrition.carbs > 60) {
        risks.push({
          type: 'high_carbs',
          severity: 'warning',
          message: `High carbohydrate content (${nutrition.carbs.toFixed(1)}g). Consider smaller portion for diabetes management.`,
          value: nutrition.carbs,
          threshold: 60
        });
      }
      if (nutrition.sugar > 15) {
        risks.push({
          type: 'high_sugar',
          severity: 'danger',
          message: `High sugar content (${nutrition.sugar.toFixed(1)}g). This may spike your blood sugar levels.`,
          value: nutrition.sugar,
          threshold: 15
        });
      }
    }

    // Check for high blood pressure
    if (conditions.some(c => c.condition === 'bp')) {
      if (nutrition.sodium > 500) {
        risks.push({
          type: 'high_sodium',
          severity: 'danger',
          message: `High sodium content (${nutrition.sodium.toFixed(1)}mg). This may increase your blood pressure.`,
          value: nutrition.sodium,
          threshold: 500
        });
      }
    }

    // Check for kidney disease
    if (conditions.some(c => c.condition === 'kidney')) {
      if (nutrition.potassium > 400) {
        risks.push({
          type: 'high_potassium',
          severity: 'danger',
          message: `High potassium content (${nutrition.potassium.toFixed(1)}mg). Limit intake for kidney health.`,
          value: nutrition.potassium,
          threshold: 400
        });
      }
    }

    // Check for high cholesterol
    if (conditions.some(c => c.condition === 'cholesterol')) {
      if (nutrition.fat > 20) {
        risks.push({
          type: 'high_fat',
          severity: 'warning',
          message: `High fat content (${nutrition.fat.toFixed(1)}g). Consider leaner alternatives.`,
          value: nutrition.fat,
          threshold: 20
        });
      }
    }

    // General health checks
    if (nutrition.calories > 600) {
      warnings.push({
        type: 'high_calories',
        message: `High calorie meal (${nutrition.calories.toFixed(0)} calories). Consider portion control.`
      });
    }

    return { risks, warnings };
  }

  /**
   * Generate recommendations based on health analysis
   * @param {Object} healthAnalysis - Health analysis results
   * @param {Object} userProfile - User's health profile
   * @returns {Array} Recommendations
   */
  generateRecommendations(healthAnalysis, userProfile) {
    const recommendations = [];

    healthAnalysis.risks.forEach(risk => {
      switch (risk.type) {
        case 'high_carbs':
          recommendations.push({
            type: 'dietary',
            message: 'Try replacing some carbs with vegetables or lean protein.',
            priority: 'medium'
          });
          break;
        case 'high_sugar':
          recommendations.push({
            type: 'dietary',
            message: 'Consider sugar-free alternatives or reduce portion size.',
            priority: 'high'
          });
          break;
        case 'high_sodium':
          recommendations.push({
            type: 'dietary',
            message: 'Use herbs and spices instead of salt for flavoring.',
            priority: 'high'
          });
          break;
        case 'high_potassium':
          recommendations.push({
            type: 'dietary',
            message: 'Choose lower potassium vegetables like green beans or cabbage.',
            priority: 'high'
          });
          break;
        case 'high_fat':
          recommendations.push({
            type: 'dietary',
            message: 'Opt for grilled or baked instead of fried foods.',
            priority: 'medium'
          });
          break;
      }
    });

    return recommendations;
  }
}

module.exports = new GoogleVisionService(); 