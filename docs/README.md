# Frontapp MCP Documentation

Welcome to the documentation for the Frontapp MCP (Model Context Protocol) integration. This documentation provides comprehensive information about the integration, its features, and how to use it.

## Table of Contents

- [Introduction](#introduction)
- [Installation Guide](installation.md)
- [API Reference](api-reference.md)
- [Webhook Integration](webhook-integration.md)
- [Development Guide](development-guide.md)

## Introduction

The Frontapp MCP integration enables Large Language Models (LLMs) to interact with the Frontapp customer communication platform through the Model Context Protocol (MCP). This integration allows LLMs to:

- Access and manipulate Frontapp data (conversations, contacts, tags, etc.)
- Automate Frontapp workflows using natural language commands
- Enhance Frontapp's functionality with AI-powered features
- Support real-time updates and event-driven automation using webhooks

### Architecture

The integration follows a client-server architecture:

1. **LLM Client**: Sends requests to the MCP server in a structured format
2. **MCP Server**: Acts as a bridge between the LLM and Frontapp's API
3. **Frontapp API**: Provides access to Frontapp data and functionality

### Key Components

- **API Gateway**: Handles incoming requests from the LLM and webhooks from Frontapp
- **Request Handlers**: Process different types of requests from the LLM
- **Webhook Handlers**: Process different types of webhooks from Frontapp
- **Frontapp API Client**: Encapsulates the logic for interacting with the Frontapp API
- **Data Models**: Define the structure of data exchanged between the LLM, MCP server, and Frontapp

### Supported Features

The integration supports a wide range of Frontapp features, including:

- **Conversations**: Retrieve, send messages, add comments, archive, assign
- **Contacts**: Retrieve, create, update
- **Tags**: Retrieve, apply, remove
- **Teammates**: Retrieve information
- **Accounts**: Retrieve, create, update
- **Webhooks**: Process real-time events from Frontapp

For detailed information about each feature, please refer to the [API Reference](api-reference.md).

### Getting Started

To get started with the Frontapp MCP integration, follow these steps:

1. [Install and set up the integration](installation.md)
2. [Explore the available API endpoints](api-reference.md)
3. [Set up webhook integration for real-time updates](webhook-integration.md)

If you're interested in contributing to the project, check out the [Development Guide](development-guide.md).
