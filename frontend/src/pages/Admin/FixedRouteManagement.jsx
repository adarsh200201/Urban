import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createFixedRoute, getAllFixedRoutes, updateFixedRoute, deleteFixedRoute } from '../../services/routesService';

const FixedRouteManagement = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [fixedRoutes, setFixedRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [cabTypes, setCabTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [formData, setFormData] = useState({
    fromCityId: '',
    toCityId: '',
    cabTypeId: '',
    price: '',
    estimatedTime: '',
    distance: ''
  });

  // API URL
  const API_URL = 'http://localhost:5000/api';
  
  // Mock token for development (replace with actual auth token in production)
  const mockToken = localStorage.getItem('adminToken') || 'mock-admin-token';
  
  // Mock data for development when API fails
  const mockCities = [
    { _id: 'city1', name: 'Rajkot' },
    { _id: 'city2', name: 'Delhi' },
    { _id: 'city3', name: 'Mumbai' },
    { _id: 'city4', name: 'Bangalore' },
    { _id: 'city5', name: 'Hyderabad' }
  ];
  
  const mockCabTypes = [
    { _id: 'cab1', name: 'Sedan', imageUrl: '' },
    { _id: 'cab2', name: 'SUV', imageUrl: '' },
    { _id: 'cab3', name: 'Luxury', imageUrl: '' },
    { _id: 'cab4', name: 'Hatchback', imageUrl: '' }
  ];

  // Fetch all fixed routes, cities, and cab types on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch fixed routes
        let routesData = [];
        try {
          const routesResponse = await axios.get(`${API_URL}/fixed-routes`);
          if (routesResponse.data.success) {
            routesData = routesResponse.data.data;
          } else {
            // Fallback to service function if direct API fails
            routesData = await getAllFixedRoutes();
          }
          setFixedRoutes(routesData);
        } catch (routeError) {
          console.warn('Failed to fetch fixed routes:', routeError);
          toast.warning('Using local data for routes. Some features may be limited.');
        }

        // Fetch cities - with fallback to mock data
        try {
          const citiesResponse = await axios.get(`${API_URL}/city`);
          if (citiesResponse.data.success) {
            // Get only active cities and format for dropdowns
            const activeCities = citiesResponse.data.data.filter(city => city.active !== false);
            setCities(activeCities);
          } else {
            throw new Error('City data format unexpected');
          }
        } catch (cityError) {
          console.warn('Failed to fetch cities, using mock data instead:', cityError);
          setCities(mockCities);
          toast.warning('Using sample city data. Please add real cities in City Management.');
        }

        // Fetch cab types - with fallback to mock data
        try {
          const cabTypesResponse = await axios.get(`${API_URL}/cabtype/all`);
          if (cabTypesResponse.data.success) {
            setCabTypes(cabTypesResponse.data.data);
          } else {
            throw new Error('Cab type data format unexpected');
          }
        } catch (cabError) {
          console.warn('Failed to fetch cab types, using mock data instead:', cabError);
          setCabTypes(mockCabTypes);
          toast.warning('Using sample cab data. Please add real cab types.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fromCityId || !formData.toCityId || !formData.cabTypeId || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Check if from and to cities are the same
    if (formData.fromCityId === formData.toCityId) {
      toast.error('Origin and destination cities cannot be the same');
      return;
    }
    
    // Get actual token from local storage or state management
    let token = localStorage.getItem('token');
    if (!token) {
      // Fallback to mock token for development
      token = 'demo-access-token';
      console.warn('Using mock token - authentication may fail in production');
    }

    try {
      setIsLoading(true);
      
      // Convert string values to numbers where needed
      const formattedData = {
        ...formData,
        price: Number(formData.price),
        distance: Number(formData.distance),
        estimatedTime: Number(formData.estimatedTime)
      };
      
      if (isEditing && currentRoute) {
        try {
          // Try API first
          const response = await updateFixedRoute(
            currentRoute._id,
            formattedData,
            localStorage.getItem('adminToken')
          );
          
          if (response.success) {
            toast.success('Fixed route updated successfully');
            // Update the fixed routes list
            setFixedRoutes(prev => prev.map(route => 
              route._id === currentRoute._id ? response.data : route
            ));
          }
        } catch (apiError) {
          // Fallback to client-side mock update
          console.warn('API not available, using client-side mock update');
          const updatedRoute = {
            ...currentRoute,
            ...formattedData,
            fromCity: cities.find(city => city._id === formattedData.fromCityId),
            toCity: cities.find(city => city._id === formattedData.toCityId),
            cabType: cabTypes.find(cab => cab._id === formattedData.cabTypeId)
          };
          
          setFixedRoutes(prev => prev.map(route => 
            route._id === currentRoute._id ? updatedRoute : route
          ));
          
          toast.success('Fixed route updated (local mode)');
        }
      } else {
        // Create new route
        try {
          const response = await createFixedRoute(formattedData, localStorage.getItem('adminToken'));
          
          if (response.success) {
            toast.success('Fixed route created successfully');
            // Add the new route to the list
            setFixedRoutes(prev => [...prev, response.data]);
          }
        } catch (apiError) {
          // Fallback to client-side mock creation
          console.warn('API not available, using client-side mock creation');
          const newRoute = {
            _id: 'mock-' + Date.now(),
            ...formattedData,
            fromCity: cities.find(city => city._id === formattedData.fromCityId),
            toCity: cities.find(city => city._id === formattedData.toCityId),
            cabType: cabTypes.find(cab => cab._id === formattedData.cabTypeId),
            active: true,
            createdAt: new Date().toISOString()
          };
          
          setFixedRoutes(prev => [...prev, newRoute]);
          toast.success('Fixed route created (local mode)');
        }
      }
      
      // Reset form and state
      setFormData({
        fromCityId: '',
        toCityId: '',
        cabTypeId: '',
        price: '',
        estimatedTime: '',
        distance: ''
      });
      setShowForm(false);
      setIsEditing(false);
      setCurrentRoute(null);
    } catch (error) {
      console.error('Error saving fixed route:', error);
      toast.error(error.message || 'Failed to save fixed route');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (route) => {
    setCurrentRoute(route);
    setFormData({
      fromCityId: route.fromCity._id,
      toCityId: route.toCity._id,
      cabTypeId: route.cabType._id,
      price: route.price,
      estimatedTime: route.estimatedTime,
      distance: route.distance
    });
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle route deletion
  const deleteRoute = async (id) => {
    if (window.confirm('Are you sure you want to delete this fixed route?')) {
      try {
        // Create a mock token for authentication
        const mockToken = 'demo-access-token';
        
        try {
          const response = await deleteFixedRoute(id, mockToken);
          
          if (response.success) {
            toast.success('Fixed route deleted successfully');
            // Remove the deleted route from the list
            setFixedRoutes(prev => prev.filter(route => route._id !== id));
          }
        } catch (apiError) {
          // Fallback to client-side mock deletion
          console.warn('API not available, using client-side mock deletion');
          // Just remove from local state
          setFixedRoutes(prev => prev.filter(route => route._id !== id));
          toast.success('Fixed route deleted (local mode)');
        }
      } catch (error) {
        console.error('Error deleting route:', error);
        toast.error(error.message || 'Failed to delete fixed route');
      }
    }
  };

  // Find city or cab type name by ID
  const getCityName = (id) => {
    const city = cities.find(city => city._id === id);
    return city ? city.name : 'Unknown';
  };

  const getCabTypeName = (id) => {
    const cabType = cabTypes.find(cab => cab._id === id);
    return cabType ? cabType.name : 'Unknown';
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center text-blue-600 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Fixed Route Management</h1>
          <p className="text-gray-600">Create and manage fixed routes with fixed pricing</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setIsEditing(false);
              setCurrentRoute(null);
              setFormData({
                fromCityId: '',
                toCityId: '',
                cabTypeId: '',
                price: '',
                estimatedTime: '',
                distance: ''
              });
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          {showForm ? 'Cancel' : <><FaPlus className="mr-2" /> Add Fixed Route</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit Fixed Route' : 'Create New Fixed Route'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From City <span className="text-red-500">*</span>
                </label>
                <select
                  name="fromCityId"
                  value={formData.fromCityId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Origin City</option>
                  {cities.length > 0 ? (
                    cities.map((city) => (
                      <option key={city._id} value={city._id}>
                        {city.name} {city.state ? `(${city.state})` : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No cities available. Please add cities first.</option>
                  )}
                </select>
                {cities.length === 0 && (
                  <p className="text-yellow-600 text-xs mt-1">
                    No cities found. Please add cities in the City Management section first.
                  </p>
                )}
              </div>
              
              {/* To City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To City <span className="text-red-500">*</span>
                </label>
                <select
                  name="toCityId"
                  value={formData.toCityId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Destination City</option>
                  {cities.length > 0 ? (
                    cities.filter(city => city._id !== formData.fromCityId).map((city) => (
                      <option key={city._id} value={city._id}>
                        {city.name} {city.state ? `(${city.state})` : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No cities available. Please add cities first.</option>
                  )}
                </select>
                {formData.fromCityId && cities.filter(city => city._id !== formData.fromCityId).length === 0 && (
                  <p className="text-yellow-600 text-xs mt-1">
                    Need at least two cities to create a route.
                  </p>
                )}
              </div>

              {/* Cab Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cab Type *</label>
                <select
                  name="cabTypeId"
                  value={formData.cabTypeId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Cab Type</option>
                  {cabTypes.map(cab => (
                    <option key={cab._id} value={cab._id}>{cab.name}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  min="1"
                />
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km) *</label>
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  min="1"
                />
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (hours) *</label>
                <input
                  type="number"
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  min="1"
                  step="0.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Route' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fixed Routes Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cab Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Time (hrs)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : fixedRoutes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No fixed routes available. Click "Add Fixed Route" to create one.
                  </td>
                </tr>
              ) : (
                fixedRoutes.map(route => (
                  <tr key={route._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{route.fromCity?.name || getCityName(route.fromCity)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{route.toCity?.name || getCityName(route.toCity)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{route.cabType?.name || getCabTypeName(route.cabType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{route.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{route.distance}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{route.estimatedTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(route)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteRoute(route._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FixedRouteManagement;
