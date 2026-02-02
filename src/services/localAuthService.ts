// localStorage Authentication Service
// Simple authentication using localStorage (no backend required)

import { v4 as uuidv4 } from 'uuid';

interface StoredUser {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  memberId?: string;
  planType?: string;
  createdAt: string;
}

const USERS_KEY = 'app_users_db';
const CURRENT_USER_KEY = 'app_current_user';

// Get all users from localStorage
const getUsers = (): StoredUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save users to localStorage
const saveUsers = (users: StoredUser[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Generate member ID
const generateMemberId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `UH-${year}-${random}`;
};

// Register new user
export const localSignup = async (userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: any; error?: string }> => {
  const users = getUsers();
  
  // Check if user already exists
  if (users.find(u => u.email === userData.email)) {
    return { success: false, error: 'User already exists' };
  }
  
  // Create new user
  const newUser: StoredUser = {
    id: uuidv4(),
    email: userData.email,
    password: userData.password, // In production, hash this!
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    memberId: generateMemberId(),
    planType: 'Standard',
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Set as current user
  const { password, ...userWithoutPassword } = newUser;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  
  return { success: true, user: userWithoutPassword };
};

// Login user
export const localLogin = async (email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Set as current user
  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  
  return { success: true, user: userWithoutPassword };
};

// Logout user
export const localLogout = async (): Promise<void> => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Get current user
export const localGetCurrentUser = (): any | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Update user profile
export const localUpdateUser = async (userId: string, updates: Partial<StoredUser>): Promise<{ success: boolean; error?: string }> => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'User not found' };
  }
  
  // Don't allow updating email or password through this method
  const { email, password, id, createdAt, ...allowedUpdates } = updates;
  
  users[userIndex] = { ...users[userIndex], ...allowedUpdates };
  saveUsers(users);
  
  // Update current user if it's the same user
  const currentUser = localGetCurrentUser();
  if (currentUser && currentUser.id === userId) {
    const { password: _, ...userWithoutPassword } = users[userIndex];
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  }
  
  return { success: true };
};

// Reset password (simplified - in production, use email verification)
export const localResetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  // In a real app, you'd send an email here
  // For now, just return success
  return { success: true };
};
