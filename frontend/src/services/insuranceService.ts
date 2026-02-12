import { supabase } from '@/integrations/supabase/client';
import { analyzeDocument, analyzeInsuranceDetails, InsuranceAnalysisResult } from './ai';

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
  throw new Error("Analysis failed after retries");
}

/**
 * Helper to format insurance analysis result into a context string for AI
 */
export const formatInsuranceContext = (result: InsuranceAnalysisResult): string => {
  if (!result) return '';

  return `
    Policy Details:
    Provider: ${result.overview?.insurerName || 'Unknown Insurer'}
    Policy Number: ${result.overview?.policyNumber || 'Unknown'}
    Effective Date: ${result.overview?.effectiveDate || 'N/A'}
    Expiration Date: ${result.overview?.expirationDate || 'N/A'}
    
    Financials:
    - Deductible: Individual ${result.financials?.deductible?.individual || 'N/A'}, Family ${result.financials?.deductible?.family || 'N/A'}
    - Out-of-Pocket Max: Individual ${result.financials?.outOfPocketMax?.individual || 'N/A'}, Family ${result.financials?.outOfPocketMax?.family || 'N/A'}
    - Co-insurance: In-Network ${result.financials?.coinsuranceRate?.inNetwork || 'N/A'}, Out-of-Network ${result.financials?.coinsuranceRate?.outOfNetwork || 'N/A'}
    - Copays: PCP ${result.financials?.copay?.pcp || 'N/A'}, Specialist ${result.financials?.copay?.specialist || 'N/A'}, ER ${result.financials?.copay?.er || 'N/A'}
    
    Coverage Details:
    ${result.coverage?.map((c: any) => `- ${c.type}: Limit ${c.limit}, Deductible ${c.deductible}, Copay ${c.copay}`).join('\n') || 'No specific coverage details found.'}
    
    Benefits (Covered Services):
    ${result.benefits?.filter((b: any) => b.covered).map((b: any) => `- ${b.category}: ${b.description}`).join('\n') || 'No specific benefits listed.'}
    
    Exclusions (Not Covered):
    ${result.exclusions?.map((e: any) => `- ${e.item}: ${e.reason}`).join('\n') || 'No specific exclusions listed.'}
  `;
};

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
  analysisResult?: any;
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
    analysisResult: (doc as any).analysis_result || undefined,
  }));
};

/**
 * Update document analysis result
 */
export const updateDocumentAnalysis = async (
  docId: string,
  analysis: any
): Promise<void> => {
  const { error } = await supabase
    .from('insurance_documents')
    .update({
      analysis_result: analysis,
      status: 'approved'
    } as any)
    .eq('id', docId);

  if (error) {
    console.error('Error updating document analysis:', error);
    throw error;
  }
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
      const { analyzeDocument, analyzeInsuranceDetails } = await import('./ai');

      // Step 1: Document Classification Check
      const classification = await withTimeout(
        analyzeDocument(file),
        25000, // Increased timeout for analysis
        'AI classification timed out'
      );

      if (classification.isValid) {
        // Enforce strict type check
        if (classification.type === 'insurance') {
          // Construct a smart filename and type based on classification
          let smartFileName = data.file_name;
          let smartFileType = data.file_type;

          if (classification.extractedData) {
            const { provider, coverageType, policyNumber, documentType } = classification.extractedData;

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

          // Step 2: Run full detailed insurance analysis
          let detailedAnalysis: any = classification; // fallback to classification
          try {
            console.log('Running detailed insurance analysis...');
            const fullAnalysis = await withTimeout(
              analyzeInsuranceDetails(file),
              30000,
              'Detailed insurance analysis timed out'
            );
            if (fullAnalysis) {
              detailedAnalysis = fullAnalysis;
              console.log('Detailed insurance analysis completed successfully');
            }
          } catch (detailError) {
            console.warn('Detailed insurance analysis failed, using basic classification:', detailError);
            // Continue with basic classification result as fallback
          }

          // Auto-approve and update metadata with full analysis
          const { data: updatedData } = await supabase
            .from('insurance_documents')
            .update({
              status: 'approved',
              file_name: smartFileName,
              file_type: smartFileType,
              analysis_result: detailedAnalysis
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
              analysisResult: (updatedData as any).analysis_result || undefined,
            };
          }
        } else {
          // REJECT: Not an insurance document
          console.warn('Document rejected: Type mismatch', classification.type);
          await supabase
            .from('insurance_documents')
            .update({ status: 'rejected' })
            .eq('id', data.id);

          return {
            id: data.id,
            userId: data.user_id,
            fileName: data.file_name,
            fileType: data.file_type,
            fileUrl: data.file_url,
            fileSize: data.file_size,
            uploadDate: data.upload_date || new Date().toISOString(),
            status: 'rejected',
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
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
      // Fallback: set to pending so it's not stuck
      await supabase.from('insurance_documents').update({ status: 'pending' }).eq('id', data.id);
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
