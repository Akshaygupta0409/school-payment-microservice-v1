import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from './utils/axiosConfig.js';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import CreatePayment from './components/CreatePayment.jsx';
import TransactionStatusCheck from './components/TransactionStatusCheck.jsx';
import ExternalPaymentRedirect from './components/ExternalPaymentRedirect.jsx';

// Global auth context
const AuthContext = React.createContext({
  isAuthenticated: false,
  handleLogout: () => {}
});

// Logout Component
const Logout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent multiple logout attempts
    if (!isLoggingOut) return;
    
    const performLogout = async () => {
      try {
        // Optional: Call backend logout endpoint if exists
        await axios.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear authentication token and user data
        localStorage.removeItem('token');
        
        // Set logout complete
        setIsLoggingOut(false);
        
        // Redirect to login page
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [navigate, isLoggingOut]);

  return <div className="flex items-center justify-center min-h-screen bg-dark-bg">
    <div className="text-gray-300">{isLoggingOut ? 'Logging out...' : 'Redirecting to login...'}</div>
  </div>;
};

// Debug logger for payment callback
const debugLog = (message, data) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [PAYMENT-CALLBACK-DEBUG] ${message}`, data);
};

// Callback Component to handle payment redirect
const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processingStatus, setProcessingStatus] = useState('Processing your payment...');
  const [statusDetails, setStatusDetails] = useState({
    status: '',
    orderId: '',
    message: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debug logs on mount
    debugLog('PaymentCallback mounted', { pathname: location.pathname, search: location.search });
    debugLog('Location object', location);

    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const collectRequestId = searchParams.get('EdvironCollectRequestId');
    const errorMessage = searchParams.get('error') || searchParams.get('errorMessage');

    debugLog('Payment Callback Details', { orderId, status, collectRequestId, errorMessage });

    // Detect payment failure from URL or error message
    const isPaymentFailed = 
      status?.toUpperCase() === 'FAILED' || 
      status?.toUpperCase() === 'FAILURE' || 
      status?.toLowerCase().includes('fail') ||
      errorMessage || 
      location.pathname.includes('payment-failed') ||
      document.title.includes('Failed');
    debugLog('isPaymentFailed', isPaymentFailed);

    // Set status details for UI feedback
    let statusMessage = '';
    let statusClass = '';
    let finalStatus = status;
    
    if (isPaymentFailed) {
      finalStatus = 'FAILED';
      statusMessage = errorMessage || 'Your payment failed. Please try again.';
      statusClass = 'text-red-400';
    } else if (status) {
      switch(status.toUpperCase()) {
        case 'SUCCESS':
          statusMessage = 'Your payment was successful!';
          statusClass = 'text-green-400';
          break;
        case 'FAILED':
          statusMessage = 'Your payment failed. Please try again.';
          statusClass = 'text-red-400';
          break;
        case 'CANCELLED':
          statusMessage = 'Your payment was cancelled.';
          statusClass = 'text-yellow-400';
          break;
        default:
          statusMessage = 'Payment status: ' + status;
          statusClass = 'text-gray-300';
      }
    }
    
    setStatusDetails({
      status: finalStatus || 'UNKNOWN',
      orderId,
      message: statusMessage,
      class: statusClass
    });
    
    // Update status message for the processing screen
    setProcessingStatus(statusMessage || 'Processing payment...');

    // Check the transaction details from the API after a delay
    const checkTransactionDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        debugLog('Calling transaction-status API', `/payments/transaction-status/${orderId}`);
        // Call the backend API to get transaction details
        const response = await axios.get(`/payments/transaction-status/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        debugLog('Transaction details from API', response.data);
        
        // If the API returns a different status, use that instead
        if (response.data && response.data.status) {
          const apiStatus = response.data.status.toUpperCase();
          if (apiStatus === 'FAILED' || apiStatus === 'CANCELLED') {
            finalStatus = apiStatus;
            setStatusDetails(prev => ({
              ...prev,
              status: apiStatus,
              message: apiStatus === 'FAILED' ? 'Your payment failed. Please try again.' : 'Your payment was cancelled.'
            }));
          }
        }
      } catch (error) {
        debugLog('Error fetching transaction details', error);
        // If we can't get transaction details and no status, assume failed
        if (!status) {
          finalStatus = 'FAILED';
          setStatusDetails(prev => ({
            ...prev,
            status: 'FAILED',
            message: 'Unable to determine payment status. Please check your dashboard.'
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Check transaction details immediately
    checkTransactionDetails();

  }, [navigate, location]);

  // Function to go back to dashboard
  const goToDashboard = () => {
    navigate('/dashboard', { 
      state: { 
        paymentProcessed: true,
        orderId: statusDetails.orderId, 
        status: statusDetails.status,
        statusMessage: statusDetails.message
      } 
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg px-4">
      <div className="max-w-md w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-200">Payment Status</h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
            <div className="text-gray-300">{processingStatus}</div>
          </div>
        ) : (
          <div className="text-center">
            {/* Status Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full mb-6 ${statusDetails.status === 'SUCCESS' || statusDetails.status === 'success' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
              statusDetails.status === 'FAILED' || statusDetails.status === 'failed' ? 'bg-red-600/20 text-red-400 border border-red-500/30' :
              statusDetails.status === 'CANCELLED' || statusDetails.status === 'cancelled' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
              'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}>
              <span className="mr-2">
                {statusDetails.status === 'SUCCESS' || statusDetails.status === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : statusDetails.status === 'FAILED' || statusDetails.status === 'failed' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : statusDetails.status === 'CANCELLED' || statusDetails.status === 'cancelled' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              <span className="font-medium capitalize">
                {statusDetails.status?.toLowerCase() || 'Unknown'}
              </span>
            </div>
            
            {/* Status Message */}
            <div className={`text-xl font-semibold my-4 ${statusDetails.class}`}>
              {statusDetails.message}
            </div>
            
            {/* Transaction Details Card */}
            <div className="bg-black-grid/30 border border-black-border rounded-lg p-4 mb-6 text-left">
              <h3 className="text-gray-300 font-medium mb-2 text-center">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                {statusDetails.orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-gray-300 font-mono">{statusDetails.orderId}</span>
                  </div>
                )}
                {location.search?.includes('EdvironCollectRequestId') && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collection ID:</span>
                    <span className="text-gray-300 font-mono">
                      {new URLSearchParams(location.search).get('EdvironCollectRequestId')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-300">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Dashboard Button */}
            <button
              onClick={goToDashboard}
              className="mt-6 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    // Check token validity
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return token ? children : <Navigate to="/login" replace />;
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Centralized logout function
  const handleLogout = () => {
    navigate('/logout');
  };

  // Navigation logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuth = !!token;
    
    // If authenticated, redirect from login/register pages
    if (isAuth) {
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/dashboard');
      }
    } 
    // If not authenticated, redirect to login except on register, logout or payment-callback pages
    else if (location.pathname !== '/register' && 
             location.pathname !== '/logout' && 
             !location.pathname.startsWith('/payment-callback')) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, handleLogout }}>
      <div className="min-h-screen bg-dark-bg">
        {isAuthenticated && location.pathname !== '/logout' && 
         !location.pathname.startsWith('/payment-callback') && (
          <></>
        )}
        
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-payment" 
            element={
              <ProtectedRoute>
                <CreatePayment />
              </ProtectedRoute>
            } 
          />
          
          {/* Transaction Status Check Route */}
          <Route 
            path="/transaction-status" 
            element={
              <ProtectedRoute>
                <TransactionStatusCheck />
              </ProtectedRoute>
            } 
          />
          
          {/* Logout Route */}
          <Route 
            path="/logout" 
            element={<Logout />} 
          />
          
          {/* Payment Callback Route */}
          <Route 
            path="/payment-callback" 
            element={<PaymentCallback />} 
          />
          
          {/* External Payment Gateway Redirect Routes */}
          <Route 
            path="/payment-failure" 
            element={<ExternalPaymentRedirect />} 
          />
          <Route 
            path="/payment-success" 
            element={<ExternalPaymentRedirect />} 
          />
          
          {/* Default Redirect */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

// Root component wrapping App with Router
export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

// Export context for use in components
export { AuthContext };
