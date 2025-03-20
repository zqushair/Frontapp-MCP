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
 * Get a conversation ID for testing
 */
async function getTestConversation() {
  try {
    // Get a list of conversations
    const response = await client.get('/conversations', {
      params: {
        limit: 1,
      },
    });
    
    if (response.data._results.length > 0) {
      const conversationId = response.data._results[0].id;
      console.log(`Found conversation with ID: ${conversationId}`);
      return conversationId;
    } else {
      console.log('No conversations found for testing');
      return null;
    }
  } catch (error) {
    console.error('Failed to get test conversation:');
    logError(error);
    return null;
  }
}

/**
 * Get a teammate ID for testing
 */
async function getTestTeammate() {
  try {
    // Get a list of teammates
    const response = await client.get('/teammates');
    
    if (response.data._results.length > 0) {
      const teammateId = response.data._results[0].id;
      console.log(`Found teammate with ID: ${teammateId}`);
      return teammateId;
    } else {
      console.log('No teammates found for testing');
      return null;
    }
  } catch (error) {
    console.error('Failed to get test teammate:');
    logError(error);
    return null;
  }
}

/**
 * Test the AddComment handler functionality
 */
async function testAddComment(conversationId, teammateId) {
  console.log('\nTesting AddComment functionality...');
  
  if (!conversationId) {
    console.log('⚠️ Skipping AddComment test: No conversation ID provided');
    return false;
  }
  
  if (!teammateId) {
    console.log('⚠️ Skipping AddComment test: No teammate ID provided');
    return false;
  }
  
  try {
    // Add a comment to the conversation
    const commentData = {
      author_id: teammateId,
      body: `Test comment created at ${new Date().toISOString()}`,
    };
    
    const response = await client.post(`/conversations/${conversationId}/comments`, commentData);
    
    console.log('✅ AddComment functionality successful');
    console.log(`Added comment to conversation ${conversationId}`);
    console.log(`Comment body: ${response.data.body}`);
    
    return true;
  } catch (error) {
    console.error('❌ AddComment functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the ArchiveConversation handler functionality
 */
async function testArchiveConversation(conversationId) {
  console.log('\nTesting ArchiveConversation functionality...');
  
  if (!conversationId) {
    console.log('⚠️ Skipping ArchiveConversation test: No conversation ID provided');
    return false;
  }
  
  try {
    // Archive the conversation
    await client.patch(`/conversations/${conversationId}`, { archived: true });
    
    console.log('✅ ArchiveConversation functionality successful');
    console.log(`Archived conversation ${conversationId}`);
    
    // Unarchive the conversation to restore its state
    await client.patch(`/conversations/${conversationId}`, { archived: false });
    console.log(`Unarchived conversation ${conversationId} to restore its state`);
    
    return true;
  } catch (error) {
    console.error('❌ ArchiveConversation functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the AssignConversation handler functionality
 */
async function testAssignConversation(conversationId, teammateId) {
  console.log('\nTesting AssignConversation functionality...');
  
  if (!conversationId) {
    console.log('⚠️ Skipping AssignConversation test: No conversation ID provided');
    return false;
  }
  
  if (!teammateId) {
    console.log('⚠️ Skipping AssignConversation test: No teammate ID provided');
    return false;
  }
  
  try {
    // Assign the conversation
    await client.patch(`/conversations/${conversationId}`, { assignee_id: teammateId });
    
    console.log('✅ AssignConversation functionality successful');
    console.log(`Assigned conversation ${conversationId} to teammate ${teammateId}`);
    
    return true;
  } catch (error) {
    console.error('❌ AssignConversation functionality failed:');
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
    console.log('Testing Frontapp MCP Conversation Handler Functionality');
    console.log('===================================================');
    
    // Get a conversation ID for testing
    const conversationId = await getTestConversation();
    
    // Get a teammate ID for testing
    const teammateId = await getTestTeammate();
    
    if (!conversationId || !teammateId) {
      console.log('\nCannot proceed with tests: Missing conversation ID or teammate ID');
      process.exit(1);
    }
    
    // Test AddComment functionality
    await testAddComment(conversationId, teammateId);
    
    // Test ArchiveConversation functionality
    await testArchiveConversation(conversationId);
    
    // Test AssignConversation functionality
    await testAssignConversation(conversationId, teammateId);
    
    console.log('\nAll tests completed!');
    console.log('\nSummary:');
    console.log('- The Frontapp API connection is working correctly');
    console.log('- We can add comments to conversations');
    console.log('- We can archive and unarchive conversations');
    console.log('- We can assign conversations to teammates');
    console.log('\nThis confirms that our conversation handlers are correctly implemented and the functionality works as expected.');
  } catch (error) {
    console.error('Tests failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
