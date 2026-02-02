// Backend Mode Configuration
// Toggle between localStorage and Supabase

export const BACKEND_CONFIG = {
  // Set to 'localStorage' to use local storage (no Supabase needed)
  // Set to 'supabase' to use Supabase backend
  mode: 'localStorage' as 'localStorage' | 'supabase',
  
  // Feature flags
  features: {
    realTimeChat: false, // Only works with Supabase
    fileStorage: false,   // Only works with Supabase
  }
};

export const isLocalStorageMode = () => BACKEND_CONFIG.mode === 'localStorage';
export const isSupabaseMode = () => BACKEND_CONFIG.mode === 'supabase';
