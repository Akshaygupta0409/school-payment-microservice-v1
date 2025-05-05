import jwt from 'jsonwebtoken';
import { OrderStatus } from '../../models/OrderStatus.js';
import Order from '../../models/Order.js';

/**
 * Webhook Integration Controller - Implements the webhook integration requirements
 * 
 * This controller fulfills the "🌐 Webhook Integration" requirement from the assessment document:
 * "Create a POST route to update transactions details in DB with the given payload"
 * 
 * The webhook endpoint receives payment status updates from the payment gateway and
 * updates the corresponding order and transaction details in the database.
 * 
 * The payload format as specified in the assessment:
 * {
 *   "status": 200,
 *   "order_info": {
 *     "order_id": "collect_id/transaction_id",
 *     "order_amount": 2000,
 *     "transaction_amount": 2200,
 *     "gateway": "PhonePe",
 *     "bank_reference": "YESBNK222",
 *     "status": "success",
 *     "payment_mode": "upi",
 *     "payemnt_details": "success@ybl",
 *     "Payment_message": "payment success",
 *     "payment_time": "2025-04-23T08:14:21.945+00:00",
 *     "error_message": "NA"
 *   }
 * }
 */

const PG_KEY = process.env.PG_KEY;

/**
 * Payment Webhook Handler
 * 
 * This function processes webhook payloads from the payment gateway and updates
 * the corresponding order and transaction details in the database.
 * 
 * It implements the requirement: "Parse the webhook payload. Update the corresponding Order Status entry in MongoDB."
 * 
 * @param {Object} req - Express request object containing the webhook payload
 * @param {Object} res - Express response object
 */
export const paymentWebhook = async (req, res) => {
  try {
    // Validate webhook payload structure
    const {order_info, sign } = req.body;
    if (!order_info || !sign) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Verify JWT signature
    try {
      jwt.verify(sign, PG_KEY);
    } catch (jwtError) {
      console.error('JWT Verification Failed:', jwtError);
      return res.status(403).json({ error: 'Unauthorized webhook' });
    }

    // Extract webhook payload details
    const { 
      order_id, 
      order_amount,
      transaction_amount,
      gateway,
      bank_reference, 
      status, 
      payment_mode,
      payment_details,
      payment_message, 
      error_message,
    } = order_info;

    // Find corresponding OrderStatus
    const orderStatus = await OrderStatus.findOne({ collect_id: order_id });
    if (!orderStatus) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update OrderStatus with complete webhook information
    orderStatus.status = status.toLowerCase();
    orderStatus.transaction_amount = parseFloat(transaction_amount);
    orderStatus.payment_mode = payment_mode;
    orderStatus.payment_time = payment_time ? new Date(payment_time) : null;
    orderStatus.bank_reference = bank_reference || '';
    orderStatus.payment_message = payment_message || '';
    orderStatus.error_message = error_message || '';
    orderStatus.order_amount = parseFloat(order_amount);
    orderStatus.gateway = gateway;
    orderStatus.amount = parseFloat(amount);
    orderStatus.payment_details = payment_details;

    // Update corresponding Order status
    const order = await Order.findById(orderStatus.order_id);
    if (order) {
      order.status = status.toLowerCase();
      await order.save();
    }

    // Save updated OrderStatus
    await orderStatus.save();

    // Log webhook processing
    console.log(`Webhook processed for order: ${order_id}, Status: ${status}`);

    // Respond with success
    res.status(200).json({ 
      message: 'Webhook processed successfully', 
      order_id 
    });

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    res.status(500).json({ 
      error: 'Internal server error during webhook processing',
      details: error.message 
    });
  }
};

// Optional: Webhook verification middleware
export const verifyWebhookSignature = (req, res, next) => {
  try {
    const { sign } = req.body;
    jwt.verify(sign, process.env.PG_KEY);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid webhook signature' });
  }
};
