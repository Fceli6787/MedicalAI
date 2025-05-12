"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { signOut, getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { app } from "../lib/firebase";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
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
  fecha_registro: string;
  ultima_actividad: string | null;
  estado: string;
  firebase_uid: string;
  rol: string; // Consider if this single 'rol' is still needed if 'roles' array is primary
  roles: string[];
  mfa_enabled?: boolean; // <--- NUEVO CAMPO PARA ESTADO DE MFA
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>; // Modificado para devolver User o null
  register: (userData: {
    tipoDocumentoCodigo: string;
    paisCodigo: string;
    nui: string;
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
    email: string;
    password: string;
    id_especialidad: number;
    numero_tarjeta_profesional: string;
    años_experiencia?: number | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // <--- NUEVA FUNCIÓN PARA ACTUALIZAR DATOS DEL USUARIO
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const configurePersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("[AuthContext] Firebase persistence configured to local.");
      } catch (error) {
        console.error("[AuthContext] Error configuring persistence:", error);
      }
    };
    configurePersistence();
  }, [auth]);

  const fetchAndSetUser = async (firebase_uid: string) => {
    console.log(`[AuthContext] fetchAndSetUser called for firebase_uid: ${firebase_uid}`);
    try {
      const response = await fetch(`/api/dashboard/users?firebase_uid=${firebase_uid}`);
      const data = await response.json();
      console.log("[AuthContext] API response for user data (/api/dashboard/users):", data);
      if (response.ok && data.user) {
        // Asegurarse que el campo mfa_enabled se procese correctamente
        const userData: User = {
          ...data.user,
          mfa_enabled: typeof data.user.mfa_enabled === 'boolean' ? data.user.mfa_enabled : false, // Default a false si no está o es inválido
        };
        console.log("[AuthContext] User data (with MFA status) fetched and setting state:", userData);
        setUser(userData);
        return userData;
      } else {
        console.warn("[AuthContext] User data not found in API or API error. Signing out Firebase.");
        await signOut(auth); // Importante para limpiar la sesión de Firebase
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user data in fetchAndSetUser:", error);
      await signOut(auth);
      setUser(null);
      return null;
    }
  };


  useEffect(() => {
    console.log("[AuthContext] Setting up Firebase auth state listener.");
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("[AuthContext] Firebase auth state changed. FirebaseUser UID:", firebaseUser ? firebaseUser.uid : null);
      if (firebaseUser) {
        setLoading(true); // Poner loading mientras se obtienen datos de la DB
        await fetchAndSetUser(firebaseUser.uid);
      } else {
        console.log("[AuthContext] No Firebase user found. Setting AuthContext user to null.");
        setUser(null);
      }
      console.log("[AuthContext] Auth loading state set to false.");
      setLoading(false);
    });
    return () => {
      console.log("[AuthContext] Cleaning up Firebase auth state listener.");
      unsubscribe();
    };
  }, [auth]);

  const handleLogin = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error', title: 'Error de inicio de sesión',
          text: result.error || 'Login failed. Please check your credentials.',
        });
        setUser(null); // Asegurarse de limpiar el usuario en caso de fallo de API
        return null;
      }

      // API devolvió OK, el usuario de Firebase ya está autenticado por el endpoint /api/auth/login
      // El endpoint /api/auth/login ya devuelve el objeto User completo incluyendo mfa_enabled
      const loggedInUser: User = {
        ...result.user,
        mfa_enabled: typeof result.user.mfa_enabled === 'boolean' ? result.user.mfa_enabled : false,
      };
      console.log("[AuthContext] Login successful via API. User data (with MFA status):", loggedInUser);
      setUser(loggedInUser);

      // No redirigir aquí directamente si MFA está habilitado.
      // La página de login manejará la redirección o el paso de MFA.
      return loggedInUser; // Devolver el usuario para que la página de login decida el siguiente paso

    } catch (error: any) {
      console.error("[AuthContext] Error in handleLogin:", error);
      Swal.fire({
        icon: 'error', title: 'Error',
        text: error.message || "An unexpected error occurred during login.",
      });
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      console.log("[AuthContext] Refreshing user data...");
      setLoading(true);
      await fetchAndSetUser(auth.currentUser.uid);
      setLoading(false);
    } else {
      console.log("[AuthContext] No current Firebase user to refresh.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log("[AuthContext] User logged out. Redirecting to /login.");
      router.push("/login"); // Asegurar redirección después de limpiar el estado
    } catch (error) {
      console.error("[AuthContext] Error logging out:", error);
      toast.error("Something went wrong when logging out");
    }
  };

  const handleRegister = async (userData: any /* Ajusta el tipo según tu definición */) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      toast.success("User created successfully. Please login.");
      router.push("/login");
    } catch (error: any) {
      console.error("[AuthContext] Error registering user:", error);
      Swal.fire({ icon: 'error', title: 'Error en el registro', text: error.message });
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
    refreshUser, // Exponer la nueva función
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