import React, { createContext, useContext, useState } from "react";

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    // Stub: Replace with Firebase Auth
    setUser({
      uid: crypto.randomUUID(),
      email,
      displayName: email.split("@")[0],
    });
  };

  const signup = async (email: string, _password: string, name: string) => {
    // Stub: Replace with Firebase Auth
    setUser({
      uid: crypto.randomUUID(),
      email,
      displayName: name,
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
