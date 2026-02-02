import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to Supabase Storage
 */
export const uploadToStorage = async (
  bucket: string,
  path: string,
  file: File
): Promise<string> => {
  const { error } = await supabase.storage.from(bucket).upload(path, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFromStorage = async (
  bucket: string,
  path: string
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get public URL for a file
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Validate file size (in MB)
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file type
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return fileExtension ? allowedTypes.includes(fileExtension) : false;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
