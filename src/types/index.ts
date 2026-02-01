export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  memberId?: string;
  planType?: string;
}

export interface InsuranceFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  fileSize: string;
}

export interface HospitalBill {
  id: string;
  hospitalName: string;
  billDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'processing' | 'denied';
  description: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}
