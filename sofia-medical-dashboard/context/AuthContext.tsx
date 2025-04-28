tsx
import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut, onAuthStateChanged,
  User,
} from "firebase/auth";
import { app } from "../lib/firebase";
import { addUser, getUser } from "@/lib/db";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
        const dbUser = await getUser(userCredential.user.uid);
        if (!dbUser) {
            signOut(auth);
            toast.error("This user does not have access");
        } else {
            setUser(userCredential.user);
            toast.success(`Welcome ${dbUser.primer_nombre}`);
        }
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Something went wrong when logging");
    } finally {
      setLoading(false);
    }
  };

    const updateUser = (user: User | null) => {
        setUser(user);
    };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user.email === "admin@example.com") {
            toast.error("Admin user can not be created this way");
        } else {
            await addUser({
                firebase_uid: userCredential.user.uid,
                nui: "0000000000",
                primer_nombre: userCredential.user.displayName || "No name",
                primer_apellido: "No apellido",
                correo: userCredential.user.email || email,
                id_tipo_documento: 1,
                id_pais: 1,
            });
            toast.success("User created successfully");
        }

    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Something went wrong when creating the user");
    } finally {
      setLoading(false);
    }
  };


  const contextValue: AuthContextProps = {
    user,
    loading,
    login,
    logout,
    register,
    updateUser,
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
