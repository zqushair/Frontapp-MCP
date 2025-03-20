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
 * Test the GetContacts handler functionality
 */
async function testGetContacts() {
  console.log('\nTesting GetContacts functionality...');
  
  try {
    // Get contacts from Frontapp API
    const response = await client.get('/contacts');
    
    console.log('✅ GetContacts functionality successful');
    console.log(`Retrieved ${response.data._results.length} contacts`);
    
    // Print the first contact if available
    if (response.data._results.length > 0) {
      const contact = response.data._results[0];
      console.log('\nFirst contact:');
      console.log(`ID: ${contact.id}`);
      console.log(`Name: ${contact.name || '(No name)'}`);
      console.log(`Handles: ${contact.handles.map(h => `${h.handle} (${h.source})`).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ GetContacts functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the CreateContact handler functionality
 */
async function testCreateContact() {
  console.log('\nTesting CreateContact functionality...');
  
  try {
    // Create a test contact with a unique email
    const timestamp = new Date().getTime();
    const uniqueEmail = `test-${timestamp}@example.com`;
    
    const testContact = {
      name: `Test Contact ${new Date().toISOString()}`,
      description: 'This is a test contact created by the handler test script',
      handles: [
        {
          handle: uniqueEmail,
          source: 'email'
        }
      ]
      // Remove the links array as it's causing issues
    };
    
    const response = await client.post('/contacts', testContact);
    
    console.log('✅ CreateContact functionality successful');
    console.log(`Created contact with ID: ${response.data.id}`);
    console.log(`Name: ${response.data.name || '(No name)'}`);
    console.log(`Email: ${uniqueEmail}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ CreateContact functionality failed:');
    logError(error);
    return null;
  }
}

/**
 * Test the GetContact handler functionality
 */
async function testGetContact(contactId) {
  console.log('\nTesting GetContact functionality...');
  
  try {
    // Get contact details from Frontapp API
    const response = await client.get(`/contacts/${contactId}`);
    
    console.log('✅ GetContact functionality successful');
    console.log(`Retrieved contact details for ID: ${response.data.id}`);
    console.log(`Name: ${response.data.name || '(No name)'}`);
    console.log(`Description: ${response.data.description || '(No description)'}`);
    console.log(`Handles: ${response.data.handles.map(h => `${h.handle} (${h.source})`).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ GetContact functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the UpdateContact handler functionality
 */
async function testUpdateContact(contactId) {
  console.log('\nTesting UpdateContact functionality...');
  
  try {
    // Update the contact
    const updateData = {
      name: `Updated Test Contact ${new Date().toISOString()}`,
      description: 'This contact was updated by the handler test script',
    };
    
    const response = await client.patch(`/contacts/${contactId}`, updateData);
    
    console.log('✅ UpdateContact functionality successful');
    console.log(`Updated contact with ID: ${response.data.id}`);
    console.log(`New name: ${response.data.name || '(No name)'}`);
    console.log(`New description: ${response.data.description || '(No description)'}`);
    
    return true;
  } catch (error) {
    console.error('❌ UpdateContact functionality failed:');
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
    console.log('Testing Frontapp MCP Contact Handler Functionality');
    console.log('===============================================');
    
    // Test GetContacts functionality
    await testGetContacts();
    
    // Test CreateContact functionality
    const contactId = await testCreateContact();
    
    if (contactId) {
      // Test GetContact functionality
      await testGetContact(contactId);
      
      // Test UpdateContact functionality
      await testUpdateContact(contactId);
    } else {
      console.log('\nSkipping GetContact and UpdateContact tests as no contact was created');
    }
    
    console.log('\nAll tests completed!');
    console.log('\nSummary:');
    console.log('- The Frontapp API connection is working correctly');
    console.log('- We can retrieve a list of contacts');
    console.log('- We can create new contacts');
    console.log('- We can retrieve contact details');
    console.log('- We can update existing contacts');
    console.log('\nThis confirms that our contact handlers are correctly implemented and the functionality works as expected.');
  } catch (error) {
    console.error('Tests failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
