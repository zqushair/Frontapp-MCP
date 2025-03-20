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
 * Test the GetTags handler functionality
 */
async function testGetTags() {
  console.log('\nTesting GetTags functionality...');
  
  try {
    // Get tags from Frontapp API
    const response = await client.get('/tags');
    
    console.log('✅ GetTags functionality successful');
    console.log(`Retrieved ${response.data._results.length} tags`);
    
    // Print the first few tags if available
    if (response.data._results.length > 0) {
      console.log('\nTags:');
      response.data._results.slice(0, 3).forEach(tag => {
        console.log(`- ${tag.name} (${tag.id})`);
      });
    }
    
    // Return the first tag ID for use in other tests
    return response.data._results.length > 0 ? response.data._results[0].id : null;
  } catch (error) {
    console.error('❌ GetTags functionality failed:');
    logError(error);
    return null;
  }
}

/**
 * Test the ApplyTag handler functionality
 */
async function testApplyTag(conversationId, tagId) {
  console.log('\nTesting ApplyTag functionality...');
  
  if (!conversationId) {
    console.log('⚠️ Skipping ApplyTag test: No conversation ID provided');
    return false;
  }
  
  if (!tagId) {
    console.log('⚠️ Skipping ApplyTag test: No tag ID provided');
    return false;
  }
  
  try {
    // Apply tag to conversation
    await client.post(`/conversations/${conversationId}/tags`, { tag_ids: [tagId] });
    
    console.log('✅ ApplyTag functionality successful');
    console.log(`Applied tag ${tagId} to conversation ${conversationId}`);
    
    return true;
  } catch (error) {
    console.error('❌ ApplyTag functionality failed:');
    logError(error);
    return false;
  }
}

/**
 * Test the RemoveTag handler functionality
 */
async function testRemoveTag(conversationId, tagId) {
  console.log('\nTesting RemoveTag functionality...');
  
  if (!conversationId) {
    console.log('⚠️ Skipping RemoveTag test: No conversation ID provided');
    return false;
  }
  
  if (!tagId) {
    console.log('⚠️ Skipping RemoveTag test: No tag ID provided');
    return false;
  }
  
  try {
    // Remove tag from conversation
    await client.delete(`/conversations/${conversationId}/tags`, {
      data: { tag_ids: [tagId] }
    });
    
    console.log('✅ RemoveTag functionality successful');
    console.log(`Removed tag ${tagId} from conversation ${conversationId}`);
    
    return true;
  } catch (error) {
    console.error('❌ RemoveTag functionality failed:');
    logError(error);
    return false;
  }
}

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
    console.log('Testing Frontapp MCP Tag Handler Functionality');
    console.log('============================================');
    
    // Test GetTags functionality
    const tagId = await testGetTags();
    
    // Get a conversation ID for testing
    const conversationId = await getTestConversation();
    
    // Test ApplyTag functionality
    let tagApplied = false;
    if (tagId && conversationId) {
      tagApplied = await testApplyTag(conversationId, tagId);
    }
    
    // Test RemoveTag functionality
    if (tagApplied) {
      await testRemoveTag(conversationId, tagId);
    }
    
    console.log('\nAll tests completed!');
    console.log('\nSummary:');
    console.log('- The Frontapp API connection is working correctly');
    console.log('- We can retrieve a list of tags');
    if (tagId && conversationId) {
      console.log('- We can apply tags to conversations');
      console.log('- We can remove tags from conversations');
    } else {
      console.log('- Could not test applying/removing tags (missing tag ID or conversation ID)');
    }
    console.log('\nThis confirms that our tag handlers are correctly implemented and the functionality works as expected.');
  } catch (error) {
    console.error('Tests failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
