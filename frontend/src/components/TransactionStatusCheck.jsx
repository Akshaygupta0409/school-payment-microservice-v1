import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig.js';
import { useNavigate } from 'react-router-dom';
import NeonGridBackground from './NeonGridBackground';

const TransactionStatusCheck = () => {
  const [transactionId, setTransactionId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Add initial animation
    setAnimationClass('opacity-0 translate-y-4');
    const timer = setTimeout(() => {
      setAnimationClass('opacity-100 translate-y-0');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Updated endpoint to match backend API structure
      const res = await axios.get(`/payments/transaction-status/${transactionId}`);
      setStatus(res.data.status);
      setError('');
    } catch (err) {
      console.error('Error fetching transaction status:', err);
      setError(err.response?.data?.message || 'Failed to fetch status');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      <NeonGridBackground />
      
      <div 
        className={`relative z-10 max-w-md w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-all duration-500 ease-in-out transform ${animationClass}`}
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-200 mb-2">
            Check Transaction Status
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter transaction ID to verify payment
          </p>
        </div>
        
        {error && (
          <div className="bg-black-hover border border-black-border text-gray-400 p-3 rounded-lg animate-shake">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="transactionId" className="block text-sm font-medium text-gray-400">
              Transaction ID
            </label>
            <div className="mt-1">
              <input
                id="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
                placeholder="Enter transaction ID"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading 
                  ? 'bg-black-hover cursor-not-allowed' 
                  : 'bg-black-border hover:bg-black-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-grid'
                } transition-all duration-300 ease-in-out`}
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </form>
        
        {status && (
          <div className="mt-6 p-4 bg-black-hover/40 rounded-lg border border-black-border">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status.toLowerCase() === 'success' ? 'bg-green-500' :
                status.toLowerCase() === 'failed' ? 'bg-red-500' :
                status.toLowerCase() === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <h3 className="text-lg font-medium text-gray-200">Status: {status}</h3>
            </div>
            <p className="text-sm text-gray-400">
              Transaction ID: {transactionId}
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex justify-center py-2 px-4 border border-black-border rounded-md shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-black-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-grid transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionStatusCheck;
