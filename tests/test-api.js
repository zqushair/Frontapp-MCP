#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const apiKey = process.env.FRONTAPP_API_KEY;
if (!apiKey) {
  console.error('FRONTAPP_API_KEY environment variable is required');
  process.exit(1);
}

// Create an Axios instance for Frontapp API
const client = axios.create({
  baseURL: 'https://api2.frontapp.com',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Test the API connection
async function testApiConnection() {
  try {
    console.log('Testing Frontapp API connection...');
    
    // Try to get a list of accounts
    const response = await client.get('/accounts');
    
    console.log('✅ API connection successful');
    console.log(`Retrieved ${response.data._results.length} accounts`);
    
    // Print the first account if available
    if (response.data._results.length > 0) {
      const account = response.data._results[0];
      console.log('\nFirst account:');
      console.log(`ID: ${account.id}`);
      console.log(`Name: ${account.name}`);
      console.log(`Domains: ${account.domains.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API connection failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from the server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`Error: ${error.message}`);
    }
    
    return false;
  }
}

// Create a test account
async function createTestAccount() {
  try {
    console.log('\nCreating a test account...');
    
    const testAccount = {
      name: `Test Account ${new Date().toISOString()}`,
      domains: ['testdomain.com'],
      description: 'This is a test account created by the API test script',
    };
    
    const response = await client.post('/accounts', testAccount);
    
    console.log('✅ Account created successfully');
    console.log(`ID: ${response.data.id}`);
    console.log(`Name: ${response.data.name}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Failed to create account:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('No response received from the server');
    } else {
      console.error(`Error: ${error.message}`);
    }
    
    return null;
  }
}

// Update a test account
async function updateTestAccount(accountId) {
  try {
    console.log('\nUpdating the test account...');
    
    const updateData = {
      name: `Updated Test Account ${new Date().toISOString()}`,
      description: 'This account was updated by the API test script',
    };
    
    const response = await client.patch(`/accounts/${accountId}`, updateData);
    
    console.log('✅ Account updated successfully');
    console.log(`ID: ${response.data.id}`);
    console.log(`Name: ${response.data.name}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update account:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('No response received from the server');
    } else {
      console.error(`Error: ${error.message}`);
    }
    
    return false;
  }
}

// Run the tests
async function main() {
  try {
    // Test API connection
    const connectionSuccess = await testApiConnection();
    if (!connectionSuccess) {
      console.error('API connection test failed. Exiting...');
      process.exit(1);
    }
    
    // Create a test account
    const accountId = await createTestAccount();
    if (!accountId) {
      console.error('Failed to create test account. Exiting...');
      process.exit(1);
    }
    
    // Update the test account
    await updateTestAccount(accountId);
    
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Tests failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
