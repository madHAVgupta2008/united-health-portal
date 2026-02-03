import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  planType?: string;
}

export interface Profile extends ProfileData {
  id: string;
  memberId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user profile
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile not found
      return null;
    }
    console.error('Error fetching profile:', error);
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.date_of_birth,
    memberId: data.member_id,
    planType: data.plan_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  profileData: Partial<ProfileData>
): Promise<Profile> => {
  const updateData: Record<string, string | null | number> = {};

  if (profileData.firstName !== undefined) updateData.first_name = profileData.firstName;
  if (profileData.lastName !== undefined) updateData.last_name = profileData.lastName;
  if (profileData.phone !== undefined) updateData.phone = profileData.phone;
  if (profileData.address !== undefined) updateData.address = profileData.address;
  if (profileData.dateOfBirth !== undefined) {
    updateData.date_of_birth = profileData.dateOfBirth === '' ? null : profileData.dateOfBirth;
  }
  if (profileData.planType !== undefined) updateData.plan_type = profileData.planType;
  if (profileData.email !== undefined) updateData.email = profileData.email;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.date_of_birth,
    memberId: data.member_id,
    planType: data.plan_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Create initial profile (usually called automatically by trigger)
 */
export const createProfile = async (
  userId: string,
  profileData: ProfileData
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: profileData.email,
      first_name: profileData.firstName || null,
      last_name: profileData.lastName || null,
      phone: profileData.phone || null,
      address: profileData.address || null,
      date_of_birth: profileData.dateOfBirth || null,
      plan_type: profileData.planType || 'Standard',
      member_id: `UH-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.date_of_birth,
    memberId: data.member_id,
    planType: data.plan_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};
