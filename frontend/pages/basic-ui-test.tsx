import React, { useState } from 'react';

export default function BasicUITest() {
  const [message, setMessage] = useState('');

  const showBasicToast = () => {
    setMessage('✅ Basic toast notification works!');
    setTimeout(() => setMessage(''), 3000);
  };

  const showBasicAlert = () => {
    if (window.confirm('This is a basic confirmation. Continue?')) {
      setMessage('✅ Confirmed!');
    } else {
      setMessage('❌ Cancelled');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Basic UI Test</h1>
      
      {/* Simple message display */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}
      
      {/* Basic buttons */}
      <div className="space-x-4 mb-8">
        <button 
          onClick={showBasicToast}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
        >
          Test Basic Toast
        </button>
        <button 
          onClick={showBasicAlert}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
        >
          Test Basic Confirmation
        </button>
      </div>

      {/* Troubleshooting info */}
      <div className="bg-gray-100 p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Info:</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Server:</strong> http://localhost:3001</li>
          <li><strong>React Version:</strong> {typeof React !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}</li>
          <li><strong>CSS Framework:</strong> {typeof window !== 'undefined' ? '✅ Browser ready' : '❌ SSR'}</li>
          <li><strong>This page:</strong> /basic-ui-test</li>
        </ul>
        
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-yellow-700">
            <strong>If you see this page properly styled, the basic setup is working.</strong>
            <br />
            Issues might be with advanced animations or complex components.
          </p>
        </div>
      </div>
    </div>
  );
}