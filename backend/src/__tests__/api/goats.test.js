const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Goat = require('../../models/Goat');
const { User } = require('../../models/User');

// Mock data
const testUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Farmer',
  email: 'farmer@test.com',
  password: 'password123',
  role: 'farmer',
  generateAuthToken: jest.fn().mockReturnValue('test-token')
};

const testGoat = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Goat',
  earTag: 'GT-2023-001',
  breed: 'Saanen',
  dateOfBirth: new Date('2022-01-01'),
  gender: 'female',
  weight: 45.5,
  color: 'White',
  status: 'active',
  owner: testUser._id,
  purchaseInfo: {
    date: new Date('2022-01-15'),
    price: 25000,
    seller: 'Test Farm'
  }
};

// Mock models
jest.mock('../../models/User');
jest.mock('../../models/Goat');

describe('Goats API', () => {
  let token;

  beforeAll(() => {
    // Mock user authentication
    User.findById.mockResolvedValue(testUser);
    token = 'test-token';
  });

  describe('GET /api/goats', () => {
    it('should return all goats with 200 status', async () => {
      const goats = [testGoat];
      Goat.find.mockResolvedValue(goats);

      const res = await request(app)
        .get('/api/goats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('name', testGoat.name);
    });

    it('should apply filters when query parameters are provided', async () => {
      const filteredGoats = [testGoat];
      Goat.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(filteredGoats)
      });

      const res = await request(app)
        .get('/api/goats?breed=Saanen&status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Goat.find).toHaveBeenCalledWith({
        breed: 'Saanen',
        status: 'active',
        owner: testUser._id
      });
    });
  });

  describe('GET /api/goats/:id', () => {
    it('should return a single goat by ID', async () => {
      Goat.findById.mockResolvedValue(testGoat);

      const res = await request(app)
        .get(`/api/goats/${testGoat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', testGoat.name);
      expect(Goat.findById).toHaveBeenCalledWith(testGoat._id);
    });

    it('should return 404 if goat is not found', async () => {
      Goat.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/goats/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Goat not found');
    });
  });

  describe('POST /api/goats', () => {
    it('should create a new goat with valid data', async () => {
      const newGoat = {
        name: 'New Goat',
        earTag: 'GT-2023-002',
        breed: 'Alpine',
        dateOfBirth: '2022-06-01',
        gender: 'male',
        weight: 50,
        color: 'Brown',
        status: 'active'
      };

      Goat.create.mockResolvedValue({
        ...newGoat,
        _id: new mongoose.Types.ObjectId(),
        owner: testUser._id
      });

      const res = await request(app)
        .post('/api/goats')
        .set('Authorization', `Bearer ${token}`)
        .send(newGoat);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', newGoat.name);
      expect(res.body.data).toHaveProperty('owner', testUser._id.toString());
    });

    it('should return 400 with validation errors for invalid data', async () => {
      const invalidGoat = {
        // Missing required fields
        name: 'In', // Too short
        earTag: 'GT-2023-002'
      };

      const res = await request(app)
        .post('/api/goats')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidGoat);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Name must be between 3 and 100 characters'
          }),
          expect.objectContaining({
            msg: 'Breed is required'
          })
        ])
      );
    });
  });

  describe('PUT /api/goats/:id', () => {
    it('should update an existing goat', async () => {
      const updates = {
        name: 'Updated Goat Name',
        weight: 52.5
      };

      const updatedGoat = {
        ...testGoat,
        ...updates,
        save: jest.fn().mockResolvedValue(true)
      };

      Goat.findById.mockResolvedValue(updatedGoat);

      const res = await request(app)
        .put(`/api/goats/${testGoat._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', updates.name);
      expect(res.body.data).toHaveProperty('weight', updates.weight);
    });

    it('should return 404 if goat to update is not found', async () => {
      Goat.findById.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/goats/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nonexistent Goat' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Goat not found');
    });
  });

  describe('DELETE /api/goats/:id', () => {
    it('should delete an existing goat', async () => {
      Goat.findById.mockResolvedValue(testGoat);
      Goat.findByIdAndDelete.mockResolvedValue(testGoat);

      const res = await request(app)
        .delete(`/api/goats/${testGoat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data', null);
      expect(Goat.findByIdAndDelete).toHaveBeenCalledWith(testGoat._id);
    });

    it('should return 404 if goat to delete is not found', async () => {
      Goat.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/goats/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Goat not found');
    });
  });
});
