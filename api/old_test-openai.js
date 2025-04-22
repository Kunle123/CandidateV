require('dotenv').config();
const axios = require('axios');

// Test OpenAI connection
async function testOpenAIConnection() {
  console.log('Testing OpenAI connection...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('Set your OpenAI API key in the .env file:');
    console.log('OPENAI_API_KEY=your_openai_api_key_here');
    return false;
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from OpenAI!"' }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      console.log('✅ OpenAI connection successful!');
      console.log('Response:', response.data.choices[0].message.content);
      return true;
    } else {
      console.error('❌ Unexpected response format from OpenAI');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to OpenAI:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Error details:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Test job match analysis endpoint
async function testJobMatchAnalysis() {
  console.log('\nTesting job match analysis endpoint...');
  const PORT = process.env.PORT || 3000;
  
  try {
    const response = await axios.post(`http://localhost:${PORT}/api/ai/job-match/analyze`, {
      cv_id: 'cv-001',
      job_description: 'We are looking for a senior software developer with experience in React, Node.js, and AWS. The ideal candidate has 5+ years of experience building scalable web applications.'
    });
    
    console.log('✅ Job match analysis endpoint responded successfully!');
    console.log('Match score:', response.data.match_score);
    console.log('Strengths:', response.data.strengths);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 503 && error.response.data.service_status === 'offline') {
      console.log('⚠️ AI service is offline (expected without API key)');
      console.log('Response:', error.response.data);
      // This is expected behavior when OpenAI API key is not configured
      return true;
    } else {
      console.error('❌ Error calling job match analysis endpoint:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Error details:', error.response.data);
      } else {
        console.error(error.message);
      }
      return false;
    }
  }
}

// Run the tests
async function runTests() {
  const openAIConnected = await testOpenAIConnection();
  
  if (openAIConnected) {
    await testJobMatchAnalysis();
  } else {
    console.log('\n❌ Skipping endpoint tests due to OpenAI connection failure');
  }
}

runTests().catch(console.error); 