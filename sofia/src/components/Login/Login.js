import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

function Login() {
  const { user } = useAuth();
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      await authService.loginWithGoogle();
    } catch (error) {
      setError(error.message);
      console.error('Error de login:', error);
    }
  };

  if (user) {
    return <div>Ya estás autenticado como: {user.email}</div>;
  }

  return (
    <div>
      <h2>Iniciar Sesión</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={handleGoogleLogin}>
        Iniciar sesión con Google
      </button>
    </div>
  );
}

export default Login;