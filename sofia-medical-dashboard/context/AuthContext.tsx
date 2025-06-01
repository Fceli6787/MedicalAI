// context/AuthContext.tsx
"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react"; // Agregado useCallback
import { signOut, getAuth, browserLocalPersistence, setPersistence, User as FirebaseUser, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../lib/firebase";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { toast } from "sonner";

import { User } from "../lib/types"; // Importar la interfaz User centralizada


// ... (interfaz AuthContextProps sin cambios) ...
interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, turnstileToken?: string | null) => Promise<User | null>;
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
  const [loading, setLoading] = useState<boolean>(true); // Inicialmente true
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Configurar persistencia LOCAL consistentemente
        await setPersistence(auth, browserLocalPersistence);
        
        // Verificar si hay un usuario guardado en localStorage
        const storedUser = localStorage.getItem('firebaseUser');
        if (storedUser) {
          const { uid } = JSON.parse(storedUser);
          const currentUser = auth.currentUser;
          
          if (!currentUser || currentUser.uid !== uid) {
            // Forzar recarga del usuario desde Firebase
            await auth.signOut();
            localStorage.removeItem('firebaseUser');
          } else {
            await fetchAndSetUser(uid, "initialCheck");
          }
        }
        console.log("[AuthContext] Persistencia configurada");

        // Esperar a que Firebase esté listo
        await auth.authStateReady();
        console.log("[AuthContext] Firebase authStateReady completado.");

        // Verificar si ya hay una sesión activa
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("[AuthContext] Usuario persistente detectado:", currentUser.uid);
          await fetchAndSetUser(currentUser.uid, "initialCheck");
          
          // Guardar datos esenciales en localStorage
          localStorage.setItem('firebaseUser', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            lastLogin: Date.now()
          }));
        } else {
          localStorage.removeItem('firebaseUser');
        }
      } catch (error) {
        console.error("[AuthContext] Error inicializando autenticación:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [auth]);

  // Usamos useCallback para estabilizar la referencia de fetchAndSetUser
  // si se fuera a usar como dependencia en otros useEffects (aunque aquí no es estrictamente necesario para ESTE cambio).
  const fetchAndSetUser = useCallback(async (firebase_uid: string | undefined, operation: string = "fetch"): Promise<User | null> => {
    console.log(`[AuthContext] fetchAndSetUser (${operation}) llamada. firebase_uid recibido: '${firebase_uid}'`);

    if (!firebase_uid) {
      console.warn(`[AuthContext] fetchAndSetUser (${operation}) - firebase_uid es undefined o null. No se puede obtener datos del usuario.`);
      setUser(null);
      return null;
    }

    // No establecemos loading aquí, el listener onAuthStateChanged lo manejará de forma más global.
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
          // Campos para médicos
          id_especialidad: data.user.id_especialidad,
          numero_tarjeta_profesional: data.user.numero_tarjeta_profesional,
          años_experiencia: data.user.años_experiencia,
        };
        console.log(`[AuthContext] fetchAndSetUser (${operation}) - Datos del usuario procesados:`, userData);
        setUser(userData); // Siempre establecer el usuario si los datos son válidos
        return userData;
      } else {
        console.warn(`[AuthContext] fetchAndSetUser (${operation}) - Datos del usuario no encontrados o error de API. Respuesta:`, data);
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error(`[AuthContext] fetchAndSetUser (${operation}) - Error obteniendo datos del usuario:`, error);
      setUser(null);
      return null;
    }
  }, [auth]); // Dependencia 'auth' si `getAuth(app)` pudiera cambiar, o vacía si `auth` es estable.
               // `router` no es usado por fetchAndSetUser, así que no necesita estar en sus dependencias.

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        // Esperar a que Firebase esté listo
        await auth.authStateReady();
        
        console.log("[AuthContext] Estado de autenticación verificado. Usuario:", firebaseUser?.uid);
        
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          // Establecer cookie con el token (válida por 1 hora)
          document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600; secure; samesite=lax`;
          
          // Guardar datos en localStorage
          localStorage.setItem('firebaseUser', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            lastLogin: Date.now()
          }));
          
          await fetchAndSetUser(firebaseUser.uid, "onAuthStateChanged");
        } else {
          // Limpiar almacenamiento local y cookies
          localStorage.removeItem('firebaseUser');
          document.cookie = 'firebaseAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error en el listener de autenticación:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log("[AuthContext] Limpiando listener de estado de autenticación de Firebase.");
      unsubscribe();
    };
  }, [auth, fetchAndSetUser]);

  const handleLogin = async (email: string, password: string, turnstileToken?: string | null): Promise<User | null> => {
    console.log("[AuthContext] Iniciando login para:", email);
    setLoading(true);
    try {
      // Primero autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      if (!firebaseUser) {
        throw new Error('No se pudo obtener el usuario de Firebase');
      }

      // Luego obtener los datos adicionales de nuestra API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firebase_uid: firebaseUser.uid,
          turnstileToken, // Incluir el token de Turnstile
        }),
      });
      const result = await response.json();
      console.log("[AuthContext] Respuesta de /api/auth/login:", result);

      if (!response.ok || !result.user) {
        Swal.fire({
          icon: 'error', title: 'Error de inicio de sesión',
          text: result.error || 'Login fallido. Por favor, verifica tus credenciales.',
        });
        setUser(null);
        setLoading(false); // Finalizar carga aquí
        return null;
      }
      
      const loggedInUser: User = {
        // ... mapeo de datos ...
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
        // Campos para médicos
        id_especialidad: result.user.id_especialidad,
        numero_tarjeta_profesional: result.user.numero_tarjeta_profesional,
        años_experiencia: result.user.años_experiencia,
      };
      console.log("[AuthContext] Login exitoso vía API. Datos del usuario:", loggedInUser);
      
      // Siempre establecer el usuario en el contexto.
      // LoginPage manejará la lógica de mostrar el paso de MFA o redirigir.
      setUser(loggedInUser);
      
      setLoading(false); // Finalizar carga aquí
      return loggedInUser;

    } catch (error: any) {
      console.error("[AuthContext] Error en handleLogin:", error);
      Swal.fire({
        icon: 'error', title: 'Error',
        text: error.message || "Ocurrió un error inesperado durante el inicio de sesión.",
      });
      setUser(null);
      setLoading(false); // Finalizar carga aquí
      return null;
    }
  };

  const refreshUser = useCallback(async () => {
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
  }, [auth, fetchAndSetUser]); // Asegurar dependencias de useCallback

  const logout = async () => {
    console.log("[AuthContext] Iniciando logout...");
    try {
      await signOut(auth);
      console.log("[AuthContext] Firebase signOut completado.");
      
      // Limpiar todos los datos de sesión
      localStorage.removeItem('firebaseUser');
      document.cookie = 'firebaseAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      console.log("[AuthContext] Datos de sesión eliminados.");
    } catch (error) {
      console.error("[AuthContext] Error durante el logout:", error);
      toast.error("Ocurrió un error al cerrar sesión.");
    }
  };

  const handleRegister = async (userData: any) => {
    console.log("[AuthContext] Iniciando registro...");
    setLoading(true);
    try {
      // ... (código de registro sin cambios) ...
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

// ... (useAuth hook sin cambios) ...
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
