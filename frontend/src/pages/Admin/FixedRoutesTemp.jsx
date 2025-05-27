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

  // Fetch all fixed routes, cities, and cab types on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch fixed routes without authentication
        const routes = await getAllFixedRoutes();
        setFixedRoutes(routes);

        // Fetch cities
        const citiesResponse = await axios.get(`${API_URL}/city`);
        if (citiesResponse.data.success) {
          setCities(citiesResponse.data.data);
        }

        // Fetch cab types
        const cabTypesResponse = await axios.get(`${API_URL}/cab/types`);
        if (cabTypesResponse.data.success) {
          setCabTypes(cabTypesResponse.data.data);
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

    // Create a mock token for authentication
    const mockToken = 'demo-access-token';

    try {
      setIsLoading(true);
      
      if (isEditing && currentRoute) {
        // Update existing route
        const response = await updateFixedRoute(
          currentRoute._id,
          formData,
          mockToken
        );
        
        if (response.success) {
          toast.success('Fixed route updated successfully');
          // Update the fixed routes list
          setFixedRoutes(prev => prev.map(route => 
            route._id === currentRoute._id ? response.data : route
          ));
        }
      } else {
        // Create new route
        const response = await createFixedRoute(formData, mockToken);
        
        if (response.success) {
          toast.success('Fixed route created successfully');
          // Add the new route to the list
          setFixedRoutes(prev => [...prev, response.data]);
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

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fixed route?')) {
      return;
    }

    // Create a mock token for authentication
    const mockToken = 'demo-access-token';

    try {
      setIsLoading(true);
      const response = await deleteFixedRoute(id, mockToken);
      
      if (response.success) {
        toast.success('Fixed route deleted successfully');
        // Remove the deleted route from the list
        setFixedRoutes(prev => prev.filter(route => route._id !== id));
      }
    } catch (error) {
      console.error('Error deleting fixed route:', error);
      toast.error(error.message || 'Failed to delete fixed route');
    } finally {
      setIsLoading(false);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">From City *</label>
                <select
                  name="fromCityId"
                  value={formData.fromCityId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Origin City</option>
                  {cities.map(city => (
                    <option key={city._id} value={city._id}>{city.name}</option>
                  ))}
                </select>
              </div>

              {/* To City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To City *</label>
                <select
                  name="toCityId"
                  value={formData.toCityId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Destination City</option>
                  {cities.map(city => (
                    <option key={city._id} value={city._id}>{city.name}</option>
                  ))}
                </select>
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
                        onClick={() => handleDelete(route._id)}
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
