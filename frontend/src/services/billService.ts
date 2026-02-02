import { supabase } from '@/integrations/supabase/client';

export interface BillData {
  hospitalName: string;
  billDate: string;
  amount: number;
  description: string;
}

export interface Bill extends BillData {
  id: string;
  userId: string;
  status: 'pending' | 'paid' | 'processing' | 'denied';
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
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
    status: bill.status,
    description: bill.description,
    fileUrl: bill.file_url,
    createdAt: bill.created_at,
    updatedAt: bill.updated_at,
  }));
};

/**
 * Add a new bill with optional file upload
 */
export const addBill = async (
  userId: string,
  billData: BillData,
  file?: File
): Promise<Bill> => {
  let fileUrl: string | undefined;

  // Upload file to storage if provided
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('hospital-bills')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('hospital-bills')
      .getPublicUrl(fileName);

    fileUrl = urlData.publicUrl;
  }

  // Insert bill record
  const { data, error } = await supabase
    .from('hospital_bills')
    .insert({
      user_id: userId,
      hospital_name: billData.hospitalName,
      bill_date: billData.billDate,
      amount: billData.amount,
      description: billData.description,
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding bill:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    hospitalName: data.hospital_name,
    billDate: data.bill_date,
    amount: data.amount,
    status: data.status,
    description: data.description,
    fileUrl: data.file_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
    const fileName = bill.file_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('hospital-bills').remove([fileName]);
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
