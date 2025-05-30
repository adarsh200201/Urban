import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaCar, FaPhone, FaUserTie, FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import socketService from '../../utils/socketService';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  // Import API URL from config
  const { API_URL } = require('../../config/apiConfig');
  const DRIVER_API_URL = `${API_URL}/driver`;
  const { user } = useSelector(state => state.auth || {});
  const [totalBookings, setTotalBookings] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cabTypes, setCabTypes] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Initialize socket connection
  useEffect(() => {
    // Connect to socket server
    socketService.connect();
    
    // Join admin room to receive updates
    socketService.joinAdminRoom();
    
    // Listen for booking updates (when a driver is assigned)
    socketService.onBookingUpdated((data) => {
      console.log('Received real-time booking update:', data);
      
      // Update the local state
      setBookings(prevBookings => {
        // Find the booking that was updated
        const updatedBookings = prevBookings.map(booking => {
          if (booking._id === data.booking._id) {
            // Create updated booking with driver information
            return {
              ...booking,
              status: 'assigned',
              driver: {
                _id: data.driver._id,
                name: data.driver.name,
                phone: data.driver.phone,
                vehicleType: data.driver.vehicleType,
                vehicleModel: data.driver.vehicleModel,
                vehicleNumber: data.driver.vehicleNumber
              }
            };
          }
          return booking;
        });
        return updatedBookings;
      });
      
      toast.success(`Driver ${data.driver.name} assigned to booking successfully`);
    });
    
    // Clean up on component unmount
    return () => {
      socketService.disconnect();
    };
  }, []);
  
  // Fetch bookings from the database
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        let config = {};
        
        // If user is authenticated, use the token for authorization
        if (user && user.token) {
          config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
        }
        
        // Fetch bookings from the API
        const response = await axios.get(`${API_URL}/booking/admin/all`, config);
        
        if (response.data && response.data.success) {
          console.log('MongoDB booking data:', response.data.data);
          // Transform the data to match our component structure
          const formattedBookings = response.data.data.map(booking => {
            // Handle MongoDB location objects (they have name and state properties)
            const fromLocation = booking.pickupLocation?.name 
              ? `${booking.pickupLocation.name}${booking.pickupLocation.state ? `, ${booking.pickupLocation.state}` : ''}` 
              : (booking.fromCity || booking.from || 'N/A');
              
            const toLocation = booking.dropLocation?.name 
              ? `${booking.dropLocation.name}${booking.dropLocation.state ? `, ${booking.dropLocation.state}` : ''}` 
              : (booking.toCity || booking.to || 'N/A');
            
            // Handle MongoDB cab type object
            const cabTypeName = booking.cabType?.name || booking.cabName || 'Standard Cab';
            
            return {
              _id: booking._id || booking.bookingId || `BK${Math.floor(Math.random() * 10000)}`,
              bookingId: booking.bookingId,
              user: {
                name: booking.userName || booking.user?.name || 'Guest User',
                email: booking.userEmail || booking.user?.email || 'guest@example.com',
                phone: booking.userPhone || booking.user?.phone || 'N/A'
              },
              from: fromLocation,
              to: toLocation,
              date: new Date(booking.pickupDate || booking.travelDate || booking.date || Date.now()).toLocaleDateString(),
              status: booking.status || 'pending',
              amount: booking.totalAmount || booking.fare || booking.amount || 0,
              cabType: cabTypeName,
              driver: booking.driver || null
            };
          });
          
          setBookings(formattedBookings);
          setTotalBookings(response.data.total || formattedBookings.length);
          console.log('Bookings loaded from database:', formattedBookings);
        } else {
          // If API call fails or returns no data, try localStorage as fallback
          tryLocalStorageFallback();
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // If API call fails, try localStorage as fallback
        tryLocalStorageFallback();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fallback to localStorage when API fails
    const tryLocalStorageFallback = () => {
      try {
        // Try to get all bookings from localStorage
        const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
        if (userBookings.length > 0) {
          console.log('Using localStorage bookings as fallback');
          
          const formattedBookings = userBookings.map(booking => ({
            _id: booking.id || booking.bookingId || `BK${Math.floor(Math.random() * 10000)}`,
            user: {
              name: booking.userName || 'Guest User',
              email: booking.userEmail || 'guest@example.com',
              phone: booking.userPhone || 'N/A'
            },
            from: booking.from || booking.pickupLocation || booking.fromCity || 'N/A',
            to: booking.to || booking.dropLocation || booking.toCity || 'N/A',
            date: new Date(booking.date || booking.pickupDate || booking.travelDate || Date.now()).toLocaleDateString(),
            status: booking.status || 'pending',
            amount: booking.amount || booking.totalAmount || booking.fare || 0,
            cabType: booking.cabType || booking.cabName || 'Standard Cab',
            driver: booking.driver || null
          }));
          
          setBookings(formattedBookings);
          setTotalBookings(formattedBookings.length);
        } else {
          // If no bookings in localStorage, create demo data
          createDemoData();
        }
      } catch (error) {
        console.error('Error using localStorage fallback:', error);
        createDemoData();
      }
    };
    
    // Create demo data if both API and localStorage fail
    const createDemoData = () => {
      console.log('Using demo data');
      const demoBookings = [
        { 
          _id: 'BK1001', 
          user: { name: 'John Doe', email: 'john@example.com', phone: '9876543210' },
          from: 'Delhi',
          to: 'Agra', 
          date: '2025-04-15', 
          status: 'completed',
          amount: 2500,
          cabType: 'Sedan',
          driver: { name: 'Ramesh Kumar', phone: '8765432109', carNumber: 'DL01AB1234', status: 'assigned' }
        },
        { 
          _id: 'BK1002', 
          user: { name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211' },
          from: 'Mumbai',
          to: 'Pune', 
          date: '2025-04-20', 
          status: 'confirmed',
          amount: 3200,
          cabType: 'SUV',
          driver: null
        },
        { 
          _id: 'BK1003', 
          user: { name: 'Raj Kumar', email: 'raj@example.com', phone: '9876543212' },
          from: 'Bangalore',
          to: 'Mysore', 
          date: '2025-04-22', 
          status: 'pending',
          amount: 2800,
          cabType: 'Sedan',
          driver: null
        }
      ];
      setBookings(demoBookings);
      setTotalBookings(demoBookings.length);
    };
    
    fetchBookings();
  }, [user, API_URL, page, limit, statusFilter]);
  
  // Fetch all available drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      // Only fetch if needed
      if (drivers.length === 0) {
        try {
          const config = user && user.token ? {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          } : {};

          // Fetch both drivers and cab types to map them properly
          // First fetch drivers
          const driversResponse = await axios.get(`${DRIVER_API_URL}/available`, config);
          const availableDrivers = driversResponse.data.data || [];

          // Then fetch cab types to map IDs to names
          let cabTypesMap = {};
          let cabTypesFetched = false;
          
          // Step 1: Try the new dedicated cab type endpoint
          try {
            const cabTypesResponse = await axios.get(`${API_URL}/cabtype/all`, config);
            if (cabTypesResponse.data && cabTypesResponse.data.data) {
              cabTypesResponse.data.data.forEach(cabType => {
                cabTypesMap[cabType._id] = cabType.name;
              });
              cabTypesFetched = true;
              console.log('Successfully fetched cab types from /cabtype/all endpoint');
            }
          } catch (error) {
            console.error('Error fetching from /cabtype/all endpoint:', error);
          }
          
          // Step 3: Last resort - try the /cab endpoint
          if (!cabTypesFetched) {
            try {
              const fallbackResponse = await axios.get(`${API_URL}/cab`, config);
              if (fallbackResponse.data && fallbackResponse.data.data) {
                fallbackResponse.data.data.forEach(cabType => {
                  cabTypesMap[cabType._id] = cabType.name;
                });
                console.log('Successfully fetched cab types from fallback /cab endpoint');
              }
            } catch (fallbackError) {
              console.error('Error fetching from all cab type endpoints:', fallbackError);
              // Create a default mapping if all else fails
              console.log('Using default cab type mapping as last resort');
            }
          }
          
          setCabTypes(cabTypesMap);
          
          // Format the drivers data
          const formattedDrivers = availableDrivers.map(driver => {
            // Get the vehicle type ID and name from the driver record
            let vehicleTypeId = null;
            let vehicleTypeName = 'Unknown';
            
            // Handle different possible driver data structures
            if (driver.vehicleType) {
              if (typeof driver.vehicleType === 'string') {
                // ID reference directly
                vehicleTypeId = driver.vehicleType;
              } else if (driver.vehicleType._id) {
                // Populated mongoose object
                vehicleTypeId = driver.vehicleType._id;
                // If the object has a name, use it directly
                if (driver.vehicleType.name) {
                  vehicleTypeName = driver.vehicleType.name;
                }
              }
            }
            
            // Map driver data to our component format
            return {
              id: driver._id,
              name: driver.name || 'Unknown Driver',
              phone: driver.phone || 'N/A',
              email: driver.email || 'N/A',
              status: driver.status || 'available',
              carType: driver.vehicle?.model || vehicleTypeName || 'Standard',
              carNumber: driver.vehicle?.registrationNumber || 'N/A',
              vehicleTypeId: vehicleTypeId,
              location: driver.location || 'N/A',
              rating: driver.rating || 4.5
            };
          });
          
          // Update state with the formatted driver data
          setDrivers(formattedDrivers);
        } catch (error) {
          console.error('Error fetching drivers:', error);
          // Set some demo drivers if API fails
          if (drivers.length === 0) {
            setDrivers([
              { id: 'D001', name: 'John Driver', phone: '9876543210', status: 'available', carType: 'Sedan', carNumber: 'DL-01-AB-1234', rating: 4.7 },
              { id: 'D002', name: 'Mary Wheels', phone: '8765432109', status: 'available', carType: 'SUV', carNumber: 'DL-02-CD-5678', rating: 4.9 },
              { id: 'D003', name: 'Sam Speed', phone: '7654321098', status: 'available', carType: 'Hatchback', carNumber: 'DL-03-EF-9012', rating: 4.5 }
            ]);
          }
        }
      } else {
        console.log('Drivers already loaded, skipping fetch');
      }
    };
    
    fetchDrivers();
  }, [drivers.length, user, DRIVER_API_URL, API_URL]);
  
  // Update booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    setIsLoading(true);
    try {
      let config = {};
      
      // If user is authenticated, use the token for authorization
      if (user && user.token) {
        config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
      }
      
      // Update the booking status on the server
      const response = await axios.put(`${API_URL}/booking/${bookingId}/status`, { status: newStatus }, config);
      
      if (response.data && response.data.success) {
        // Update local state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId ? { ...booking, status: newStatus } : booking
          )
        );
        toast.success(`Booking ${bookingId} status updated to ${newStatus}`);
      } else {
        // If API call fails, still update the UI for demo purposes
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId ? { ...booking, status: newStatus } : booking
          )
        );
        toast.success(`Booking ${bookingId} status updated to ${newStatus} (local only)`);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      // Still update the UI for demo purposes even if API fails
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
      toast.info(`Booking status updated locally. Unable to update on server.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open driver assignment modal
  const openDriverAssignModal = (booking) => {
    setSelectedBooking(booking);
    setShowDriverModal(true);
  };
  
  // Close driver assignment modal
  const closeDriverAssignModal = () => {
    setSelectedBooking(null);
    setShowDriverModal(false);
  };
  
  // Assign driver to booking
  const assignDriver = async (driverId) => {
    if (!selectedBooking) return;
    
    // Find the selected driver
    const selectedDriver = drivers.find(driver => driver.id === driverId || driver._id === driverId);
    if (!selectedDriver) return;
    
    // Use MongoDB _id instead of id
    const mongoDbDriverId = selectedDriver._id || driverId;
    
    try {
      setIsLoading(true);
      let config = {};
      
      if (user && user.token) {
        config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
      }
      
      // Attempt to assign driver with retries
      let attempt = 0;
      const maxAttempts = 3;
      let apiSuccess = false;
      
      while (attempt < maxAttempts && !apiSuccess) {
        try {
          console.log(`Attempting to assign driver ${mongoDbDriverId} to booking ${selectedBooking._id}`);
          
          // Make API call to assign driver using only the expected parameters
          const response = await axios.put(`${API_URL}/booking/assign-driver`, {
            bookingId: selectedBooking._id,
            driverId: mongoDbDriverId
          }, config);
          
          if (response.data && response.data.success) {
            apiSuccess = true;
            console.log('Driver assigned successfully via API');
          } else {
            throw new Error('Invalid API response format');
          }
        } catch (apiError) {
          console.error(`Attempt ${attempt + 1}/${maxAttempts} failed:`, apiError);
          attempt++;
          
          if (attempt < maxAttempts) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // Update driver status to assigned
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver.id === driverId ? { ...driver, status: 'assigned' } : driver
        )
      );
      
      // Update the booking with the assigned driver
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === selectedBooking._id 
            ? { 
                ...booking, 
                driver: { 
                  id: selectedDriver.id,
                  name: selectedDriver.name,
                  phone: selectedDriver.phone, 
                  carNumber: selectedDriver.carNumber,
                  status: 'assigned'
                } 
              } 
            : booking
        )
      );
      
      if (apiSuccess) {
        toast.success(`Driver ${selectedDriver.name} assigned to booking ${selectedBooking._id}`);
      } else {
        toast.warning(`Unable to connect to server. Driver assigned locally only.`);
      }
    } catch (error) {
      console.error('Error in assignment process:', error);
      toast.error(`Failed to assign driver. Please try again.`);
    } finally {
      setIsLoading(false);
      closeDriverAssignModal();
    }
  };
  
  // Remove assigned driver
  const removeDriver = async (bookingId) => {
    // Find the booking
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking || !booking.driver) {
      toast.error('No driver assigned to this booking');
      return;
    }
    
    try {
      setIsLoading(true);
      let config = {};
      
      if (user && user.token) {
        config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        };
      } else {
        toast.error('Authentication required');
        setIsLoading(false);
        return;
      }
      
      // Attempt to remove driver with retries
      let attempt = 0;
      const maxAttempts = 3;
      let apiSuccess = false;
      
      while (attempt < maxAttempts && !apiSuccess) {
        try {
          // Fix 1: Use the RESTful approach by including bookingId in the URL
          const response = await axios.put(`${API_URL}/booking/${bookingId}/remove-driver`, {}, config);
          
          // Fix 2: Alternative approach if the above doesn't work
          if (!response.data || !response.data.success) {
            // Try alternative endpoint structure
            console.log('Trying alternative endpoint...');
            const altResponse = await axios.post(`${API_URL}/booking/remove-driver/${bookingId}`, {}, config);
            
            if (altResponse.data && altResponse.data.success) {
              apiSuccess = true;
              console.log('Driver removed successfully via alternative API');
            } else {
              throw new Error('Invalid API response format');
            }
          } else {
            apiSuccess = true;
            console.log('Driver removed successfully via API');
          }
        } catch (apiError) {
          console.error(`Attempt ${attempt + 1}/${maxAttempts} failed:`, apiError);
          
          // If the error has response data, log it for debugging
          if (apiError.response && apiError.response.data) {
            console.error('Error response data:', apiError.response.data);
          }
          
          attempt++;
          
          if (attempt < maxAttempts) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // Even if API call fails, update the UI for better UX
      // Update driver status back to available
      const driverToUpdate = drivers.find(d => d.phone === booking.driver.phone);
      if (driverToUpdate) {
        setDrivers(prevDrivers => 
          prevDrivers.map(driver => 
            driver.id === driverToUpdate.id ? { ...driver, status: 'available' } : driver
          )
        );
      }
      
      // Remove driver from booking
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId ? { ...booking, driver: null, status: 'pending' } : booking
        )
      );
      
      if (apiSuccess) {
        toast.success(`Driver removed from booking ${bookingId}`);
      } else {
        toast.warning(`Unable to connect to server. Driver removed locally only.`);
        // Try to update the booking using updateBookingStatus method for consistency
        updateLocalDriverRemoval(bookingId, booking);
      }
    } catch (error) {
      console.error('Error in removal process:', error);
      toast.error(`Failed to remove driver. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to update local state when removing a driver
  const updateLocalDriverRemoval = (bookingId, booking) => {
    // Update driver status back to available
    const driverToUpdate = drivers.find(d => d.phone === booking.driver.phone);
    if (driverToUpdate) {
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver.id === driverToUpdate.id ? { ...driver, status: 'available' } : driver
        )
      );
    }
    
    // Remove driver from booking
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking._id === bookingId ? { ...booking, driver: null } : booking
      )
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Booking Management</h1>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
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
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="sr-only">Filter by Status</label>
            <select
              id="status"
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <FaCalendarAlt className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Bookings</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <FaUser className="text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Bookings</p>
              <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-full mr-3">
              <FaCar className="text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Available Drivers</p>
              <p className="text-2xl font-bold">{drivers.filter(d => d.status === 'available').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <FaUserTie className="text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Drivers</p>
              <p className="text-2xl font-bold">{drivers.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Loading booking data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Booking ID</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">Route</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Cab Type</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Driver</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="border-t">
                      <td className="py-3 px-4">{booking._id}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{booking.user.name}</div>
                          <div className="text-gray-500 text-sm">{booking.user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">From: {booking.pickupLocation?.name || booking.from || 'Not specified'}</div>
                          <div className="text-gray-500">To: {booking.dropLocation?.name || booking.to || 'Not specified'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{booking.date}</td>
                      <td className="py-3 px-4">{booking.cabType}</td>
                      <td className="py-3 px-4">₹{booking.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirm</option>
                          <option value="completed">Complete</option>
                          <option value="cancelled">Cancel</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {booking.driver ? (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-sm">
                              <FaUserTie className="mr-2 text-blue-600" />
                              <span>
                                {(booking.driver.user && booking.driver.user.name) || booking.driver.name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <FaPhone className="mr-2 text-green-600" />
                              <span>
                                {(booking.driver.user && booking.driver.user.phone) || booking.driver.phone || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <FaCar className="mr-2 text-gray-600" />
                              <span>
                                {booking.driver.vehicleNumber || booking.driver.carNumber || 'N/A'}
                              </span>
                            </div>
                            <button 
                              onClick={() => removeDriver(booking._id)}
                              className="text-xs text-red-600 hover:text-red-800 mt-1"
                            >
                              Remove Driver
                            </button>
                          </div>
                        ) : (
                          booking.status === 'confirmed' ? (
                            <button
                              onClick={() => openDriverAssignModal(booking)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
                            >
                              Assign Driver
                            </button>
                          ) : (
                            <span className="text-gray-500 text-sm">
                              {booking.status === 'pending' ? 'Awaiting confirmation' : 
                               booking.status === 'cancelled' ? 'Booking cancelled' : 
                               'No driver assigned'}
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 px-4 text-center text-gray-500" colSpan="8">
                      {searchTerm || statusFilter !== 'all' ? 'No bookings matching the criteria' : 'No bookings found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalBookings > limit && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(totalBookings / limit) }, (_, i) => i + 1)
              .filter(p => p === 1 || p === Math.ceil(totalBookings / limit) || (p >= page - 1 && p <= page + 1))
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-3 py-1">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))
            }
            
            <button
              onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalBookings / limit)))}
              disabled={page === Math.ceil(totalBookings / limit)}
              className={`px-3 py-1 rounded ${page === Math.ceil(totalBookings / limit) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
      {/* Driver Assignment Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Assign Driver to Booking</h3>
                <button
                  onClick={closeDriverAssignModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Booking Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Booking ID:</span> {selectedBooking?._id}
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span> {selectedBooking?.user.name}
                  </div>
                  <div>
                    <span className="text-gray-600">From:</span> {selectedBooking?.from}
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span> {selectedBooking?.to}
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span> {selectedBooking?.date}
                  </div>
                  <div>
                    <span className="text-gray-600">Cab Type:</span> {selectedBooking?.cabType}
                  </div>
                </div>
              </div>

              <h4 className="font-medium mb-2">Available Drivers for {selectedBooking?.cabType}</h4>
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3 text-left text-sm font-medium">Name</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Contact</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Car Details</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Filter drivers by availability and matching cab type */}
                    {drivers
                      .filter(driver => {
                        // Only show available drivers
                        if (driver.status !== 'available') return false;
                        
                        // Always allow a match in this case regardless of cab type
                        // This ensures drivers show up for the assignment demo purpose
                        
                        // For debugging, log the comparison
                        const bookingCabType = (selectedBooking?.cabType || '').toLowerCase().trim();
                        const driverCabType = (driver.carType || '').toLowerCase().trim();
                        
                        console.log(`Comparing booking cab type: "${bookingCabType}" with driver cab type: "${driverCabType}"`);
                        
                        // Use vehicle type ID to match with booking cab type
                        // This allows us to match by ID instead of hardcoded strings
                        const vehicleTypeMatch = driver.vehicleTypeId && 
                                               cabTypes[driver.vehicleTypeId] && 
                                               cabTypes[driver.vehicleTypeId].toLowerCase().trim() === bookingCabType;
                        
                        // Check if cab types match exactly by name
                        const exactMatch = bookingCabType === driverCabType;
                        
                        // Log when we find a match
                        if (exactMatch || vehicleTypeMatch) {
                          console.log(`\u2705 MATCH FOUND: ${driver.name}'s cab type "${driverCabType}" matches booking cab type "${bookingCabType}"`);
                        }
                        
                        return exactMatch || vehicleTypeMatch;
                      })
                      .map(driver => (
                        <tr key={driver.id} className="hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center">
                              <FaUser className="text-gray-500 mr-2" />
                              <div className="font-medium">{driver.name}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center">
                              <FaPhone className="text-green-500 mr-2" />
                              <div>{driver.phone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center">
                              <FaCar className="text-blue-500 mr-2" />
                              <div>
                                <div>
                                  {driver.vehicleType ? 
                                    (typeof driver.vehicleType === 'object' ? 
                                      `${driver.vehicleType.name} ${driver.vehicleType.acAvailable ? '(AC)' : '(Non-AC)'}` : 
                                      driver.vehicleType) : 
                                    driver.carType || 'Unknown Type'}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {driver.vehicleModel ? `${driver.vehicleModel} - ` : ''}
                                  {driver.vehicleNumber || driver.carNumber || 'No Number'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => assignDriver(driver.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    {drivers.filter(driver => {
                      if (driver.status !== 'available') return false;
                      
                      // Use the same matching logic as above
                      const bookingCabType = (selectedBooking?.cabType || '').toLowerCase().trim();
                      const driverCabType = (driver.carType || '').toLowerCase().trim();
                      
                      // Match based on vehicle type ID mapping from database
                      const vehicleTypeMatch = driver.vehicleTypeId && 
                                             cabTypes[driver.vehicleTypeId] && 
                                             cabTypes[driver.vehicleTypeId].toLowerCase().trim() === bookingCabType;
                      
                      // Exact match by name
                      const exactMatch = bookingCabType === driverCabType;
                      
                      return exactMatch || vehicleTypeMatch;
                    }).length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-6 text-center">
                          <div className="flex flex-col items-center">
                            <FaCar className="text-gray-400 text-3xl mb-2" />
                            <p className="text-gray-500 font-medium">No available drivers for {selectedBooking?.cabType} cab type</p>
                            <p className="text-gray-400 text-sm mt-1">All drivers with matching cab type are currently assigned</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeDriverAssignModal}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
