import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in real app, this would call an API
    if (email && password) {
      setUser({
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        phone: '(555) 123-4567',
        address: '123 Health Street, Medical City, MC 12345',
        dateOfBirth: '1985-06-15',
        memberId: 'UH-2024-001234',
        planType: 'Premium Gold',
      });
      return true;
    }
    return false;
  };

  const signup = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    // Mock signup - in real app, this would call an API
    if (userData.email && userData.password) {
      setUser({
        id: '1',
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        memberId: `UH-2024-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        planType: 'Standard',
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
