import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaCar, FaIdCard, FaCalendarAlt, FaSpinner, FaTaxi, FaExclamationCircle } from 'react-icons/fa';
import { registerDriver } from '../../features/driver/driverAuthSlice';
import { useDocumentRequirements } from '../../context/DocumentRequirementsContext';

const DriverRegister = () => {
  const [cabTypes, setCabTypes] = useState([]);
  const [loadingCabTypes, setLoadingCabTypes] = useState(false);
  const { documentConfig, loading: loadingDocConfig, error: docConfigError } = useDocumentRequirements();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleModel: '',
    vehicleNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: '',
    // Documents
    aadhaarCard: null,
    driversLicense: null,
    driverPhoto: null,
    vehicleRC: null,
    insuranceCertificate: null,
    pucCertificate: null,
    fitnessCertificate: null,
    routePermit: null,
    vehiclePhotoFront: null,
    vehiclePhotoBack: null
  });
  
  const { 
    name, 
    email, 
    phone, 
    password, 
    confirmPassword, 
    vehicleModel, 
    vehicleNumber, 
    vehicleType,
    licenseNumber, 
    licenseExpiry 
  } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.driverAuth
  );
  
  // Fetch cab types when component mounts
  useEffect(() => {
    const fetchCabTypes = async () => {
      setLoadingCabTypes(true);
      try {
        // Try the new cabtype endpoint first
        // Use environment variable for API URL
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/cabtype/all`);
        if (response.data && response.data.data) {
          // Filter only active cab types
          const activeCabTypes = response.data.data.filter(cabType => cabType.active);
          setCabTypes(activeCabTypes);
          console.log('Fetched cab types from cabtype/all:', activeCabTypes);
        }
      } catch (error) {
        console.error('Error fetching from cabtype/all:', error);
        // Fallback to the old endpoint if new one fails
        try {
          // Use environment variable for API URL
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const fallbackResponse = await axios.get(`${API_URL}/cab`);
          if (fallbackResponse.data && fallbackResponse.data.data) {
            setCabTypes(fallbackResponse.data.data);
            console.log('Fetched cab types from fallback endpoint:', fallbackResponse.data.data);
          }
        } catch (fallbackError) {
          console.error('Error fetching cab types from fallback:', fallbackError);
          toast.error('Failed to load available cab types. Please try again later.');
        }
      } finally {
        setLoadingCabTypes(false);
      }
    };

    fetchCabTypes();
  }, []);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess) {
      toast.success("Application submitted successfully! Our team will review and activate your account soon.");
      navigate('/driver/login');
    }
  }, [isError, isSuccess, message, navigate]);
  
  const onChange = (e) => {
    // Handle document file uploads
    const documentTypes = [
      'aadhaarCard', 'driversLicense', 'driverPhoto',
      'vehicleRC', 'insuranceCertificate', 'pucCertificate',
      'fitnessCertificate', 'routePermit', 'vehiclePhotoFront', 'vehiclePhotoBack'
    ];
    
    if (documentTypes.includes(e.target.name)) {
      // Validate file type (only images)
      const file = e.target.files[0];
      if (file) {
        const fileType = file.type;
        if (!fileType.match(/^image\/(jpeg|jpg|png)$/)) {
          toast.error(`Only image files (JPG, JPEG, PNG) are allowed for ${e.target.name}`);
          // Reset the file input
          e.target.value = '';
          return;
        }
        
        // Update form data with the file
        setFormData((prevState) => ({
          ...prevState,
          [e.target.name]: file
        }));
      }
    } else {
      // Handle regular form inputs
      setFormData((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value
      }));
    }
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Check if all required documents are provided
    const requiredDocKeys = Object.entries(documentConfig)
      .filter(([_, config]) => config.required)
      .map(([key]) => key);
    
    const missingDocs = requiredDocKeys.filter(key => !formData[key]);
    
    if (missingDocs.length > 0) {
      const missingDocNames = missingDocs.map(key => documentConfig[key].name).join(', ');
      toast.error(`Missing required documents: ${missingDocNames}`);
      return;
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    // Validate vehicle type selection
    if (!vehicleType) {
      toast.error('Please select a vehicle type');
      return;
    }
    
    // Create FormData object for file upload with explicit values
    const driverData = new FormData();
    
    // Add each field explicitly to ensure they're included
    driverData.append('name', name);
    driverData.append('email', email);
    driverData.append('phone', phone);
    driverData.append('password', password);
    driverData.append('vehicleModel', vehicleModel);
    driverData.append('vehicleNumber', vehicleNumber);
    driverData.append('licenseNumber', licenseNumber);
    driverData.append('licenseExpiry', licenseExpiry);
    driverData.append('vehicleType', vehicleType);
    
    // Handle all document files
    const documentTypes = [
      'aadhaarCard', 'driversLicense', 'driverPhoto',
      'vehicleRC', 'insuranceCertificate', 'pucCertificate',
      'fitnessCertificate', 'routePermit', 'vehiclePhotoFront', 'vehiclePhotoBack'
    ];
    
    // Add each document if it exists
    let documentCount = 0;
    documentTypes.forEach(docType => {
      if (formData[docType]) {
        driverData.append(docType, formData[docType]);
        console.log(`${docType} added to form data:`, formData[docType].name);
        documentCount++;
      }
    });
    
    console.log(`${documentCount} documents added to form data`);
    if (documentCount === 0) {
      console.log('No documents selected');
    }
    
    // Log the keys to confirm data is being sent
    console.log('FormData keys:', [...driverData.keys()]);
    
    // Add extra logging to debug data contents
    for (let pair of driverData.entries()) {
      console.log('FormData entry:', pair[0], '->', pair[1]);
    }
    
    // Dispatch the action with the FormData
    dispatch(registerDriver(driverData));
    
    toast.info('Submitting your driver registration...');
  };
  
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Driver Registration</h1>
          <p className="text-center text-gray-600 mb-6">
            Join our team of professional drivers and start earning today
          </p>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div>
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
                  
                  <div>
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
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
                  
                  <div>
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
                  
                  <div>
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
                  
                  <div>
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
                </div>
              </div>
              
              {/* Vehicle Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Vehicle & License Information</h2>
                <div className="space-y-4">

                  
                  <div>
                    <label htmlFor="vehicleType" className="block text-gray-700 mb-2">Vehicle Type</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-500">
                        <FaTaxi />
                      </div>
                      <select
                        id="vehicleType"
                        name="vehicleType"
                        value={vehicleType}
                        onChange={onChange}
                        className="form-input pl-10"
                        required
                      >
                        <option value="">Select Vehicle Type</option>
                        {loadingCabTypes ? (
                          <option disabled>Loading cab types...</option>
                        ) : (
                          cabTypes.map(cabType => (
                            <option key={cabType._id} value={cabType._id}>
                              {cabType.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    {cabTypes.length === 0 && !loadingCabTypes && (
                      <p className="text-red-500 text-xs mt-1">No vehicle types available. Please contact support.</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="vehicleModel" className="block text-gray-700 mb-2">Vehicle Model</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-500">
                        <FaCar />
                      </div>
                      <input
                        type="text"
                        id="vehicleModel"
                        name="vehicleModel"
                        value={vehicleModel}
                        onChange={onChange}
                        className="form-input pl-10"
                        placeholder="E.g., Toyota Corolla"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="vehicleNumber" className="block text-gray-700 mb-2">Vehicle Registration Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-500">
                        <FaCar />
                      </div>
                      <input
                        type="text"
                        id="vehicleNumber"
                        name="vehicleNumber"
                        value={vehicleNumber}
                        onChange={onChange}
                        className="form-input pl-10"
                        placeholder="Enter vehicle number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="licenseNumber" className="block text-gray-700 mb-2">Driver's License Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-500">
                        <FaIdCard />
                      </div>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        value={licenseNumber}
                        onChange={onChange}
                        className="form-input pl-10"
                        placeholder="Enter license number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="licenseExpiry" className="block text-gray-700 mb-2">License Expiry Date</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-500">
                        <FaCalendarAlt />
                      </div>
                      <input
                        type="date"
                        id="licenseExpiry"
                        name="licenseExpiry"
                        value={licenseExpiry}
                        onChange={onChange}
                        className="form-input pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                </div>
              </div>
              
              {/* Required Documents */}
              <div className="col-span-2 mt-6">
                <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload clear images of the following documents. All documents marked with * are mandatory.
                  Only JPG, JPEG, and PNG image formats are accepted.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-yellow-800 mb-2">Personal Documents (Mandatory)</h3>
                  <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                    <li>Aadhaar Card - proof of identity and address</li>
                    <li>Driver's License - must be a valid commercial license</li>
                    <li>Recent passport-sized photograph</li>
                  </ul>
                </div>
                
                <div className="space-y-6">
                  {/* Documents Section */}
                  {loadingDocConfig ? (
                    <div className="animate-pulse flex flex-col items-center py-8">
                      <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
                      <div className="h-32 w-full bg-gray-200 rounded"></div>
                    </div>
                  ) : docConfigError ? (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                      <div className="flex items-center">
                        <FaExclamationCircle className="text-red-500 mr-2" />
                        <p>Error loading document requirements. Please try again later.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Personal Documents Section */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3">Personal Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Filter and map through personal documents */}
                          {Object.entries(documentConfig)
                            .filter(([key]) => ['aadhaarCard', 'driversLicense', 'driverPhoto'].includes(key))
                            .map(([key, config]) => (
                              <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <label htmlFor={key} className="block text-gray-700 font-medium">
                                    {config.name}
                                  </label>
                                  {config.required && (
                                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="file"
                                  id={key}
                                  name={key}
                                  onChange={onChange}
                                  className="form-input"
                                  accept=".jpg,.jpeg,.png"
                                  required={config.required}
                                />
                                <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      
      
                      {/* Vehicle Documents Section */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3">Vehicle Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Filter and map through vehicle documents */}
                          {Object.entries(documentConfig)
                            .filter(([key]) => ['vehicleRC', 'insuranceCertificate', 'pucCertificate', 'fitnessCertificate', 'routePermit'].includes(key))
                            .map(([key, config]) => (
                              <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <label htmlFor={key} className="block text-gray-700 font-medium">
                                    {config.name}
                                  </label>
                                  {config.required && (
                                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="file"
                                  id={key}
                                  name={key}
                                  onChange={onChange}
                                  className="form-input"
                                  accept=".jpg,.jpeg,.png"
                                  required={config.required}
                                />
                                <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      
      
                      {/* Vehicle Photos Section */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3">Vehicle Photos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Filter and map through vehicle photos */}
                          {Object.entries(documentConfig)
                            .filter(([key]) => ['vehiclePhotoFront', 'vehiclePhotoBack'].includes(key))
                            .map(([key, config]) => (
                              <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <label htmlFor={key} className="block text-gray-700 font-medium">
                                    {config.name}
                                  </label>
                                  {config.required && (
                                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="file"
                                  id={key}
                                  name={key}
                                  onChange={onChange}
                                  className="form-input"
                                  accept=".jpg,.jpeg,.png"
                                  required={config.required}
                                />
                                <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </label>
              </div>
              
              <button
                type="submit"
                className="w-full btn btn-primary py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" /> Processing...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Already have a driver account?{' '}
              <Link to="/driver/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
