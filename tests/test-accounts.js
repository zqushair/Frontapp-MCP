#!/usr/bin/env node
import dotenv from 'dotenv';
import { frontappClient } from '../src/clients/frontapp/index.js';
import { getAccountsHandler } from '../src/handlers/requests/accounts/getAccounts.js';
import { getAccountHandler } from '../src/handlers/requests/accounts/getAccount.js';
import { createAccountHandler } from '../src/handlers/requests/accounts/createAccount.js';
import { updateAccountHandler } from '../src/handlers/requests/accounts/updateAccount.js';

// Load environment variables
dotenv.config();

/**
 * Test script for account handlers
 * This script tests the account handlers by directly calling them
 */
async function main() {
  try {
    console.log('Testing Frontapp MCP Account Handlers');
    console.log('====================================');
    
    // Test 1: Test API connection
    console.log('\n1. Testing API connection...');
    try {
      const response = await frontappClient.getAccounts();
      console.log('✅ API connection successful');
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      process.exit(1);
    }
    
    // Test 2: Test GetAccounts handler
    console.log('\n2. Testing GetAccounts handler...');
    try {
      const result = await getAccountsHandler.handle({});
      console.log('✅ GetAccounts handler successful');
      
      // Parse the response and print the number of accounts
      const responseData = JSON.parse(result.content[0].text);
      console.log(`Retrieved ${responseData.accounts.length} accounts`);
      
      // Print the first account if available
      if (responseData.accounts.length > 0) {
        const account = responseData.accounts[0];
        console.log('\nFirst account:');
        console.log(`ID: ${account.id}`);
        console.log(`Name: ${account.name}`);
        console.log(`Domains: ${account.domains.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ GetAccounts handler failed:', error);
    }
    
    // Test 3: Test CreateAccount handler
    console.log('\n3. Testing CreateAccount handler...');
    let createdAccountId;
    try {
      const testAccount = {
        name: `Test Account ${new Date().toISOString()}`,
        domains: ['testdomain.com'],
        description: 'This is a test account created by the MCP test script',
      };
      
      const result = await createAccountHandler.handle(testAccount);
      console.log('✅ CreateAccount handler successful');
      
      // Parse the response and get the account ID
      const responseData = JSON.parse(result.content[0].text);
      createdAccountId = responseData.account.id;
      console.log(`Created account with ID: ${createdAccountId}`);
      console.log(`Name: ${responseData.account.name}`);
    } catch (error) {
      console.error('❌ CreateAccount handler failed:', error);
    }
    
    // Test 4: Test GetAccount handler (if we have a created account)
    if (createdAccountId) {
      console.log('\n4. Testing GetAccount handler...');
      try {
        const result = await getAccountHandler.handle({ account_id: createdAccountId });
        console.log('✅ GetAccount handler successful');
        
        // Parse the response and print account details
        const responseData = JSON.parse(result.content[0].text);
        console.log(`Retrieved account details for ID: ${responseData.id}`);
        console.log(`Name: ${responseData.name}`);
        console.log(`Description: ${responseData.description}`);
        console.log(`Domains: ${responseData.domains.join(', ')}`);
      } catch (error) {
        console.error('❌ GetAccount handler failed:', error);
      }
      
      // Test 5: Test UpdateAccount handler
      console.log('\n5. Testing UpdateAccount handler...');
      try {
        const updateData = {
          account_id: createdAccountId,
          name: `Updated Test Account ${new Date().toISOString()}`,
          description: 'This account was updated by the MCP test script',
        };
        
        const result = await updateAccountHandler.handle(updateData);
        console.log('✅ UpdateAccount handler successful');
        
        // Parse the response and print updated account details
        const responseData = JSON.parse(result.content[0].text);
        console.log(`Updated account with ID: ${responseData.account.id}`);
        console.log(`New name: ${responseData.account.name}`);
        console.log(`New description: ${responseData.account.description}`);
      } catch (error) {
        console.error('❌ UpdateAccount handler failed:', error);
      }
    } else {
      console.log('\nSkipping GetAccount and UpdateAccount tests as no account was created');
    }
    
    console.log('\nTests completed!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
