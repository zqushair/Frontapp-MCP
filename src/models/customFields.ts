/**
 * Custom field types for Frontapp models
 * These types provide more specific type definitions for custom fields in Frontapp models
 */

/**
 * Base type for custom field values
 * Custom fields can be strings, numbers, booleans, dates, or arrays of these types
 */
export type CustomFieldValue = string | number | boolean | Date | CustomFieldValue[];

/**
 * Type for custom fields
 * This is a record of field names to field values
 */
export interface CustomFields {
  [fieldName: string]: CustomFieldValue;
}

/**
 * Type for metadata fields
 * Metadata can contain various types of information, but we can define common patterns
 */
export interface MetadataFields {
  // Common metadata fields
  source?: string;
  channel?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  tags?: string[];
  labels?: string[];
  
  // Allow for additional custom metadata fields
  [key: string]: CustomFieldValue | undefined;
}

/**
 * Type for webhook payload data
 * This provides a more specific type for the webhook payload data
 */
export interface WebhookPayloadData {
  id: string;
  
  // Common webhook payload fields
  conversation_id?: string;
  message_id?: string;
  contact_id?: string;
  teammate_id?: string;
  tag_id?: string;
  inbox_id?: string;
  account_id?: string;
  
  // Timestamps
  created_at?: number;
  updated_at?: number;
  
  // Status fields
  status?: string;
  archived?: boolean;
  
  // Allow for additional fields based on webhook type
  [key: string]: any;
}
