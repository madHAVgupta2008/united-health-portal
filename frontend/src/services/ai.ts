import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/integrations/supabase/client';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("VITE_GEMINI_API_KEY is not set in the environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const fetchUserContext = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    const [bills, insurance, profile] = await Promise.all([
      supabase.from('hospital_bills').select('*').eq('user_id', user.id),
      supabase.from('insurance_documents').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single()
    ]);

    let context = "User Context:\n";

    if (profile.data) {
      context += `Profile: ${profile.data.first_name || ''} ${profile.data.last_name || ''}, Plan: ${profile.data.plan_type || 'N/A'}, Member ID: ${profile.data.member_id}\n`;
    }

    if (bills.data && bills.data.length > 0) {
      context += "Hospital Bills:\n";
      bills.data.forEach((bill: any) => {
        context += `- ${bill.hospital_name}: $${bill.amount} (${bill.status}) - Date: ${bill.bill_date}\n`;
      });
    } else {
      context += "No hospital bills found.\n";
    }

    if (insurance.data && insurance.data.length > 0) {
      context += "Insurance Documents:\n";
      insurance.data.forEach((doc: any) => {
        context += `- ${doc.file_name} (${doc.file_type}) - Status: ${doc.status}\n`;
      });
    } else {
      context += "No insurance documents found.\n";
    }

    return context;
  } catch (error) {
    console.error("Error fetching user context:", error);
    return "";
  }
};

export const analyzeDocument = async (file: File): Promise<{
  isValid: boolean;
  type: 'bill' | 'insurance' | 'other';
  summary: string;
  extractedData?: {
    amount?: number;
    date?: string;
    hospitalName?: string;
    documentType?: string;
    policyNumber?: string;
    coverageType?: string;
    provider?: string;
  };
}> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const prompt = `
      Analyze this image/document carefully. It is uploaded to a Healthcare Finance Dashboard.
      
      Return ONLY a valid JSON object with no markdown formatting, following this structure:
      {
        "isValid": boolean, // proper healthcare bill or insurance document?
        "type": "bill" | "insurance" | "other",
        "summary": "Short 1-sentence summary of content",
        "extractedData": {
          "amount": number | null, // Total amount if it's a bill
          "date": string | null, // Date of service/bill in ISO strings
          "hospitalName": string | null, // Name of provider
          "documentType": string | null, // e.g., "Invoice", "Policy", "Claim"
          // Insurance Specific Fields
          "policyNumber": string | null,
          "coverageType": string | null, // e.g., "Medical", "Dental", "Vision"
          "provider": string | null // e.g., "UHC", "Aetna", "Blue Cross"
        }
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ]);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up markdown if present
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response JSON:", e);
      return {
        isValid: false,
        type: 'other',
        summary: "AI analysis completed but returned invalid format."
      };
    }


  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      isValid: false,
      type: 'other',
      summary: "AI processing failed. Please try again later."
    };
  }
};

export const generateAIResponse = async (userMessage: string, chatHistory: string): Promise<string> => {
  if (!userMessage || !userMessage.trim()) {
    return "I didn't receive your message. Could you please try again?";
  }

  try {
    const userContext = await fetchUserContext();

    const systemPrompt = `You are a helpful AI Health Assistant for United Health Financial Portal. 
Your role is to help users understand their healthcare coverage, explain medical bills, answer insurance questions, and provide general health information.
You have access to the user's personal context (bills, insurance, profile) which is provided below. USE THIS CONTEXT to answer their questions specifically.
Be friendly, helpful, and concise.

${userContext}

Now respond to the user's message.`;

    // Construct a prompt that includes history context manually since we aren't maintaining stateful chat here
    const fullPrompt = chatHistory
      ? `${systemPrompt}\n\nPrevious conversation:\n${chatHistory}\n\nUser: ${userMessage}`
      : `${systemPrompt}\n\nUser: ${userMessage}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently unable to access the AI service. Please ensure the API key is configured correctly.";
  }
};

export interface BillAnalysisResult {
  overview: {
    totalAmount: number;
    patientName?: string;
    hospitalName?: string;
    date?: string;
    summary: string;
  };
  services: {
    name: string;
    charge: number;
    code?: string;
  }[];
  coveragePrediction: {
    estimatedInsuranceCoverage: number;
    estimatedPatientResponsibility: number;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
  };
  schemes: {
    name: string;
    description: string;
    value?: string;
  }[];
}

export const analyzeBillDetails = async (file: File): Promise<BillAnalysisResult | null> => {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const prompt = `
      Analyze this hospital bill image/document in detail.
      
      Extract the following information and return ONLY a valid JSON object:
      
      1. **Overview**: Total amount, patient name (if visible), hospital name, and date. Provide a brief summary.
      2. **Services**: An itemized list of ALL services, procedures, or medications listed, with their individual charges. If codes (CPT/HCPCS) are present, include them.
      3. **Coverage Prediction**: Based on typical insurance policies and the nature of the bill, estimate what percentage might be covered by insurance vs. patient responsibility. This is an ESTIMATE. Provide reasoning.
      4. **Schemes**: Identify and explain any specific insurance terms mentioned (e.g., Deductible, Co-pay, Co-insurance, Out-of-Pocket Max). If not explicitly mentioned, explain these standard concepts as they might apply to this bill.

      JSON Structure:
      {
        "overview": {
          "totalAmount": number,
          "patientName": string | null,
          "hospitalName": string | null,
          "date": string | null,
          "summary": string
        },
        "services": [
          { "name": "Service Description", "charge": number, "code": "optional code" }
        ],
        "coveragePrediction": {
          "estimatedInsuranceCoverage": number (amount),
          "estimatedPatientResponsibility": number (amount),
          "confidence": "High" | "Medium" | "Low",
          "reasoning": "Explanation..."
        },
        "schemes": [
          { "name": "Term Name", "description": "What it means", "value": "Value found or 'N/A'" }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Detailed Bill Analysis Failed:", error);
    return null;
  }
};
