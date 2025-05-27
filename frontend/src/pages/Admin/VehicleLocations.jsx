import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const VehicleLocations = () => {
  // Sample data for cities and cabs
  const [cities, setCities] = useState([
    { id: 1, name: 'Delhi', state: 'Delhi', popular: true },
    { id: 2, name: 'Mumbai', state: 'Maharashtra', popular: true },
    { id: 3, name: 'Bangalore', state: 'Karnataka', popular: true },
    { id: 4, name: 'Chennai', state: 'Tamil Nadu', popular: true },
    { id: 5, name: 'Kolkata', state: 'West Bengal', popular: true },
    { id: 6, name: 'Hyderabad', state: 'Telangana', popular: true },
    { id: 7, name: 'Jaipur', state: 'Rajasthan', popular: true },
    { id: 8, name: 'Pune', state: 'Maharashtra', popular: true }
  ]);
  
  const [cabTypes, setCabTypes] = useState([
    { 
      id: 1, 
      name: 'Premium Sedan',
      description: 'Comfortable sedan for up to 4 passengers',
      basePrice: 15,
      perKMCharge: 12,
      capacity: 4,
      luggage: 3,
      imageUrl: 'https://UrbanRide.com/assets/images/cabs/sedan.png'
    },
    { 
      id: 2, 
      name: 'SUV',
      description: 'Spacious SUV for up to 6 passengers',
      basePrice: 20,
      perKMCharge: 15,
      capacity: 6,
      luggage: 5,
      imageUrl: 'https://UrbanRide.com/assets/images/cabs/suv.png'
    },
    { 
      id: 3, 
      name: 'Luxury Sedan',
      description: 'Premium luxury sedan with extra comfort',
      basePrice: 25,
      perKMCharge: 18,
      capacity: 4,
      luggage: 3,
      imageUrl: 'https://UrbanRide.com/assets/images/cabs/luxury.png'
    }
  ]);
  
  // State for the vehicle-city mappings
  const [vehicleLocations, setVehicleLocations] = useState([
    { id: 1, cabTypeId: 1, cityId: 1, status: 'active', availability: 10 },
    { id: 2, cabTypeId: 1, cityId: 2, status: 'active', availability: 8 },
    { id: 3, cabTypeId: 1, cityId: 3, status: 'active', availability: 12 },
    { id: 4, cabTypeId: 2, cityId: 1, status: 'active', availability: 5 },
    { id: 5, cabTypeId: 2, cityId: 2, status: 'active', availability: 4 },
    { id: 6, cabTypeId: 3, cityId: 1, status: 'active', availability: 3 }
  ]);
  
  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCabType, setSelectedCabType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVehicleLocation, setCurrentVehicleLocation] = useState(null);
  const [formData, setFormData] = useState({
    cabTypeId: '',
    cityId: '',
    availability: '',
    status: 'active'
  });
  
  // Handle opening the modal
  const handleOpenModal = (vehicleLocation = null) => {
    if (vehicleLocation) {
      setFormData({
        cabTypeId: vehicleLocation.cabTypeId,
        cityId: vehicleLocation.cityId,
        availability: vehicleLocation.availability,
        status: vehicleLocation.status
      });
      setCurrentVehicleLocation(vehicleLocation);
    } else {
      setFormData({
        cabTypeId: '',
        cityId: '',
        availability: '',
        status: 'active'
      });
      setCurrentVehicleLocation(null);
    }
    setModalOpen(true);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setModalOpen(false);
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cabTypeId || !formData.cityId || !formData.availability) {
      toast.error('All fields are required!');
      return;
    }
    
    // Check if the combination already exists (except when editing the current one)
    const isDuplicate = vehicleLocations.some(vl => 
      vl.cabTypeId === parseInt(formData.cabTypeId) && 
      vl.cityId === parseInt(formData.cityId) && 
      (!currentVehicleLocation || vl.id !== currentVehicleLocation.id)
    );
    
    if (isDuplicate) {
      toast.error('This vehicle type is already assigned to this city!');
      return;
    }
    
    if (currentVehicleLocation) {
      // Update existing vehicle location
      const updatedVehicleLocations = vehicleLocations.map(vl => 
        vl.id === currentVehicleLocation.id ? { 
          ...vl, 
          cabTypeId: parseInt(formData.cabTypeId),
          cityId: parseInt(formData.cityId),
          availability: parseInt(formData.availability),
          status: formData.status
        } : vl
      );
      setVehicleLocations(updatedVehicleLocations);
      toast.success('Vehicle location updated successfully!');
    } else {
      // Add new vehicle location
      const newVehicleLocation = {
        id: Math.max(...vehicleLocations.map(vl => vl.id), 0) + 1,
        cabTypeId: parseInt(formData.cabTypeId),
        cityId: parseInt(formData.cityId),
        availability: parseInt(formData.availability),
        status: 'active'
      };
      setVehicleLocations([...vehicleLocations, newVehicleLocation]);
      toast.success('Vehicle location added successfully!');
    }
    
    handleCloseModal();
  };
  
  // Toggle status of a vehicle location
  const toggleStatus = (id, currentStatus) => {
    const updatedVehicleLocations = vehicleLocations.map(vl => 
      vl.id === id ? { ...vl, status: currentStatus === 'active' ? 'inactive' : 'active' } : vl
    );
    setVehicleLocations(updatedVehicleLocations);
    toast.success(`Vehicle location ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
  };
  
  // Delete a vehicle location
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle location?')) {
      const updatedVehicleLocations = vehicleLocations.filter(vl => vl.id !== id);
      setVehicleLocations(updatedVehicleLocations);
      toast.success('Vehicle location deleted successfully');
    }
  };
  
  // Filter vehicle locations based on search term and dropdown selections
  const filteredVehicleLocations = vehicleLocations.filter(vl => {
    const cabType = cabTypes.find(c => c.id === vl.cabTypeId);
    const city = cities.find(c => c.id === vl.cityId);
    
    const matchesSearch = !searchTerm || 
      (cabType && cabType.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (city && city.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCabType = !selectedCabType || vl.cabTypeId === parseInt(selectedCabType);
    const matchesCity = !selectedCity || vl.cityId === parseInt(selectedCity);
    
    return matchesSearch && matchesCabType && matchesCity;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicle Location Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Vehicle Location
        </button>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vehicle or city"
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="cabType" className="block text-sm font-medium text-gray-700 mb-1">Filter by Vehicle Type</label>
            <select
              id="cabType"
              value={selectedCabType}
              onChange={(e) => setSelectedCabType(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Vehicle Types</option>
              {cabTypes.map(cab => (
                <option key={cab.id} value={cab.id}>{cab.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Filter by City</label>
            <select
              id="city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCabType('');
                setSelectedCity('');
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Vehicle Locations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicleLocations.length > 0 ? (
                  filteredVehicleLocations.map((vl) => {
                    const cabType = cabTypes.find(c => c.id === vl.cabTypeId);
                    const city = cities.find(c => c.id === vl.cityId);
                    
                    return (
                      <tr key={vl.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full object-cover" src={cabType?.imageUrl || 'https://via.placeholder.com/40'} alt={cabType?.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{cabType?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{cabType?.description.substring(0, 30) || ''}{cabType?.description.length > 30 ? '...' : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{city?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{city?.state || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vl.availability} vehicles</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vl.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {vl.status.charAt(0).toUpperCase() + vl.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleOpenModal(vl)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(vl.id, vl.status)}
                            className={`${vl.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} mr-3`}
                          >
                            {vl.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(vl.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No vehicle locations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add/Edit Vehicle Location Modal */}
      {modalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {currentVehicleLocation ? 'Edit Vehicle Location' : 'Add New Vehicle Location'}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cabTypeId" className="block text-sm font-medium text-gray-700">Vehicle Type*</label>
                      <select
                        id="cabTypeId"
                        name="cabTypeId"
                        value={formData.cabTypeId}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select a vehicle type</option>
                        {cabTypes.map(cab => (
                          <option key={cab.id} value={cab.id}>{cab.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="cityId" className="block text-sm font-medium text-gray-700">City*</label>
                      <select
                        id="cityId"
                        name="cityId"
                        value={formData.cityId}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select a city</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="availability" className="block text-sm font-medium text-gray-700">Available Vehicles*</label>
                      <input
                        type="number"
                        id="availability"
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    {currentVehicleLocation && (
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {currentVehicleLocation ? 'Update' : 'Add'}
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

export default VehicleLocations;
