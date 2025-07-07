@echo off
echo ========================================
echo HealthyMealTrack - Simple Setup
echo ========================================

echo.
echo Step 1: Installing dependencies...
npm install

echo.
echo Step 2: Creating environment file...
if not exist .env (
    copy env.example .env
    echo Environment file created!
) else (
    echo Environment file already exists.
)

echo.
echo Step 3: Starting MongoDB (if Docker is available)...
docker run -d -p 27017:27017 --name mongodb mongo:6.0 2>nul
if %errorlevel% equ 0 (
    echo MongoDB started with Docker!
) else (
    echo Docker not available. Please start MongoDB manually.
)

echo.
echo Step 4: Starting the application...
echo.
echo The application will be available at: http://localhost:5000
echo.
npm start

pause 