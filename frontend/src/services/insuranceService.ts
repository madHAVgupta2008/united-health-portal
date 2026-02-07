import { supabase } from '@/integrations/supabase/client';

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

// Helper function for retry logic with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

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
    uploadDate: doc.upload_date || new Date().toISOString(),
    status: (doc.status as InsuranceDocument['status']) || 'pending',
    createdAt: doc.created_at || new Date().toISOString(),
    updatedAt: doc.updated_at || new Date().toISOString(),
  }));
};

/**
 * Upload an insurance document with timeout and retry protection
 */
export const uploadDocument = async (
  userId: string,
  docData: DocumentData,
  file: File
): Promise<InsuranceDocument> => {
  try {
    // Upload file to storage with timeout and retry
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Wrap upload with timeout (30 seconds) and retry logic
    await withRetry(
      () => withTimeout(
        supabase.storage
          .from('insurance-documents')
          .upload(fileName, file)
          .then(result => {
            if (result.error) throw result.error;
            return result;
          }),
        30000,
        'File upload timed out after 30 seconds'
      ),
      3, // 3 retry attempts
      1000 // Start with 1 second delay
    );

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('insurance-documents')
      .getPublicUrl(fileName);

    // Insert document record with timeout
    const insertResult = await withTimeout(
      (async () => {
        const result = await supabase
          .from('insurance_documents')
          .insert({
            user_id: userId,
            file_name: docData.fileName,
            file_type: docData.fileType,
            file_url: urlData.publicUrl,
            file_size: file.size,
            status: 'pending'
          })
          .select()
          .single();
        return result;
      })(),
      10000,
      'Database insert timed out'
    );

    const { data, error } = insertResult;

    if (error) {
      console.error('Error adding document record to database:', error);
      throw error;
    }

    // AI Analysis Integration (non-blocking)
    try {
      // Lazy load to avoid circular dependencies if any
      const { analyzeDocument } = await import('./ai');
      const analysis = await withTimeout(
        analyzeDocument(file),
        25000, // Increased timeout for analysis
        'AI analysis timed out'
      );

      if (analysis.isValid) {
        // Construct a smart filename and type based on analysis
        // e.g. "UHC Medical Policy - 12345.pdf"
        let smartFileName = data.file_name;
        let smartFileType = data.file_type;

        if (analysis.extractedData) {
          const { provider, coverageType, policyNumber, documentType } = analysis.extractedData;

          // Generate smart name parts
          const parts = [];
          if (provider) parts.push(provider);
          if (coverageType) parts.push(coverageType);
          if (documentType) parts.push(documentType);

          if (parts.length > 0) {
            // Keep original extension
            const ext = data.file_name.split('.').pop();
            smartFileName = `${parts.join(' ')}${policyNumber ? ` - ${policyNumber}` : ''}.${ext}`;
          }

          if (documentType) {
            smartFileType = documentType;
          }
        }

        // Auto-approve and update metadata
        const { data: updatedData } = await supabase
          .from('insurance_documents')
          .update({
            status: 'approved',
            file_name: smartFileName,
            file_type: smartFileType
          })
          .eq('id', data.id)
          .select()
          .single();

        if (updatedData) {
          return {
            id: updatedData.id,
            userId: updatedData.user_id,
            fileName: updatedData.file_name,
            fileType: updatedData.file_type,
            fileUrl: updatedData.file_url,
            fileSize: updatedData.file_size,
            uploadDate: updatedData.upload_date || new Date().toISOString(),
            status: (updatedData.status as InsuranceDocument['status']) || 'pending',
            createdAt: updatedData.created_at || new Date().toISOString(),
            updatedAt: updatedData.updated_at || new Date().toISOString(),
          };
        }
      } else {
        await supabase
          .from('insurance_documents')
          .update({ status: 'rejected' })
          .eq('id', data.id);
      }
    } catch (aiError) {
      console.error('AI Analysis failed, document uploaded successfully:', aiError);
      // Continue with original data even if AI fails
    }

    return {
      id: data.id,
      userId: data.user_id,
      fileName: data.file_name,
      fileType: data.file_type,
      fileUrl: data.file_url,
      fileSize: data.file_size,
      uploadDate: data.upload_date || new Date().toISOString(),
      status: (data.status as InsuranceDocument['status']) || 'pending',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error: unknown) {
    console.error('Upload document error:', error);

    // Type guard for error messages
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);

    // Provide user-friendly error messages
    if (errorMessage.includes('timed out')) {
      throw new Error('Upload timed out. Please check your connection and try again.');
    } else if (errorMessage.includes('aborted')) {
      throw new Error('Upload was interrupted. Please try again.');
    } else if (errorMessage.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(errorMessage || 'Failed to upload document. Please try again.');
  }
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
    const path = doc.file_url.split('insurance-documents/')[1];
    if (path) {
      await supabase.storage.from('insurance-documents').remove([path]);
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
