import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './assets/layout-utils.css';

// Layouts
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/Home';
import OneWay from './pages/OneWay';
import RoundTrip from './pages/RoundTrip';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingTrack from './pages/BookingTrack';
import NotFound from './pages/NotFound';
import CarSelection from './pages/CarSelection';
import CustomerDetails from './pages/CustomerDetails';
import PaymentPage from './pages/PaymentPage';
import ClearStorage from './pages/ClearStorage';

// Protected Pages  
import Dashboard from './pages/Dashboard';
import BookingHistory from './pages/BookingHistory';
import BookingDetails from './pages/BookingDetails';
import BookingConfirmation from './pages/BookingConfirmation';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminBookings from './pages/Admin/Bookings';
import AdminCabs from './pages/Admin/Cabs';
import AdminCities from './pages/Admin/Cities';
import AdminVehicleLocations from './pages/Admin/VehicleLocations';
import AdminLogin from './pages/Admin/Login';
import AdminDriverManagement from './pages/Admin/DriverManagement';
import AdminBookingAssignment from './pages/Admin/BookingAssignment';
import FixedRouteManagement from './pages/Admin/FixedRouteManagement';

// Driver Pages
import DriverLogin from './pages/driver/DriverLogin';
import DriverRegister from './pages/driver/DriverRegister';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverProfile from './pages/driver/DriverProfile';
import CurrentRide from './pages/driver/CurrentRide';
import RideHistory from './pages/driver/RideHistory';

// Components
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import DriverRoute from './components/DriverRoute';
import ScrollToTop from './components/ScrollToTop';
import DriverHeader from './layouts/DriverHeader';

function App() {
  // Initialize socket connection once at the app level
  useEffect(() => {
    // Import socket service directly to avoid issues with hooks
    const socketService = require('./utils/socketService').default;
    
    // Connect to socket server at the application level to maintain a single connection
    socketService.connect();
    
    return () => {
      // Only disconnect on full app unmount (rarely happens in production)
      socketService.disconnect();
    };
  }, []);
  
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
      <ToastContainer position="top-right" autoClose={5000} />
    </Router>
  );
}

// Component to conditionally render the header based on the current route
function AppContent() {
  // Use the actual useLocation hook from react-router-dom
  const location = useLocation();
  const pathname = location.pathname;
  const { driver } = useSelector((state) => state.driverAuth);
  
  // Check if we're on any driver page or if the user is logged in as a driver
  const isDriverPage = (
    pathname.includes('/driver/dashboard') || 
    pathname.includes('/driver/current-ride') || 
    pathname.includes('/driver/ride-history') || 
    pathname.includes('/driver/profile')
  );
  
  // Only show debugging info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Current path:', pathname);
    console.log('Is driver page?', isDriverPage);
    console.log('Driver auth state:', driver ? 'Logged in' : 'Not logged in');
  }
  
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Show Driver Header on driver pages, main Header on other pages except admin pages */}
      {isDriverPage ? <DriverHeader /> : (!pathname.includes('/admin') && <Header />)}
      
      <main className="flex-grow page-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/city/one-way-cab" element={<OneWay />} />
          <Route path="/city/round-trip-cab" element={<RoundTrip />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track-booking" element={<BookingTrack />} />
          <Route path="/cabs" element={<CarSelection />} />
          <Route path="/booking/customer-details" element={<CustomerDetails />} />
          <Route path="/booking/payment" element={<PaymentPage />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/clear-storage" element={<ClearStorage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><BookingHistory /></PrivateRoute>} />
          <Route path="/booking/:id" element={<PrivateRoute><BookingDetails /></PrivateRoute>} />
          <Route path="/booking-confirmation/:id" element={<PrivateRoute><BookingConfirmation /></PrivateRoute>} />
          <Route path="/booking/confirmation" element={<BookingConfirmation />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/payment/:bookingId" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/payment-success/:bookingId" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />  
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminLayout><AdminBookings /></AdminLayout></AdminRoute>} />
          <Route path="/admin/cabs" element={<AdminRoute><AdminLayout><AdminCabs /></AdminLayout></AdminRoute>} />
          <Route path="/admin/cities" element={<AdminRoute><AdminLayout><AdminCities /></AdminLayout></AdminRoute>} />
          <Route path="/admin/vehicle-locations" element={<AdminRoute><AdminLayout><AdminVehicleLocations /></AdminLayout></AdminRoute>} />
          <Route path="/admin/drivers" element={<AdminRoute><AdminLayout><AdminDriverManagement /></AdminLayout></AdminRoute>} />
          <Route path="/admin/booking-assignment" element={<AdminRoute><AdminLayout><AdminBookingAssignment /></AdminLayout></AdminRoute>} />
          <Route path="/admin/fixed-routes" element={<AdminLayout><FixedRouteManagement /></AdminLayout>} />
          
          {/* Driver Routes */}
          <Route path="/driver/dashboard" element={<DriverRoute><DriverDashboard /></DriverRoute>} />
          <Route path="/driver/profile" element={<DriverRoute><DriverProfile /></DriverRoute>} />
          <Route path="/driver/current-ride" element={<DriverRoute><CurrentRide /></DriverRoute>} />
          <Route path="/driver/ride-history" element={<DriverRoute><RideHistory /></DriverRoute>} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!pathname.includes('/admin') && <Footer />}
    </div>
  );
}

export default App;
