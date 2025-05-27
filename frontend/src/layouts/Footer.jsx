import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white pt-8 sm:pt-10 md:pt-12 lg:pt-16 pb-4 sm:pb-6 md:pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Company Info */}
          <div className="mb-6 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">UrbanRide</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
              Book outstation cabs at the lowest prices with clean cars, experienced drivers and transparent billing.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition">
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* Popular Routes */}
          <div className="mb-6 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Popular Routes</h3>
            <ul className="text-gray-400 text-sm sm:text-base space-y-3">
              <li><Link to="/routes/mumbai-pune" className="hover:text-primary transition-colors duration-200">Mumbai - Pune</Link></li>
              <li><Link to="/routes/delhi-jaipur" className="hover:text-primary transition-colors duration-200">Delhi - Jaipur</Link></li>
              <li><Link to="/routes/bangalore-mysore" className="hover:text-primary transition-colors duration-200">Bangalore - Mysore</Link></li>
              <li><Link to="/routes/chennai-pondicherry" className="hover:text-primary transition-colors duration-200">Chennai - Pondicherry</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="mb-6 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Quick Links</h3>
            <ul className="text-gray-400 text-sm sm:text-base space-y-3">
              <li><Link to="/about" className="hover:text-primary transition-colors duration-200">About Us</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors duration-200">Services</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors duration-200">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors duration-200">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mb-6 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Contact Us</h3>
            <ul className="text-gray-400 text-sm sm:text-base space-y-3">
              <li className="flex items-center">
                <FaMapMarkerAlt className="mr-2 text-primary" /> Rajkot,Gujarat
              </li>
              <li className="flex items-center">
                <FaPhoneAlt className="mr-2 text-primary" /> +91 9572377168
              </li>
              <li className="flex items-center">
                <FaEnvelope className="mr-2 text-primary" /> support@urbanride.com
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <hr className="border-gray-700 my-6 sm:my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs sm:text-sm mb-3 md:mb-0 text-center md:text-left">
            &copy; {currentYear} UrbanRide. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:space-x-6">
            <Link to="/terms" className="text-gray-400 hover:text-primary transition-colors duration-200 text-xs sm:text-sm px-2">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="text-gray-400 hover:text-primary transition-colors duration-200 text-xs sm:text-sm px-2">
              Privacy Policy
            </Link>
            <Link to="/refund" className="text-gray-400 hover:text-primary transition-colors duration-200 text-xs sm:text-sm px-2">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
