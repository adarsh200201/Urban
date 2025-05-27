import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaSpinner } from 'react-icons/fa';
import { register, reset } from '../features/auth/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const { name, email, phone, password, confirmPassword } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    // Redirect when logged in
    if (isSuccess || user) {
      navigate('/');
    }
    
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    const userData = {
      name,
      email,
      phone,
      password
    };
    
    dispatch(register(userData));
  };
  
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Register</h1>
          
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaUser />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  className="form-input pl-10"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaEnvelope />
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
            
            <div className="mb-4">
              <label htmlFor="phone" className="block text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaPhone />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={onChange}
                  className="form-input pl-10"
                  placeholder="Enter your 10-digit phone number"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
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
                  placeholder="Create a password"
                  required
                  minLength="6"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaLock />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  className="form-input pl-10"
                  placeholder="Confirm your password"
                  required
                  minLength="6"
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
                  <FaSpinner className="animate-spin mr-2" /> Loading...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center font-medium text-gray-700 mb-2">Are you a driver?</p>
            <p className="text-center text-sm text-gray-600 mb-2">Join our team of professional drivers</p>
            <Link 
              to="/driver/register" 
              className="block w-full text-center py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Register as a Driver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
