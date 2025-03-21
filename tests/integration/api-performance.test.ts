/**
 * Performance test for the API server
 * This test measures the performance of the API server under load
 */

import { createTestClient, mockFrontappApi, cleanup } from './setup.js';
import { expect } from 'chai';

describe('API Performance Tests', () => {
  let testClient: any;
  let mockApi: any;
  
  beforeEach(() => {
    // Create a test client
    testClient = createTestClient();
    
    // Mock the Frontapp API
    const mock = mockFrontappApi();
    mockApi = mock.frontappApi;
  });
  
  afterEach(() => {
    // Close the test client
    if (testClient) {
      testClient.close();
    }
    
    // Clean up mocks
    cleanup();
  });
  
  it('should handle multiple concurrent requests efficiently', async () => {
    // Mock API responses for the performance test
    mockApi
      .get('/conversations')
      .query(true)
      .times(10)
      .reply(200, {
        _pagination: {
          next: null,
        },
        _links: {
          self: 'https://api2.frontapp.com/conversations',
        },
        _results: [
          {
            id: 'cnv_123',
            subject: 'Test Conversation',
            status: 'open',
          },
        ],
      });
    
    // Create an array of 10 concurrent requests
    const requests = Array(10).fill(0).map(() => {
      return testClient.request
        .post('/tools/get_conversations')
        .set('X-API-Key', 'test-api-key')
        .send({
          arguments: {
            status: 'open',
            limit: 10,
          },
        });
    });
    
    // Measure the time it takes to complete all requests
    const startTime = Date.now();
    
    // Execute all requests concurrently
    const responses = await Promise.all(requests);
    
    // Calculate the total time
    const totalTime = Date.now() - startTime;
    
    // Verify all requests were successful
    for (const response of responses) {
      expect(response.status).to.equal(200);
      expect(response.body.content[0].text._results).to.be.an('array');
      expect(response.body.content[0].text._results[0].id).to.equal('cnv_123');
    }
    
    // Log the performance metrics
    console.log(`Completed 10 concurrent requests in ${totalTime}ms (${totalTime / 10}ms per request)`);
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
    
    // Assert that the average response time is reasonable
    // This is a flexible assertion that can be adjusted based on the environment
    expect(totalTime / 10).to.be.lessThan(500, 'Average response time should be less than 500ms');
  });
  
  it('should handle rate limiting correctly', async () => {
    // Mock API responses for the rate limiting test
    mockApi
      .get('/conversations')
      .query(true)
      .times(3)
      .reply(200, {
        _pagination: {
          next: null,
        },
        _links: {
          self: 'https://api2.frontapp.com/conversations',
        },
        _results: [
          {
            id: 'cnv_123',
            subject: 'Test Conversation',
            status: 'open',
          },
        ],
      });
    
    // Mock rate limit exceeded response
    mockApi
      .get('/conversations')
      .query(true)
      .times(7)
      .reply(429, {
        _error: {
          status: 429,
          title: 'Too Many Requests',
          message: 'Rate limit exceeded',
          details: {
            retry_after: 60,
          },
        },
      });
    
    // Create an array of 10 concurrent requests
    const requests = Array(10).fill(0).map(() => {
      return testClient.request
        .post('/tools/get_conversations')
        .set('X-API-Key', 'test-api-key')
        .send({
          arguments: {
            status: 'open',
            limit: 10,
          },
        });
    });
    
    // Execute all requests concurrently
    const responses = await Promise.all(requests);
    
    // Count successful and rate-limited responses
    const successfulResponses = responses.filter(response => !response.body.isError);
    const rateLimitedResponses = responses.filter(response => 
      response.body.isError && 
      response.body.content[0].text.includes('Rate limit exceeded')
    );
    
    // Verify the counts
    expect(successfulResponses.length).to.equal(3, 'Should have 3 successful responses');
    expect(rateLimitedResponses.length).to.equal(7, 'Should have 7 rate-limited responses');
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
  });
  
  it('should handle errors gracefully under load', async () => {
    // Mock API responses for the error handling test
    mockApi
      .get('/conversations')
      .query(true)
      .times(5)
      .reply(200, {
        _pagination: {
          next: null,
        },
        _links: {
          self: 'https://api2.frontapp.com/conversations',
        },
        _results: [
          {
            id: 'cnv_123',
            subject: 'Test Conversation',
            status: 'open',
          },
        ],
      });
    
    // Mock server error responses
    mockApi
      .get('/conversations')
      .query(true)
      .times(5)
      .reply(500, {
        _error: {
          status: 500,
          title: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
      });
    
    // Create an array of 10 concurrent requests
    const requests = Array(10).fill(0).map(() => {
      return testClient.request
        .post('/tools/get_conversations')
        .set('X-API-Key', 'test-api-key')
        .send({
          arguments: {
            status: 'open',
            limit: 10,
          },
        });
    });
    
    // Execute all requests concurrently
    const responses = await Promise.all(requests);
    
    // Count successful and error responses
    const successfulResponses = responses.filter(response => !response.body.isError);
    const errorResponses = responses.filter(response => 
      response.body.isError && 
      response.body.content[0].text.includes('Internal Server Error')
    );
    
    // Verify the counts
    expect(successfulResponses.length).to.equal(5, 'Should have 5 successful responses');
    expect(errorResponses.length).to.equal(5, 'Should have 5 error responses');
    
    // Verify all responses have status 200 (even errors are wrapped in a 200 response)
    for (const response of responses) {
      expect(response.status).to.equal(200);
    }
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
  });
  
  it('should maintain response time consistency under load', async () => {
    // Mock API responses with varying delays
    for (let i = 0; i < 10; i++) {
      mockApi
        .get('/conversations')
        .query(true)
        .delay(i * 50) // Increasing delay for each request
        .reply(200, {
          _pagination: {
            next: null,
          },
          _links: {
            self: 'https://api2.frontapp.com/conversations',
          },
          _results: [
            {
              id: `cnv_${i}`,
              subject: `Test Conversation ${i}`,
              status: 'open',
            },
          ],
        });
    }
    
    // Create an array of 10 sequential requests
    const responseTimes: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      const response = await testClient.request
        .post('/tools/get_conversations')
        .set('X-API-Key', 'test-api-key')
        .send({
          arguments: {
            status: 'open',
            limit: 10,
          },
        });
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      // Verify the response
      expect(response.status).to.equal(200);
      expect(response.body.content[0].text._results).to.be.an('array');
      expect(response.body.content[0].text._results[0].id).to.equal(`cnv_${i}`);
    }
    
    // Calculate statistics
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const responseTimeRange = maxResponseTime - minResponseTime;
    
    // Log the performance metrics
    console.log(`Response times (ms): ${responseTimes.join(', ')}`);
    console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`Min response time: ${minResponseTime}ms`);
    console.log(`Max response time: ${maxResponseTime}ms`);
    console.log(`Response time range: ${responseTimeRange}ms`);
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
    
    // Assert that the response time range is reasonable
    // This is a flexible assertion that can be adjusted based on the environment
    expect(responseTimeRange).to.be.lessThan(1000, 'Response time range should be less than 1000ms');
  });
});
