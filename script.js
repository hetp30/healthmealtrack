// HealthyMealTrack - Main JavaScript File
// Handles all functionality for the AI-powered health meal tracking platform

// API Configuration (Frontend Demo - No Backend)
const API_BASE_URL = '#';
let authToken = null;
let currentUser = null;

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// File upload helper
async function uploadFile(file, endpoint) {
  const formData = new FormData();
  formData.append('image', file);
  
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method: 'POST',
    headers: {
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    },
    body: formData
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
}

class HealthyMealTrack {
    constructor() {
        this.userProfile = null;
        this.meals = [];
        this.healthAlerts = [];
        this.points = 0;
        this.streak = 0;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadUserData();
        console.log('HealthyMealTrack initialized');
    }

    // Authentication Management
    async checkAuth() {
        // Demo mode - no real authentication check
        if (!authToken) {
            // Skip authentication for demo
            return;
        }

        // Demo mode - skip real API calls
        try {
            // Simulate user data for demo
            currentUser = { name: 'Demo User', points: 150, streak: 5 };
            this.userProfile = currentUser;
            this.updateUIForAuthenticatedUser();
        } catch (error) {
            console.error('Demo auth check:', error);
        }
    }

    async login(email, password) {
        // Demo mode - simulate login
        try {
            // Simulate successful login
            const demoResponse = {
                token: 'demo-token',
                user: { name: 'Demo User', email: email, points: 150, streak: 5 }
            };

            authToken = demoResponse.token;
            currentUser = demoResponse.user;
            this.userProfile = demoResponse.user;

            // localStorage operations removed for demo

            this.updateUIForAuthenticatedUser();
            return demoResponse;
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        // Demo mode - simulate registration
        try {
            // Simulate successful registration
            const demoResponse = {
                token: 'demo-token',
                user: { 
                    name: userData.name || 'Demo User', 
                    email: userData.email, 
                    points: 0, 
                    streak: 0 
                }
            };

            authToken = demoResponse.token;
            currentUser = demoResponse.user;
            this.userProfile = demoResponse.user;

            // localStorage operations removed for demo

            this.updateUIForAuthenticatedUser();
            return demoResponse;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        authToken = null;
        currentUser = null;
        this.userProfile = null;
        // localStorage operations removed for demo
        this.redirectToLogin();
    }

    redirectToLogin() {
        window.location.href = 'form.html';
    }

    updateUIForAuthenticatedUser() {
        if (currentUser) {
            // Update user info in dashboard
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.name;
            }

            const userPointsElement = document.querySelector('.user-points');
            if (userPointsElement) {
                userPointsElement.textContent = currentUser.points || 0;
            }

            const userStreakElement = document.querySelector('.user-streak');
            if (userStreakElement) {
                userStreakElement.textContent = currentUser.streak || 0;
            }
        }
    }

    // User Profile Management
    async loadUserData() {
        if (!currentUser) return;

        try {
            // Load user meals
            const mealsResponse = await apiRequest('/meals');
            this.meals = mealsResponse.meals || [];
            this.updateMealsDisplay();

            // Load health stats
            await this.loadHealthStats();
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    async saveUserProfile(profile) {
        try {
            const response = await apiRequest('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profile)
            });

            this.userProfile = response.user;
            currentUser = response.user;
            // localStorage operations removed for demo

            return response;
        } catch (error) {
            throw error;
        }
    }

    // Demo Analysis (Frontend Only)
    async analyzeMeal(mealData) {
        console.log('Starting real AI analysis for meal:', mealData);
        
        try {
            // Upload image and start analysis
            const uploadResponse = await uploadFile(mealData.file, '/analysis/meal');
            
            // Poll for analysis results
            const analysisResults = await this.pollAnalysisResults(uploadResponse.mealId);
            
            return {
                mealId: uploadResponse.mealId,
                imageUrl: uploadResponse.imageUrl,
                ...analysisResults
            };
        } catch (error) {
            console.error('Meal analysis failed:', error);
            throw error;
        }
    }

    async pollAnalysisResults(mealId) {
        const maxAttempts = 30; // 30 seconds max
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await apiRequest(`/analysis/meal/${mealId}`);
                const meal = response.meal;

                if (meal.aiAnalysis.analysisStatus === 'completed') {
                    return {
                        foods: meal.aiAnalysis.recognizedFoods || [],
                        nutrition: meal.aiAnalysis.nutrition || {},
                        healthAnalysis: {
                            risks: meal.aiAnalysis.healthRisks || [],
                            warnings: meal.aiAnalysis.warnings || []
                        },
                        recommendations: meal.aiAnalysis.recommendations || []
                    };
                } else if (meal.aiAnalysis.analysisStatus === 'failed') {
                    throw new Error(meal.aiAnalysis.analysisError || 'Analysis failed');
                }

                // Wait 1 second before next poll
                await this.delay(1000);
                attempts++;
            } catch (error) {
                console.error('Polling error:', error);
                throw error;
            }
        }

        throw new Error('Analysis timeout');
    }

    async loadHealthStats() {
        try {
            const response = await apiRequest('/health/stats');
            this.updateHealthStats(response.stats);
        } catch (error) {
            console.error('Failed to load health stats:', error);
        }
    }

