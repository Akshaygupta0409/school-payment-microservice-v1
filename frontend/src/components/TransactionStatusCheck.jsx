import React, { useState } from 'react';
import axios from 'axios';

const TransactionStatusCheck = () => {
  const [transactionId, setTransactionId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`/api/transactions/${transactionId}`);
      setStatus(res.data.status);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch status');
      setStatus('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Check Transaction Status</h2>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Transaction ID"
          className="flex-1 p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Check
        </button>
      </form>
      {status && <p className="mt-4">Status: {status}</p>}
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
};

export default TransactionStatusCheck;
