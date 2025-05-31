import React, { useState, useEffect } from 'react';
import { FaFileImage, FaTimesCircle, FaCheckCircle, FaEye, FaExclamationTriangle } from 'react-icons/fa';

const DriverDocumentPreview = ({ driver, onApproveDocument }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableDocuments, setEditableDocuments] = useState({});
  const [editSaved, setEditSaved] = useState(false);
  
  // Document categories
  const documentCategories = [
    {
      title: 'Personal Documents',
      items: [
        { key: 'aadhaarCard', label: 'Aadhaar Card' },
        { key: 'driversLicense', label: 'Driver\'s License' },
        { key: 'driverPhoto', label: 'Passport Photo' },
      ]
    },
    {
      title: 'Vehicle Documents',
      items: [
        { key: 'vehicleRC', label: 'Vehicle RC' },
        { key: 'insuranceCertificate', label: 'Insurance Certificate' },
        { key: 'pucCertificate', label: 'PUC Certificate' },
        { key: 'fitnessCertificate', label: 'Fitness Certificate' },
        { key: 'routePermit', label: 'Route Permit' },
      ]
    },
    {
      title: 'Vehicle Photos',
      items: [
        { key: 'vehiclePhotoFront', label: 'Front View' },
        { key: 'vehiclePhotoBack', label: 'Back View' },
      ]
    }
  ];
  
  // Check if driver has any documents
  const [hasDocuments, setHasDocuments] = useState(false);
  
  useEffect(() => {
    // This ensures we correctly identify if there are any documents
    // Handle both object format and potential empty/null documents
    if (driver?.documents) {
      if (typeof driver.documents === 'object') {
        const hasAnyDocs = Object.values(driver.documents).some(doc => doc && doc.length > 0);
        setHasDocuments(hasAnyDocs);
        
        // Initialize editable documents with current values
        setEditableDocuments({...driver.documents});
      } else {
        setHasDocuments(false);
        // Initialize empty editable documents structure
        setEditableDocuments({
          aadhaarCard: '',
          driversLicense: '',
          driverPhoto: '',
          vehicleRC: '',
          insuranceCertificate: '',
          pucCertificate: '',
          fitnessCertificate: '',
          routePermit: '',
          vehiclePhotoFront: '',
          vehiclePhotoBack: ''
        });
      }
    } else {
      setHasDocuments(false);
      // Initialize empty editable documents structure
      setEditableDocuments({
        aadhaarCard: '',
        driversLicense: '',
        driverPhoto: '',
        vehicleRC: '',
        insuranceCertificate: '',
        pucCertificate: '',
        fitnessCertificate: '',
        routePermit: '',
        vehiclePhotoFront: '',
        vehiclePhotoBack: ''
      });
    }
  }, [driver]);
  
  // Handle input change in document URL fields
  const handleDocumentInputChange = (key, value) => {
    setEditableDocuments({
      ...editableDocuments,
      [key]: value
    });
  };
  
  // Save edited documents
  const saveDocuments = () => {
    if (onApproveDocument && driver?._id) {
      onApproveDocument(driver._id, null, null, editableDocuments);
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 2000);
    }
  };
  
  // Open image preview modal
  const openPreview = (imageUrl) => {
    // Only open preview if there's actually a URL to display
    if (imageUrl && imageUrl.trim() !== '') {
      setPreviewImage(imageUrl);
    }
  };
  
  // Close image preview modal
  const closePreview = () => {
    setPreviewImage(null);
  };
  
  // Handle document approval
  const handleApproveDocument = (documentKey, isApproved) => {
    if (onApproveDocument) {
      onApproveDocument(driver._id, documentKey, isApproved);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Driver Documents</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            isEditing ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Document URLs'}
        </button>
      </div>
      
      {!hasDocuments && !driver?.documents && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-700">
            No documents have been uploaded by this driver yet.
          </p>
        </div>
      )}
      
      {!hasDocuments && driver?.documents && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-orange-500 mr-2" />
            <p className="text-sm text-orange-700">
              Documents may exist but are stored in an incorrect format. Please check the database record.
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-700">
            <p>Current document data structure:</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-32">
              {JSON.stringify(driver.documents, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="mb-3 flex items-center">
            <FaFileImage className="text-blue-500 mr-2" />
            <h3 className="font-medium text-blue-800">Edit Document URLs</h3>
          </div>
          
          <div className="space-y-4">
            {documentCategories.map((category) => (
              <div key={category.title} className="border-t border-blue-200 pt-3">
                <h4 className="font-medium text-gray-700 mb-2">{category.title}</h4>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.key} className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-1">{item.label} URL</label>
                      <input
                        type="text"
                        value={editableDocuments[item.key] || ''}
                        onChange={(e) => handleDocumentInputChange(item.key, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        placeholder={`Enter ${item.label} URL`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveDocuments}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            >
              <FaCheckCircle className="mr-2" />
              {editSaved ? 'Saved!' : 'Save Document URLs'}
            </button>
          </div>
        </div>
      )}
      
      {!isEditing && hasDocuments && (
        <div className="space-y-6">
          {/* Document categories */}
          {documentCategories.map((category) => {
            // Check if any documents in this category exist
            const hasAnyInCategory = category.items.some(item => 
              driver.documents[item.key] && driver.documents[item.key].length > 0
            );
            
            if (!hasAnyInCategory) return null;
            
            return (
              <div key={category.title} className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-3">{category.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item) => {
                    const documentUrl = driver.documents[item.key];
                    if (!documentUrl) return null;
                    
                    return (
                      <div key={item.key} className="border border-gray-200 rounded-lg p-4 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-700">{item.label}</h4>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openPreview(documentUrl)}
                              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 cursor-pointer mb-2"
                             onClick={() => documentUrl && documentUrl.trim() !== '' ? openPreview(documentUrl) : null}>
                          {documentUrl && documentUrl.trim() !== '' ? (
                            <div className="relative w-full h-24 overflow-hidden rounded border border-gray-200">
                              <img 
                                src={documentUrl} 
                                alt={item.label}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                  console.log(`Failed to load image: ${documentUrl}`);
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                                Click to view full image
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <FaFileImage className="w-8 h-8 mb-2" />
                              <span className="text-xs">Not Uploaded</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          {documentUrl && documentUrl.trim() !== '' ? (
            <span className="text-xs text-gray-500 flex items-center">
              <FaEye className="w-3 h-3 mr-1" /> View full image
            </span>
          ) : (
            <span className="text-xs text-gray-500">No image available</span>
          )}
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApproveDocument(item.key, false)}
                              className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              title="Reject Document"
                            >
                              <FaTimesCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApproveDocument(item.key, true)}
                              className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              title="Approve Document"
                            >
                              <FaCheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closePreview}>
          <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={closePreview}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              aria-label="Close preview"
            >
              <FaTimesCircle className="w-6 h-6 text-gray-700" />
            </button>
            <div className="bg-white p-2 rounded-lg shadow-2xl">
              <img 
                src={previewImage} 
                alt="Document Preview" 
                className="max-h-[80vh] w-auto mx-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  console.error(`Failed to load preview image: ${previewImage}`);
                  e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                }}
              />
              <div className="mt-2 text-center text-sm text-gray-600">
                Document Preview
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDocumentPreview;
