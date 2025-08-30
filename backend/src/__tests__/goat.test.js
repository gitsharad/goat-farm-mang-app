const mongoose = require('mongoose');
const Goat = require('../models/Goat');
const { validation } = require('../utils/validation');

describe('Goat Model', () => {
  let testGoat;

  beforeEach(() => {
    testGoat = {
      name: 'Daisy',
      earTag: 'GT-2023-001',
      breed: 'Saanen',
      dateOfBirth: new Date('2022-01-15'),
      gender: 'female',
      weight: 45.5,
      color: 'White',
      status: 'active',
      purchaseInfo: {
        date: new Date('2022-03-10'),
        price: 25000,
        seller: 'Local Farm',
      },
      healthRecords: [
        {
          date: new Date('2023-01-10'),
          temperature: 38.5,
          weight: 48.2,
          notes: 'Routine checkup',
          vet: 'Dr. Smith',
        },
      ],
    };
  });

  it('should create and save a goat successfully', async () => {
    const goat = new Goat(testGoat);
    const savedGoat = await goat.save();

    expect(savedGoat._id).toBeDefined();
    expect(savedGoat.name).toBe(testGoat.name);
    expect(savedGoat.earTag).toBe(testGoat.earTag);
    expect(savedGoat.breed).toBe(testGoat.breed);
    expect(savedGoat.gender).toBe(testGoat.gender);
    expect(savedGoat.status).toBe('active');
  });

  it('should require name field', async () => {
    delete testGoat.name;
    const goat = new Goat(testGoat);
    
    let error;
    try {
      await goat.validate();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.name).toBeDefined();
  });

  it('should require unique ear tag', async () => {
    // Save first goat
    const goat1 = new Goat(testGoat);
    await goat1.save();
    
    // Try to save second goat with same ear tag
    const goat2 = new Goat({
      ...testGoat,
      name: 'Daisy Clone',
      earTag: 'GT-2023-001',
    });
    
    let error;
    try {
      await goat2.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Duplicate key error
  });

  it('should validate breed against allowed values', async () => {
    testGoat.breed = 'InvalidBreed';
    const goat = new Goat(testGoat);
    
    let error;
    try {
      await goat.validate();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.breed).toBeDefined();
  });

  it('should calculate age in months', () => {
    const goat = new Goat(testGoat);
    const now = new Date();
    const expectedMonths = (now.getFullYear() - testGoat.dateOfBirth.getFullYear()) * 12 + 
                          (now.getMonth() - testGoat.dateOfBirth.getMonth());
    
    expect(goat.ageInMonths).toBeGreaterThanOrEqual(expectedMonths);
  });

  it('should add health record correctly', async () => {
    const goat = new Goat(testGoat);
    await goat.save();
    
    const newHealthRecord = {
      date: new Date(),
      temperature: 39.0,
      weight: 49.0,
      notes: 'Follow-up checkup',
      vet: 'Dr. Johnson',
    };
    
    goat.healthRecords.push(newHealthRecord);
    const updatedGoat = await goat.save();
    
    expect(updatedGoat.healthRecords).toHaveLength(2);
    expect(updatedGoat.healthRecords[1].vet).toBe('Dr. Johnson');
  });

  it('should validate weight is positive', async () => {
    testGoat.weight = -5;
    const goat = new Goat(testGoat);
    
    let error;
    try {
      await goat.validate();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.weight).toBeDefined();
  });

  it('should set default status to active', async () => {
    delete testGoat.status;
    const goat = new Goat(testGoat);
    expect(goat.status).toBe('active');
  });
});
