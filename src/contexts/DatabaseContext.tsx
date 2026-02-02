import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getBills, addBill as addBillService, Bill } from '@/services/billService';
import { getDocuments, uploadDocument as uploadDocumentService, InsuranceDocument } from '@/services/insuranceService';
import { getChatHistory, saveChatMessage, ChatMessage as ChatMsg } from '@/services/chatService';

interface HospitalBill {
  id: string;
  hospitalName: string;
  billDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'processing' | 'denied';
  description: string;
  fileUrl?: string;
}

interface InsuranceFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  fileSize: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface DatabaseContextType {
  bills: HospitalBill[];
  insuranceFiles: InsuranceFile[];
  chatHistory: ChatMessage[];
  isLoading: boolean;
  addBill: (billData: Omit<HospitalBill, 'id' | 'status' | 'fileUrl'>, file?: File) => Promise<void>;
  uploadDocument: (docData: Omit<InsuranceFile, 'id' | 'uploadDate' | 'status' | 'fileSize'>, file: File) => Promise<void>;
  addChatMessage: (message: ChatMessage) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [bills, setBills] = useState<HospitalBill[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<InsuranceFile[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert service types to context types
  const convertBill = (bill: Bill): HospitalBill => ({
    id: bill.id,
    hospitalName: bill.hospitalName,
    billDate: bill.billDate,
    amount: bill.amount,
    status: bill.status,
    description: bill.description,
    fileUrl: bill.fileUrl,
  });

  const convertDocument = (doc: InsuranceDocument): InsuranceFile => ({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    uploadDate: doc.uploadDate,
    status: doc.status,
    fileSize: formatFileSize(doc.fileSize),
  });

  const convertChatMessage = (msg: ChatMsg): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender,
    timestamp: new Date(msg.createdAt),
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Load data when user is authenticated
  const loadData = async () => {
    if (!user || !isAuthenticated) {
      setBills([]);
      setInsuranceFiles([]);
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load all data in parallel
      const [billsData, docsData, chatData] = await Promise.all([
        getBills(user.id),
        getDocuments(user.id),
        getChatHistory(user.id),
      ]);

      setBills(billsData.map(convertBill));
      setInsuranceFiles(docsData.map(convertDocument));
      setChatHistory(chatData.map(convertChatMessage));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isAuthenticated]);

  const addBill = async (
    billData: Omit<HospitalBill, 'id' | 'status' | 'fileUrl'>,
    file?: File
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newBill = await addBillService(
        user.id,
        {
          hospitalName: billData.hospitalName,
          billDate: billData.billDate,
          amount: billData.amount,
          description: billData.description,
        },
        file
      );

      setBills(prev => [convertBill(newBill), ...prev]);
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  };

  const uploadDocument = async (
    docData: Omit<InsuranceFile, 'id' | 'uploadDate' | 'status' | 'fileSize'>,
    file: File
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newDoc = await uploadDocumentService(
        user.id,
        {
          fileName: docData.fileName,
          fileType: docData.fileType,
        },
        file
      );

      setInsuranceFiles(prev => [convertDocument(newDoc), ...prev]);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const addChatMessage = async (message: ChatMessage): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Optimistically add to UI
      setChatHistory(prev => [...prev, message]);

      // Save to database
      await saveChatMessage(user.id, message.content, message.sender);
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Revert on error
      setChatHistory(prev => prev.filter(m => m.id !== message.id));
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  return (
    <DatabaseContext.Provider 
      value={{ 
        bills, 
        insuranceFiles, 
        chatHistory, 
        isLoading,
        addBill, 
        uploadDocument, 
        addChatMessage,
        refreshData,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
