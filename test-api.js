const axios = require('axios');

async function testEndpoints() {
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    console.log('Testing health endpoint...');
    const healthRes = await axios.get(`${baseUrl}/health`);
    console.log('Health endpoint response:', {
      status: healthRes.status,
      data: healthRes.data
    });
    
    console.log('\nTesting breeding endpoint...');
    const breedingRes = await axios.get(`${baseUrl}/breeding/test`);
    console.log('Breeding test endpoint response:', {
      status: breedingRes.status,
      data: breedingRes.data
    });
    
  } catch (error) {
    console.error('Error testing endpoints:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testEndpoints();
