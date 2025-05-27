import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaToggleOn, FaToggleOff, FaUserAlt, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { logoutDriver } from '../features/driver/driverAuthSlice';
import { updateDriverAvailability, getDriverProfile } from '../features/driver/driverSlice';

const DriverHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Get driver data from both auth and profile state
  const { driver: driverAuth } = useSelector((state) => state.driverAuth);
  const { driver: driverData } = useSelector((state) => state.driver);
  
  // Ensure driver profile is loaded
  useEffect(() => {
    if (driverAuth && !driverData) {
      const driverId = driverAuth._id || (driverAuth.driver && driverAuth.driver._id);
      if (driverId) {
        dispatch(getDriverProfile(driverId));
      }
    }
  }, [driverAuth, driverData, dispatch]);
  
  // Get the driver name from any available source
  const driverName = driverData?.name || driverAuth?.name || driverAuth?.driver?.name || 'Driver';
  
  // Function to toggle driver availability status
  const toggleAvailability = async () => {
    if (!driverData || !driverData._id) return;
    
    setLoading(true);
    dispatch(updateDriverAvailability({
      driverId: driverData._id,
      isAvailable: !driverData.isAvailable
    }));
    setLoading(false);
  };

  const handleLogout = () => {
    dispatch(logoutDriver());
    navigate('/driver/login');
  };

  return (
    <header className="bg-gradient-to-r from-primary to-secondary py-4 text-white shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-2xl font-bold mr-2">
            <span className="text-white">Driver</span>
            <span className="text-yellow-300">Dashboard</span>
          </div>
          {driverData && driverData.isApproved && (
            <div className="ml-4 flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <span className="mr-2 text-sm font-medium">
                {driverData.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              <button 
                onClick={toggleAvailability}
                disabled={loading}
                className="text-xl focus:outline-none transition-colors"
                aria-label={driverData.isAvailable ? "Set unavailable" : "Set available"}
              >
                {driverData.isAvailable ? (
                  <FaToggleOn className="text-green-300" />
                ) : (
                  <FaToggleOff className="text-gray-300" />
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/driver/current-ride" className="hover:text-yellow-300 transition-colors">
              Current Ride
            </Link>
            <Link to="/driver/ride-history" className="hover:text-yellow-300 transition-colors">
              Ride History
            </Link>
            <div className="relative group">
              <button className="flex items-center space-x-2 hover:text-yellow-300 transition-colors">
                <FaUserAlt className="mr-1" />
                <span>{driverName}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaSignOutAlt className="inline mr-2" /> Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute left-0 right-0 z-50 shadow-md">
          <div className="px-4 py-2">
            <Link 
              to="/driver/current-ride" 
              className="block py-2 text-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Current Ride
            </Link>
            <Link 
              to="/driver/ride-history" 
              className="block py-2 text-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Ride History
            </Link>
            <button 
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-gray-700"
            >
              <FaSignOutAlt className="inline mr-2" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default DriverHeader;
