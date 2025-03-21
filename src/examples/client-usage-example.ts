import { FrontappMcpClient } from '../frontapp-mcp-client.js';

// Example usage of the Frontapp MCP client
async function main() {
  // Create a client instance
  // In a real application, you would use the actual URL of your MCP server
  const client = new FrontappMcpClient('http://localhost:3000');

  // Enable retries for better reliability
  client.enableRetries(3, 1000);

  // Set up custom error handling
  client.setErrorHandler((error: Error) => {
    console.error('Error occurred:', error.message);
  });

  try {
    // Example 1: Get a list of conversations
    console.log('Getting conversations...');
    const conversations = await client.getConversations({
      status: 'open',
      limit: 10,
    });
    console.log(`Retrieved ${conversations.result._results.length} conversations`);

    // Example 2: Get details of a specific conversation
    // Replace 'cnv_123' with an actual conversation ID
    console.log('Getting conversation details...');
    const conversation = await client.getConversation('cnv_123');
    console.log('Conversation subject:', conversation.result.subject);

    // Example 3: Send a message to a conversation
    console.log('Sending a message...');
    await client.sendMessage('cnv_123', 'Hello, how can I help you today?', {
      tags: ['support', 'priority'],
    });
    console.log('Message sent successfully');

    // Example 4: Get a list of tags
    console.log('Getting tags...');
    const tags = await client.getTags();
    console.log(`Retrieved ${tags.result._results.length} tags`);

    // Example 5: Get a list of teammates
    console.log('Getting teammates...');
    const teammates = await client.getTeammates();
    console.log(`Retrieved ${teammates.result._results.length} teammates`);

    // Example 6: Get a list of inboxes
    console.log('Getting inboxes...');
    const inboxes = await client.getInboxes();
    console.log(`Retrieved ${inboxes.result._results.length} inboxes`);

    // Example 7: Get details of a specific inbox
    // Replace 'inb_123' with an actual inbox ID
    console.log('Getting inbox details...');
    const inbox = await client.getInbox('inb_123');
    console.log('Inbox name:', inbox.result.name);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().catch(console.error);
