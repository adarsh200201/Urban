import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Default document requirements configuration
const defaultDocumentConfig = {
  // Personal documents
  aadhaarCard: { required: true, name: 'Aadhaar Card', description: 'Government issued ID' },
  driversLicense: { required: true, name: 'Driver\'s License', description: 'Valid driving license' },
  driverPhoto: { required: true, name: 'Driver Photo', description: 'Recent passport-size photo' },
  
  // Vehicle documents
  vehicleRC: { required: true, name: 'Vehicle Registration Certificate', description: 'RC book of the vehicle' },
  insuranceCertificate: { required: true, name: 'Insurance Certificate', description: 'Valid vehicle insurance' },
  pucCertificate: { required: true, name: 'PUC Certificate', description: 'Pollution certificate' },
  fitnessCertificate: { required: false, name: 'Fitness Certificate', description: 'Vehicle fitness certificate' },
  routePermit: { required: false, name: 'Route Permit', description: 'Commercial route permit' },
  
  // Vehicle photos
  vehiclePhotoFront: { required: true, name: 'Vehicle Front Photo', description: 'Front view with number plate' },
  vehiclePhotoBack: { required: false, name: 'Vehicle Back Photo', description: 'Back view with number plate' }
};

// Create context
const DocumentRequirementsContext = createContext();

export const useDocumentRequirements = () => {
  return useContext(DocumentRequirementsContext);
};

export const DocumentRequirementsProvider = ({ children }) => {
  const [documentConfig, setDocumentConfig] = useState(defaultDocumentConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get authentication token from Redux store
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchDocumentConfig = async () => {
      setLoading(true);
      
      // Only attempt to fetch if user is authenticated
      if (!user || !user.token) {
        console.log('User not authenticated, using default document config');
        setLoading(false);
        return;
      }
      
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        
        // Setup request config with authentication token
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/admin/document-config`, config);
        
        if (response.data && response.data.success) {
          setDocumentConfig({
            ...defaultDocumentConfig, // Maintain default structure
            ...response.data.data // Override with server data
          });
        }
      } catch (error) {
        console.error('Error fetching document requirements:', error);
        setError('Failed to fetch document requirements. Using default configuration.');
        // On error, we still use the default config
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentConfig();
  }, [user]); // Add user to dependency array to re-fetch when user logs in

  // Get only the required documents
  const getRequiredDocuments = () => {
    return Object.fromEntries(
      Object.entries(documentConfig).filter(([_, config]) => config.required)
    );
  };

  // Validate if all required documents are provided
  const validateDocumentRequirements = (formData) => {
    const requiredDocuments = getRequiredDocuments();
    const missingDocuments = [];
    
    Object.entries(requiredDocuments).forEach(([key, config]) => {
      if (!formData[key]) {
        missingDocuments.push(config.name);
      }
    });
    
    return {
      valid: missingDocuments.length === 0,
      missingDocuments
    };
  };

  const value = {
    documentConfig,
    loading,
    error,
    getRequiredDocuments,
    validateDocumentRequirements
  };

  return (
    <DocumentRequirementsContext.Provider value={value}>
      {children}
    </DocumentRequirementsContext.Provider>
  );
};

export default DocumentRequirementsContext;
