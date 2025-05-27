import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * ClearStorage component - utility page to clear browser storage data
 * Useful for troubleshooting and resetting the application state
 */
const ClearStorage = () => {
  const [cleared, setCleared] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear all localStorage items
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies (not HttpOnly cookies)
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      toast.success('Storage cleared successfully! Redirecting to home page...');
      console.log('All storage cleared successfully');
      setCleared(true);
      
      // Redirect after a short delay to let the user see the message
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error clearing storage:', error);
      toast.error('There was an error clearing storage');
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Storage Clearing {cleared ? 'Complete' : 'In Progress...'}</h1>
        
        {cleared ? (
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-4">All application data has been cleared from your browser.</p>
            <p className="text-gray-800">You will be redirected to the home page in a moment...</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-600">Clearing all UrbanRide application data from your browser...</p>
          </div>
        )}
        
        <div className="mt-6">
          <p className="text-sm text-gray-500">This utility clears all locally stored data including:</p>
          <ul className="text-sm text-gray-500 list-disc list-inside mt-2">
            <li>Login information</li>
            <li>User preferences</li>
            <li>Booking data</li>
            <li>Application settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClearStorage;
