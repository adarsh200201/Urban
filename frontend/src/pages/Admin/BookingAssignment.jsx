import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCarAlt, FaMapMarkerAlt, FaCalendarAlt, FaUserAlt, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import AdminLayout from '../../layouts/AdminLayout';
import { getPendingBookings, getAvailableDrivers, assignDriverToBooking, reset } from '../../features/admin/adminSlice';

const BookingAssignment = () => {
  const dispatch = useDispatch();
  const { pendingBookings, availableDrivers, loading, error, success, message } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  useEffect(() => {
    dispatch(getPendingBookings());
    dispatch(getAvailableDrivers());
    
    // Set up a polling interval to refresh data
    const interval = setInterval(() => {
      dispatch(getPendingBookings());
      dispatch(getAvailableDrivers());
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
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
      setSelectedBooking(null);
      setSelectedDriver(null);
      dispatch(reset());
    }
  }, [error, success, message, dispatch]);
  
  useEffect(() => {
    if (pendingBookings) {
      filterBookings();
    }
  }, [pendingBookings, searchTerm]);
  
  const filterBookings = () => {
    if (!pendingBookings) {
      return;
    }
    
    if (!searchTerm) {
      setFilteredBookings(pendingBookings);
    } else {
      const filtered = pendingBookings.filter(
        booking => 
          (booking.bookingId && booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          // Check for user fields from MongoDB data
          (booking.user?.name && booking.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (booking.user?.phone && booking.user.phone.includes(searchTerm)) ||
          (booking.user?.email && booking.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          // Check legacy passenger fields
          (booking.passengerDetails?.name && booking.passengerDetails.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (booking.passengerDetails?.phone && booking.passengerDetails.phone.includes(searchTerm)) ||
          // Check location fields
          (booking.pickupLocation?.name && booking.pickupLocation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (booking.dropLocation?.name && booking.dropLocation.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBookings(filtered);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setSelectedDriver(null);
  };
  
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
  };
  
  const handleAssign = () => {
    if (selectedBooking && selectedDriver) {
      dispatch(assignDriverToBooking({
        bookingId: selectedBooking._id,
        driverId: selectedDriver._id
      }));
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  if (loading && !pendingBookings) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Booking Assignment</h1>
          <p className="text-gray-600">Assign drivers to confirmed bookings</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Pending Bookings</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              
              {filteredBookings && filteredBookings.length > 0 ? (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredBookings.map((booking) => (
                    <div 
                      key={booking._id}
                      onClick={() => handleSelectBooking(booking)}
                      className={`p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition duration-150 ${selectedBooking?._id === booking._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    >
                      <div className="flex justify-between mb-2">
                        <div className="font-medium text-gray-900">{booking.bookingId}</div>
                        <div className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{booking.status}</div>
                      </div>
                      <div className="flex items-center text-sm mb-2">
                        <FaUserAlt className="text-gray-400 mr-2" />
                        <span>
                          {booking.user?.name || booking.passengerDetails?.name || 'No name'}
                          {booking.user?.phone && ` • ${booking.user.phone}`}
                          {!booking.user?.phone && booking.passengerDetails?.phone && ` • ${booking.passengerDetails.phone}`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm mb-2">
                        <FaMapMarkerAlt className="text-gray-400 mr-2" />
                        <span>
                          {booking.pickupLocation?.name || 'Unknown'}
                          {booking.pickupLocation?.state && `, ${booking.pickupLocation.state}`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm mb-2">
                        <FaMapMarkerAlt className="text-red-400 mr-2" />
                        <span>
                          {booking.dropLocation?.name || 'Unknown'}
                          {booking.dropLocation?.state && `, ${booking.dropLocation.state}`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2" />
                        <span>
                          {formatDate(booking.pickupDate)}, {booking.pickupTime}
                          {booking.cabType?.name && ` • ${booking.cabType.name}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FaCarAlt className="text-gray-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Pending Bookings</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No bookings match your search criteria.' : 'There are no bookings pending assignment.'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Assignment Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Driver Assignment</h2>
              </div>
              
              {selectedBooking ? (
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-2">Booking Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Booking ID</p>
                          <p className="text-sm font-medium">{selectedBooking.bookingId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm"><span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{selectedBooking.status}</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Passenger</p>
                          <p className="text-sm">{selectedBooking.user?.name || selectedBooking.passengerDetails?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm">{selectedBooking.user?.phone || selectedBooking.passengerDetails?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pickup</p>
                          <p className="text-sm">
                            {selectedBooking.pickupLocation?.name || 'N/A'}
                            {selectedBooking.pickupLocation?.state && `, ${selectedBooking.pickupLocation.state}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Drop</p>
                          <p className="text-sm">
                            {selectedBooking.dropLocation?.name || 'N/A'}
                            {selectedBooking.dropLocation?.state && `, ${selectedBooking.dropLocation.state}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date & Time</p>
                          <p className="text-sm">{formatDate(selectedBooking.pickupDate)}, {selectedBooking.pickupTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cab Type</p>
                          <p className="text-sm">{selectedBooking.cabType?.name || 'Standard'}</p>
                        </div>
                        {selectedBooking.distance && (
                          <div>
                            <p className="text-xs text-gray-500">Distance</p>
                            <p className="text-sm">{selectedBooking.distance} km</p>
                          </div>
                        )}
                        {selectedBooking.totalAmount && (
                          <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-sm">₹{selectedBooking.totalAmount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-2">Available Drivers</h3>
                    {availableDrivers && availableDrivers.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto">
                        {availableDrivers.map((driver) => (
                          <div 
                            key={driver._id}
                            onClick={() => handleSelectDriver(driver)}
                            className={`p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition duration-150 ${
                              selectedDriver?._id === driver._id ? 'bg-green-50 border-l-4 border-green-500' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                                {driver.user?.name?.charAt(0).toUpperCase() || 'D'}
                              </div>
                              <div>
                                <p className="font-medium">{driver.user?.name}</p>
                                <div className="flex text-sm text-gray-500">
                                  <span className="mr-3">{driver.vehicleNumber}</span>
                                  <span>{driver.vehicleModel}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500">No drivers available</p>
                        <p className="text-sm text-gray-400 mt-1">All drivers are currently assigned or unavailable</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAssign}
                      disabled={!selectedDriver || loading}
                      className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg ${
                        selectedDriver && !loading
                          ? 'bg-primary hover:bg-primary-dark text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FaCheck className="mr-2" /> Assign Driver
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedBooking(null);
                        setSelectedDriver(null);
                      }}
                      className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
                    >
                      <FaTimes className="mr-2" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FaCarAlt className="text-gray-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Booking Selected</h3>
                  <p className="text-gray-500">
                    Select a booking from the list to assign a driver
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingAssignment;
