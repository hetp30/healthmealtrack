# HealthyMealTrack - AI-Powered Health Meal Monitoring Platform

A comprehensive full-stack web application that helps people with chronic health conditions monitor their meals and receive personalized dietary advice using AI-powered image analysis.

## 🌟 Features

### Core Features
- **AI-Powered Food Recognition**: Upload meal photos and get instant ingredient identification using Google Vision API
- **Personalized Health Analysis**: Get health warnings and recommendations based on your specific medical conditions
- **Real-time Nutritional Analysis**: Detailed breakdown of calories, protein, carbs, fat, sodium, and more
- **Health Risk Alerts**: Instant warnings for foods that could harm your specific health conditions
- **Smart Chatbot**: Ask questions about food safety and get personalized answers
- **Progress Tracking**: Monitor your dietary habits and health improvements over time

### Health Conditions Supported
- Diabetes (Type 1 & 2)
- High Blood Pressure
- High Cholesterol
- Kidney Disease
- Heart Disease
- Thyroid Issues
- Obesity
- PCOS
- Lactose Intolerance
- Gluten Sensitivity
- Anemia
- IBS
- Osteoporosis
- Gout
- Food Allergies
- Custom Conditions (user-defined)

### Gamification
- **Points System**: Earn points for meal uploads and healthy choices
- **Achievement Badges**: Unlock badges for milestones and streaks
- **Daily Streaks**: Track consecutive days of meal logging
- **Leaderboards**: Compare progress with other users

## 🏗️ Architecture

### Frontend
- **HTML5/CSS3**: Modern, responsive design with animations
- **Vanilla JavaScript**: ES6+ features with modular architecture
- **Font Awesome**: Beautiful icons and UI elements
- **Progressive Web App**: Works offline and can be installed

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for user data and meal records
- **Mongoose**: MongoDB object modeling
- **JWT**: Secure authentication and authorization

### AI & APIs
- **Google Vision API**: Advanced image recognition and food identification
- **Edamam Nutrition API**: Comprehensive nutritional database
- **Cloudinary**: Image storage and optimization
- **Custom AI Logic**: Health risk analysis and recommendations

### Infrastructure
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-service orchestration
- **Nginx**: Reverse proxy and load balancing
- **Redis**: Caching and session management

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB 6.0+
- Docker and Docker Compose (for deployment)
- Google Cloud Vision API credentials
- Cloudinary account
- Edamam API credentials

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/healthymealtrack.git
   cd healthymealtrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0
   
   # Or install MongoDB locally
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Application: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/healthymealtrack

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id

# Nutrition API (Edamam)
NUTRITION_API_KEY=your-edamam-api-key
EDAMAM_APP_ID=your-edamam-app-id

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### API Keys Setup

1. **Google Cloud Vision API**
   - Create a Google Cloud project
   - Enable Vision API
   - Create service account and download credentials
   - Place credentials file in project root

2. **Edamam Nutrition API**
   - Sign up at https://developer.edamam.com/
   - Get API key and app ID
   - Add to environment variables

3. **Cloudinary**
   - Sign up at https://cloudinary.com/
   - Get cloud name, API key, and secret
   - Add to environment variables

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "age": 30,
  "gender": "male",
  "weight": 70,
  "height": 175,
  "healthConditions": [
    {"condition": "diabetes", "details": "Type 2"}
  ],
  "customConditions": "None",
  "medications": "Metformin",
  "allergies": "None"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Meal Analysis Endpoints

#### Upload and Analyze Meal
```http
POST /api/analysis/meal
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <file>,
  "mealType": "lunch",
  "description": "Grilled chicken with rice"
}
```

#### Get Analysis Results
```http
GET /api/analysis/meal/:mealId
Authorization: Bearer <token>
```

### User Management Endpoints

#### Get User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "weight": 68,
  "height": 175
}
```

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  age: Number,
  gender: String,
  weight: Number,
  height: Number,
  healthConditions: [{
    condition: String,
    details: String
  }],
  customConditions: String,
  medications: String,
  allergies: String,
  healthMetrics: {
    bmi: Number,
    lastUpdated: Date
  },
  points: Number,
  streak: Number,
  achievements: [{
    id: String,
    title: String,
    description: String,
    unlockedAt: Date
  }],
  preferences: Object,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Meal Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  mealType: String,
  imageUrl: String,
  description: String,
  aiAnalysis: {
    recognizedFoods: [{
      name: String,
      confidence: Number
    }],
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      // ... other nutrients
    },
    healthRisks: [{
      type: String,
      severity: String,
      message: String
    }],
    recommendations: [{
      type: String,
      message: String,
      priority: String
    }],
    analysisStatus: String,
    analyzedAt: Date
  },
  category: String,
  consumedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing security
- **Helmet.js**: Security headers and protection
- **SQL Injection Prevention**: MongoDB with parameterized queries
- **XSS Protection**: Input sanitization and output encoding

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Winston**: Application logging
- **Health Checks**: Application health monitoring
- **Error Tracking**: Comprehensive error handling
- **Performance Monitoring**: Response time tracking

## 🚀 Deployment

### Production Deployment

1. **Set up production environment**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthymealtrack
   ```

2. **Build and deploy**
   ```bash
   npm run build
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up SSL certificate**
   ```bash
   # Using Let's Encrypt
   certbot --nginx -d yourdomain.com
   ```

### Cloud Deployment Options

- **Heroku**: Easy deployment with add-ons
- **AWS**: EC2, ECS, or Lambda deployment
- **Google Cloud**: App Engine or Compute Engine
- **Azure**: App Service or Container Instances
- **DigitalOcean**: Droplets or App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Vision API for image recognition
- Edamam for nutritional data
- Font Awesome for icons
- Unsplash for stock images
- MongoDB for database
- Express.js community

## 📞 Support

- **Email**: support@healthymealtrack.com
- **Documentation**: https://docs.healthymealtrack.com
- **Issues**: https://github.com/yourusername/healthymealtrack/issues
- **Discord**: https://discord.gg/healthymealtrack

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Barcode scanning for packaged foods
- [ ] Integration with fitness trackers
- [ ] Meal planning and recipes
- [ ] Social features and sharing
- [ ] Advanced analytics and insights
- [ ] Voice input for meal descriptions
- [ ] Multi-language support
- [ ] AI-powered meal suggestions
- [ ] Integration with healthcare providers

### Technical Improvements
- [ ] GraphQL API
- [ ] Real-time notifications
- [ ] Advanced caching strategies
- [ ] Microservices architecture
- [ ] Machine learning model training
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] PWA enhancements

---

**Made with ❤️ for better health outcomes** "# healthmealtrack" 
