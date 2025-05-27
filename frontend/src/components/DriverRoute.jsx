import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const DriverRoute = ({ children }) => {
  const { driver, isLoading } = useSelector((state) => state.driverAuth);
  
  // Very minimal protection - only redirect if authentication is completely missing
  // and we're not currently loading
  if (!driver && !isLoading) {
    return <Navigate to="/driver/login" />;
  }
  
  // In all other cases, just render the children
  return children;
};

export default DriverRoute;
