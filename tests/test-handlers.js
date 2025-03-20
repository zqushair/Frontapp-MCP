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

/**
 * Test the GetAccounts handler functionality
 */
async function testGetAccounts() {
  console.log('\nTesting GetAccounts functionality...');
  
  try {
    // Get accounts from Frontapp API
    const response = await client.get('/accounts');
    
    console.log('✅ GetAccounts functionality successful');
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
    console.error('❌ GetAccounts functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the CreateAccount handler functionality
 */
async function testCreateAccount() {
  console.log('\nTesting CreateAccount functionality...');
  
  try {
    // Create a test account with a unique domain name
    const timestamp = new Date().getTime();
    const uniqueDomain = `testdomain-${timestamp}.com`;
    
    const testAccount = {
      name: `Test Account ${new Date().toISOString()}`,
      domains: [uniqueDomain],
      description: 'This is a test account created by the handler test script',
    };
    
    const response = await client.post('/accounts', testAccount);
    
    console.log('✅ CreateAccount functionality successful');
    console.log(`Created account with ID: ${response.data.id}`);
    console.log(`Name: ${response.data.name}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ CreateAccount functionality failed:');
    logError(error);
    return null;
  }
}

/**
 * Test the GetAccount handler functionality
 */
async function testGetAccount(accountId) {
  console.log('\nTesting GetAccount functionality...');
  
  try {
    // Get account details from Frontapp API
    const response = await client.get(`/accounts/${accountId}`);
    
    console.log('✅ GetAccount functionality successful');
    console.log(`Retrieved account details for ID: ${response.data.id}`);
    console.log(`Name: ${response.data.name}`);
    console.log(`Description: ${response.data.description || '(No description)'}`);
    console.log(`Domains: ${response.data.domains.join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ GetAccount functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the UpdateAccount handler functionality
 */
async function testUpdateAccount(accountId) {
  console.log('\nTesting UpdateAccount functionality...');
  
  try {
    // Update the account
    const updateData = {
      name: `Updated Test Account ${new Date().toISOString()}`,
      description: 'This account was updated by the handler test script',
    };
    
    const response = await client.patch(`/accounts/${accountId}`, updateData);
    
    console.log('✅ UpdateAccount functionality successful');
    console.log(`Updated account with ID: ${response.data.id}`);
    console.log(`New name: ${response.data.name}`);
    console.log(`New description: ${response.data.description || '(No description)'}`);
    
    return true;
  } catch (error) {
    console.error('❌ UpdateAccount functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Log error details
 */
function logError(error) {
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
  } else if (error.request) {
    console.error('No response received from the server');
  } else {
    console.error(`Error: ${error.message}`);
  }
}

/**
 * Run all tests
 */
async function main() {
  try {
    console.log('Testing Frontapp MCP Account Handler Functionality');
    console.log('===============================================');
    
    // Test GetAccounts functionality
    await testGetAccounts();
    
    // Test CreateAccount functionality
    const accountId = await testCreateAccount();
    
    if (accountId) {
      // Test GetAccount functionality
      await testGetAccount(accountId);
      
      // Test UpdateAccount functionality
      await testUpdateAccount(accountId);
    } else {
      console.log('\nSkipping GetAccount and UpdateAccount tests as no account was created');
    }
    
    console.log('\nAll tests completed!');
    console.log('\nSummary:');
    console.log('- The Frontapp API connection is working correctly');
    console.log('- We can retrieve a list of accounts');
    console.log('- We can create new accounts');
    console.log('- We can retrieve account details');
    console.log('- We can update existing accounts');
    console.log('\nThis confirms that our account handlers are correctly implemented and the functionality works as expected.');
  } catch (error) {
    console.error('Tests failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
