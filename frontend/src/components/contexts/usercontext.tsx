import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  userEmail: string;
  name: string;
  accountCreated: string;
  userIndex?: number;
  totalEntries: number;
  region: string;
  isEditor: boolean;
  isVerified?: boolean;
  profilephotokey: string;
}


interface UserContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextState | undefined>(undefined);

const getStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredUser());
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = (userData: User, token: string) => {
    console.log("Setting user in context:", userData);
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  const updateUser = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://api.benchracershq.com/api/users/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const responseData = await response.json();
      
      if (responseData.user) {
        setUser(responseData.user);
        localStorage.setItem('user', JSON.stringify(responseData.user));
      } else {
        const updatedUser: User | null = user
          ? {
              userEmail: updates.userEmail ?? user.userEmail,
              name: updates.name ?? user.name,
              accountCreated: updates.accountCreated ?? user.accountCreated,
              userIndex: updates.userIndex ?? user.userIndex,
              totalEntries: updates.totalEntries ?? user.totalEntries,
              region: updates.region ?? user.region,
              isEditor: updates.isEditor ?? user.isEditor,
              isVerified: updates.isVerified ?? user.isVerified,
              profilephotokey: updates.profilephotokey ?? user.profilephotokey,
            }
          : null;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update profile');
      throw error; 
    } finally {
      setLoading(false);
    }
  };


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
        updateUser,
        setError,
        setLoading
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}