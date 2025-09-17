import api from './api';

/**
 * Fetches statistics for all farm types
 * @returns {Promise<Object>} Object containing statistics for each farm type
 */
export const getFarmStatistics = async () => {
  try {
    console.log('Fetching farm statistics from /api/farms/statistics');
    const response = await api.get('/api/dashboard/farms/statistics');
    console.log('Farm statistics response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching farm statistics:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    // Return default values if the API call fails
    return {
      goat: { count: 0 },
      poultry: { count: 0 },
      dairy: { count: 0 },
      crops: { count: 0 },
      equipment: { count: 0 }
    };
  }
};

/**
 * Fetches statistics for a specific farm type
 * @param {string} farmType - The type of farm (e.g., 'goat', 'poultry', 'dairy')
 * @returns {Promise<Object>} Statistics for the specified farm type
 */
export const getFarmTypeStatistics = async (farmType) => {
  try {
    const response = await api.get(`/api/farms/${farmType}/statistics`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${farmType} statistics:`, error);
    return { count: 0 };
  }
};
