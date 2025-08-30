#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Goat Farm Management System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' });
  console.log(`✅ Node.js version: ${nodeVersion.trim()}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' });
  console.log(`✅ npm version: ${npmVersion.trim()}`);
} catch (error) {
  console.error('❌ npm is not installed. Please install npm.');
  process.exit(1);
}

// Install root dependencies
console.log('\n📦 Installing root dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Root dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install root dependencies');
  process.exit(1);
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  execSync('cd backend && npm install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Create backend .env file if it doesn't exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const backendEnvExamplePath = path.join(__dirname, 'backend', 'env.example');

if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
  console.log('\n🔧 Creating backend environment file...');
  try {
    fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
    console.log('✅ Backend .env file created from template');
    console.log('⚠️  Please edit backend/.env with your configuration');
  } catch (error) {
    console.error('❌ Failed to create backend .env file');
  }
}

// Create frontend .env file if it doesn't exist
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  console.log('\n🔧 Creating frontend environment file...');
  try {
    const frontendEnvContent = `REACT_APP_API_URL=http://localhost:5000/api\n`;
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('✅ Frontend .env file created');
  } catch (error) {
    console.error('❌ Failed to create frontend .env file');
  }
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Edit backend/.env with your MongoDB connection and JWT secret');
console.log('3. Start the application: npm run dev');
console.log('\n🌐 The application will be available at:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend API: http://localhost:5000/api');
console.log('\n📚 For more information, see README.md'); 