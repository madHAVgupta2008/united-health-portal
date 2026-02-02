import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HospitalBill, InsuranceFile, ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseContextType {
  bills: HospitalBill[];
  insuranceFiles: InsuranceFile[];
  chatHistory: ChatMessage[];
  addBill: (billData: Omit<HospitalBill, 'id' | 'status'>) => void;
  uploadDocument: (docData: Omit<InsuranceFile, 'id' | 'uploadDate' | 'status' | 'fileSize'>) => void;
  addChatMessage: (message: ChatMessage) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage to avoid race conditions and overwrite issues
  const [bills, setBills] = useState<HospitalBill[]>(() => {
    const saved = localStorage.getItem('app_bills');
    return saved ? JSON.parse(saved) : [
      { id: '1', hospitalName: 'City General Hospital', billDate: '2024-01-12', amount: 1250.00, status: 'pending', description: 'Emergency Room Visit' },
      { id: '2', hospitalName: 'Metro Medical Center', billDate: '2024-01-08', amount: 450.00, status: 'paid', description: 'Lab Tests and Consultation' },
    ];
  });

  const [insuranceFiles, setInsuranceFiles] = useState<InsuranceFile[]>(() => {
    const saved = localStorage.getItem('app_documents');
    return saved ? JSON.parse(saved) : [
      { id: '1', fileName: 'Insurance_Card_2024.pdf', fileType: 'Insurance Card', uploadDate: '2024-01-15', status: 'approved', fileSize: '1.2 MB' },
      { id: '2', fileName: 'Policy_Document.pdf', fileType: 'Policy Document', uploadDate: '2024-01-10', status: 'approved', fileSize: '3.5 MB' },
    ];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('app_chat');
    if (saved) {
      return JSON.parse(saved).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [
      {
        id: '1',
        content: "Hello! I'm your United Health AI assistant. I can help you with questions about your insurance, bills, claims, and more. How can I assist you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('app_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('app_documents', JSON.stringify(insuranceFiles));
  }, [insuranceFiles]);

  useEffect(() => {
    localStorage.setItem('app_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const addBill = (billData: Omit<HospitalBill, 'id' | 'status'>) => {
    const newBill: HospitalBill = {
      id: uuidv4(),
      status: 'pending', 
      ...billData,
    };
    setBills(prev => [newBill, ...prev]);
  };

  const uploadDocument = (docData: Omit<InsuranceFile, 'id' | 'uploadDate' | 'status' | 'fileSize'>) => {
    const newDoc: InsuranceFile = {
      id: uuidv4(),
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      ...docData,
    };
    setInsuranceFiles(prev => [newDoc, ...prev]);
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  };

  return (
    <DatabaseContext.Provider value={{ bills, insuranceFiles, chatHistory, addBill, uploadDocument, addChatMessage }}>
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
