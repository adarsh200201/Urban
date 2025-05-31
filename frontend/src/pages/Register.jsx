import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { register, reset } from '../features/auth/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  // Validation states
  const [validationState, setValidationState] = useState({
    name: { valid: false, message: '', touched: false },
    email: { valid: false, message: '', touched: false },
    phone: { valid: false, message: '', touched: false },
    password: { valid: false, message: '', touched: false, strength: 0 },
    confirmPassword: { valid: false, message: '', touched: false }
  });

  const { name, email, phone, password, confirmPassword } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  
  // Form validity check
  const isFormValid = Object.values(validationState).every(field => field.valid);
  
  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return { valid: false, message: 'Name is required' };
    }
    if (name.trim().length < 3) {
      return { valid: false, message: 'Name must be at least 3 characters' };
    }
    return { valid: true, message: 'Name is valid' };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      return { valid: false, message: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true, message: 'Email is valid' };
  };

  const validatePhone = (phone) => {
    if (!phone) {
      return { valid: false, message: 'Phone number is required' };
    }
    if (!/^\d{10}$/.test(phone)) {
      return { valid: false, message: 'Phone must be a 10-digit number' };
    }
    return { valid: true, message: 'Phone number is valid' };
  };

  const validatePassword = (password) => {
    let strength = 0;
    const messages = [];
    
    if (!password) {
      return { valid: false, message: 'Password is required', strength: 0 };
    }
    
    if (password.length < 6) {
      messages.push('at least 6 characters');
    } else {
      strength += 1;
    }
    
    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      messages.push('at least one uppercase letter');
    }
    
    if (/[0-9]/.test(password)) {
      strength += 1;
    } else {
      messages.push('at least one number');
    }
    
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    } else {
      messages.push('at least one special character');
    }
    
    let messageText = '';
    if (messages.length > 0) {
      messageText = `Password should have ${messages.join(', ')}`;
    } else {
      messageText = 'Strong password';
    }
    
    return { 
      valid: strength >= 3, 
      message: messageText, 
      strength 
    };
  };

  const validateConfirmPassword = (confirmPass, originalPass) => {
    if (!confirmPass) {
      return { valid: false, message: 'Please confirm your password' };
    }
    if (confirmPass !== originalPass) {
      return { valid: false, message: 'Passwords do not match' };
    }
    return { valid: true, message: 'Passwords match' };
  };

  useEffect(() => {
    if (isError) {
      // Check for email already exists error
      if (message.includes('email already exists')) {
        toast.error(
          <div>
            This email is already registered. Please use a different email or 
            <Link to="/login" className="font-bold underline">login here</Link>.
          </div>, 
          { autoClose: 8000 }
        );
        
        // Update validation state for email
        setValidationState(prev => ({
          ...prev,
          email: { ...prev.email, valid: false, message: 'Email already in use' }
        }));
      } 
      // Check for phone already exists error
      else if (message.includes('phone number already exists')) {
        toast.error(
          <div>
            This phone number is already registered. Please use a different number or 
            <Link to="/login" className="font-bold underline">login here</Link>.
          </div>, 
          { autoClose: 8000 }
        );
        
        // Update validation state for phone
        setValidationState(prev => ({
          ...prev,
          phone: { ...prev.phone, valid: false, message: 'Phone number already in use' }
        }));
      } else {
        toast.error(message);
      }
    }
    
    // Redirect when logged in
    if (isSuccess || user) {
      navigate('/');
    }
    
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);
  
  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
    
    // Validate in real-time
    let validationResult;
    switch (name) {
      case 'name':
        validationResult = validateName(value);
        break;
      case 'email':
        validationResult = validateEmail(value);
        break;
      case 'phone':
        validationResult = validatePhone(value);
        break;
      case 'password':
        validationResult = validatePassword(value);
        // Also update confirmPassword validation when password changes
        if (confirmPassword) {
          const confirmResult = validateConfirmPassword(confirmPassword, value);
          setValidationState(prev => ({
            ...prev,
            confirmPassword: { ...confirmResult, touched: prev.confirmPassword.touched }
          }));
        }
        break;
      case 'confirmPassword':
        validationResult = validateConfirmPassword(value, password);
        break;
      default:
        return;
    }
    
    setValidationState(prev => ({
      ...prev,
      [name]: { ...validationResult, touched: true }
    }));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    // Touch all fields to show validation errors
    const touchedValidation = {};
    Object.keys(validationState).forEach(field => {
      // Revalidate all fields
      let validationResult;
      switch(field) {
        case 'name':
          validationResult = validateName(formData.name);
          break;
        case 'email':
          validationResult = validateEmail(formData.email);
          break;
        case 'phone':
          validationResult = validatePhone(formData.phone);
          break;
        case 'password':
          validationResult = validatePassword(formData.password);
          break;
        case 'confirmPassword':
          validationResult = validateConfirmPassword(formData.confirmPassword, formData.password);
          break;
        default:
          validationResult = { valid: false, message: '' };
      }
      
      touchedValidation[field] = { ...validationResult, touched: true };
    });
    
    setValidationState(touchedValidation);
    
    // Check if form is valid before submitting
    if (!Object.values(touchedValidation).every(field => field.valid)) {
      toast.error('Please correct the errors in the form');
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
  
  // Helper function to render validation feedback
  const renderFeedback = (field) => {
    const { valid, message, touched } = validationState[field];
    
    if (!touched) return null;
    
    if (valid) {
      return (
        <div className="text-green-600 text-sm mt-1 flex items-center">
          <FaCheckCircle className="mr-1" /> {message}
        </div>
      );
    } else {
      return (
        <div className="text-red-600 text-sm mt-1 flex items-center">
          <FaExclamationTriangle className="mr-1" /> {message}
        </div>
      );
    }
  };
  
  // Helper function for input class based on validation state
  const getInputClass = (field) => {
    const baseClass = "form-input pl-10";
    const { valid, touched } = validationState[field];
    
    if (!touched) return baseClass;
    return valid ? `${baseClass} border-green-500` : `${baseClass} border-red-500`;
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
                  onBlur={() => setValidationState(prev => ({ ...prev, name: { ...prev.name, touched: true } }))}
                  className={getInputClass('name')}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {renderFeedback('name')}
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
                  onBlur={() => setValidationState(prev => ({ ...prev, email: { ...prev.email, touched: true } }))}
                  className={getInputClass('email')}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {renderFeedback('email')}
            </div>
            
            <div className="mb-4">
              <label htmlFor="phone" className="block text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-500">
                  <FaPhone />
                </div>
                <div className="flex">
                  <div className="bg-gray-100 flex items-center px-3 border border-r-0 rounded-l">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={onChange}
                    onBlur={() => setValidationState(prev => ({ ...prev, phone: { ...prev.phone, touched: true } }))}
                    className={`${getInputClass('phone')} rounded-l-none`}
                    placeholder="10-digit number"
                    required
                    maxLength="10"
                  />
                </div>
              </div>
              {renderFeedback('phone')}
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
                  onBlur={() => setValidationState(prev => ({ ...prev, password: { ...prev.password, touched: true } }))}
                  className={getInputClass('password')}
                  placeholder="Create a password"
                  required
                  minLength="6"
                />
              </div>
              {renderFeedback('password')}
              
              {/* Password strength indicator */}
              {validationState.password.touched && password && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    <div className={`h-1 flex-1 rounded ${validationState.password.strength >= 1 ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded ${validationState.password.strength >= 2 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded ${validationState.password.strength >= 3 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded ${validationState.password.strength >= 4 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {validationState.password.strength === 0 && 'Very weak'}
                    {validationState.password.strength === 1 && 'Weak'}
                    {validationState.password.strength === 2 && 'Fair'}
                    {validationState.password.strength === 3 && 'Good'}
                    {validationState.password.strength === 4 && 'Strong'}
                  </div>
                </div>
              )}
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
                  onBlur={() => setValidationState(prev => ({ ...prev, confirmPassword: { ...prev.confirmPassword, touched: true } }))}
                  className={getInputClass('confirmPassword')}
                  placeholder="Confirm your password"
                  required
                  minLength="6"
                />
              </div>
              {renderFeedback('confirmPassword')}
            </div>
            
            <button
              type="submit"
              className={`w-full py-3 rounded-md transition-colors ${isFormValid ? 'btn btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" /> Loading...
                </span>
              ) : (
                'Register'
              )}
            </button>
            
            {/* Form validation status summary */}
            {Object.values(validationState).some(field => field.touched && !field.valid) && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <p className="font-medium">Please fix the following errors:</p>
                <ul className="list-disc list-inside mt-1">
                  {validationState.name.touched && !validationState.name.valid && (
                    <li>{validationState.name.message}</li>
                  )}
                  {validationState.email.touched && !validationState.email.valid && (
                    <li>{validationState.email.message}</li>
                  )}
                  {validationState.phone.touched && !validationState.phone.valid && (
                    <li>{validationState.phone.message}</li>
                  )}
                  {validationState.password.touched && !validationState.password.valid && (
                    <li>{validationState.password.message}</li>
                  )}
                  {validationState.confirmPassword.touched && !validationState.confirmPassword.valid && (
                    <li>{validationState.confirmPassword.message}</li>
                  )}
                </ul>
              </div>
            )}
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
