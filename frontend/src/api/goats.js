import apiClient from '../lib/apiClient';

export const getGoats = async () => {
  const response = await apiClient.get('/api/goats');
  return response.data;
};

export const getGoatById = async (id) => {
  const response = await apiClient.get(`/api/goats/${id}`);
  return response.data;
};

export const createGoat = async (goatData) => {
  const response = await apiClient.post('/api/goats', goatData);
  return response.data;
};

export const updateGoat = async (id, goatData) => {
  const response = await apiClient.put(`/api/goats/${id}`, goatData);
  return response.data;
};

export const deleteGoat = async (id) => {
  const response = await apiClient.delete(`/api/goats/${id}`);
  return response.data;
};
