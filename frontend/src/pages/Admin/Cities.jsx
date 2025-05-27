import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaPlus, FaEdit, FaToggleOn, FaToggleOff, FaSearch } from 'react-icons/fa';

const Cities = () => {
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = 'http://localhost:5000/api';

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    popular: false
  });
  
  // Fetch cities from API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/city`);
        if (response.data.success) {
          // Format the city data to match our component structure
          const formattedCities = response.data.data.map(city => ({
            _id: city._id,
            name: city.name,
            state: city.state || '',
            popular: city.isPopular || false,
            status: city.active ? 'active' : 'inactive'
          }));
          setCities(formattedCities);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        toast.error('Failed to load cities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  const handleOpenModal = (city = null) => {
    if (city) {
      setFormData({
        name: city.name,
        state: city.state,
        popular: city.popular
      });
      setCurrentCity(city);
    } else {
      setFormData({
        name: '',
        state: '',
        popular: false
      });
      setCurrentCity(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.state) {
      toast.error('City name and state are required!');
      return;
    }
    
    // Capitalize the first letter of city name
    const cityName = formData.name.trim();
    const capitalizedName = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    
    // Prepare the API data
    const cityData = {
      name: capitalizedName,
      state: formData.state,
      isPopular: formData.popular,
      active: true
    };
    
    try {
      setIsLoading(true);
      
      if (currentCity) {
        // Update existing city
        const response = await axios.put(`${API_URL}/city/${currentCity._id}`, cityData);
        
        if (response.data.success) {
          // Update the city in local state
          const updatedCities = cities.map(city => 
            city._id === currentCity._id ? { 
              ...city, 
              name: capitalizedName, 
              state: formData.state, 
              popular: formData.popular 
            } : city
          );
          setCities(updatedCities);
          toast.success('City updated successfully!');
        }
      } else {
        // Add new city
        const response = await axios.post(`${API_URL}/city`, cityData);
        
        if (response.data.success) {
          // Add the new city to local state
          const newCity = {
            _id: response.data.data._id,
            name: capitalizedName,
            state: formData.state,
            popular: formData.popular,
            status: 'active'
          };
          setCities([...cities, newCity]);
          toast.success('City added successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving city:', error);
      toast.error(error.response?.data?.message || 'Failed to save city');
    } finally {
      setIsLoading(false);
      handleCloseModal();
    }
  };

  const toggleStatus = async (cityId, currentStatus) => {
    try {
      setIsLoading(true);
      const city = cities.find(c => c._id === cityId);
      if (!city) return;
      
      const newStatus = currentStatus === 'active' ? false : true;
      
      // Update city active status in the backend
      const response = await axios.put(`${API_URL}/city/${cityId}`, {
        active: newStatus
      });
      
      if (response.data.success) {
        // Update cities in local state
        const updatedCities = cities.map(city => 
          city._id === cityId ? { ...city, status: newStatus ? 'active' : 'inactive' } : city
        );
        setCities(updatedCities);
        toast.success(`City ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling city status:', error);
      toast.error('Failed to update city status');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePopular = async (cityId, isCurrentlyPopular) => {
    try {
      setIsLoading(true);
      const city = cities.find(c => c._id === cityId);
      if (!city) return;
      
      // Update city popularity in the backend
      const response = await axios.put(`${API_URL}/city/${cityId}`, {
        isPopular: !isCurrentlyPopular
      });
      
      if (response.data.success) {
        // Update cities in local state
        const updatedCities = cities.map(city => 
          city._id === cityId ? { ...city, popular: !isCurrentlyPopular } : city
        );
        setCities(updatedCities);
        toast.success(`City marked as ${!isCurrentlyPopular ? 'popular' : 'not popular'}`);
      }
    } catch (error) {
      console.error('Error toggling city popularity:', error);
      toast.error('Failed to update city popularity');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">City Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New City
        </button>
      </div>
      
      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
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
              placeholder="Search cities by name or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Cities Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left">City Name</th>
                <th className="py-3 px-4 text-left">State</th>
                <th className="py-3 px-4 text-center">Popular</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <tr key={city._id} className="border-t">
                    <td className="py-3 px-4">{city.name}</td>
                    <td className="py-3 px-4">{city.state}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => togglePopular(city._id, city.popular)}
                        className={`w-5 h-5 rounded ${city.popular ? 'bg-yellow-400' : 'bg-gray-300'}`}
                        title={city.popular ? "Remove from popular cities" : "Mark as popular city"}
                      >
                        {city.popular && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        city.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {city.status.charAt(0).toUpperCase() + city.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(city)}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(city._id, city.status)}
                          className={`px-3 py-1 rounded text-sm ${
                            city.status === 'active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {city.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 px-4 text-center text-gray-500" colSpan="5">
                    {searchTerm ? 'No cities matching search criteria' : 'No cities found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit City Modal */}
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
                  {currentCity ? 'Edit City' : 'Add New City'}
                </h3>
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">City Name*</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State*</label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-center mb-4">
                    <input
                      id="popular"
                      name="popular"
                      type="checkbox"
                      checked={formData.popular}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="popular" className="ml-2 block text-sm text-gray-700">
                      Mark as Popular City
                    </label>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {currentCity ? 'Update City' : 'Add City'}
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

export default Cities;
