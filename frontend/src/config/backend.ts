// Backend Mode Configuration
// Strictly using Supabase

export const BACKEND_CONFIG = {
  mode: 'supabase' as const,
  
  // Feature flags
  features: {
    realTimeChat: true,
    fileStorage: true,
  }
};

export const isLocalStorageMode = () => false;
export const isSupabaseMode = () => true;
