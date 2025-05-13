import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the User type based on your database schema
export interface User {
  userEmail: string;
  name: string;
  accountCreated: string;
  userIndex?: number;
  totalEntries: number;
  region: string;
  isEditor: boolean;
  isVerified?: boolean;
}

// Define the context state
interface UserContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

// Create context
const UserContext = createContext<UserContextState | undefined>(undefined);

// Get initial state from localStorage
const getStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
};

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredUser());
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Login function
  const login = (userData: User, token: string) => {
    console.log("Setting user in context:", userData);
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Check if token exists on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        setError,
        setLoading
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}