const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

// Mock the User model
jest.mock('../models/User');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'farmer'
      };

      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: 'some-user-id',
        ...userData,
        toJSON: () => ({
          _id: 'some-user-id',
          name: userData.name,
          email: userData.email,
          role: userData.role
        })
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'Test@1234',
        role: 'farmer'
      };

      User.findOne.mockResolvedValue({
        email: userData.email
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test@1234'
      };

      const mockUser = {
        _id: 'some-user-id',
        name: 'Test User',
        email: userData.email,
        role: 'farmer',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const userData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});
