import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getDashboardStats } from '../../features/admin/adminSlice';
import { Link } from 'react-router-dom';
import { FaCar, FaUser, FaCalendarAlt, FaRupeeSign, FaChartLine, FaFilter, FaSearch, FaTaxi, FaUserTie, FaListAlt } from 'react-icons/fa';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading } = useSelector((state) => state.admin);
  
  const [period, setPeriod] = useState('weekly');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading dashboard data...</span>
      </div>
    );
  }

  // If stats are not yet loaded, show placeholders
  const stats = dashboardStats || {
    totalUsers: 0,
    totalBookings: 0,
    totalCabs: 0,
    recentBookings: [],
    monthlyRevenue: [],
    totalRevenue: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    todayBookings: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
  };

  return (
    <div className="container mx-auto px-2 py-3">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      {/* Quick Access Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <Link to="/admin/users" className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
          <div className="p-3 rounded-full bg-blue-100 text-blue-800 mb-3">
            <FaUser className="w-6 h-6" />
          </div>
          <span className="text-gray-700 font-medium">Users</span>
        </Link>
        
        <Link to="/admin/bookings" className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
          <div className="p-3 rounded-full bg-green-100 text-green-800 mb-3">
            <FaCalendarAlt className="w-6 h-6" />
          </div>
          <span className="text-gray-700 font-medium">Bookings</span>
        </Link>
        
        <Link to="/admin/cabs" className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-800 mb-3">
            <FaCar className="w-6 h-6" />
          </div>
          <span className="text-gray-700 font-medium">Cab Types</span>
        </Link>
        
        <Link to="/admin/drivers" className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
          <div className="p-3 rounded-full bg-purple-100 text-purple-800 mb-3">
            <FaUserTie className="w-6 h-6" />
          </div>
          <span className="text-gray-700 font-medium">Drivers</span>
        </Link>
        
        <Link to="/admin/booking-assignment" className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-800 mb-3">
            <FaTaxi className="w-6 h-6" />
          </div>
          <span className="text-gray-700 font-medium">Assign Drivers</span>
        </Link>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-3 lg:gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-800">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600">Total Users</h2>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-800">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600">Total Bookings</h2>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
              <FaCar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600">Total Cabs</h2>
              <p className="text-2xl font-bold">{stats.totalCabs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-3 lg:gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Pending Bookings</h3>
              <p className="text-2xl font-bold">{stats.pendingBookings || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
              <FaCalendarAlt className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/bookings?status=pending" className="text-sm text-blue-600 hover:underline">View all pending bookings</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Today's Bookings</h3>
              <p className="text-2xl font-bold">{stats.todayBookings || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-800">
              <FaCalendarAlt className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/bookings" className="text-sm text-blue-600 hover:underline">View all bookings</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">{period === 'weekly' ? 'Weekly' : 'Monthly'} Revenue</h3>
              <p className="text-2xl font-bold">₹{period === 'weekly' ? (stats.weeklyRevenue || 0) : (stats.monthlyRevenue || 0)}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-800">
              <FaRupeeSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex space-x-2">
              <button 
                onClick={() => setPeriod('weekly')} 
                className={`text-xs px-2 py-1 rounded ${period === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setPeriod('monthly')} 
                className={`text-xs px-2 py-1 rounded ${period === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Total Revenue</h3>
              <p className="text-2xl font-bold">₹{stats.totalRevenue || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-800">
              <FaChartLine className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/reports" className="text-sm text-blue-600 hover:underline">View detailed reports</Link>
          </div>
        </div>
      </div>
      
      {/* Booking filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          
          <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                className="pl-8 pr-4 py-1 border border-gray-300 rounded text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-2 top-2 text-gray-400" />
            </div>
            
            <select 
              className="border border-gray-300 rounded py-1 px-2 text-sm"
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left">Booking ID</th>
                <th className="py-2 px-3 text-left">User</th>
                <th className="py-2 px-3 text-left">Route</th>
                <th className="py-2 px-3 text-left">Date</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings && stats.recentBookings.length > 0 ? (
                stats.recentBookings
                  .filter(booking => {
                    // Apply status filter
                    if (bookingFilter !== 'all' && booking.status !== bookingFilter) {
                      return false;
                    }
                    
                    // Apply search query
                    if (searchQuery) {
                      const searchLower = searchQuery.toLowerCase();
                      const idMatch = booking._id && booking._id.toLowerCase().includes(searchLower);
                      const bookingIdMatch = booking.bookingId && booking.bookingId.toLowerCase().includes(searchLower);
                      const userMatch = booking.user?.name && booking.user.name.toLowerCase().includes(searchLower);
                      const userNameMatch = booking.userName && booking.userName.toLowerCase().includes(searchLower);
                      const fromMatch = (booking.from || booking.pickupLocation || booking.fromCity || '').toLowerCase().includes(searchLower);
                      const toMatch = (booking.to || booking.dropLocation || booking.toCity || '').toLowerCase().includes(searchLower);
                      
                      return idMatch || bookingIdMatch || userMatch || userNameMatch || fromMatch || toMatch;
                    }
                    
                    return true;
                  })
                  .map((booking) => (
                  <tr key={booking._id || booking.bookingId} className="border-t">
                    <td className="py-2 px-3">{booking._id ? booking._id.slice(-6).toUpperCase() : booking.bookingId || 'N/A'}</td>
                    <td className="py-2 px-3">{booking.user?.name || booking.userName || 'N/A'}</td>
                    <td className="py-2 px-3">{booking.from || booking.pickupLocation || booking.fromCity || 'N/A'} to {booking.to || booking.dropLocation || booking.toCity || 'N/A'}</td>
                    <td className="py-2 px-3">{booking.date ? new Date(booking.date).toLocaleDateString() : 
                      booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : 
                      booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-3">₹{booking.amount || booking.totalAmount || booking.fare || 0}</td>
                  </tr>
                ))
              ) : searchQuery || bookingFilter !== 'all' ? (
                <tr>
                  <td className="py-4 px-3 text-center text-gray-500" colSpan="6">No bookings match your filters</td>
                </tr>
              ) : (
                <tr>
                  <td className="py-4 px-3 text-center text-gray-500" colSpan="6">No recent bookings</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>
        <div className="h-64">
          {/* Simple chart visualization */}
          <div className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-end h-full pb-4 pt-8">
                {stats.monthlyRevenue && Array.isArray(stats.monthlyRevenue) && stats.monthlyRevenue.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 w-12" 
                      style={{ 
                        height: `${Math.max(20, (item.amount / (Math.max(...stats.monthlyRevenue.map(i => i.amount || 0)) || 1)) * 200)}px` 
                      }}
                    ></div>
                    <span className="text-xs mt-2">{item.month || `Month ${index+1}`}</span>
                  </div>
                ))}
                {(!stats.monthlyRevenue || stats.monthlyRevenue.length === 0) && (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No revenue data available
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-center text-gray-600">
                Revenue data by month
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
