import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getBills, addBill as addBillService, updateBillStatus as updateBillStatusService, updateBillAnalysis as updateBillAnalysisService, deleteBill as deleteBillService, Bill } from '@/services/billService';
import { getDocuments, uploadDocument as uploadDocumentService, updateDocumentAnalysis as updateDocumentAnalysisService, deleteDocument as deleteDocumentService, InsuranceDocument } from '@/services/insuranceService';
import { getChatHistory, saveChatMessage, clearChatHistory as clearChatHistoryService, ChatMessage as ChatMsg } from '@/services/chatService';

export type { Bill };

interface HospitalBill {
  id: string;
  hospitalName: string;
  billDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'processing' | 'denied';
  description: string;
  fileUrl?: string;
  analysisResult?: any;
}

interface InsuranceFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  fileSize: string;
  fileUrl: string;
  analysisResult?: any;
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
  updateBillAnalysis: (billId: string, analysis: any) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  updateDocumentAnalysis: (docId: string, analysis: any) => Promise<void>;
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
    analysisResult: bill.analysisResult,
  }), []);



  const convertInsuranceFile = useCallback((doc: InsuranceDocument): InsuranceFile => ({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    uploadDate: doc.uploadDate,
    status: doc.status as 'pending' | 'approved' | 'rejected',
    fileSize: formatFileSize(doc.fileSize),
    fileUrl: doc.fileUrl,
    analysisResult: doc.analysisResult,
  }), [formatFileSize]);

  const convertChatMessage = useCallback((msg: ChatMsg): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender,
    timestamp: new Date(msg.createdAt),
  }), []);

  // Helper to manage local storage cache
  const getCacheKey = (key: string, userId: string) => `uhfi_${userId}_${key}`;

  const loadFromCache = useCallback(<T,>(key: string, userId: string): T | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(key, userId));
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error(`Error loading ${key} from cache:`, error);
    }
    return null;
  }, []);

  const saveToCache = useCallback((key: string, userId: string, data: any) => {
    try {
      localStorage.setItem(getCacheKey(key, userId), JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error(`Error saving ${key} to cache:`, error);
    }
  }, []);

  // Load data when user is authenticated
  const loadData = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setBills([]);
      setInsuranceFiles([]);
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    // Try verifying from cache first for immediate feedback
    const cachedBills = loadFromCache<HospitalBill[]>('bills', user.id);
    const cachedDocs = loadFromCache<InsuranceFile[]>('insurance', user.id);
    const cachedChat = loadFromCache<ChatMessage[]>('chat', user.id);

    if (cachedBills) setBills(cachedBills);
    if (cachedDocs) setInsuranceFiles(cachedDocs);
    if (cachedChat) setChatHistory(cachedChat);

    // If we have cached data, stop loading indicator immediately
    if (cachedBills || cachedDocs) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      // Supabase mode only
      const [billsData, docsData, chatData] = await Promise.all([
        getBills(user.id),
        getDocuments(user.id),
        getChatHistory(user.id),
      ]);

      // Convert bills inline
      const formattedBills = billsData.map(bill => ({
        id: bill.id,
        hospitalName: bill.hospitalName,
        billDate: bill.billDate,
        amount: bill.amount,
        status: bill.status,
        description: bill.description,
        fileUrl: bill.fileUrl,
        analysisResult: bill.analysisResult,
      }));
      setBills(formattedBills);
      saveToCache('bills', user.id, formattedBills);

      // Convert documents inline
      const formattedDocs = docsData.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        uploadDate: doc.uploadDate,
        status: doc.status,
        fileSize: formatFileSize(doc.fileSize),
        fileUrl: doc.fileUrl,
        analysisResult: doc.analysisResult,
      }));
      setInsuranceFiles(formattedDocs);
      saveToCache('insurance', user.id, formattedDocs);

      // Convert chat messages inline
      const formattedChat = chatData.map(convertChatMessage);
      setChatHistory(formattedChat);
      saveToCache('chat', user.id, formattedChat);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, formatFileSize, loadFromCache, saveToCache, convertChatMessage]);

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
      const convertedBill = convertBill(newBill);
      setBills(prev => {
        const updated = [convertedBill, ...prev];
        saveToCache('bills', user.id, updated);
        return updated;
      });
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
      const convertedDoc = convertInsuranceFile(newDoc);
      setInsuranceFiles(prev => {
        const updated = [convertedDoc, ...prev];
        saveToCache('insurance', user.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const addChatMessage = async (message: ChatMessage): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Optimistically add to UI
      setChatHistory(prev => {
        const updated = [...prev, message];
        saveToCache('chat', user.id, updated);
        return updated;
      });

      // Supabase mode only
      await saveChatMessage(user.id, message.content, message.sender);
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Revert on error
      setChatHistory(prev => {
        const updated = prev.filter(m => m.id !== message.id);
        saveToCache('chat', user.id, updated);
        return updated;
      });
      throw error;
    }
  };

  const clearChat = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setChatHistory([]);
      saveToCache('chat', user.id, []);
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
    try {
      await updateBillStatusService(billId, status);
      setBills(prev => {
        const updated = prev.map(bill => bill.id === billId ? { ...bill, status } : bill);
        saveToCache('bills', user!.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error updating bill status:', error);
      throw error;
    }
  };

  const updateBillAnalysis = async (billId: string, analysis: any): Promise<void> => {
    try {
      await updateBillAnalysisService(billId, analysis);
      // Optimistically update local state
      setBills(prev => {
        const updated = prev.map(bill => {
          if (bill.id === billId) {
            const updates: Partial<HospitalBill> = { analysisResult: analysis, status: 'pending' };
            if (analysis?.overview) {
              if (analysis.overview.totalAmount) updates.amount = analysis.overview.totalAmount;
              if (analysis.overview.hospitalName) updates.hospitalName = analysis.overview.hospitalName;
              if (analysis.overview.date) updates.billDate = analysis.overview.date;
              if (analysis.overview.summary) updates.description = analysis.overview.summary;
            }
            return { ...bill, ...updates };
          }
          return bill;
        });
        if (user) saveToCache('bills', user.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error updating bill analysis:', error);
      throw error;
    }
  };

  const deleteBill = async (billId: string): Promise<void> => {
    try {
      await deleteBillService(billId);
      setBills(prev => {
        const updated = prev.filter(bill => bill.id !== billId);
        if (user) saveToCache('bills', user.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  };

  const updateDocumentAnalysis = async (docId: string, analysis: any): Promise<void> => {
    try {
      await updateDocumentAnalysisService(docId, analysis);
      setInsuranceFiles(prev => {
        const updated = prev.map(doc => doc.id === docId ? { ...doc, analysisResult: analysis } : doc);
        if (user) saveToCache('insurance', user.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error updating document analysis:', error);
      throw error;
    }
  };

  const deleteDocument = async (docId: string): Promise<void> => {
    try {
      await deleteDocumentService(docId);
      setInsuranceFiles(prev => {
        const updated = prev.filter(doc => doc.id !== docId);
        if (user) saveToCache('insurance', user.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
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
        updateBillAnalysis,
        deleteBill,
        updateDocumentAnalysis,
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
