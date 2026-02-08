import { supabase } from '@/integrations/supabase/client';

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

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt,
        image: {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        }
      }
    });

    if (error) throw error;

    let text = data.text;
    if (!text) throw new Error("No response from AI");

    try {
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
    
    // We send the context as part of the history or prompt to the backend
    // Since the backend 'gemini-chat' function handles 'history' and 'prompt',
    // We will prepend the user context to the history for the AI to see.
    const fullHistory = `${userContext}\n\n${chatHistory}`;

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt: userMessage,
        history: fullHistory
      }
    });

    if (error) throw error;
    return data.text || "Sorry, I couldn't generate a response.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently unable to access the AI service. Please ensure the API key is configured correctly in the backend.";
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

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt,
        image: {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        }
      }
    });

    if (error) throw error;

    let text = data.text;
    if (!text) throw new Error("No response from AI");

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Detailed Bill Analysis Failed:", error);
    return null;
  }
};

export interface InsuranceAnalysisResult {
  overview: {
    policyNumber?: string;
    insurerName?: string;
    policyHolder?: string;
    effectiveDate?: string;
    expirationDate?: string;
    summary: string;
  };
  coverage: {
    type: string;
    limit: string;
    deductible?: string;
    copay?: string;
  }[];
  benefits: {
    category: string;
    description: string;
    covered: boolean;
  }[];
  exclusions: {
    item: string;
    reason: string;
  }[];
  recommendations: {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
}

export const analyzeInsuranceDetails = async (file: File): Promise<InsuranceAnalysisResult | null> => {
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
      Analyze this insurance document image/PDF in detail.
      
      Extract the following information and return ONLY a valid JSON object:
      
      1. **Overview**: Policy number, insurer name, policy holder name, effective and expiration dates. Provide a brief summary.
      2. **Coverage**: List all coverage types with their limits, deductibles, and copays.
      3. **Benefits**: What services/items are covered under this policy.
      4. **Exclusions**: What is NOT covered and why.
      5. **Recommendations**: Personalized tips for the user based on this policy.

      JSON Structure:
      {
        "overview": {
          "policyNumber": string | null,
          "insurerName": string | null,
          "policyHolder": string | null,
          "effectiveDate": string | null,
          "expirationDate": string | null,
          "summary": string
        },
        "coverage": [
          { "type": "Coverage Type", "limit": "$X", "deductible": "$Y", "copay": "$Z" }
        ],
        "benefits": [
          { "category": "Category Name", "description": "What's covered", "covered": true }
        ],
        "exclusions": [
          { "item": "What's excluded", "reason": "Why it's excluded" }
        ],
        "recommendations": [
          { "title": "Recommendation", "description": "Detailed advice", "priority": "High" | "Medium" | "Low" }
        ]
      }
    `;

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt,
        image: {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        }
      }
    });

    if (error) throw error;
    
    let text = data.text;
    if (!text) throw new Error("No response from AI");

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Insurance Document Analysis Failed:", error);
    return null;
  }
};
