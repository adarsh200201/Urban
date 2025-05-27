import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Component to protect routes that require admin privileges
const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is logged in and has admin role
  if (!user || user.user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
