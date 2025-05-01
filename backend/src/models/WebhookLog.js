import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Webhook Log Schema - Implements the Webhook Logs Schema as specified in the assessment document
 * 
 * This is a custom schema to store webhook-related logs as required in the assessment.
 * It captures all incoming webhook payloads for:
 * - Audit trail purposes
 * - Debugging payment gateway integration issues
 * - Tracking payment status updates
 * 
 * The schema stores:
 * - payload: The complete webhook payload received from the payment gateway
 * - receivedAt: Timestamp when the webhook was received
 * 
 * This implements the "Robust Logging" requirement from the assessment document,
 * which specifies to "Log incoming webhook events and failed transactions for audit and debugging."
 */
const webhookLogSchema = new Schema(
  {
    payload: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    receivedAt: { 
      type: Date, 
      default: Date.now 
    },
    status: {
      type: String,
      enum: ['processed', 'failed', 'invalid'],
      default: 'processed'
    },
    errorDetails: {
      type: String
    }
  },
  {
    collection: 'webhook_logs',
    timestamps: true // Adds createdAt and updatedAt timestamps
  }
);

// Create indexes for efficient querying
webhookLogSchema.index({ receivedAt: -1 }); // For sorting by time received
webhookLogSchema.index({ status: 1 }); // For filtering by processing status

export const WebhookLog = model('WebhookLog', webhookLogSchema);
