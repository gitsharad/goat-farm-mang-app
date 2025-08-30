# Goat Farm Management System

A comprehensive web application for managing goat farm operations built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 🚀 Features

### Core Functionality
- **Goat Management**: Track individual goats with detailed profiles
- **Health Records**: Monitor vaccinations, treatments, and medical history
- **Breeding Programs**: Manage mating schedules and track pregnancies
- **Feed Management**: Track feeding schedules and nutritional requirements
- **User Management**: Role-based access control with permissions
- **Dashboard**: Comprehensive overview with charts and statistics

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live data synchronization
- **Secure Authentication**: JWT-based authentication system
- **Role-based Access**: Different permission levels for users
- **Data Visualization**: Interactive charts and graphs
- **Search & Filtering**: Advanced data querying capabilities

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart components
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Hook Form** - Form handling

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd goat-farm-management
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Environment Configuration

#### Backend Environment
Create a `.env` file in the `backend` directory:
```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/goat-farm

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (Optional)
Create a `.env` file in the `frontend` directory if you need to customize the API URL:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Windows)
# Start MongoDB service from Windows Services
```

### 5. Run the Application

#### Development Mode (Recommended)
```bash
# Run both backend and frontend concurrently
npm run dev

# Or run them separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health-check

## 👥 Default Users

After starting the application, you can create your first admin user through the registration form, or use these default credentials if you've seeded the database:

- **Username**: admin
- **Password**: admin123
- **Role**: Admin

## 📱 Usage Guide

### 1. User Registration/Login
- Navigate to the login page
- Toggle between login and registration modes
- Create an account with appropriate role permissions

### 2. Dashboard Overview
- View farm statistics and key metrics
- Monitor upcoming health events and kidding dates
- Access quick actions for common tasks

### 3. Goat Management
- Add new goats with detailed information
- Track individual goat profiles
- Monitor breeding status and health records

### 4. Health Records
- Record vaccinations and treatments
- Set reminders for upcoming health events
- Track medical costs and history

### 5. Breeding Management
- Schedule mating events
- Track pregnancy progress
- Record kidding outcomes

### 6. Feed Management
- Log feeding schedules
- Track feed consumption and costs
- Monitor nutritional requirements

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Goats
- `GET /api/goats` - List all goats
- `POST /api/goats` - Create new goat
- `GET /api/goats/:id` - Get goat details
- `PUT /api/goats/:id` - Update goat
- `DELETE /api/goats/:id` - Delete goat
- `GET /api/goats/stats/overview` - Goat statistics

### Health Records
- `GET /api/health` - List health records
- `POST /api/health` - Create health record
- `GET /api/health/upcoming/events` - Upcoming health events
- `GET /api/health/stats/overview` - Health statistics

### Breeding Records
- `GET /api/breeding` - List breeding records
- `POST /api/breeding` - Create breeding record
- `GET /api/breeding/upcoming/kidding` - Upcoming kidding events
- `GET /api/breeding/stats/overview` - Breeding statistics

### Feed Records
- `GET /api/feed` - List feed records
- `POST /api/feed` - Create feed record
- `GET /api/feed/stats/consumption` - Feed consumption stats
- `GET /api/feed/stats/cost-analysis` - Cost analysis

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/breed-distribution` - Breed distribution
- `GET /api/dashboard/age-distribution` - Age distribution
- `GET /api/dashboard/monthly-trends` - Monthly trends
- `GET /api/dashboard/upcoming-events` - Upcoming events

## 🗄️ Database Schema

### Goat Model
- Basic information (name, tag number, breed, gender)
- Weight tracking (birth, weaning, yearling, current)
- Health status (vaccinations, deworming)
- Breeding information (pregnancy status, due dates)
- Production data (milk production, kidding history)
- Location and notes

### Health Record Model
- Treatment type and description
- Medications and dosages
- Costs and next due dates
- Veterinarian information
- Attachments and notes

### Breeding Record Model
- Doe and buck information
- Mating and due dates
- Pregnancy confirmation
- Kidding outcomes
- Status tracking

### Feed Record Model
- Feed type and quantity
- Feeding schedules
- Cost tracking
- Consumption and waste monitoring

### User Model
- Authentication credentials
- Role-based permissions
- Profile information
- Activity tracking

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt password encryption
- **Input Validation** - Comprehensive data validation
- **Rate Limiting** - API request throttling
- **CORS Protection** - Cross-origin request security
- **Role-based Access Control** - Permission-based features

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set environment variables for production
2. Build and deploy to your preferred hosting service
3. Configure MongoDB connection for production
4. Set up proper CORS origins

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables for production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Future Enhancements

- **Mobile App**: Native mobile applications
- **IoT Integration**: Smart sensors and monitoring
- **AI Analytics**: Predictive health and breeding insights
- **Multi-language Support**: Internationalization
- **Advanced Reporting**: Custom report generation
- **Integration APIs**: Third-party service connections

---

**Note**: This is a comprehensive farm management system designed for production use. Make sure to properly configure security settings and database connections before deploying to production environments. 