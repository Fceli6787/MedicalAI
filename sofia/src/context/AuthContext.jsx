import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loginLocal, checkAuth } from '../services/authService';

export const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica autenticación local (MySQL) si no hay usuario de Firebase
  const checkLocalAuth = async () => {
    try {
      const response = await checkAuth();
      if (response.authenticated) {
        setCurrentUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          provider: 'local'
        });
      }
    } catch (error) {
      console.error('Error checking local auth:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Iniciando verificación de autenticación');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Estado de Firebase:', firebaseUser ? 'Autenticado' : 'No autenticado');
      if (firebaseUser) {
        // Usuario de Firebase autenticado
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          provider: 'firebase'
        });
        setLoading(false);
      } else {
        // Verificar autenticación local
        await checkLocalAuth();
        // Asegurarse de terminar loading
        if (loading) {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLocalLogin = async (email, password) => {
    try {
      const response = await loginLocal(email, password);
      setCurrentUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        provider: 'local'
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error || 'Error al iniciar sesión' };
    }
  };

  const value = {
    currentUser,
    loading,
    loginLocal: handleLocalLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
