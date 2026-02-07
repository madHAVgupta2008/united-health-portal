import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getBills, addBill as addBillService, updateBillStatus as updateBillStatusService, deleteBill as deleteBillService, Bill } from '@/services/billService';
import { getDocuments, uploadDocument as uploadDocumentService, deleteDocument as deleteDocumentService, InsuranceDocument } from '@/services/insuranceService';
import { getChatHistory, saveChatMessage, clearChatHistory as clearChatHistoryService, ChatMessage as ChatMsg } from '@/services/chatService';

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
  fileUrl: string;
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
  uploadDocument: (docData: Omit<InsuranceFile, 'id' | 'uploadDate' | 'status' | 'fileSize' | 'fileUrl'>, file: File) => Promise<void>;
  addChatMessage: (message: ChatMessage) => Promise<void>;
  clearChat: () => Promise<void>;
  updateBillStatus: (billId: string, status: 'pending' | 'paid' | 'processing' | 'denied') => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
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
  // Format file size helper function
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const convertBill = useCallback((bill: Bill): HospitalBill => ({
    id: bill.id,
    hospitalName: bill.hospitalName,
    billDate: bill.billDate,
    amount: bill.amount,
    status: bill.status as 'pending' | 'paid' | 'processing' | 'denied',
    description: bill.description,
    fileUrl: bill.fileUrl,
  }), []);



  const convertInsuranceFile = useCallback((doc: InsuranceDocument): InsuranceFile => ({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    uploadDate: doc.uploadDate,
    status: doc.status as 'pending' | 'approved' | 'rejected',
    fileSize: formatFileSize(doc.fileSize),
    fileUrl: doc.fileUrl,
  }), [formatFileSize]);

  const convertChatMessage = useCallback((msg: ChatMsg): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender,
    timestamp: new Date(msg.createdAt),
  }), []);

  // Load data when user is authenticated
  const loadData = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setBills([]);
      setInsuranceFiles([]);
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Supabase mode only
      const [billsData, docsData, chatData] = await Promise.all([
        getBills(user.id),
        getDocuments(user.id),
        getChatHistory(user.id),
      ]);

      // Convert bills inline
      setBills(billsData.map(bill => ({
        id: bill.id,
        hospitalName: bill.hospitalName,
        billDate: bill.billDate,
        amount: bill.amount,
        status: bill.status,
        description: bill.description,
        fileUrl: bill.fileUrl,
      })));

      // Convert documents inline
      setInsuranceFiles(docsData.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        uploadDate: doc.uploadDate,
        status: doc.status,
        fileSize: formatFileSize(doc.fileSize),
        fileUrl: doc.fileUrl,
      })));

      // Convert chat messages inline
      setChatHistory(chatData.map(convertChatMessage));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, formatFileSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBill = async (
    billData: Omit<HospitalBill, 'id' | 'status' | 'fileUrl'>,
    file?: File
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Supabase mode only
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
    docData: Omit<InsuranceFile, 'id' | 'uploadDate' | 'status' | 'fileSize' | 'fileUrl'>,
    file: File
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Supabase mode only
      const newDoc = await uploadDocumentService(
        user.id,
        {
          fileName: docData.fileName,
          fileType: docData.fileType,
        },
        file
      );
      setInsuranceFiles(prev => [convertInsuranceFile(newDoc), ...prev]);
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

      // Supabase mode only
      await saveChatMessage(user.id, message.content, message.sender);
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Revert on error
      setChatHistory(prev => prev.filter(m => m.id !== message.id));
      throw error;
    }
  };

  const clearChat = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setChatHistory([]);
      // Supabase mode only
      await clearChatHistoryService(user.id);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      // We can't easily revert a clear operation, so just refresh
      await loadData();
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  const updateBillStatus = async (billId: string, status: 'pending' | 'paid' | 'processing' | 'denied'): Promise<void> => {
    await updateBillStatusService(billId, status);
    setBills(prev => prev.map(bill => bill.id === billId ? { ...bill, status } : bill));
  };

  const deleteBill = async (billId: string): Promise<void> => {
    await deleteBillService(billId);
    setBills(prev => prev.filter(bill => bill.id !== billId));
  };

  const deleteDocument = async (docId: string): Promise<void> => {
    await deleteDocumentService(docId);
    setInsuranceFiles(prev => prev.filter(doc => doc.id !== docId));
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
        clearChat,
        updateBillStatus,
        deleteBill,
        deleteDocument,
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
