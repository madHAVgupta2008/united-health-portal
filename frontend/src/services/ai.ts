import { supabase } from '@/integrations/supabase/client';

export const analyzeDocument = async (file: File): Promise<{
  isValid: boolean;
  type: 'bill' | 'insurance' | 'other';
  summary: string;
  extractedData?: {
    amount?: number;
    date?: string;
    hospitalName?: string;
    documentType?: string;
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

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt: `
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
              "documentType": string | null // e.g., "Invoice", "Policy", "Claim"
            }
          }
        `,
        image: {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        }
      }
    });

    if (error) throw error;
    
    // Parse the response text as JSON if it's returned as a string within the 'text' field
    const responseText = data.text;
    try {
      // Clean up markdown if present
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
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
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt: userMessage,
        history: chatHistory
      }
    });

    if (error) {
      console.error("Supabase Function Error:", error);
      throw error;
    }

    return data.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently unable to access the AI service. Please ensure the 'gemini-chat' function is deployed and secrets are set.";
  }
};


