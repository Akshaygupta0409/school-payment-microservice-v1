import jwt from 'jsonwebtoken';
import Order from '../../models/Order.js';
import { OrderStatus } from '../../models/OrderStatus.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Payment Gateway Integration - Implements the requirements from the assessment document
 * 
 * This controller handles the POST /create-payment route as specified in the assessment:
 * "Implement a POST /create-payment route."
 * "Accept payment details from the user."
 * "Forward data to the payment API using create-collect-request"
 * "Generate JWT-signed payloads as required."
 * "Redirect the user to the payment page from the API response."
 * 
 * The integration uses the Edviron payment gateway as specified in the assessment document.
 */

// Configurable constants with fallbacks
const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY || 'your-default-pg-key';
const PG_API_KEY = process.env.PG_API_KEY || 'your-default-api-key';
const APP_URL = process.env.APP_URL || 'http://localhost:4574/';
const SCHOOL_ID = process.env.SCHOOL_ID || 'default-school-id';

// Helper function to validate environment variables
const validateEnvVars = () => {
  const requiredVars = [
    { name: 'EDVIRON_API_BASE', value: EDVIRON_API_BASE },
    { name: 'PG_KEY', value: PG_KEY },
    { name: 'PG_API_KEY', value: PG_API_KEY },
    { name: 'APP_URL', value: APP_URL },
    { name: 'SCHOOL_ID', value: SCHOOL_ID }
  ];
  
  const missingVars = requiredVars
    .filter(v => v.value === undefined || v.value.includes('default') || v.value.includes('your-'))
    .map(v => v.name);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
}

