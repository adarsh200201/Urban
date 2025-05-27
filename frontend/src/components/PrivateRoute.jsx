import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
