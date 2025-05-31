import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaTimesCircle, FaSave } from 'react-icons/fa';
import { getAllCities, getCityManagementList, addCity, updateCity, deleteCity, setCityToEdit } from '../../features/admin/adminSlice';
import AdminLayout from '../../layouts/AdminLayout';

const CityManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCityName, setEditCityName] = useState('');
  const [editCityCode, setEditCityCode] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);

  const dispatch = useDispatch();
  
  const { cities, isLoading, isSuccess, isError, message, cityToEdit } = useSelector((state) => state.admin);
  
  useEffect(() => {
    dispatch(getCityManagementList());
  }, [dispatch]);
  
  useEffect(() => {
    // Filter cities based on search term
    if (cities && cities.length > 0) {
      const filtered = cities.filter((city) => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [cities, searchTerm]);
  
  useEffect(() => {
    // For success/error messages
    if (isSuccess) {
      toast.success(message);
    }
    
    if (isError) {
      toast.error(message);
    }
  }, [isSuccess, isError, message]);
  
  useEffect(() => {
    // For edit modal
    if (cityToEdit) {
      setEditCityName(cityToEdit.name);
      setEditCityCode(cityToEdit.code);
      setShowEditModal(true);
    }
  }, [cityToEdit]);
  
  const handleAddCity = (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!cityName.trim()) {
      toast.error('City name cannot be empty');
      return;
    }
    
    if (!cityCode.trim()) {
      toast.error('City code cannot be empty');
      return;
    }
    
    // Validate city code format (should be 2-5 uppercase letters)
    const codePattern = /^[A-Z]{2,5}$/;
    if (!codePattern.test(cityCode.toUpperCase())) {
      toast.error('City code should be 2-5 uppercase letters (e.g., NYC, LON, DEL)');
      return;
    }
    
    // Check for duplicate city code
    const isDuplicateCode = cities.some(city => 
      city.code.toUpperCase() === cityCode.toUpperCase()
    );
    
    if (isDuplicateCode) {
      toast.error(`City code '${cityCode}' already exists. Please use a unique code.`);
      return;
    }
    
    // Create a new city with proper formatting
    const newCity = {
      name: cityName.trim(),
      code: cityCode.toUpperCase().trim(),
    };
    
    // Show toast with unique ID to prevent duplicates
    toast.info('Adding new city...', { toastId: `add-city-${cityCode}` });
    
    // Dispatch action with admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    dispatch(addCity({ cityData: newCity, token: adminToken }));
    
    // Reset form and close modal
    setCityName('');
    setCityCode('');
    setShowAddModal(false);
  };
  
  const handleEditCity = (city) => {
    dispatch(setCityToEdit(city));
  };
  
  const handleUpdateCity = (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!editCityName.trim()) {
      toast.error('City name cannot be empty');
      return;
    }
    
    if (!editCityCode.trim()) {
      toast.error('City code cannot be empty');
      return;
    }
    
    // Validate city code format (should be 2-5 uppercase letters)
    const codePattern = /^[A-Z]{2,5}$/;
    if (!codePattern.test(editCityCode.toUpperCase())) {
      toast.error('City code should be 2-5 uppercase letters (e.g., NYC, LON, DEL)');
      return;
    }
    
    // Check for duplicate city code, excluding the current city
    const isDuplicateCode = cities.some(city => 
      city.code.toUpperCase() === editCityCode.toUpperCase() && 
      city._id !== cityToEdit._id
    );
    
    if (isDuplicateCode) {
      toast.error(`City code '${editCityCode}' already exists. Please use a unique code.`);
      return;
    }
    
    // Create updated city object with proper formatting
    const updatedCity = {
      name: editCityName.trim(),
      code: editCityCode.toUpperCase().trim(),
    };
    
    // Show toast with unique ID to prevent duplicates
    toast.info('Updating city...', { toastId: `update-city-${cityToEdit._id}` });
    
    // Dispatch action with admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    dispatch(updateCity({ 
      cityId: cityToEdit._id,
      cityData: updatedCity,
      token: adminToken
    }));
    
    // Close modal
    setShowEditModal(false);
  };
  
  const openDeleteModal = (city) => {
    setCityToDelete(city);
    setDeleteModalOpen(true);
  };
  
  const handleDeleteCity = () => {
    if (cityToDelete) {
      // Add confirmation toast with unique ID
      toast.info(`Deleting city ${cityToDelete.name}...`, { toastId: `delete-city-${cityToDelete._id}` });
      
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminToken');
      
      // Dispatch delete action with city ID and token
      dispatch(deleteCity({ 
        cityId: cityToDelete._id,
        token: adminToken
      }));
      
      // Close modal and reset state
      setDeleteModalOpen(false);
      setCityToDelete(null);
    }
  };
  
  const closeAddModal = () => {
    setCityName('');
    setCityCode('');
    setShowAddModal(false);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    dispatch(setCityToEdit(null));
  };
  
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCityToDelete(null);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">City Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <FaPlus className="mr-1" /> Add New City
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search cities by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border text-blue-500" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                      No cities found
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((city) => (
                    <tr key={city._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{city.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{city.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditCity(city)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit className="text-xl" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(city)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New City</h2>
              <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-800">
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddCity}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cityName">
                  City Name
                </label>
                <input
                  type="text"
                  id="cityName"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cityCode">
                  City Code
                </label>
                <input
                  type="text"
                  id="cityCode"
                  value={cityCode}
                  onChange={(e) => setCityCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city code (e.g. NYC, LON)"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
                >
                  <FaSave className="mr-1" /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit City Modal */}
      {showEditModal && cityToEdit && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit City</h2>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-800">
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleUpdateCity}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editCityName">
                  City Name
                </label>
                <input
                  type="text"
                  id="editCityName"
                  value={editCityName}
                  onChange={(e) => setEditCityName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editCityCode">
                  City Code
                </label>
                <input
                  type="text"
                  id="editCityCode"
                  value={editCityCode}
                  onChange={(e) => setEditCityCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city code (e.g. NYC, LON)"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
                >
                  <FaSave className="mr-1" /> Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && cityToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Delete City</h2>
              <button onClick={closeDeleteModal} className="text-gray-500 hover:text-gray-800">
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-bold">{cityToDelete.name}</span>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCity}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CityManagement;
