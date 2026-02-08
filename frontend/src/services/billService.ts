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

export interface BillData {
  hospitalName: string;
  billDate: string;
  amount: number;
  description: string;
  analysisResult?: any; // strict typing 'BillAnalysisResult' would require import
}

export interface Bill extends BillData {
  id: string;
  userId: string;
  status: 'pending' | 'paid' | 'processing' | 'denied';
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  analysisResult?: any;
}

/**
 * Fetch all bills for a user
 */
export const getBills = async (userId: string): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from('hospital_bills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }

  return data.map(bill => ({
    id: bill.id,
    userId: bill.user_id,
    hospitalName: bill.hospital_name,
    billDate: bill.bill_date,
    amount: bill.amount,
    status: (bill.status as Bill['status']) || 'pending',
    description: bill.description || '',
    fileUrl: bill.file_url || undefined,
    createdAt: bill.created_at || new Date().toISOString(),
    updatedAt: bill.updated_at || new Date().toISOString(),
    analysisResult: (bill as any).analysis_result || undefined,
  }));
};

/**
 * Add a new bill with optional file upload - with timeout and retry protection
 */
export const addBill = async (
  userId: string,
  billData: BillData,
  file?: File
): Promise<Bill> => {
  try {
    let fileUrl: string | undefined;

    // Upload file to storage if provided
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Wrap upload with timeout (30 seconds) and retry logic
      await withRetry(
        () => withTimeout(
          supabase.storage
            .from('hospital-bills')
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
        .from('hospital-bills')
        .getPublicUrl(fileName);

      fileUrl = urlData.publicUrl;
    }

    // Insert bill record initially as 'processing' with timeout
    const insertResult = await withTimeout(
      (async () => {
        const result = await supabase
          .from('hospital_bills')
          .insert({
            user_id: userId,
            hospital_name: billData.hospitalName,
            bill_date: billData.billDate,
            amount: billData.amount,
            description: billData.description,
            file_url: fileUrl,
            status: 'processing' // Initial status
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
      console.error('Error adding bill to database:', error);
      throw error;
    }

    // AI Analysis Integration (non-blocking)
    if (file) {
      try {
        // Lazy load to avoid circular dependencies if any
        const { analyzeBillDetails, analyzeDocument } = await import('./ai');

        // Step 1: Document Classification Check
        const classification = await withTimeout(
          analyzeDocument(file),
          20000,
          'Document classification timed out'
        );

        if (!classification.isValid || classification.type !== 'bill') {
          console.warn('Bill rejected: Type mismatch', classification.type);
          await supabase
            .from('hospital_bills')
            .update({
              status: 'denied',
              description: `AI Rejected: Document appears to be a ${classification.type} instead of a hospital bill.`
            })
            .eq('id', data.id);

          return {
            id: data.id,
            userId: data.user_id,
            hospitalName: data.hospital_name,
            billDate: data.bill_date,
            amount: data.amount,
            status: 'denied',
            description: `AI Rejected: Document appears to be a ${classification.type} instead of a hospital bill.`,
            fileUrl: data.file_url || undefined,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
          };
        }

        // Step 2: Detailed Bill Analysis
        // Fetch active insurance policy for context
        const { data: insuranceData } = await supabase
          .from('insurance_documents')
          .select('analysis_result')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .limit(1)
          .maybeSingle();

        let insuranceContext = '';
        if (insuranceData && (insuranceData as any).analysis_result) {
          const result = (insuranceData as any).analysis_result;
          insuranceContext = `
          Policy Details:
          Provider: ${result.overview?.insurerName || 'Unknown'}
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
          `;
        }

        const analysis = await withTimeout(
          analyzeBillDetails(file, insuranceContext),
          25000,
          'AI analysis timed out'
        );

        if (analysis) {
          // Update with AI extracted intelligence
          const updates: Record<string, string | number | object> = {
            status: 'pending', // Validated and ready for review
            description: analysis.overview.summary || data.description || '',
            analysis_result: analysis
          };

          if (analysis.overview.totalAmount) updates.amount = analysis.overview.totalAmount;
          if (analysis.overview.hospitalName) updates.hospital_name = analysis.overview.hospitalName;
          if (analysis.overview.date) updates.bill_date = analysis.overview.date;

          const { data: updatedData, error: updateError } = await supabase
            .from('hospital_bills')
            .update(updates)
            .eq('id', data.id)
            .select()
            .single();

          if (!updateError && updatedData) {
            return {
              id: updatedData.id,
              userId: updatedData.user_id,
              hospitalName: updatedData.hospital_name,
              billDate: updatedData.bill_date,
              amount: updatedData.amount,
              status: (updatedData.status as Bill['status']) || 'pending',
              description: updatedData.description || '',
              fileUrl: updatedData.file_url || undefined,
              createdAt: updatedData.created_at || new Date().toISOString(),
              updatedAt: updatedData.updated_at || new Date().toISOString(),
              analysisResult: (updatedData as any).analysis_result || undefined,
            };
          }
        } else {
          // Mark as denied/review if document seems invalid
          await supabase
            .from('hospital_bills')
            .update({
              status: 'denied',
              description: `AI Flag: Potential invalid or unreadable document`
            })
            .eq('id', data.id);
        }
      } catch (aiError) {
        console.error('AI Analysis failed, proceeding with original data', aiError);
        // Fallback: just set to pending so it's not stuck in processing
        await supabase.from('hospital_bills').update({ status: 'pending' }).eq('id', data.id);

        // Return updated object so UI reflects change
        return {
          id: data.id,
          userId: data.user_id,
          hospitalName: data.hospital_name,
          billDate: data.bill_date,
          amount: data.amount,
          status: 'pending', // Explicitly set to pending
          description: data.description || '',
          fileUrl: data.file_url || undefined,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
        };
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      hospitalName: data.hospital_name,
      billDate: data.bill_date,
      amount: data.amount,
      status: (data.status as Bill['status']) || 'pending',
      description: data.description || '',
      fileUrl: data.file_url || undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error: unknown) {
    console.error('Add bill error:', error);

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
    throw new Error(errorMessage || 'Failed to upload bill. Please try again.');
  }
};

/**
 * Update bill status
 */
export const updateBillStatus = async (
  billId: string,
  status: 'pending' | 'paid' | 'processing' | 'denied'
): Promise<void> => {
  const { error } = await supabase
    .from('hospital_bills')
    .update({ status })
    .eq('id', billId);

  if (error) {
    console.error('Error updating bill status:', error);
    throw error;
  }
  if (error) {
    console.error('Error updating bill status:', error);
    throw error;
  }
};

/**
 * Update bill analysis result
 */
export const updateBillAnalysis = async (
  billId: string,
  analysis: any
): Promise<void> => {
  const { error } = await supabase
    .from('hospital_bills')
    .update({ analysis_result: analysis } as any)
    .eq('id', billId);

  if (error) {
    console.error('Error updating bill analysis:', error);
    throw error;
  }
};

/**
 * Delete a bill and its associated file
 */
export const deleteBill = async (billId: string): Promise<void> => {
  // First get the bill to find the file URL
  const { data: bill, error: fetchError } = await supabase
    .from('hospital_bills')
    .select('file_url')
    .eq('id', billId)
    .single();

  if (fetchError) {
    console.error('Error fetching bill:', fetchError);
    throw fetchError;
  }

  // Delete file from storage if it exists
  if (bill?.file_url) {
    const path = bill.file_url.split('hospital-bills/')[1];
    if (path) {
      await supabase.storage.from('hospital-bills').remove([path]);
    }
  }

  // Delete bill record
  const { error } = await supabase
    .from('hospital_bills')
    .delete()
    .eq('id', billId);

  if (error) {
    console.error('Error deleting bill:', error);
    throw error;
  }
};
