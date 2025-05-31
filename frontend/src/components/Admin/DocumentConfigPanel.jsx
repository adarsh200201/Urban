import React, { useState, useEffect } from 'react';
import { FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const DocumentConfigPanel = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [documentConfig, setDocumentConfig] = useState({
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
  });

  // Fetch existing configuration on component mount
  useEffect(() => {
    const fetchDocumentConfig = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/admin/document-config`);
        
        if (response.data && response.data.success) {
          setDocumentConfig(prevConfig => ({
            ...prevConfig,
            ...response.data.data
          }));
        }
      } catch (error) {
        console.error('Error fetching document configuration:', error);
        // If API call fails, use the default configuration
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentConfig();
  }, []);
  
  const handleToggleRequired = (documentKey) => {
    setDocumentConfig(prev => ({
      ...prev,
      [documentKey]: {
        ...prev[documentKey],
        required: !prev[documentKey].required
      }
    }));
  };
  
  const handleChangeDescription = (documentKey, newDescription) => {
    setDocumentConfig(prev => ({
      ...prev,
      [documentKey]: {
        ...prev[documentKey],
        description: newDescription
      }
    }));
  };
  
  const saveConfiguration = async () => {
    setSaveLoading(true);
    try {
      // Get the admin token from localStorage
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      if (!adminInfo || !adminInfo.token) {
        throw new Error('Admin authorization required');
      }
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(
        `${API_URL}/admin/document-config`,
        documentConfig, // Send the document config directly
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminInfo.token}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        toast.success('Document configuration saved successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving document configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to save configuration. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Driver Document Requirements</h2>
        <button
          onClick={saveConfiguration}
          disabled={saveLoading}
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              Save Configuration
            </>
          )}
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <FaExclamationTriangle className="mr-2" />
              <p className="text-sm">
                Configure which documents are required for driver registration. Document requirements will be applied to all new driver registrations.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3 pb-2 border-b">Personal Documents</h3>
              <div className="space-y-4">
                {Object.entries(documentConfig)
                  .filter(([key]) => ['aadhaarCard', 'driversLicense', 'driverPhoto'].includes(key))
                  .map(([key, config]) => (
                    <DocumentConfigItem
                      key={key}
                      documentKey={key}
                      config={config}
                      onToggleRequired={() => handleToggleRequired(key)}
                      onChangeDescription={(desc) => handleChangeDescription(key, desc)}
                    />
                  ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-3 pb-2 border-b">Vehicle Documents</h3>
              <div className="space-y-4">
                {Object.entries(documentConfig)
                  .filter(([key]) => ['vehicleRC', 'insuranceCertificate', 'pucCertificate', 'fitnessCertificate', 'routePermit'].includes(key))
                  .map(([key, config]) => (
                    <DocumentConfigItem
                      key={key}
                      documentKey={key}
                      config={config}
                      onToggleRequired={() => handleToggleRequired(key)}
                      onChangeDescription={(desc) => handleChangeDescription(key, desc)}
                    />
                  ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-3 pb-2 border-b">Vehicle Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(documentConfig)
                .filter(([key]) => ['vehiclePhotoFront', 'vehiclePhotoBack'].includes(key))
                .map(([key, config]) => (
                  <DocumentConfigItem
                    key={key}
                    documentKey={key}
                    config={config}
                    onToggleRequired={() => handleToggleRequired(key)}
                    onChangeDescription={(desc) => handleChangeDescription(key, desc)}
                  />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Document configuration item component
const DocumentConfigItem = ({ documentKey, config, onToggleRequired, onChangeDescription }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{config.name}</span>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.required}
            onChange={onToggleRequired}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-600">
            {config.required ? 'Required' : 'Optional'}
          </span>
        </label>
      </div>
      <div>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          value={config.description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Document description"
        />
      </div>
    </div>
  );
};

export default DocumentConfigPanel;
