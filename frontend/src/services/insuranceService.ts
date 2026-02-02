import { supabase } from '@/integrations/supabase/client';

export interface DocumentData {
  fileName: string;
  fileType: string;
}

export interface InsuranceDocument extends DocumentData {
  id: string;
  userId: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all insurance documents for a user
 */
export const getDocuments = async (userId: string): Promise<InsuranceDocument[]> => {
  const { data, error } = await supabase
    .from('insurance_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return data.map(doc => ({
    id: doc.id,
    userId: doc.user_id,
    fileName: doc.file_name,
    fileType: doc.file_type,
    fileUrl: doc.file_url,
    fileSize: doc.file_size,
    uploadDate: doc.upload_date,
    status: doc.status,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }));
};

/**
 * Upload an insurance document
 */
export const uploadDocument = async (
  userId: string,
  docData: DocumentData,
  file: File
): Promise<InsuranceDocument> => {
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('insurance-documents')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading document:', uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('insurance-documents')
    .getPublicUrl(fileName);

  // Insert document record
  const { data, error } = await supabase
    .from('insurance_documents')
    .insert({
      user_id: userId,
      file_name: docData.fileName,
      file_type: docData.fileType,
      file_url: urlData.publicUrl,
      file_size: file.size,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding document record to database:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    fileName: data.file_name,
    fileType: data.file_type,
    fileUrl: data.file_url,
    fileSize: data.file_size,
    uploadDate: data.upload_date,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Update document status
 */
export const updateDocumentStatus = async (
  docId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  const { error } = await supabase
    .from('insurance_documents')
    .update({ status })
    .eq('id', docId);

  if (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};

/**
 * Delete a document and its associated file
 */
export const deleteDocument = async (docId: string): Promise<void> => {
  // First get the document to find the file URL
  const { data: doc, error: fetchError } = await supabase
    .from('insurance_documents')
    .select('file_url')
    .eq('id', docId)
    .single();

  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw fetchError;
  }

  // Delete file from storage
  if (doc?.file_url) {
    const fileName = doc.file_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('insurance-documents').remove([fileName]);
    }
  }

  // Delete document record
  const { error } = await supabase
    .from('insurance_documents')
    .delete()
    .eq('id', docId);

  if (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
