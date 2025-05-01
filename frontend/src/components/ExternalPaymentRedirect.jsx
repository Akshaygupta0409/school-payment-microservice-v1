import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NeonGridBackground from './NeonGridBackground';

// Create a debug logger function that logs to console with timestamp
const debugLog = (message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [PAYMENT-REDIRECT-DEBUG] ${message}`, data || '');
};

const ExternalPaymentRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    // Add initial animation
    setAnimationClass('opacity-0 translate-y-4');
    const timer = setTimeout(() => {
      setAnimationClass('opacity-100 translate-y-0');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Log the component mount
    debugLog('ExternalPaymentRedirect component mounted');
    
    // Log the full URL and all available information
    debugLog('Current URL:', window.location.href);
    debugLog('Location object:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
      key: location.key
    });
    
    // Log document referrer if available
    if (document.referrer) {
      debugLog('Referred from:', document.referrer);
    }

    // Check if this is a payment failure URL from the external gateway
    const isPaymentFailureUrl = 
      window.location.href.includes('dev.pg.edviron.com/payment-failure') ||
      window.location.href.includes('pg.edviron.com/payment-failure');
    
    debugLog('Is payment failure URL?', isPaymentFailureUrl);

    // Parse all query parameters
    const searchParams = new URLSearchParams(location.search);
    const queryParams = {};
    
    // Get all query parameters
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }
    
    debugLog('All query parameters:', queryParams);

    // Specific parameters of interest
    const collectId = searchParams.get('collect_id');
    const amount = searchParams.get('amount');

    // Log the parsed parameters
    if (collectId || amount) {
      debugLog('Payment redirect parameters:', { collectId, amount });
    }

    // Log navigation intent
    debugLog('Redirecting to dashboard with payment failure state');

    // Set a timeout to ensure logs are visible before redirect
    setTimeout(() => {
      // Always redirect to dashboard with payment failure state
      navigate('/dashboard', { 
        state: { 
          paymentProcessed: true,
          status: 'FAILED',
          statusMessage: 'Your payment was not completed. Please try again or contact support.',
          redirectSource: window.location.href,
          redirectParams: queryParams
        } 
      });
      
      debugLog('Navigation to dashboard triggered');
    }, 3000); // Short delay to ensure logs are visible

    // Cleanup function
    return () => {
      debugLog('ExternalPaymentRedirect component unmounting');
    };
  }, [navigate, location]);

  return (
    <div className="relative min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4 overflow-hidden">
      <NeonGridBackground />
      
      <div className={`relative z-10 max-w-md w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-all duration-500 ease-in-out transform ${animationClass}`}>
        <h2 className="text-2xl font-bold text-center text-gray-200">Payment Processing</h2>
        
        <div className="text-center text-gray-400 bg-black-hover/30 rounded-lg p-4 border border-black-border">
          <p className="text-sm mb-2">URL: {window.location.href}</p>
          {location.search && <p className="text-xs truncate">Parameters: {location.search}</p>}
        </div>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
          <div className="text-gray-300">Redirecting to dashboard...</div>
        </div>
      </div>
    </div>
  );
};

export default ExternalPaymentRedirect;