/**
 * Create Payment Controller - Handles payment creation and integration with Edviron payment gateway
 * 
 * This controller implements the following requirements from the assessment:
 * 1. Accept payment details from the user
 * 2. Forward data to the payment API
 * 3. Generate JWT-signed payloads
 * 4. Return the payment URL to redirect the user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createPayment = async (req, res) => {
  // Validate environment variables first
  if (!validateEnvVars()) {
    return res.status(500).json({ 
      error: 'Server configuration error', 
      details: 'Missing required environment variables for payment processing' 
    });
  }

  try {
    const { amount, student_info, phone_number } = req.body;
    
    // Extensive logging
    console.log('Payment Creation Request:', {
      amount,
      student_info,
      phone_number,
      EDVIRON_API_BASE,
      SCHOOL_ID,
      APP_URL
    });

    // Enhanced validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }
    
    if (!student_info || !student_info.name) {
      return res.status(400).json({ error: 'Student information with at least a name is required' });
    }

    // Ensure student_info has all required fields
    const validatedStudentInfo = {
      name: student_info.name,
      id: student_info.id || `temp-${uuidv4()}`,
      email: student_info.email || `${student_info.name.replace(/\s+/g, '').toLowerCase()}@example.com`
    };
    
    // Create Order with validated data
    const order = new Order({
      school_id: SCHOOL_ID,
      trustee_id: req.user ? req.user.userId : uuidv4(),
      student_info: validatedStudentInfo,
      gateway_name: 'Edviron',
      amount: parseFloat(amount),
      currency: 'INR',
      status: 'pending',
      created_at: new Date()
    });
    
    await order.save();
    console.log('Order created:', order._id.toString());

    // Generate a unique reference ID for this transaction
    const reference_id = `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Ensure callback URL ends with a slash if needed
    const baseCallbackUrl = APP_URL.endsWith('/') ? APP_URL : `${APP_URL}/`;
    const callbackUrl = `${baseCallbackUrl}api/payments/callback?orderId=${order._id}`;
    
    /**
     * Prepare payload for JWT signing as specified in the assessment document:
     * The JWT payload should only contain:
     * "school_id": "<string>",
     * "amount": "<string>",
     * "callback_url": "<string>"
     */
    const jwtPayload = {
      school_id: SCHOOL_ID,
      amount: parseFloat(amount).toFixed(2),
      callback_url: callbackUrl
    };

    /**
     * Generate JWT signature as specified in the assessment:
     * "To generate the sign, create a JWT with the following payload and sign it using the PG Secret Key"
     */
    const sign = jwt.sign(jwtPayload, PG_KEY, { algorithm: 'HS256' });

    // Build complete request body with only the required fields
    const requestBody = {
      school_id: SCHOOL_ID,
      amount: parseFloat(amount).toFixed(2),
      callback_url: callbackUrl,
      sign
    };

    // Log detailed request info
    console.log('Edviron API Request:', {
      url: `${EDVIRON_API_BASE}/create-collect-request`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PG_API_KEY.substring(0, 10)}...`
      },
      body: requestBody
    });

    /**
     * Send request to payment API as specified in the assessment:
     * "Forward data to the payment API using create-collect-request"
     * 
     * The endpoint used is: POST https://dev-vanilla.edviron.com/erp/create-collect-request
     * With headers:
     * - Content-Type: application/json
     * - Authorization: Bearer <API Key>
     */
    let response;
    try {
      response = await axios.post(`${EDVIRON_API_BASE}/create-collect-request`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PG_API_KEY}`,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
    } catch (apiError) {
      console.error('Payment API error:', apiError.message);
      
      // Check for specific API errors
      if (apiError.response) {
        console.error('API Error Response:', {
          status: apiError.response.status,
          data: apiError.response.data
        });
        
        // Handle specific error codes
        if (apiError.response.status === 401) {
          return res.status(401).json({ 
            error: 'Payment gateway authentication failed', 
            details: 'Invalid API credentials' 
          });
        }
        
        if (apiError.response.status === 400) {
          return res.status(400).json({ 
            error: 'Invalid payment request', 
            details: apiError.response.data?.message || 'Bad request to payment gateway' 
          });
        }
        
        if (apiError.response.status === 404) {
          return res.status(404).json({ 
            error: 'Payment gateway endpoint not found', 
            details: 'The payment gateway endpoint is not found' 
          });
        }
      }
      
      // For timeout or network errors
      if (apiError.code === 'ECONNABORTED' || !apiError.response) {
        return res.status(504).json({ 
          error: 'Payment gateway timeout', 
          details: 'The payment service is currently unavailable. Please try again later.' 
        });
      }
      
      // Generic error fallback
      return res.status(500).json({ 
        error: 'Payment gateway error', 
        details: apiError.message 
      });
    }

    // Log full API response
    console.log('Edviron API Full Response:', response.data);

    /**
     * Extract payment URL from response as specified in the assessment:
     * "Redirect the user to the payment page from the API response."
     * 
     * The response contains:
     * - collect_request_id: Unique order ID
     * - Collect_request_url: Payment URL
     * - sign: JWT token
     */
    const paymentUrl = response.data.collect_request_url || 
                       response.data.Collect_request_url || 
                       response.data.payment_url || 
                       response.data.redirect_url;

    // Validate response
    if (!paymentUrl) {
      console.error('No payment URL in response:', response.data);
      return res.status(500).json({ 
        error: 'Invalid payment gateway response', 
        details: 'Payment URL not found in response' 
      });
    }

    // Extract collect_request_id with fallbacks
    const collect_request_id = response.data.collect_request_id || 
                              response.data.id || 
                              reference_id;

    /**
     * Save payment status in OrderStatus model
     * This implements the requirement to track payment status
     */
    const orderStatus = new OrderStatus({
      collect_id: collect_request_id,
      order_id: order._id,
      order_amount: parseFloat(amount),
      status: 'pending',
      payment_details: JSON.stringify({
        reference_id,
        phone: phone_number || '',
        preferred_mode: phone_number ? 'UPI' : 'QR',
        created_at: new Date().toISOString()
      }),
      updated_at: new Date()
    });
    await orderStatus.save();

    // Return JSON with redirect_url and collect_request_url
    console.log('Returning JSON:', {
      redirect_url: paymentUrl,
      collect_request_url: paymentUrl,
      collect_request_id,
      order_id: order._id.toString()
    });
    
    /**
     * Return the payment URL to the frontend
     * This implements the requirement: "Redirect the user to the payment page from the API response."
     */
    res.json({ 
      redirect_url: paymentUrl, 
      collect_request_url: paymentUrl, 
      collect_request_id,
      order_id: order._id.toString(),
      status: 'success',
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error.message);
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    res.status(500).json({ 
      error: 'Failed to initiate payment',
      details: error.message,
      status: 'error'
    });
  }
};
