import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaTaxi, FaCity, FaStar, 
         FaMapMarkerAlt, FaBars, FaTimes, FaSignOutAlt, FaFileAlt } from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/admin/users', name: 'Users', icon: <FaUsers /> },
    { path: '/admin/bookings', name: 'Bookings', icon: <FaCalendarAlt /> },
    { path: '/admin/cabs', name: 'Cab Management', icon: <FaTaxi /> },
    { path: '/admin/drivers', name: 'Driver Management', icon: <FaUsers /> },
    { path: '/admin/cities', name: 'City Management', icon: <FaCity /> },
    { path: '/admin/fixed-routes', name: 'Fixed Routes', icon: <FaMapMarkerAlt /> },
    { path: '/admin/document-settings', name: 'Document Requirements', icon: <FaFileAlt /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 w-64 h-screen transition-transform transform bg-primary text-white ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-blue-900">
            <div className="flex items-center">
              <Link to="/admin">
                <span className="text-xl font-semibold text-white">UrbanRide Admin</span>
              </Link>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white focus:outline-none"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          {/* Sidebar Menu - Scrollable Area */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            <nav className="space-y-1 mb-6">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.path || 
                    (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User Profile & Logout - Sticky Footer */}
          <div className="border-t border-blue-700 p-4 mt-auto">
            <div className="flex items-center mb-4">
              <div className="mr-3 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                {user?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.user?.name || 'Admin User'}</p>
                <p className="text-xs text-blue-200">{user?.user?.email || 'admin@example.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-600 transition-colors"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 transition-all duration-300 bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 focus:outline-none md:hidden"
            >
              <FaBars size={20} />
            </button>
            <div className="flex items-center gap-4">
              {/* Optional: Admin quick actions or profile dropdown could go here */}
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-0">
          {/* This wrapper ensures content doesn't get hidden under the header or pushed too far down */}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
