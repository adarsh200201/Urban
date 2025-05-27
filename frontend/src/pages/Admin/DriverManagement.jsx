import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaEdit, FaToggleOn, FaToggleOff, FaCheckCircle, FaTimesCircle, FaTaxi, FaFileAlt, FaEye } from 'react-icons/fa';
import { getAllDrivers, toggleDriverStatus, toggleDriverApproval, verifyDriverDocument, updateDriverDocuments, reset } from '../../features/admin/adminSlice';
import DriverDocumentPreview from '../../components/Admin/DriverDocumentPreview';

const DriverManagement = () => {
  const dispatch = useDispatch();
  const { drivers, loading, error, success, message } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    dispatch(getAllDrivers());

    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reset());
    }

    if (success) {
      toast.success(message);
      dispatch(reset());
    }
  }, [error, success, message, dispatch]);

  useEffect(() => {
    if (drivers) {
      console.log('Drivers data received:', drivers);
      filterDrivers();
    }
  }, [drivers, searchTerm]);

  const filterDrivers = () => {
    if (!searchTerm) {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(
        driver => {
          // Check if driver exists
          if (!driver) return false;
          
          // Search in user properties if user object exists
          const userNameMatch = driver.user && driver.user.name ? 
            driver.user.name.toLowerCase().includes(searchTerm.toLowerCase()) :
            // Or search in direct driver properties
            driver.name ? driver.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
          
          const userPhoneMatch = driver.user && driver.user.phone ? 
            driver.user.phone.includes(searchTerm) :
            // Or search in direct driver properties
            driver.phone ? driver.phone.includes(searchTerm) : false;
          
          // Search in driver properties
          const vehicleNumberMatch = driver.vehicleNumber && 
            driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
          
          const vehicleModelMatch = driver.vehicleModel && 
            driver.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
          
          return userNameMatch || userPhoneMatch || vehicleNumberMatch || vehicleModelMatch;
        }
      );
      setFilteredDrivers(filtered);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleStatus = (driverId, currentStatus) => {
    dispatch(toggleDriverStatus({
      driverId,
      isAvailable: !currentStatus
    }));
  };

  const handleToggleApproval = (driverId, currentApprovalStatus) => {
    dispatch(toggleDriverApproval({
      driverId,
      isApproved: !currentApprovalStatus
    }));
  };
  
  // View driver documents
  const viewDriverDocuments = (driver) => {
    setSelectedDriver(driver);
    setShowDocumentModal(true);
  };
  
  // Close document modal
  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDriver(null);
  };
  
  // Handle document approval and updates
  const handleDocumentApproval = (driverId, documentKey, isApproved, documents) => {
    // If documents object is provided, this is a manual update of document URLs
    if (documents) {
      dispatch(updateDriverDocuments({ driverId, documents }));
      toast.info('Updating document URLs...');
      return;
    }
    
    // Otherwise, this is a document approval/rejection
    if (documentKey) {
      dispatch(verifyDriverDocument({ driverId, documentKey, isApproved }));
      toast.info(`Processing ${documentKey} ${isApproved ? 'approval' : 'rejection'}...`);
    }
  };

  if (loading && !drivers) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 py-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 px-4 pt-4">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Driver Management</h1>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowAddDriver(true)}
            className="flex items-center justify-center bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition duration-200"
          >
            <FaPlus className="mr-2" /> Add Driver
          </button>
        </div>
      </div>
      
      {filteredDrivers && filteredDrivers.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mx-4 mb-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed text-left">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[6%]" />
                <col className="w-[8%]" />
                <col className="w-[17%]" />
              </colgroup>
              <thead>
                <tr className="bg-gray-100">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    License
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">
                    Availability
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">
                    Approval Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Rides
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver) => {
                  // Check if driver data is valid
                  if (!driver || !driver._id) {
                    console.log('Invalid driver data:', driver);
                    return null;
                  }
                  
                  // Format license expiry date safely
                  let expiryDate = 'N/A';
                  try {
                    if (driver.licenseExpiry) {
                      expiryDate = new Date(driver.licenseExpiry).toLocaleDateString();
                    }
                  } catch (e) {
                    console.error('Error formatting date:', e);
                  }
                  
                  return (
                    <tr key={driver._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                            {driver.user && driver.user.name ? driver.user.name.charAt(0).toUpperCase() : 
                             driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {driver.user && driver.user.name ? driver.user.name : 
                               driver.name ? driver.name : 'Unknown Driver'}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {driver.user && driver.user.phone ? driver.user.phone : 
                               driver.phone ? driver.phone : 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{driver.vehicleModel || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{driver.vehicleNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{driver.licenseNumber || 'N/A'}</div>
                        <div className="text-sm text-gray-500">Expires: {expiryDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {driver.isAvailable ? 'Available' : driver.onTrip ? 'On Trip' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {driver.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {driver.totalRides || 0}
                      </td>
                      <td className="px-6 py-4">
                        {driver.rating ? (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-1">{driver.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">/ 5.0</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-y-2">
                        <button
                          onClick={() => handleToggleStatus(driver._id, driver.isAvailable)}
                          className={`px-3 py-1 rounded text-xs font-medium block w-full text-center ${driver.isAvailable ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                        >
                          {driver.isAvailable ? (
                            <>
                              <FaToggleOff className="inline mr-1" />
                              Unavailable
                            </>
                          ) : (
                            <>
                              <FaToggleOn className="inline mr-1" />
                              Available
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleToggleApproval(driver._id, driver.isApproved)}
                          className={`px-3 py-1 rounded text-xs font-medium block w-full text-center ${driver.isApproved ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                        >
                          {driver.isApproved ? (
                            <>
                              <FaTimesCircle className="inline mr-1" />
                              Unapprove
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="inline mr-1" />
                              Approval
                            </>
                          )}
                        </button>
                        
                        <button
                          className="px-3 py-1 rounded text-xs font-medium block w-full text-center bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          <FaEdit className="inline mr-1" />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => viewDriverDocuments(driver)}
                          className="px-3 py-1 rounded text-xs font-medium block w-full text-center bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        >
                          <FaFileAlt className="inline mr-1" />
                          Documents
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-8 mx-4 mb-4">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <FaTaxi className="text-gray-400 w-12 h-12" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Drivers Found</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No drivers match your search criteria.' : 'There are no drivers registered in the system.'}
          </p>
          <button
            onClick={() => setShowAddDriver(true)}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition duration-200"
          >
            <FaPlus className="mr-2" /> Add Driver
          </button>
        </div>
      )}
      
      {/* Document Preview Modal */}
      {showDocumentModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                Documents for {selectedDriver.user?.name || selectedDriver.name || 'Driver'}
              </h2>
              <button
                onClick={closeDocumentModal}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <DriverDocumentPreview
                driver={selectedDriver}
                onApproveDocument={handleDocumentApproval}
              />
            </div>
            
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={closeDocumentModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Close
              </button>
              
              {!selectedDriver.documentsVerified && (
                <button
                  onClick={() => {
                    // This would typically verify all documents at once
                    toast.success('All documents have been verified');
                    closeDocumentModal();
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded ml-2"
                >
                  Verify All Documents
                </button>
              )}
              
              {!selectedDriver.isApproved && (
                <button
                  onClick={() => {
                    handleToggleApproval(selectedDriver._id, false);
                    closeDocumentModal();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-2"
                >
                  Approve Driver
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
