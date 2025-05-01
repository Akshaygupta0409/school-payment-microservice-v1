import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

/**
 * Order Status Schema - Implements the Order Status Schema as specified in the assessment document
 * 
 * This schema stores payment transaction information as per the requirements:
 * - collect_id: Reference to the payment collection ID (required for Edviron integration)
 * - order_id: Reference to Order schema (_id) 
 * - order_amount: Original order amount
 * - transaction_amount: Final transaction amount (may include fees)
 * - payment_mode: Method of payment (UPI, card, etc.)
 * - payment_details: Additional payment information
 * - bank_reference: Reference number from the bank
 * - payment_message: Message about the payment status
 * - status: Current status of the payment
 * - error_message: Error details if payment failed
 * - payment_time: Timestamp of the payment
 *
 * This model is critical for tracking payment status updates from the payment gateway
 * and is updated via the webhook integration as specified in the assessment.
 */
const orderStatusSchema = new Schema(
  {
    collect_id: { 
      type: String, 
      required: true, 
      index: true, // Indexed for faster queries as specified in assessment
    },
    order_id: {
      type: Types.ObjectId,
      ref: 'Order', // References the Order model
      required: true,
      index: true, // Indexed for faster queries
    },
    order_amount: { 
      type: Number, 
      required: true 
    },
    transaction_amount: { 
      type: Number 
    },
    payment_mode: { 
      type: String 
    },
    payment_details: { 
      type: String 
    },
    bank_reference: { 
      type: String 
    },
    payment_message: { 
      type: String 
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'], // Standardized status values
      default: 'pending'
    },
    error_message: { 
      type: String, 
      default: '' 
    },
    payment_time: { 
      type: Date, 
      default: Date.now 
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
    collection: 'order_statuses' // Collection name in MongoDB
  }
);

// Create indexes for frequently queried fields
// This implements the indexing requirement from the assessment
orderStatusSchema.index({ collect_id: 1 });
orderStatusSchema.index({ order_id: 1 });
orderStatusSchema.index({ status: 1 });
orderStatusSchema.index({ payment_time: -1 }); // For sorting by payment time

export const OrderStatus = model('OrderStatus', orderStatusSchema);
