import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';

const LocationInput = ({ 
  value, 
  onChange, 
  placeholder, 
  label,
  className = '',
  iconClassName = ''
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const API_URL = 'http://localhost:5000/api';

  // Fetch city suggestions from the API
  useEffect(() => {
    const getSuggestions = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch cities from API that match the search term
        const response = await axios.get(`${API_URL}/city?search=${encodeURIComponent(value)}`);
        
        if (response.data && response.data.success) {
          setSuggestions(response.data.data || []);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        // Fallback behavior when API fails
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };


    const debounceTimer = setTimeout(() => {
      getSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [value, API_URL]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
      )}
      <div className="relative group">
        <FaMapMarkerAlt className={`absolute left-3 top-3 text-primary z-10 ${iconClassName}`} />
        <input 
          type="text" 
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className="w-full border border-gray-300 bg-white rounded-xl pl-10 py-2 sm:py-2.5 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 group-hover:border-primary"
          placeholder={placeholder}
        />
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && value.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-gray-500 text-sm text-center">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion) => (
                <li 
                  key={suggestion._id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center text-sm"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <FaMapMarkerAlt className="mr-2 text-primary" />
                  <span>{suggestion.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-gray-500 text-sm text-center">No locations found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
