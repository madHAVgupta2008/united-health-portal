import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getProfile, updateProfile as updateProfileService, Profile } from '@/services/profileService';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  memberId?: string;
  planType?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: { email: string; password: string; firstName?: string; lastName?: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase user + profile to our User type
  const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const profile = await getProfile(supabaseUser.id);
      
      if (!profile) {
        // Profile should be created automatically by trigger, but handle edge case
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
        };
      }

      return {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        address: profile.address,
        dateOfBirth: profile.dateOfBirth,
        memberId: profile.memberId,
        planType: profile.planType,
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userProfile = await loadUserProfile(session.user);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        const userProfile = await loadUserProfile(data.user);
        setUser(userProfile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login exception:', error);
      return false;
    }
  };

  const signup = async (userData: { 
    email: string; 
    password: string; 
    firstName?: string; 
    lastName?: string;
    phone?: string;
  }): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return false;
      }

      if (data.user) {
        // Profile will be created automatically by the trigger
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        const userProfile = await loadUserProfile(data.user);
        setUser(userProfile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup exception:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      await updateProfileService(user.id, {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        phone: updatedData.phone,
        address: updatedData.address,
        dateOfBirth: updatedData.dateOfBirth,
        planType: updatedData.planType,
      });

      setUser({ ...user, ...updatedData });
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password reset exception:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateUser, resetPassword }}>
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
