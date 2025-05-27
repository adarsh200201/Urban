import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaTaxi, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { logout, reset } from '../features/auth/authSlice';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Handle scroll event to change header style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-2 sm:py-3 md:py-4'}`} style={{ minHeight: '60px' }}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center z-10 relative">
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            <span className="text-secondary">Urban</span>
            <span className="text-yellow-400">Ride</span>
          </span>
        </Link>




        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          
          {user ? (
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="flex items-center space-x-1 text-secondary hover:text-primary transition"
              >
                <FaUser />
                <span>{user.user?.name ? user.user.name.split(' ')[0] : 'User'}</span>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                  <Link 
                    to="/dashboard" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/bookings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  {user.user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-primary text-white py-2 px-4 rounded-md hover:bg-amber-600 transition whitespace-nowrap"
            >
              Login / Register
            </Link>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-secondary text-xl p-1"
          onClick={toggleMenu}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg py-4 absolute left-0 right-0 top-full z-50 overflow-y-auto max-h-[calc(100vh-4rem)] border-t border-gray-200">
          <nav className="container mx-auto px-6 flex flex-col space-y-4">
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-secondary hover:text-primary transition py-2 border-b border-gray-100" onClick={toggleMenu}>Dashboard</Link>
                <Link to="/bookings" className="text-secondary hover:text-primary transition py-2 border-b border-gray-100" onClick={toggleMenu}>My Bookings</Link>
                <Link to="/profile" className="text-secondary hover:text-primary transition py-2 border-b border-gray-100" onClick={toggleMenu}>Profile</Link>
                {user.user?.role === 'admin' && (
                  <Link to="/admin" className="text-secondary hover:text-primary transition py-2 border-b border-gray-100" onClick={toggleMenu}>Admin Panel</Link>
                )}
                <button
                  onClick={() => {
                    toggleMenu();
                    onLogout();
                  }}
                  className="flex items-center text-secondary hover:text-primary transition py-2 w-full"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary text-white py-3 px-4 rounded-md hover:bg-amber-600 transition text-center my-2 block"
                onClick={toggleMenu}
              >
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
