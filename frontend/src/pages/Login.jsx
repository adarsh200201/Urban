import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaSpinner } from 'react-icons/fa';
import { login, reset } from '../features/auth/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { email, password } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  
  // Get any redirect URL from query params
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect');
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    // Redirect when logged in, checking for redirect parameters
    if (isSuccess || user) {
      // Check if we need to redirect to payment page
      if (redirectPath === 'payment') {
        // Get saved payment parameters from session storage
        const paymentParams = sessionStorage.getItem('paymentRedirectParams') || '';
        console.log('Redirecting to payment page with params:', paymentParams);
        navigate(`/payment${paymentParams}`);
      } else {
        // Default redirect to home page
        navigate('/');
      }
    }
    
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch, redirectPath]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    const userData = {
      email,
      password
    };
    
    dispatch(login(userData));
  };
  
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
          
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaUser />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  className="form-input pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaLock />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  className="form-input pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full btn btn-primary py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" /> Loading...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center font-medium text-gray-700 mb-2">Are you a driver?</p>
            <Link 
              to="/driver/login" 
              className="block w-full text-center py-2 px-4 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors"
            >
              Go to Driver Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
