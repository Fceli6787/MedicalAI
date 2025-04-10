import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const loginLocal = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al iniciar sesión' };
  }
};

export const registerLocal = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al registrarse' };
  }
};

export const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/check`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { authenticated: false };
    }
    console.error('Error en checkAuth:', error);
    throw error.response?.data || { error: 'Error verificando autenticación' };
  }
};
