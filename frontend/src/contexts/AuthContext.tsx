import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getProfile, updateProfile as updateProfileService, createProfile } from '@/services/profileService';

// Error types for better error handling
export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TIMEOUT = 'TIMEOUT',
  PROFILE_ERROR = 'PROFILE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
}

// Helper function to wrap promises with timeout
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

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
  lastError: AuthError | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  signup: (userData: { email: string; password: string; firstName?: string; lastName?: string; phone?: string }) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearError = () => setLastError(null);

  // Enhanced profile loading with retry logic
  const loadUserProfile = useCallback(async (
    supabaseUser: SupabaseUser,
    retries: number = 2
  ): Promise<User | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const profile = await withTimeout(
          getProfile(supabaseUser.id),
          5000,
          'Profile fetch timed out'
        );
        
        if (!profile) {
          // Create initial profile if it doesn't exist
          const metadata = supabaseUser.user_metadata || {};
          
          const newProfile = await withTimeout(
            createProfile(supabaseUser.id, {
              email: supabaseUser.email || '',
              firstName: metadata.firstName || '',
              lastName: metadata.lastName || '',
              phone: metadata.phone || '',
            }),
            8000,
            'Profile creation timed out'
          );
          
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
        console.error(`Profile load attempt ${attempt + 1} failed:`, error);
        
        // If this was the last retry, return null
        if (attempt === retries) {
          console.error('All profile load attempts failed');
          return null;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
    
    return null;
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Supabase mode
    const initSession = async () => {
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null }, error: Error }>((_, reject) => 
            setTimeout(() => reject(new Error('Session check timed out')), 10000)
          )
        ]);

        if (error) throw error;
        
        const session = data?.session;
        if (session?.user) {
          try {
            const userProfile = await loadUserProfile(session.user);
            if (userProfile) {
              setUser(userProfile);
            } else {
              // Use basic user if profile fails
              setUser({
                id: session.user.id,
                email: session.user.email || '',
              });
            }
          } catch (error) {
            console.error('Profile load failed during init:', error);
            // Still set basic user
            setUser({
              id: session.user.id,
              email: session.user.email || '',
            });
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const userProfile = await loadUserProfile(session.user);
          if (userProfile) {
            setUser(userProfile);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
            });
          }
        } catch (error) {
          console.error('Profile load failed in auth change:', error);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile, isMountedRef]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      clearError();
      
      // Add timeout to prevent hanging indefinitely
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        10000,
        'Login request timed out'
      );

      if (error) {
        console.error('Login error:', error);
        
        // Determine error type
        let authError: AuthError;
        if (error.message.includes('Invalid login credentials')) {
          authError = {
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'Invalid email or password. Please try again.',
          };
        } else if (error.message.includes('timed out') || error.message.includes('timeout')) {
          authError = {
            type: AuthErrorType.TIMEOUT,
            message: 'Connection timed out. Please check your internet and try again.',
          };
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          authError = {
            type: AuthErrorType.NETWORK_ERROR,
            message: 'Network error. Please check your connection and try again.',
          };
        } else {
          authError = {
            type: AuthErrorType.UNKNOWN,
            message: error.message || 'An unexpected error occurred. Please try again.',
          };
        }
        
        setLastError(authError);
        return { success: false, error: authError };
      }

      // CRITICAL: Only proceed if we have BOTH a valid user AND session
      // This prevents authentication bypass
      if (data.user && data.session) {
        // Try to load user profile, but don't block login if it fails
        try {
          const userProfile = await loadUserProfile(data.user);
          
          if (userProfile && isMountedRef.current) {
            setUser(userProfile);
          } else {
            // Profile load failed, use basic user data
            const basicUser: User = {
              id: data.user.id,
              email: data.user.email || '',
            };
            
            if (isMountedRef.current) {
              setUser(basicUser);
            }
          }
        } catch (profileError) {
          console.error('Profile load error during login:', profileError);
          // Still allow login with basic user data
          const basicUser: User = {
            id: data.user.id,
            email: data.user.email || '',
          };
          
          if (isMountedRef.current) {
            setUser(basicUser);
          }
        }
        
        return { success: true };
      }

      const unknownError: AuthError = {
        type: AuthErrorType.UNKNOWN,
        message: 'Login failed. Please try again.',
      };
      setLastError(unknownError);
      return { success: false, error: unknownError };
    } catch (error) {
      console.error('Login exception:', error);
      
      const authError: AuthError = {
        type: error instanceof Error && error.message.includes('timed out') 
          ? AuthErrorType.TIMEOUT 
          : AuthErrorType.NETWORK_ERROR,
        message: error instanceof Error && error.message.includes('timed out')
          ? 'Connection timed out. Please check your internet and try again.'
          : 'Network error. Please check your connection and try again.',
      };
      
      setLastError(authError);
      return { success: false, error: authError };
    }
  };

  const signup = async (userData: { 
    email: string; 
    password: string; 
    firstName?: string; 
    lastName?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      clearError();
      
      // Add timeout to prevent hanging indefinitely
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
            },
          },
        }),
        10000,
        'Signup request timed out'
      );

      if (error) {
        console.error('Signup error:', error);
        
        // Determine error type
        let authError: AuthError;
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          authError = {
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'This email is already registered. Please login instead.',
          };
        } else if (error.message.includes('timed out') || error.message.includes('timeout')) {
          authError = {
            type: AuthErrorType.TIMEOUT,
            message: 'Connection timed out. Please check your internet and try again.',
          };
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          authError = {
            type: AuthErrorType.NETWORK_ERROR,
            message: 'Network error. Please check your connection and try again.',
          };
        } else {
          authError = {
            type: AuthErrorType.UNKNOWN,
            message: error.message || 'Signup failed. Please try again.',
          };
        }
        
        setLastError(authError);
        return { success: false, error: authError };
      }

      if (data.user) {
        // Try to load user profile, but don't block signup if it fails
        try {
          const userProfile = await loadUserProfile(data.user);
          
          if (userProfile && isMountedRef.current) {
            setUser(userProfile);
          } else {
            // Profile load/creation failed, use basic user data
            const basicUser: User = {
              id: data.user.id,
              email: data.user.email || '',
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
            };
            
            if (isMountedRef.current) {
              setUser(basicUser);
            }
          }
        } catch (profileError) {
          console.error('Profile creation error during signup:', profileError);
          // Still allow signup with basic user data
          const basicUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
          };
          
          if (isMountedRef.current) {
            setUser(basicUser);
          }
        }
        
        return { success: true };
      }

      const unknownError: AuthError = {
        type: AuthErrorType.UNKNOWN,
        message: 'Signup failed. Please try again.',
      };
      setLastError(unknownError);
      return { success: false, error: unknownError };
    } catch (error) {
      console.error('Signup exception:', error);
      
      const authError: AuthError = {
        type: error instanceof Error && error.message.includes('timed out') 
          ? AuthErrorType.TIMEOUT 
          : AuthErrorType.NETWORK_ERROR,
        message: error instanceof Error && error.message.includes('timed out')
          ? 'Connection timed out. Please check your internet and try again.'
          : 'Network error. Please check your connection and try again.',
      };
      
      setLastError(authError);
      return { success: false, error: authError };
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, lastError, login, signup, logout, updateUser, resetPassword, clearError }}>
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
