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

  // Enhanced profile loading with retry logic and self-healing
  const loadUserProfile = useCallback(async (
    supabaseUser: SupabaseUser,
    retries: number = 2
  ): Promise<User | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let profile = await withTimeout(
          getProfile(supabaseUser.id),
          5000,
          'Profile fetch timed out'
        );

        const metadata = supabaseUser.user_metadata || {};

        if (!profile) {
          // Create initial profile if it doesn't exist
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

        // Self-healing: If profile exists but is missing data that we have in metadata, update it
        if ((!profile.firstName && metadata.firstName) ||
          (!profile.lastName && metadata.lastName)) {
          console.log('Profile missing data, attempting to sync from metadata...');
          try {
            const updatedProfile = await updateProfileService(supabaseUser.id, {
              firstName: metadata.firstName,
              lastName: metadata.lastName,
              phone: metadata.phone,
            });

            // Use the updated profile
            if (updatedProfile) {
              profile = updatedProfile;
            }
          } catch (updateError) {
            console.error('Failed to sync profile from metadata:', updateError);
            // Continue with existing profile rather than failing
          }
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
            setTimeout(() => reject(new Error('Session check timed out')), 20000)
          )
        ]);

        if (error) throw error;

        const session = data?.session;
        if (session?.user) {
          // Only set user if email is verified
          if (session.user.email_confirmed_at) {
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
          } else {
            // Email not verified, don't set user
            console.log('Initial session: Email not verified, not setting user');
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
        // Only set user if email is verified
        if (session.user.email_confirmed_at) {
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
          // Email not verified, don't set user
          console.log('Auth state change: Email not verified, not setting user');
          setUser(null);
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
        30000,
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
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          console.log('Email not verified, blocking login');

          // Sign out the user immediately
          await supabase.auth.signOut();

          const verificationError: AuthError = {
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          };

          setLastError(verificationError);
          return { success: false, error: verificationError };
        }

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
            emailRedirectTo: `${window.location.origin}/verify-email`,
            data: {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
            },
          },
        }),
        30000,
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
        // Don't set user state - they need to verify email first
        // Profile will be created by database trigger, but user won't be logged in
        console.log('Signup successful, user must verify email before login');

        // Note: We don't set the user state here because email is not verified yet
        // The user will need to verify their email and then login

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
