"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { signOut, getAuth, browserLocalPersistence, setPersistence, User as FirebaseUser } from "firebase/auth";
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
  rol?: string;
  roles: string[];
  mfa_enabled?: boolean;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
        console.log("[AuthContext] Firebase persistence configurada a local.");
      } catch (error) {
        console.error("[AuthContext] Error configurando persistencia:", error);
      }
    };
    configurePersistence();
  }, [auth]);

  const fetchAndSetUser = async (firebase_uid: string | undefined, operation: string = "fetch"): Promise<User | null> => {
    console.log(`[AuthContext] fetchAndSetUser (${operation}) llamada. firebase_uid recibido: '${firebase_uid}'`);

    if (!firebase_uid) {
      console.warn(`[AuthContext] fetchAndSetUser (${operation}) - firebase_uid es undefined o null. No se puede obtener datos del usuario.`);
      setUser(null); // Asegurar que el usuario se limpia si no hay UID
      // setLoading(false); // El llamador (onAuthStateChanged) maneja setLoading
      return null;
    }

    try {
      const apiUrl = `/api/dashboard/users?firebase_uid=${firebase_uid}`;
      console.log(`[AuthContext] fetchAndSetUser (${operation}) - Llamando a API: ${apiUrl}`);
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log(`[AuthContext] fetchAndSetUser (${operation}) - Respuesta de API (${apiUrl}):`, data);

      if (response.ok && data.user) {
        const userData: User = {
          id_usuario: data.user.id_usuario,
          id_tipo_documento: data.user.id_tipo_documento,
          id_pais: data.user.id_pais,
          nui: data.user.nui,
          primer_nombre: data.user.primer_nombre,
          segundo_nombre: data.user.segundo_nombre || null,
          primer_apellido: data.user.primer_apellido,
          segundo_apellido: data.user.segundo_apellido || null,
          correo: data.user.correo,
          fecha_registro: data.user.fecha_registro,
          ultima_actividad: data.user.ultima_actividad || null,
          estado: data.user.estado,
          firebase_uid: data.user.firebase_uid,
          rol: data.user.rol || (data.user.roles && data.user.roles.length > 0 ? data.user.roles[0] : undefined),
          roles: data.user.roles || [],
          mfa_enabled: typeof data.user.mfa_enabled === 'boolean' ? data.user.mfa_enabled : false,
        };
        console.log(`[AuthContext] fetchAndSetUser (${operation}) - Datos del usuario (con estado MFA) procesados:`, userData);
        setUser(userData);
        return userData;
      } else {
        console.warn(`[AuthContext] fetchAndSetUser (${operation}) - Datos del usuario no encontrados en API o error de API. Respuesta:`, data);
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error(`[AuthContext] fetchAndSetUser (${operation}) - Error obteniendo datos del usuario:`, error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    console.log("[AuthContext] Configurando listener de estado de autenticación de Firebase.");
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      console.log("[AuthContext] Estado de autenticación de Firebase cambiado. FirebaseUser UID:", firebaseUser ? firebaseUser.uid : "Ninguno");
      if (firebaseUser && firebaseUser.uid) {
        await fetchAndSetUser(firebaseUser.uid, "onAuthStateChanged");
      } else {
        console.log("[AuthContext] No hay usuario de Firebase o UID no disponible. Estableciendo usuario del AuthContext a null.");
        setUser(null);
      }
      console.log("[AuthContext] Carga de autenticación completada (después de onAuthStateChanged).");
      setLoading(false);
    });

    return () => {
      console.log("[AuthContext] Limpiando listener de estado de autenticación de Firebase.");
      unsubscribe();
    };
  }, [auth]);

  const handleLogin = async (email: string, password: string): Promise<User | null> => {
    console.log("[AuthContext] Iniciando login para:", email);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      console.log("[AuthContext] Respuesta de /api/auth/login:", result);

      if (!response.ok || !result.user) {
        Swal.fire({
          icon: 'error', title: 'Error de inicio de sesión',
          text: result.error || 'Login fallido. Por favor, verifica tus credenciales.',
        });
        setUser(null);
        setLoading(false);
        return null;
      }
      
      const loggedInUser: User = {
        id_usuario: result.user.id_usuario,
        id_tipo_documento: result.user.id_tipo_documento,
        id_pais: result.user.id_pais,
        nui: result.user.nui,
        primer_nombre: result.user.primer_nombre,
        segundo_nombre: result.user.segundo_nombre || null,
        primer_apellido: result.user.primer_apellido,
        segundo_apellido: result.user.segundo_apellido || null,
        correo: result.user.correo,
        fecha_registro: result.user.fecha_registro,
        ultima_actividad: result.user.ultima_actividad || null,
        estado: result.user.estado,
        firebase_uid: result.user.firebase_uid,
        rol: result.user.rol || (result.user.roles && result.user.roles.length > 0 ? result.user.roles[0] : undefined),
        roles: result.user.roles || [],
        mfa_enabled: typeof result.user.mfa_enabled === 'boolean' ? result.user.mfa_enabled : false,
      };
      console.log("[AuthContext] Login exitoso vía API. Datos del usuario (con estado MFA):", loggedInUser);
      setUser(loggedInUser);
      setLoading(false);
      return loggedInUser;

    } catch (error: any) {
      console.error("[AuthContext] Error en handleLogin:", error);
      Swal.fire({
        icon: 'error', title: 'Error',
        text: error.message || "Ocurrió un error inesperado durante el inicio de sesión.",
      });
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  const refreshUser = async () => {
    const currentFirebaseUser = auth.currentUser;
    if (currentFirebaseUser && currentFirebaseUser.uid) {
      console.log(`[AuthContext] Refrescando datos del usuario para UID: ${currentFirebaseUser.uid}`);
      setLoading(true);
      await fetchAndSetUser(currentFirebaseUser.uid, "refreshUser");
      setLoading(false);
      console.log("[AuthContext] Datos del usuario refrescados.");
    } else {
      console.log("[AuthContext] No hay usuario de Firebase actual (o UID no disponible) para refrescar.");
    }
  };

  // --- FUNCIÓN LOGOUT MODIFICADA ---
  const logout = async () => {
    console.log("[AuthContext] Iniciando logout...");
    try {
      await signOut(auth); // Limpia la sesión de Firebase. Esto disparará onAuthStateChanged.
      setUser(null);       // Establece explícitamente el usuario del contexto a null AHORA.
      setLoading(false);   // Establece explícitamente loading a false AHORA.
                           // Esto asegura que el estado del contexto refleje inmediatamente "no usuario, no cargando".
      console.log("[AuthContext] Firebase signOut completado, usuario del contexto y loading actualizados. Redirigiendo a /login.");
      router.push("/login");
      // onAuthStateChanged también se ejecutará, verá que no hay firebaseUser,
      // y llamará a setUser(null) y setLoading(false) de nuevo, lo cual es redundante pero inofensivo.
      // Lo importante es que el estado del contexto sea correcto ANTES de la redirección.
    } catch (error) {
      console.error("[AuthContext] Error durante el logout:", error);
      toast.error("Ocurrió un error al cerrar sesión.");
      setLoading(false); // Asegurarse de que loading sea false también en caso de error.
    }
  };
  // --- FIN DE FUNCIÓN LOGOUT MODIFICADA ---

  const handleRegister = async (userData: any) => {
    console.log("[AuthContext] Iniciando registro...");
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("[AuthContext] Error en API de registro:", data.error);
        throw new Error(data.error || 'Falló el registro');
      }
      toast.success("Usuario creado exitosamente. Por favor, inicia sesión.");
      router.push("/login");
    } catch (error: any) {
      console.error("[AuthContext] Error registrando usuario:", error);
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
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
