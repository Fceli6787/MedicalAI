"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { signOut, getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { app } from "../lib/firebase";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2'; // Importar SweetAlert2
import { toast } from "sonner";

export interface User {
  id_usuario: number;
  id_tipo_documento: number;
  id_pais: number;
  nui: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  fecha_registro: string; // Changed to string for JSON compatibility
  ultima_actividad: string | null; // Changed to string for JSON compatibility
  estado: string;
  firebase_uid: string;
  rol: string;
  roles: string[];
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    id_tipo_documento: number;
    id_pais: number;
    nui: string;
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
    email: string; // Cambiado de 'correo' a 'email'
    password: string;
    id_especialidad: number;
    numero_tarjeta_profesional: string;
    años_experiencia?: number | null;
  }) => Promise<void>; // Ajustar la interfaz para todos los campos de médico
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Inicialmente true mientras se verifica la autenticación
  const router = useRouter();
  const auth = getAuth(app);
  
  // Configurar persistencia solo si no está ya configurada
  useEffect(() => {
    const configurePersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error configuring persistence:", error);
      }
    };
    
    configurePersistence();
  }, [auth]);

  // Listener para el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Si hay un usuario autenticado en Firebase, obtener sus datos de la API
        try {
          const response = await fetch(`/api/dashboard/users?firebase_uid=${firebaseUser.uid}`);
          const data = await response.json();
          if (response.ok && data.user) {
            setUser(data.user);
          } else {
            // Si no se encuentran datos del usuario en la API, cerrar sesión en Firebase
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false); // La verificación inicial ha terminado
    });

    // Limpiar el listener al desmontar el componente
    return () => unsubscribe();
  }, [auth]); // Dependencia en 'auth'

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json(); // Cambiado de data a result para mayor claridad
      
      if (!response.ok) {
        // Si la respuesta no es OK, mostrar el mensaje de error de la API con SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'Error de inicio de sesión',
          text: result.error || 'Login failed',
        });
        // No relanzar el error aquí para evitar que el catch genérico lo maneje también
        return; 
      }

      // Si la respuesta es OK, proceder con el inicio de sesión exitoso
      // Asegurarse de que el objeto user tenga la propiedad 'roles' como un array
      setUser({ ...result.user, roles: result.user.roles || [] });
      // Mostrar SweetAlert2 para inicio de sesión exitoso
      Swal.fire({
        icon: 'success',
        title: 'Inicio de sesión exitoso',
        text: `Welcome ${result.user.primer_nombre}`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error logging in:", error);
      // Mostrar un mensaje genérico con SweetAlert2 para errores no manejados por la API
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || "Something went wrong when logging in",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Something went wrong when logging out");
    }
  };

  const handleRegister = async (
    userData: {
      id_tipo_documento: number;
      id_pais: number;
      nui: string;
      primer_nombre: string;
      segundo_nombre?: string | null;
      primer_apellido: string;
      segundo_apellido?: string | null;
      email: string; // Cambiado de 'correo' a 'email'
      password: string;
      id_especialidad: number;
      numero_tarjeta_profesional: string;
      años_experiencia?: number | null;
    }
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      toast.success("User created successfully");
      router.push("/login"); // Redirigir a login después de un registro exitoso
    } catch (error: any) {
      console.error("Error registering user:", error);
      // Mostrar error con SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: error.message || "Something went wrong when creating the user",
      });
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextProps = {
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
