import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../utils/googleAuth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import '../css/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { loginLocal: handleLocalLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Primero intenta con Firebase
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (firebaseError) {
        // Si falla Firebase, intenta con autenticación local
        const result = await handleLocalLogin(email, password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      }
    } catch (err) {
      setError('Error al iniciar sesión: ' + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión con Google: ' + err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
        </form>
        
        <button className="google-login-button" onClick={handleGoogleLogin}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google logo"
            style={{ height: '20px', width: '20px', verticalAlign: 'middle', marginRight: '8px' }}
          />
          Continuar con Google
        </button>
        
        <div className="register-link">
          ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
