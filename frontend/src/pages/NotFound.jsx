import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you are looking for might have been removed or is temporarily unavailable.</p>
        <Link to="/" className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
