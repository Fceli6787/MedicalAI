"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import { signOut, getAuth } from "firebase/auth";
import { login, register, User } from "@/app/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null); // Now using the correct User type
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
    const auth = getAuth(app);
  
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response : { user: dbUser} = await login(email, password);
      setUser(response.user);
      toast.success(`Welcome ${response.user.primer_nombre}`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Something went wrong when logging");
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

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("User created successfully");
      router.push("/");
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

