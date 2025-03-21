# API Examples

This document provides examples of request and response payloads for the Frontapp MCP integration API.

## Table of Contents

- [Conversation Tools](#conversation-tools)
  - [get_conversations](#get_conversations)
  - [get_conversation](#get_conversation)
  - [send_message](#send_message)
  - [add_comment](#add_comment)
  - [archive_conversation](#archive_conversation)
  - [assign_conversation](#assign_conversation)
- [Contact Tools](#contact-tools)
  - [get_contact](#get_contact)
  - [create_contact](#create_contact)
  - [update_contact](#update_contact)
- [Tag Tools](#tag-tools)
  - [get_tags](#get_tags)
  - [apply_tag](#apply_tag)
  - [remove_tag](#remove_tag)
- [Teammate Tools](#teammate-tools)
  - [get_teammates](#get_teammates)
  - [get_teammate](#get_teammate)
- [Account Tools](#account-tools)
  - [get_accounts](#get_accounts)
  - [get_account](#get_account)
  - [create_account](#create_account)
  - [update_account](#update_account)

## Conversation Tools

### get_conversations

**Request:**

```json
{
  "name": "get_conversations",
  "arguments": {
    "inbox_id": "inb_123",
    "status": "open",
    "limit": 10
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "_pagination": {
          "next": "eyJpZCI6ImNudl8xMjMifQ=="
        },
        "_links": {
          "self": "https://api2.frontapp.com/conversations"
        },
        "_results": [
          {
            "id": "cnv_123",
            "subject": "Need help with my order",
            "status": "open",
            "assignee": {
              "id": "tea_123",
              "email": "agent@example.com",
              "username": "agent",
              "first_name": "Support",
              "last_name": "Agent",
              "is_admin": false,
              "is_available": true,
              "is_blocked": false,
              "custom_fields": {}
            },
            "recipient": {
              "handle": "customer@example.com",
              "role": "to"
            },
            "tags": [
              {
                "id": "tag_123",
                "name": "support",
                "highlight": "#FF0000",
                "is_private": false,
                "created_at": 1615482367,
                "updated_at": 1615482367
              }
            ],
            "last_message": {
              "id": "msg_123",
              "type": "email",
              "is_inbound": true,
              "created_at": 1615482367,
              "blurb": "I need help with my recent order...",
              "body": "<p>I need help with my recent order. The product I received is damaged.</p>",
              "text": "I need help with my recent order. The product I received is damaged.",
              "author": {
                "email": "customer@example.com",
                "is_teammate": false
              }
            },
            "created_at": 1615482367,
            "is_private": false
          },
          {
            "id": "cnv_124",
            "subject": "Billing question",
            "status": "open",
            "assignee": null,
            "recipient": {
              "handle": "billing@example.com",
              "role": "to"
            },
            "tags": [],
            "last_message": {
              "id": "msg_124",
              "type": "email",
              "is_inbound": true,
              "created_at": 1615482367,
              "blurb": "I have a question about my recent invoice...",
              "body": "<p>I have a question about my recent invoice. Can you explain the charges?</p>",
              "text": "I have a question about my recent invoice. Can you explain the charges?",
              "author": {
                "email": "customer@example.com",
                "is_teammate": false
              }
            },
            "created_at": 1615482367,
            "is_private": false
          }
        ]
      }
    }
  ],
  "isError": false
}
```

### get_conversation

**Request:**

```json
{
  "name": "get_conversation",
  "arguments": {
    "conversation_id": "cnv_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "cnv_123",
        "subject": "Need help with my order",
        "status": "open",
        "assignee": {
          "id": "tea_123",
          "email": "agent@example.com",
          "username": "agent",
          "first_name": "Support",
          "last_name": "Agent",
          "is_admin": false,
          "is_available": true,
          "is_blocked": false,
          "custom_fields": {}
        },
        "recipient": {
          "handle": "customer@example.com",
          "role": "to"
        },
        "tags": [
          {
            "id": "tag_123",
            "name": "support",
            "highlight": "#FF0000",
            "is_private": false,
            "created_at": 1615482367,
            "updated_at": 1615482367
          }
        ],
        "messages": [
          {
            "id": "msg_123",
            "type": "email",
            "is_inbound": true,
            "created_at": 1615482367,
            "blurb": "I need help with my recent order...",
            "body": "<p>I need help with my recent order. The product I received is damaged.</p>",
            "text": "I need help with my recent order. The product I received is damaged.",
            "author": {
              "email": "customer@example.com",
              "is_teammate": false
            }
          },
          {
            "id": "msg_124",
            "type": "email",
            "is_inbound": false,
            "created_at": 1615482467,
            "blurb": "I'm sorry to hear about the damaged product...",
            "body": "<p>I'm sorry to hear about the damaged product. We'll send a replacement right away.</p>",
            "text": "I'm sorry to hear about the damaged product. We'll send a replacement right away.",
            "author": {
              "id": "tea_123",
              "email": "agent@example.com",
              "username": "agent",
              "first_name": "Support",
              "last_name": "Agent",
              "is_teammate": true
            }
          }
        ],
        "comments": [
          {
            "id": "com_123",
            "author": {
              "id": "tea_123",
              "email": "agent@example.com",
              "username": "agent",
              "first_name": "Support",
              "last_name": "Agent",
              "is_teammate": true
            },
            "body": "Customer reported damaged product. Sending replacement.",
            "posted_at": 1615482567
          }
        ],
        "created_at": 1615482367,
        "is_private": false
      }
    }
  ],
  "isError": false
}
```

### send_message

**Request:**

```json
{
  "name": "send_message",
  "arguments": {
    "conversation_id": "cnv_123",
    "content": "Hello, how can I help you today?",
    "options": {
      "tags": ["support", "priority"],
      "archive": false
    }
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "msg_125",
        "type": "email",
        "is_inbound": false,
        "created_at": 1615482667,
        "blurb": "Hello, how can I help you today?",
        "body": "<p>Hello, how can I help you today?</p>",
        "text": "Hello, how can I help you today?",
        "author": {
          "id": "tea_123",
          "email": "agent@example.com",
          "username": "agent",
          "first_name": "Support",
          "last_name": "Agent",
          "is_teammate": true
        },
        "conversation_id": "cnv_123"
      }
    }
  ],
  "isError": false
}
```

### add_comment

**Request:**

```json
{
  "name": "add_comment",
  "arguments": {
    "conversation_id": "cnv_123",
    "body": "Internal note: Customer needs follow-up",
    "author_id": "tea_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "com_124",
        "author": {
          "id": "tea_123",
          "email": "agent@example.com",
          "username": "agent",
          "first_name": "Support",
          "last_name": "Agent",
          "is_teammate": true
        },
        "body": "Internal note: Customer needs follow-up",
        "posted_at": 1615482767,
        "conversation_id": "cnv_123"
      }
    }
  ],
  "isError": false
}
```

### archive_conversation

**Request:**

```json
{
  "name": "archive_conversation",
  "arguments": {
    "conversation_id": "cnv_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "cnv_123",
        "status": "archived"
      }
    }
  ],
  "isError": false
}
```

### assign_conversation

**Request:**

```json
{
  "name": "assign_conversation",
  "arguments": {
    "conversation_id": "cnv_123",
    "assignee_id": "tea_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "cnv_123",
        "assignee": {
          "id": "tea_123",
          "email": "agent@example.com",
          "username": "agent",
          "first_name": "Support",
          "last_name": "Agent"
        }
      }
    }
  ],
  "isError": false
}
```

## Contact Tools

### get_contact

**Request:**

```json
{
  "name": "get_contact",
  "arguments": {
    "contact_id": "cta_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "cta_123",
        "name": "John Doe",
        "description": "VIP Customer",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_spammer": false,
        "links": [
          {
            "name": "Website",
            "url": "https://example.com"
          },
          {
            "name": "LinkedIn",
            "url": "https://linkedin.com/in/johndoe"
          }
        ],
        "handles": [
          {
            "handle": "john.doe@example.com",
            "source": "email"
          },
          {
            "handle": "+1234567890",
            "source": "phone"
          }
        ],
        "groups": ["customers", "vip"],
        "custom_fields": {
          "account_type": "enterprise",
          "subscription_level": "premium"
        },
        "created_at": 1615482367,
        "updated_at": 1615482367
      }
    }
  ],
  "isError": false
}
```

### create_contact

**Request:**

```json
{
  "name": "create_contact",
  "arguments": {
    "name": "John Doe",
    "handles": [
      {
        "handle": "john.doe@example.com",
        "source": "email"
      }
    ],
    "links": [
      {
        "name": "Website",
        "url": "https://example.com"
      }
    ]
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "cta_124",
        "name": "John Doe",
        "description": null,
        "avatar_url": null,
        "is_spammer": false,
        "links": [
          {
            "name": "Website",
            "url": "https://example.com"
          }
        ],
        "handles": [
          {
            "handle": "john.doe@example.com",
            "source": "email"
          }
        ],
        "groups": [],
        "custom_fields": {},
        "created_at": 1615482867,
        "updated_at": 1615482867
      }
    }
  ],
  "isError": false
}
```

### update_contact

**Request:**

```json
{
  "name": "update_contact",
  "arguments": {
    "contact_id": "cta_123",
    "name": "John Smith",
    "description": "Updated contact information"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "cta_123",
        "name": "John Smith",
        "description": "Updated contact information",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_spammer": false,
        "links": [
          {
            "name": "Website",
            "url": "https://example.com"
          },
          {
            "name": "LinkedIn",
            "url": "https://linkedin.com/in/johndoe"
          }
        ],
        "handles": [
          {
            "handle": "john.doe@example.com",
            "source": "email"
          },
          {
            "handle": "+1234567890",
            "source": "phone"
          }
        ],
        "groups": ["customers", "vip"],
        "custom_fields": {
          "account_type": "enterprise",
          "subscription_level": "premium"
        },
        "updated_at": 1615482967
      }
    }
  ],
  "isError": false
}
```

## Tag Tools

### get_tags

**Request:**

```json
{
  "name": "get_tags",
  "arguments": {
    "limit": 20
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "_pagination": {},
        "_links": {
          "self": "https://api2.frontapp.com/tags"
        },
        "_results": [
          {
            "id": "tag_123",
            "name": "support",
            "highlight": "#FF0000",
            "is_private": false,
            "created_at": 1615482367,
            "updated_at": 1615482367
          },
          {
            "id": "tag_124",
            "name": "billing",
            "highlight": "#00FF00",
            "is_private": false,
            "created_at": 1615482367,
            "updated_at": 1615482367
          },
          {
            "id": "tag_125",
            "name": "priority",
            "highlight": "#0000FF",
            "is_private": false,
            "created_at": 1615482367,
            "updated_at": 1615482367
          }
        ]
      }
    }
  ],
  "isError": false
}
```

### apply_tag

**Request:**

```json
{
  "name": "apply_tag",
  "arguments": {
    "conversation_id": "cnv_123",
    "tag_id": "tag_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "conversation_id": "cnv_123",
        "tag_id": "tag_123",
        "tag": {
          "id": "tag_123",
          "name": "support",
          "highlight": "#FF0000",
          "is_private": false
        }
      }
    }
  ],
  "isError": false
}
```

### remove_tag

**Request:**

```json
{
  "name": "remove_tag",
  "arguments": {
    "conversation_id": "cnv_123",
    "tag_id": "tag_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "conversation_id": "cnv_123",
        "tag_id": "tag_123"
      }
    }
  ],
  "isError": false
}
```

## Teammate Tools

### get_teammates

**Request:**

```json
{
  "name": "get_teammates",
  "arguments": {
    "limit": 20
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "_pagination": {},
        "_links": {
          "self": "https://api2.frontapp.com/teammates"
        },
        "_results": [
          {
            "id": "tea_123",
            "email": "agent@example.com",
            "username": "agent",
            "first_name": "Support",
            "last_name": "Agent",
            "is_admin": false,
            "is_available": true,
            "is_blocked": false,
            "custom_fields": {}
          },
          {
            "id": "tea_124",
            "email": "manager@example.com",
            "username": "manager",
            "first_name": "Team",
            "last_name": "Manager",
            "is_admin": true,
            "is_available": true,
            "is_blocked": false,
            "custom_fields": {}
          }
        ]
      }
    }
  ],
  "isError": false
}
```

### get_teammate

**Request:**

```json
{
  "name": "get_teammate",
  "arguments": {
    "teammate_id": "tea_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "tea_123",
        "email": "agent@example.com",
        "username": "agent",
        "first_name": "Support",
        "last_name": "Agent",
        "is_admin": false,
        "is_available": true,
        "is_blocked": false,
        "custom_fields": {},
        "inboxes": [
          {
            "id": "inb_123",
            "name": "Support",
            "is_private": false,
            "address": "support@example.com"
          },
          {
            "id": "inb_124",
            "name": "Sales",
            "is_private": false,
            "address": "sales@example.com"
          }
        ]
      }
    }
  ],
  "isError": false
}
```

## Account Tools

### get_accounts

**Request:**

```json
{
  "name": "get_accounts",
  "arguments": {
    "limit": 20
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "_pagination": {},
        "_links": {
          "self": "https://api2.frontapp.com/accounts"
        },
        "_results": [
          {
            "id": "act_123",
            "name": "Acme Inc.",
            "description": "A company that makes everything",
            "domains": ["acme.com"],
            "external_id": "acme123",
            "custom_fields": {
              "industry": "Manufacturing",
              "size": "Enterprise"
            },
            "created_at": 1615482367,
            "updated_at": 1615482367
          },
          {
            "id": "act_124",
            "name": "Globex Corporation",
            "description": "A global technology company",
            "domains": ["globex.com"],
            "external_id": "globex123",
            "custom_fields": {
              "industry": "Technology",
              "size": "Enterprise"
            },
            "created_at": 1615482367,
            "updated_at": 1615482367
          }
        ]
      }
    }
  ],
  "isError": false
}
```

### get_account

**Request:**

```json
{
  "name": "get_account",
  "arguments": {
    "account_id": "act_123"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "act_123",
        "name": "Acme Inc.",
        "description": "A company that makes everything",
        "domains": ["acme.com"],
        "external_id": "acme123",
        "custom_fields": {
          "industry": "Manufacturing",
          "size": "Enterprise"
        },
        "created_at": 1615482367,
        "updated_at": 1615482367,
        "contacts": [
          {
            "id": "cta_123",
            "name": "John Doe",
            "description": "VIP Customer"
          },
          {
            "id": "cta_124",
            "name": "Jane Smith",
            "description": "Account Manager"
          }
        ]
      }
    }
  ],
  "isError": false
}
```

### create_account

**Request:**

```json
{
  "name": "create_account",
  "arguments": {
    "name": "Acme Inc.",
    "domains": ["acme.com"],
    "description": "A company that makes everything"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "act_125",
        "name": "Acme Inc.",
        "description": "A company that makes everything",
        "domains": ["acme.com"],
        "external_id": null,
        "custom_fields": {},
        "created_at": 1615483067,
        "updated_at": 1615483067
      }
    }
  ],
  "isError": false
}
```

### update_account

**Request:**

```json
{
  "name": "update_account",
  "arguments": {
    "account_id": "act_123",
    "name": "Acme Corporation",
    "description": "Updated account information"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "json",
      "text": {
        "id": "act_123",
        "name": "Acme Corporation",
        "description": "Updated account information",
        "domains": ["acme.com"],
        "external_id": "acme123",
        "custom_fields": {
          "industry": "Manufacturing",
          "size": "Enterprise"
        },
        "updated_at": 1615483167
      }
    }
  ],
  "isError": false
}
```

## Error Responses

### Invalid API Key

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Invalid API key"
    }
  ],
  "isError": true
}
```

### Resource Not Found

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Resource not found: conversation_id cnv_999 does not exist"
    }
  ],
  "isError": true
}
```

### Rate Limit Exceeded

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Rate limit exceeded. Please try again in 60 seconds."
    }
  ],
  "isError": true
}
```

### Validation Error

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Validation failed: 'content' is required"
    }
  ],
  "isError": true
}
```

### Server Error

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: An unexpected error occurred. Please try again later."
    }
  ],
  "isError": true
}
