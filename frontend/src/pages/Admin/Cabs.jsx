import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getAllCabs, addCab, addCabSimple, updateCab, deleteCab } from '../../features/admin/adminSlice';

const Cabs = () => {
  const dispatch = useDispatch();
  const { cabs, isLoading, isError, isSuccess, message } = useSelector((state) => state.admin);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCab, setCurrentCab] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all cabs on component mount
  useEffect(() => {
    dispatch(getAllCabs());
  }, [dispatch]);
  
  // Show toast messages on success or error
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess && message) {
      toast.success(message);
    }
  }, [isError, isSuccess, message]);
  
  // Form state for creating/editing cabs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    acType: 'AC',
    seatingCapacity: 4,
    luggageCapacity: 2,
    baseKmPrice: 0,
    extraFarePerKm: 0,
    includedKm: 0,
    vehicleLocation: '',
    fuelCharges: { included: true, amount: 0 },
    driverCharges: { included: true, amount: 0 },
    nightCharges: { included: true, amount: 0 },
    features: [],
    active: true
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleOpenModal = (cab = null) => {
    if (cab) {
      setFormData({
        name: cab.name,
        description: cab.description,
        acType: cab.acType || 'AC',
        seatingCapacity: cab.seatingCapacity || 4,
        luggageCapacity: cab.luggageCapacity || 2,
        baseKmPrice: cab.baseKmPrice || '',
        extraFarePerKm: cab.extraFarePerKm || 0,
        includedKm: cab.includedKm || 0,
        vehicleLocation: cab.vehicleLocation || '',
        features: cab.features || [],
        fuelCharges: {
          included: cab.fuelCharges?.included !== undefined ? cab.fuelCharges.included : true,
          amount: cab.fuelCharges?.amount || 0
        },
        driverCharges: {
          included: cab.driverCharges?.included !== undefined ? cab.driverCharges.included : true,
          amount: cab.driverCharges?.amount || 0
        },
        nightCharges: {
          included: cab.nightCharges?.included !== undefined ? cab.nightCharges.included : true,
          amount: cab.nightCharges?.amount || 0
        },
        active: cab.active !== undefined ? cab.active : true
      });
      setCurrentCab(cab);
      setImagePreview(cab.imageUrl || '');
    } else {
      setFormData({
        name: '',
        description: '',
        acType: 'AC',
        seatingCapacity: 4,
        luggageCapacity: 2,
        baseKmPrice: '',
        extraFarePerKm: 0,
        includedKm: 0,
        vehicleLocation: '',
        features: [],
        fuelCharges: {
          included: true,
          charge: 0
        },
        driverCharges: {
          included: true,
          charge: 0
        },
        nightCharges: {
          included: true,
          charge: 0
        },
        active: true
      });
      setCurrentCab(null);
      setImagePreview('');
      setImageFile(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentCab(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested charge objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeatureChange = (e) => {
    const feature = e.target.value;
    if (e.key === 'Enter' && feature.trim() !== '') {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
      e.target.value = '';
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Cab name is required');
      return;
    }
    
    console.log('Submitting form data:', formData);
    toast.info('Creating cab type...');
    
    try {
      const token = localStorage.getItem('token') || 
        (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null);
      
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Step 1: Create a JSON object with the cab data
      // Check if the name already contains (AC) or (Non-AC)
      let cabName = formData.name;
      if (!cabName.includes('(AC)') && !cabName.includes('(Non-AC)')) {
        cabName = formData.acType === 'Non-AC' 
          ? `${cabName} (Non-AC)` 
          : `${cabName} (AC)`;
      }
      const nameWithAC = cabName;
      
      const cabData = {
        name: nameWithAC,
        description: formData.description || '',
        acType: formData.acType || 'AC',
        seatingCapacity: parseInt(formData.seatingCapacity) || 4,
        luggageCapacity: parseInt(formData.luggageCapacity) || 2,
        baseKmPrice: parseFloat(formData.baseKmPrice) || 0,
        extraFarePerKm: parseFloat(formData.extraFarePerKm) || 0,
        includedKm: parseInt(formData.includedKm) || 0,
        vehicleLocation: formData.vehicleLocation || '',
        fuelCharges: {
          included: formData.fuelCharges.included,
          amount: formData.fuelCharges.included ? 0 : parseFloat(formData.fuelCharges.amount) || 0
        },
        driverCharges: {
          included: formData.driverCharges.included,
          amount: formData.driverCharges.included ? 0 : parseFloat(formData.driverCharges.amount) || 0
        },
        nightCharges: {
          included: formData.nightCharges.included,
          amount: formData.nightCharges.included ? 0 : parseFloat(formData.nightCharges.amount) || 0
        },
        active: formData.active,
        features: formData.features || [],
        // Use direct image URL if provided
        imageUrl: formData.directImageUrl || ''
      };
      
      console.log('Step 1: Creating cab with data:', cabData);
      
      let response;
      
      if (currentCab) {
        // Update existing cab
        response = await axios.put(
          `http://localhost:5000/api/cab/${currentCab._id}`,
          cabData,
          config
        );
        toast.success('Cab updated successfully');
      } else {
        // Create new cab
        response = await axios.post(
          'http://localhost:5000/api/cab/noimage',
          cabData,
          config
        );
        toast.success('Cab created successfully');
      }
      
      console.log('Cab created/updated:', response.data);
      
      // Step 2: If there's an image file, upload it separately using the direct endpoint
      if (imageFile) {
        const cabId = response.data.data._id;
        console.log('Step 2: Uploading image for cab:', cabId);
        
        // Create a new FormData for the image only
        const imageFormData = new FormData();
        
        // Add the file with the name 'image' - this is critical
        imageFormData.append('image', imageFile);
        
        // Log FormData contents for debugging
        console.log('FormData created with file:', imageFile.name, 'size:', imageFile.size, 'type:', imageFile.type);
        
        // Update headers for multipart/form-data - don't set Content-Type manually
        // Let Axios set the correct multipart boundary
        const imageConfig = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        try {
          // Add loading indicator
          toast.info('Uploading image...', { autoClose: false, toastId: 'uploading' });
          
          // Upload the image using the direct endpoint
          const imageResponse = await axios.post(
            `http://localhost:5000/api/direct-cab-image/${cabId}`,
            imageFormData,
            imageConfig
          );
          
          // Clear the loading toast
          toast.dismiss('uploading');
          
          console.log('Image uploaded successfully:', imageResponse.data);
          toast.success('Image uploaded successfully');
          
          // Update the cab with the new image URL in the local state if needed
          if (imageResponse.data?.data?.imageUrl) {
            // This could update the UI to show the new image right away
            console.log('Updated image URL:', imageResponse.data.data.imageUrl);
          }
        } catch (imageError) {
          // Clear the loading toast
          toast.dismiss('uploading');
          
          console.error('Error uploading image:', imageError);
          console.error('Error details:', imageError.response?.data || 'No response data');
          
          // More detailed error handling
          if (imageError.response?.status === 500) {
            toast.error(`Server error during image upload: ${imageError.response?.data?.message || 'Unknown error'}`);
            
            // Update the cab to let the user know it was created but image failed
            try {
              await axios.put(
                `http://localhost:5000/api/cab/${cabId}`,
                { ...cabData, note: 'Image upload failed - please try again' },
                config
              );
            } catch (e) {
              // Silently fail if this update fails
              console.error('Failed to update cab with note:', e);
            }
          } else if (imageError.response?.status === 400) {
            toast.error(`Bad request: ${imageError.response?.data?.message || 'File validation failed'}`);
          } else {
            toast.warning(`Cab created but failed to upload image (${imageError.response?.status || 'Unknown error'}). Please try again.`);
          }
        }
      } else {
        console.log('No image file provided');
        toast.info('Cab created without an image. You can edit it later to add an image.');
      }
      
      // Refresh the cab list
      dispatch(getAllCabs());
      
      // Close the modal
      handleCloseModal();
    } catch (error) {
      console.error('Error saving cab data:', error);
      toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleStatus = (cabId, currentActive) => {
    // Find the cab to update its status
    const cabToUpdate = cabs.find(cab => cab._id === cabId);
    if (!cabToUpdate) {
      toast.error('Cab not found');
      return;
    }
    
    const newActive = !currentActive;
    
    // Create FormData for the update
    const formDataObj = new FormData();
    formDataObj.append('active', newActive.toString());
    
    // Update status using Redux action
    dispatch(updateCab({
      id: cabId,
      cabData: formDataObj
    }));
  };
  
  // Delete a cab
  const handleDelete = (cabId) => {
    if (!window.confirm('Are you sure you want to delete this cab?')) {
      return;
    }
    
    // Delete cab using Redux action
    dispatch(deleteCab(cabId));
  };

  const filteredCabs = cabs.filter(cab => 
    cab.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cab Management</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Cab
        </button>
      </div>
      
      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search cabs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Cabs Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCabs.length > 0 ? (
            filteredCabs.map((cab) => (
              <div key={cab._id} className={`bg-white rounded-lg shadow-md overflow-hidden ${cab.active ? '' : 'opacity-70'}`}>
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                  {cab.imageUrl ? (
                    <img 
                      src={cab.imageUrl} 
                      alt={cab.name} 
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Cab+Image';
                      }}
                    />
                  ) : (
                    <svg className="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold">{cab.name}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cab.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cab.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{cab.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-gray-500 text-xs">Base Price</p>
                      <p className="font-medium">₹{cab.baseKmPrice}/km</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Extra KM Charge</p>
                      <p className="font-medium">₹{cab.extraFarePerKm || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Capacity</p>
                      <p className="font-medium">{cab.seatingCapacity} Persons</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Luggage</p>
                      <p className="font-medium">{cab.luggageCapacity} Bags</p>
                    </div>
                  </div>
                  
                  {/* Features */}
                  {cab.features && cab.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {cab.features.map((feature, index) => (
                          <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Charges information */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cab.fuelCharges && cab.fuelCharges.included ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Fuel Included
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Fuel: ₹{cab.fuelCharges?.amount || 0}
                      </span>
                    )}
                    {cab.driverCharges && cab.driverCharges.included ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Driver Included
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Driver: ₹{cab.driverCharges?.amount || 0}
                      </span>
                    )}
                    {cab.nightCharges && cab.nightCharges.included ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Night Charges Included
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Night: ₹{cab.nightCharges?.amount || 0}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handleOpenModal(cab)}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(cab._id)}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => toggleStatus(cab._id, cab.active)}
                        className={`px-3 py-1 rounded text-sm ${
                          cab.active ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {cab.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchTerm ? 'No cabs matching search criteria' : 'No cabs found'}
            </div>
          )}
        </div>
      )}
      
      {/* Add/Edit Cab Modal */}
      {modalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {currentCab ? 'Edit Cab' : 'Add New Cab'}
                </h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Cab Name*</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                  </div>

                  {/* AC/Non-AC Option */}
                  <div>
                    <label htmlFor="acType" className="block text-sm font-medium text-gray-700">AC Type</label>
                    <select
                      name="acType"
                      id="acType"
                      value={formData.acType || 'AC'}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="AC">AC</option>
                      <option value="Non-AC">Non-AC</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="baseKmPrice" className="block text-sm font-medium text-gray-700">Base Price per Km (₹)*</label>
                      <input
                        type="number"
                        name="baseKmPrice"
                        id="baseKmPrice"
                        value={formData.baseKmPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="extraFarePerKm" className="block text-sm font-medium text-gray-700">Extra Per KM Charge (₹)</label>
                      <input
                        type="number"
                        name="extraFarePerKm"
                        id="extraFarePerKm"
                        value={formData.extraFarePerKm}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  
                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Features</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                          {feature}
                          <button 
                            type="button" 
                            className="ml-1 text-blue-600 hover:text-blue-800"
                            onClick={() => removeFeature(index)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Type a feature and press Enter"
                      onKeyDown={handleFeatureChange}
                    />
                  </div>
                  

                  
                  {/* Pickup Location */}
                  <div>
                    <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
                    VehicleLocation
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="vehicleLocation"
                        id="vehicleLocation"
                        value={formData.vehicleLocation}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Fuel Charges Group */}
                  <div className="border rounded-md p-3 space-y-3">
                    <h4 className="font-medium text-gray-700">Fuel Charges</h4>
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name="fuelCharges.included"
                          checked={formData.fuelCharges.included}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Included in price</span>
                      </label>
                    
                      {!formData.fuelCharges.included && (
                        <div className="flex items-center">
                          <label htmlFor="fuelCharges.amount" className="mr-2 text-sm font-medium text-gray-700">
                            Charge (₹):
                          </label>
                          <input
                            type="number"
                            name="fuelCharges.amount"
                            value={formData.fuelCharges.amount}
                            onChange={handleChange}
                            min="0"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 w-24 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Driver Charges Group */}
                  <div className="border rounded-md p-3 space-y-3">
                    <h4 className="font-medium text-gray-700">Driver Charges</h4>
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name="driverCharges.included"
                          checked={formData.driverCharges.included}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Included in price</span>
                      </label>
                    
                      {!formData.driverCharges.included && (
                        <div className="flex items-center">
                          <label htmlFor="driverCharges.amount" className="mr-2 text-sm font-medium text-gray-700">
                            Charge (₹):
                          </label>
                          <input
                            type="number"
                            name="driverCharges.amount"
                            value={formData.driverCharges.amount}
                            onChange={handleChange}
                            min="0"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 w-24 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Night Charges Group */}
                  <div className="border rounded-md p-3 space-y-3">
                    <h4 className="font-medium text-gray-700">Night Charges</h4>
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name="nightCharges.included"
                          checked={formData.nightCharges.included}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Included in price</span>
                      </label>
                    
                      {!formData.nightCharges.included && (
                        <div className="flex items-center">
                          <label htmlFor="nightCharges.amount" className="mr-2 text-sm font-medium text-gray-700">
                            Charge (₹):
                          </label>
                          <input
                            type="number"
                            name="nightCharges.amount"
                            value={formData.nightCharges.amount}
                            onChange={handleChange}
                            min="0"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 w-24 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Active/Inactive */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        name="active"
                        id="active"
                        checked={formData.active}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                                    {/* Image Upload Section */}
                  <div className="border-2 border-blue-300 bg-blue-50 rounded-md p-4 mb-4">
                    <label className="block text-lg font-medium text-gray-800">Cab Image Upload</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <div className="mb-3">
                            <img 
                              src={imagePreview} 
                              alt="Cab Preview" 
                              className="mx-auto h-32 w-auto object-cover" 
                            />
                          </div>
                        ) : (
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 015.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input
                              id="image-upload"
                              name="image"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {currentCab ? 'Update Cab' : 'Add Cab'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cabs;
