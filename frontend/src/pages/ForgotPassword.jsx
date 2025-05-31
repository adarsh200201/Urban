import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Import API URL from config to maintain consistency
  const { API_URL } = require('../config/apiConfig');
  
  const onSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Email validation
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/forgotpassword`, { email });
      
      if (response.data && response.data.success) {
        setIsSuccess(true);
        toast.success('Password reset email sent! Please check your inbox.');
      }
    } catch (error) {
      // Handle different error scenarios
      if (error.response && error.response.status === 404) {
        toast.error('No account found with this email address');
      } else {
        const message = 
          (error.response && 
            error.response.data && 
            error.response.data.message) ||
          error.message ||
          'Failed to send password reset email. Please try again.';
          
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <Link to="/login" className="flex items-center text-primary mb-6 hover:underline">
            <FaArrowLeft className="mr-2" /> Back to Login
          </Link>
          
          <h1 className="text-3xl font-bold text-center mb-6">Forgot Password</h1>
          
          {isSuccess ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                <p className="font-medium">Email Sent Successfully!</p>
                <p className="mt-2">We've sent password reset instructions to your email address.</p>
              </div>
              
              <p className="mb-4">Please check your inbox and follow the link to reset your password.</p>
              <p className="text-sm text-gray-600 mt-4">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    onSubmit({ preventDefault: () => {} });
                  }}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-6 text-center">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <form onSubmit={onSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <FaEnvelope />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input pl-10"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full btn btn-primary py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" /> Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Remember your password?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
