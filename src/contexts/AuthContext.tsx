import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  interface StoredUser extends User {
    password: string;
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const usersDb = localStorage.getItem('app_users_db');
    if (usersDb) {
      const users: StoredUser[] = JSON.parse(usersDb);
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('app_user', JSON.stringify(userWithoutPassword));
        return true;
      }
    }
    return false;
  };

  const signup = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    if (userData.email && userData.password) {
      const newUser: StoredUser = {
        id: uuidv4(),
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        memberId: `UH-2024-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        planType: 'Standard',
        password: userData.password,
        ...userData,
      };
      
      // Save to session
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem('app_user', JSON.stringify(userWithoutPassword));

      // Save to "database"
      const usersDb = localStorage.getItem('app_users_db');
      const users: StoredUser[] = usersDb ? JSON.parse(usersDb) : [];
      users.push(newUser);
      localStorage.setItem('app_users_db', JSON.stringify(users));

      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    // Update session
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('app_user', JSON.stringify(updatedUser));

    // Update "database"
    const usersDb = localStorage.getItem('app_users_db');
    if (usersDb) {
        const users: StoredUser[] = JSON.parse(usersDb);
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...updatedData };
            localStorage.setItem('app_users_db', JSON.stringify(users));
        }
    }

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateUser }}>
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
