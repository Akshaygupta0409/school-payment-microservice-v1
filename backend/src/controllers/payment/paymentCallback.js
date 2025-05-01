import jwt from 'jsonwebtoken';
import { OrderStatus } from '../../models/OrderStatus.js';
import Order from '../../models/Order.js';
import axios from 'axios';

/**
 * Payment Callback Controller - Implements the payment callback handling requirements
 * 
 * This controller handles callbacks from the Edviron payment gateway after a payment is processed.
 * It works alongside the webhook integration to update transaction details in the database.
 * 
 * The controller implements these requirements from the assessment document:
 * - Receive and process payment callbacks
 * - Update transaction status in the database
 * - Verify payment status with the payment gateway API
 * - Redirect users to appropriate pages based on payment status
 */

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

// Get the frontend URL from environment variables with robust fallbacks
// 1. Use explicit FRONTEND_URL if provided
// 2. In local development (NODE_ENV !== 'production'), default to React dev server
// 3. Otherwise use APP_URL (e.g., Vercel site) or the production fallback
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null) ||
  process.env.APP_URL ||
  'https://school-payment-microservice-v1.vercel.app';

console.log('Resolved FRONTEND_URL:', FRONTEND_URL);

/**
 * Payment Callback Handler
 * 
 * This function processes callbacks from the payment gateway and updates the order status.
 * It implements the requirement to update transaction details in the database based on payment status.
 * 
 * @param {Object} req - Express request object containing callback parameters
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const paymentCallback = async (req, res, next) => {
  try {
    // Log incoming callback data for debugging and audit purposes
    console.log('Callback Request Query:', req.query);
    console.log('Callback Request Body:', req.body);
    console.log('Frontend URL for redirect:', FRONTEND_URL);

    // Extract IDs from query parameters
    const { orderId, EdvironCollectRequestId, status: callbackStatus } = req.query;
    
    // Use Edviron's collect request ID for verification if available
    const collectRequestId = EdvironCollectRequestId || orderId;
    
    // Clean the IDs to ensure they don't contain query parameters
    const cleanOrderId = orderId ? orderId.split('?')[0] : '';
    const cleanCollectRequestId = collectRequestId ? collectRequestId.split('?')[0] : '';
    
    console.log('Cleaned IDs:', { cleanOrderId, cleanCollectRequestId });
    
    if (!cleanCollectRequestId) {
      console.error('No collect request ID provided in callback');
      return res.status(400).send('Missing collect request ID');
    }

    /**
     * Direct Status Update from Callback
     * 
     * If the callback already includes a status, we can update the order status directly
     * without making an additional API call to check the status.
     */
    if (callbackStatus && cleanOrderId) {
      console.log(`Direct status update from callback: ${callbackStatus}`);
      try {
        // First, find the order status
        let orderStatus = await OrderStatus.findOne({ collect_id: cleanCollectRequestId });
        
        if (!orderStatus) {
          // If not found by collect_id, try by order_id
          orderStatus = await OrderStatus.findOne({ order_id: cleanOrderId });
        }
        
        if (orderStatus) {
          // Map the callback status to our normalized status values
          const normalizedStatus = normalizeStatus(callbackStatus);
          
          // Update the order status
          orderStatus.status = normalizedStatus;
          orderStatus.updated_at = new Date();
          
          // If status is success, update payment details
          if (normalizedStatus === 'success') {
            orderStatus.payment_message = 'Payment completed successfully';
            orderStatus.payment_time = new Date();
          } else if (normalizedStatus === 'failed') {
            orderStatus.error_message = 'Payment failed';
            orderStatus.payment_message = 'Payment transaction failed';
          } else if (normalizedStatus === 'cancelled') {
            orderStatus.error_message = 'Payment cancelled by user';
            orderStatus.payment_message = 'Payment transaction cancelled';
          }
          
          await orderStatus.save();
          
          // Also update the parent order
          if (orderStatus.order_id) {
            const order = await Order.findById(orderStatus.order_id);
            if (order) {
              order.status = normalizedStatus;
              await order.save();
            }
          }
          
          console.log('Updated Order Status:', orderStatus);
          
          // Redirect to frontend redirect.html with status info as query parameters
          return res.redirect(`${FRONTEND_URL}/redirect.html?orderId=${cleanOrderId}&status=${callbackStatus}&EdvironCollectRequestId=${cleanCollectRequestId}`);
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError);
      }
    }

    /**
     * Check Payment Status from Edviron API
     * 
     * If we couldn't update the status directly from the callback,
     * we'll check the payment status from the Edviron API.
     * 
     * This implements the "Check Payment Status" API integration from the assessment document:
     * "Use this API to check the status of a previously created payment request."
     */
    try {
      // Get school ID from environment variables or use a default
      const schoolId = process.env.SCHOOL_ID;
      
      if (!schoolId) {
        console.error('SCHOOL_ID environment variable is not set');
        throw new Error('Missing school ID configuration');
      }
      
      // Prepare JWT signature for API authentication with the correct payload structure
      // The payload should include both school_id and collect_request_id as per documentation
      const sign = jwt.sign(
        { 
          school_id: schoolId, 
          collect_request_id: cleanCollectRequestId 
        },
        PG_KEY,
        { expiresIn: '1h' }
      );
      
      // Log the API call details for debugging
      console.log('Calling payment status API with:', {
        method: 'GET',
        url: `${EDVIRON_API_BASE}/collect-request/${cleanCollectRequestId}?school_id=${schoolId}&sign=${sign.substring(0, 20)}...`,
        collectRequestId: cleanCollectRequestId,
        schoolId
      });
      
      // Call Edviron API to verify payment status with the correct endpoint structure
      // Using GET method and query parameters as specified in the documentation
      const apiResponse = await axios.get(
        `${EDVIRON_API_BASE}/collect-request/${cleanCollectRequestId}?school_id=${schoolId}&sign=${sign}`,
        { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PG_API_KEY}`,
            'Accept': 'application/json'
          },
          timeout: 5000
        }
      );
      
      const { data } = apiResponse;
      console.log('Payment status API response:', data);
      
      // Extract payment status from the API response
      // The format is different from the previous endpoint
      if (data && data.status) {
        // Normalize the status value
        const normalizedStatus = normalizeStatus(data.status);
        
        // Look up the order status in the database
        let orderStatus = await OrderStatus.findOne({ collect_id: cleanCollectRequestId });
        if (!orderStatus && cleanOrderId) {
          orderStatus = await OrderStatus.findOne({ order_id: cleanOrderId });
        }
        
        if (orderStatus) {
          // Update status fields
          orderStatus.status = normalizedStatus;
          orderStatus.updated_at = new Date();
          
          // Update additional fields based on the API response
          if (data.amount) orderStatus.transaction_amount = data.amount;
          
          // Add payment details if available
          if (normalizedStatus === 'success') {
            orderStatus.payment_message = 'Payment verified successfully';
            orderStatus.payment_time = new Date();
          } else if (normalizedStatus === 'failed') {
            orderStatus.error_message = 'Payment verification failed';
          }
          
          await orderStatus.save();
          
          // Also update the parent order
          if (orderStatus.order_id) {
            const order = await Order.findById(orderStatus.order_id);
            if (order) {
              order.status = normalizedStatus;
              await order.save();
            }
          }
          
          console.log('Updated Order Status from API:', orderStatus);
        }
        
        // Redirect to frontend redirect.html with status info as query parameters
        return res.redirect(`${FRONTEND_URL}/redirect.html?orderId=${cleanOrderId || cleanCollectRequestId}&status=${data.status}&EdvironCollectRequestId=${cleanCollectRequestId}`);
      }
    } catch (apiError) {
      console.error('Error checking payment status:', apiError.message);
      console.error('API response data:', apiError.response?.data);
      console.error('API request URL:', apiError.config?.url);
      
      // Try to update the order status with the information we have from the callback
      // This serves as a fallback when the API call fails
      if (callbackStatus && cleanOrderId) {
        try {
          console.log('Falling back to callback status due to API error');
          const normalizedStatus = normalizeStatus(callbackStatus);
          
          let orderStatus = await OrderStatus.findOne({ collect_id: cleanCollectRequestId });
          if (!orderStatus) {
            orderStatus = await OrderStatus.findOne({ order_id: cleanOrderId });
          }
          
          if (orderStatus) {
            // Update status fields
            orderStatus.status = normalizedStatus;
            orderStatus.updated_at = new Date();
            orderStatus.error_message = 'API verification failed, using callback status';
            
            await orderStatus.save();
            console.log('Updated order status using fallback method:', orderStatus);
          }
        } catch (fallbackError) {
          console.error('Error in fallback status update:', fallbackError.message);
        }
      }
    }
    
    // If we couldn't process the status, redirect with PENDING status - ensure we go to payment-callback route
    return res.redirect(`${FRONTEND_URL}/redirect.html?orderId=${cleanOrderId || cleanCollectRequestId}&status=PENDING&EdvironCollectRequestId=${cleanCollectRequestId}`);
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Status Normalization Function
 * 
 * This helper function normalizes various status strings from the payment gateway
 * into standardized status values that match our OrderStatus model's enum values.
 * 
 * This implements the data validation requirement from the assessment document:
 * "Ensure proper validation of all incoming data"
 * 
 * @param {string} status - The status string from the payment gateway
 * @returns {string} - Normalized status value ('pending', 'success', 'failed', or 'cancelled')
 */
function normalizeStatus(status) {
  if (!status) return 'pending';
  
  const normalizedStatus = status.toString().toLowerCase();
  
  // Check for success status variations
  if (
    normalizedStatus === 'success' ||
    normalizedStatus === 'successful' ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'paid' ||
    normalizedStatus === 'captured' ||
    normalizedStatus === 'authorized'
  ) {
    return 'success';
  }
  
  // Check for failed status variations
  if (
    normalizedStatus === 'failed' ||
    normalizedStatus === 'failure' ||
    normalizedStatus === 'declined' ||
    normalizedStatus === 'rejected' ||
    normalizedStatus === 'error'
  ) {
    return 'failed';
  }
  
  // Check for cancelled status variations
  if (
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled' ||
    normalizedStatus === 'abandoned' ||
    normalizedStatus === 'aborted'
  ) {
    return 'cancelled';
  }
  
  // Default to pending for any other status
  return 'pending';
}
