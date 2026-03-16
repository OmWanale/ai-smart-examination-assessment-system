#!/usr/bin/env node
/**
 * Test script to verify API endpoints respond correctly
 * This helps identify if the backend is causing app crashes
 */

const axios = require('axios');

const API_BASE_URL = 'https://classyn-ai.onrender.com/api';
const MOCK_TOKEN = 'DEV_FAKE_JWT_TOKEN';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOCK_TOKEN}`
  }
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response OK:', {
      status: response.status,
      url: response.config.url,
      data: JSON.stringify(response.data, null, 2)
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    throw error;
  }
);

async function testAPIs() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Get classes (should return empty array initially)
    console.log('Test 1: GET /classes (My Classes)');
    const classesRes = await apiClient.get('/classes');
    console.log('Response structure:', {
      statusCode: classesRes.status,
      hasData: !!classesRes.data,
      dataType: typeof classesRes.data,
      dataKeys: Array.isArray(classesRes.data) ? 'ARRAY' : Object.keys(classesRes.data || {})
    });
    console.log('\n');

    // Test 2: Create a class
    console.log('Test 2: POST /classes (Create Class)');
    const createRes = await apiClient.post('/classes', {
      name: 'Test Class',
      description: 'Test Description'
    });
    const newClassId = createRes.data._id;
    console.log('Created class with ID:', newClassId);
    console.log('Response data keys:', Object.keys(createRes.data));
    console.log('\n');

    // Test 3: Get the new class
    console.log('Test 3: GET /classes (Should see new class)');
    const classesRes2 = await apiClient.get('/classes');
    console.log('Response contains', Array.isArray(classesRes2.data) ? classesRes2.data.length : '?', 'classes');
    console.log('\n');

    console.log('✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

testAPIs();

