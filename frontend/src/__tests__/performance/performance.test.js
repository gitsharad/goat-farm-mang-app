import React from 'react';
import { render, screen } from '@testing-library/react';
import { measurePerformance } from 'reassure';
import PoultryProduction from '../../pages/Poultry/PoultryProduction';
import GoatDetail from '../../pages/Goat/GoatDetail';

// Mock API responses
const mockPoultryData = {
  dailyProduction: Array(1000).fill(0).map((_, i) => ({
    date: `2023-06-${String(i + 1).padStart(2, '0')}`,
    eggs: Math.floor(Math.random() * 50) + 30,
    feedConsumption: Math.random() * 10 + 5
  })),
  weeklyAverage: 6.2,
  monthlyTotal: 1300,
  feedConversionRatio: 2.1
};

const mockGoatData = {
  _id: 'g1',
  tagNumber: 'GT-001',
  name: 'Test Goat',
  breed: 'Boer',
  dateOfBirth: '2020-01-01',
  gender: 'Female',
  status: 'Active',
  weight: 45.5,
  milkRecords: Array(365).fill(0).map((_, i) => ({
    date: new Date(2023, 0, i + 1).toISOString(),
    amount: Math.random() * 3 + 1,
    time: i % 2 === 0 ? 'morning' : 'evening'
  })),
  healthRecords: Array(10).fill(0).map((_, i) => ({
    date: new Date(2023, i, 1).toISOString(),
    type: ['Vaccination', 'Deworming', 'Checkup'][i % 3],
    description: `Record ${i + 1}`,
    notes: `Notes for record ${i + 1}`
  }))
};

// Mock API calls
jest.mock('../../services/api', () => ({
  get: jest.fn((url) => {
    if (url.includes('poultry/production')) {
      return Promise.resolve({ data: mockPoultryData });
    }
    if (url.includes('goats/g1')) {
      return Promise.resolve({ data: mockGoatData });
    }
    return Promise.resolve({ data: [] });
  })
}));

describe('Performance Tests', () => {
  describe('PoultryProduction', () => {
    test('should render production chart with 1000 data points efficiently', async () => {
      await measurePerformance(
        <PoultryProduction />,
        { 
          runs: 5,
          warmup: 2
        }
      );
    }, 30000); // 30 second timeout
  });

  describe('GoatDetail', () => {
    test('should render goat details with 1 year of milk records efficiently', async () => {
      await measurePerformance(
        <GoatDetail />,
        { 
          runs: 5,
          warmup: 2
        }
      );
    }, 30000); // 30 second timeout
  });
});

// Performance test utilities
function generateLargeDataset(size) {
  return Array(size).fill(0).map((_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    value: Math.random() * 1000,
    date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString(),
    active: Math.random() > 0.5,
    // Add more fields to simulate real data
    ...Array(10).fill(0).reduce((acc, _, j) => ({
      ...acc,
      [`field${j}`]: `value-${i}-${j}`
    }), {})
  }));
}

// Export for use in other test files
export {
  generateLargeDataset
};
