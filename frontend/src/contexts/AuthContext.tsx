import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getProfile, updateProfile as updateProfileService, createProfile } from '@/services/profileService';

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

  const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const profile = await getProfile(supabaseUser.id);
      
      if (!profile) {
        // Create initial profile if it doesn't exist
        console.log('Profile missing, creating initial profile for:', supabaseUser.id);
        
        // Use metadata from signup if available
        const metadata = supabaseUser.user_metadata || {};
        
        const newProfile = await createProfile(supabaseUser.id, {
          email: supabaseUser.email || '',
          firstName: metadata.firstName || '',
          lastName: metadata.lastName || '',
          phone: metadata.phone || '',
        });
        
        return {
          id: newProfile.id,
          email: newProfile.email,
          firstName: newProfile.firstName,
          lastName: newProfile.lastName,
          phone: newProfile.phone,
          address: newProfile.address,
          dateOfBirth: newProfile.dateOfBirth,
          memberId: newProfile.memberId,
          planType: newProfile.planType,
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
    // Supabase mode
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userProfile = await loadUserProfile(session.user);
        setUser(userProfile);
      }
      setIsLoading(false);
    });

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
            phone: userData.phone || '',
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return false;
      }

      if (data.user) {
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
      const result = await updateProfileService(user.id, {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        phone: updatedData.phone,
        address: updatedData.address,
        dateOfBirth: updatedData.dateOfBirth,
        planType: updatedData.planType,
        email: updatedData.email,
      });

      console.log('Profile update successful in database. New data:', result);
      setUser(result);
      return true;
    } catch (error) {
      console.error('Update user profile error:', error);
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