    updateHealthStats(stats) {
        // Update health stats cards in dashboard
        const statsElements = {
            'total-calories': stats.totalCalories || 0,
            'avg-calories': stats.averageCalories || 0,
            'healthy-meals': stats.healthyMeals || 0,
            'total-meals': stats.totalMeals || 0
        };

        Object.keys(statsElements).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = statsElements[key];
            }
        });
    }

    updateMealsDisplay() {
        const mealsContainer = document.querySelector('.meals-container');
        if (!mealsContainer) return;

        mealsContainer.innerHTML = '';

        this.meals.forEach(meal => {
            const mealCard = this.createMealCard(meal);
            mealsContainer.appendChild(mealCard);
        });
    }

    createMealCard(meal) {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.innerHTML = `
            <div class="meal-image">
                <img src="${meal.imageUrl}" alt="Meal">
            </div>
            <div class="meal-info">
                <h3>${meal.mealType}</h3>
                <p class="meal-description">${meal.description || 'No description'}</p>
                <div class="nutrition-info">
                    <span class="calories">${meal.totalCalories || 0} cal</span>
                    <span class="protein">${meal.aiAnalysis?.nutrition?.protein || 0}g protein</span>
                    <span class="carbs">${meal.aiAnalysis?.nutrition?.carbs || 0}g carbs</span>
                </div>
                ${this.renderHealthRisks(meal.aiAnalysis?.healthRisks || [])}
            </div>
        `;
        return card;
    }

    renderHealthRisks(risks) {
        if (risks.length === 0) return '';

        const riskHtml = risks.map(risk => `
            <div class="health-risk ${risk.severity}">
                <i class="fas fa-exclamation-triangle"></i>
                ${risk.message}
            </div>
        `).join('');

        return `<div class="health-risks">${riskHtml}</div>`;
    }

    async processChatMessage(message) {
        try {
            const response = await apiRequest('/health/chat', {
                method: 'POST',
                body: JSON.stringify({ message })
            });

            return response.response;
        } catch (error) {
            console.error('Chat processing failed:', error);
            return 'Sorry, I encountered an error. Please try again.';
        }
    }

    addPoints(amount) {
        this.points += amount;
        this.updatePointsDisplay();
    }

    updatePointsDisplay() {
        const pointsElement = document.querySelector('.user-points');
        if (pointsElement) {
            pointsElement.textContent = this.points;
        }
    }

    updateStreak() {
        this.streak++;
        this.updateStreakDisplay();
    }

    updateStreakDisplay() {
        const streakElement = document.querySelector('.user-streak');
        if (streakElement) {
            streakElement.textContent = this.streak;
        }
    }

    checkAchievements() {
        const achievements = [
            {
                id: 'first_meal',
                condition: () => this.meals.length === 1,
                title: 'First Meal',
                description: 'Uploaded your first meal',
                points: 50
            },
            {
                id: 'week_streak',
                condition: () => this.streak >= 7,
                title: 'Week Warrior',
                description: '7-day meal logging streak',
                points: 200
            }
        ];

        achievements.forEach(achievement => {
            if (achievement.condition() && !this.isAchievementUnlocked(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.addPoints(achievement.points);
        this.showAchievementNotification(achievement);
        // localStorage operations removed for demo
    }

    isAchievementUnlocked(achievementId) {
        // localStorage operations removed for demo
        return false;
    }

    getHealthyMealsCount() {
        return this.meals.filter(meal => 
            meal.aiAnalysis?.healthRisks?.length === 0
        ).length;
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <i class="fas fa-trophy"></i>
                <div>
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                    <span class="points">+${achievement.points} points</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showHealthAlert(alert) {
        const alertContainer = document.querySelector('.health-alerts');
        if (!alertContainer) return;

        const alertElement = document.createElement('div');
        alertElement.className = `health-alert ${alert.severity}`;
        alertElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${alert.message}</span>
            <button class="close-alert">&times;</button>
        `;

        alertContainer.appendChild(alertElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    setupEventListeners() {
        // File upload
        this.setupFileUpload();
        
        // Chatbot
        this.setupChatbot();
        
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    setupFileUpload() {
        const fileInput = document.getElementById('mealImage');
        const uploadArea = document.querySelector('.upload-area');
        const uploadBtn = document.querySelector('.upload-btn');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleFileUpload(e.dataTransfer.files);
            });
        }

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                fileInput?.click();
            });
        }
    }

    setupChatbot() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.querySelector('.send-btn');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.handleChatMessage();
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleChatMessage();
                }
            });
        }
    }

    async handleFileUpload(files) {
        if (!files.length) return;

        const file = files[0];
        const mealType = document.getElementById('mealType')?.value || 'lunch';
        const description = document.getElementById('mealDescription')?.value || '';

        try {
            // Show loading state
            this.showLoadingState();

            // Create meal data
            const mealData = {
                file,
                mealType,
                description
            };

            // Analyze meal
            const analysis = await this.analyzeMeal(mealData);

            // Add meal to list
            this.meals.unshift(analysis);
            this.updateMealsDisplay();

            // Check achievements
            this.checkAchievements();

            // Show success message
            this.showSuccessMessage('Meal analyzed successfully!');

        } catch (error) {
            console.error('File upload failed:', error);
            this.showErrorMessage('Failed to analyze meal. Please try again.');
        } finally {
            this.hideLoadingState();
        }
    }

    async handleChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value.trim();

        if (!message) return;

        // Add user message
        this.addChatMessage(message, 'user');
        chatInput.value = '';

        try {
            // Get AI response
            const response = await this.processChatMessage(message);
            this.addChatMessage(response, 'ai');
        } catch (error) {
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }

    addChatMessage(message, sender) {
        const chatContainer = document.querySelector('.chat-messages');
        if (!chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message}</span>
                <span class="message-time">${this.formatDate(new Date())}</span>
            </div>
        `;

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showLoadingState() {
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    hideLoadingState() {
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.healthyMealTrack = new HealthyMealTrack();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthyMealTrack;
}
