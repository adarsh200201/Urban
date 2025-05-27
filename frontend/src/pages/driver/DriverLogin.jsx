import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTaxi, FaLock, FaUser } from 'react-icons/fa';
import { loginDriver, reset } from '../../features/driver/driverAuthSlice';

const DriverLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { driver, isLoading, isError, isSuccess, isPendingApproval, message } = useSelector(
    (state) => state.driverAuth
  );

  // Use a ref to track if we've already navigated
  const hasNavigated = React.useRef(false);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isPendingApproval) {
      toast.warning(message);
    }

    // Only navigate if we haven't already and we have a successful login
    if ((isSuccess || driver) && !hasNavigated.current) {
      hasNavigated.current = true; // Set flag to prevent multiple navigations
      // Use setTimeout to slightly delay navigation and avoid React throttling warnings
      const timer = setTimeout(() => {
        navigate('/driver/dashboard');
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [isError, isSuccess, isPendingApproval, message, navigate, driver]);
  
  // Separate useEffect for resetting state to avoid dependency array issues
  useEffect(() => {
    // Only reset non-pending approval states to keep the pending message visible
    if (!isPendingApproval) {
      dispatch(reset());
    }
  }, [dispatch, isPendingApproval]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
    };

    dispatch(loginDriver(userData));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-container">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center">
            <FaTaxi className="text-white text-3xl" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Driver Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Log in to your driver account to manage your rides
          </p>
        </div>
        
        {isPendingApproval && (
          <div className="my-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Account Pending Approval</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your driver account is currently pending administrator approval. Once approved, you'll be able to log in and start accepting rides. This usually takes 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={onChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={onChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <div className="mb-4 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-800 mb-1">How to become a driver</h3>
            <p className="text-sm text-blue-700">
              You can register as a driver online by filling out our application form. Simply submit your details and upload the required documents. Our team will review your application and activate your account once verified.
            </p>
            <div className="mt-3">
              <Link 
                to="/driver/register" 
                className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Register as a Driver
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-2">
              Not a driver? Return to regular login
            </p>
            <Link to="/login" className="inline-block py-2 px-4 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors">
              Back to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
