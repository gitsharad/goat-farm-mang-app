const jwt = require('jsonwebtoken');
const { createRequest, createResponse } = require('node-mocks-http');
const { auth, authorize } = require('../../middleware/auth');
const User = require('../../models/User');

// Mock the User model
jest.mock('../../models/User');

// Mock the jwt.verify method
jwt.verify = jest.fn();

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Create mock request, response, and next function
    req = createRequest();
    res = createResponse();
    next = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('auth middleware', () => {
    it('should return 401 if no token is provided', async () => {
      await auth(req, res, next);
      
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(req, res, next);
      
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid', async () => {
      const user = { _id: 'user123', role: 'farmer' };
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(user);

      await auth(req, res, next);
      
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue({ userId: 'non-existent-user' });
      User.findById.mockResolvedValue(null);

      await auth(req, res, next);
      
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'User not found.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    const roles = ['admin', 'manager'];
    
    it('should call next() if user has required role', () => {
      req.user = { role: 'admin' };
      
      authorize(roles)(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      req.user = { role: 'farmer' };
      
      authorize(roles)(req, res, next);
      
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle array of roles', () => {
      req.user = { role: 'manager' };
      
      authorize(roles)(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      authorize(roles)(req, res, next);
      
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'Authentication required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
