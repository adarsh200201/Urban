import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaToggleOn, FaToggleOff, FaAngleDown } from 'react-icons/fa';
import { logoutDriver } from '../features/driver/driverAuthSlice';
import { updateDriverAvailability } from '../features/driver/driverSlice';
import { FaHome, FaCarAlt, FaUserAlt, FaSignOutAlt, FaHistory } from 'react-icons/fa';

const DriverLayout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: driverUser, isAuthenticated } = useSelector((state) => state.driverAuth);
  const { driver: driverData } = useSelector((state) => state.driver);
  
  // Check driver authentication exactly once when the layout mounts
  useEffect(() => {
    // Skip authentication check if we're on the login or register page
    if (location.pathname === '/driver/login' || location.pathname === '/driver/register') {
      return;
    }
    
    // ONLY redirect if there's absolutely no authentication data
    if (driverUser === null && !hasNavigated.current) {
      console.log('Driver authentication completely missing, redirecting to login');
      hasNavigated.current = true;
      navigate('/driver/login');
    }
    
    // We only want this to run once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Function to toggle driver availability status
  const toggleAvailability = async () => {
    setLoading(true);
    dispatch(updateDriverAvailability({
      driverId: driverData._id,
      isAvailable: !driverData.isAvailable
    }));
    setLoading(false);
  };

  const driverName = driverUser?.name || 'Driver';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    dispatch(logoutDriver());
    hasNavigated.current = true;
    navigate('/driver/login');
  };

  // All driver pages now use the global DriverHeader from App.js
  
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="container mx-auto px-4 py-2">
            <ul>
              <li>
                <Link 
                  to="/driver/dashboard" 
                  className={`block py-2 ${location.pathname === '/driver/dashboard' ? 'text-primary' : 'text-gray-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaHome className="inline mr-2" /> Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/driver/current-ride" 
                  className={`block py-2 ${location.pathname === '/driver/current-ride' ? 'text-primary' : 'text-gray-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaCarAlt className="inline mr-2" /> Current Ride
                </Link>
              </li>
              <li>
                <Link 
                  to="/driver/ride-history" 
                  className={`block py-2 ${location.pathname === '/driver/ride-history' ? 'text-primary' : 'text-gray-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaHistory className="inline mr-2" /> Ride History
                </Link>
              </li>
              <li>
                <Link 
                  to="/driver/profile" 
                  className={`block py-2 ${location.pathname === '/driver/profile' ? 'text-primary' : 'text-gray-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUserAlt className="inline mr-2" /> Profile
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-gray-600"
                >
                  <FaSignOutAlt className="inline mr-2" /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="hidden md:block w-64 bg-white shadow-md">
          <div className="p-2">
            <ul className="space-y-0.5">
              <li>
                <Link 
                  to="/driver/dashboard" 
                  className={`flex items-center p-1.5 rounded-lg ${
                    location.pathname === '/driver/dashboard' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaHome className="mr-2" /> Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/driver/current-ride" 
                  className={`flex items-center p-1.5 rounded-lg ${
                    location.pathname === '/driver/current-ride' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaCarAlt className="mr-2" /> Current Ride
                </Link>
              </li>
              <li>
                <Link 
                  to="/driver/ride-history" 
                  className={`flex items-center p-1.5 rounded-lg ${
                    location.pathname === '/driver/ride-history' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaHistory className="mr-2" /> Ride History
                </Link>
              </li>
              <li>
                <Link 
                  to="/driver/profile" 
                  className={`flex items-center p-1.5 rounded-lg ${
                    location.pathname === '/driver/profile' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaUserAlt className="mr-2" /> Profile
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Content - Add top padding to accommodate the global header */}
        <div className="flex-1 p-4 md:p-6 pt-16 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DriverLayout;
