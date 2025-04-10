import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!currentUser) {
    console.log('Redirigiendo a login - currentUser:', currentUser);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
