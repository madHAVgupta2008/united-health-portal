import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with key from environment variables
// Note: In a production app, this should be proxied through a backend to protect the key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
}

// System prompt to define the assistant's persona
const SYSTEM_PROMPT = `
You are the AI Health Assistant for "United Health Financial Interface".
Your role is to help users manage their healthcare finances, understand insurance terminology, and guide them through using this application.

Specific attributes:
- Tone: Professional, empathetic, clear, and helpful.
- Knowledge: You assume the context of this specific web application (Hospital Bills, Insurance Documents).
- Limitations: You cannot access real-time external databases or perform medical diagnosis.
- Functionality:
  - Explain deductibles, copays, and out-of-pocket maximums.
  - Guide users on how to upload bills (Bill Upload page) and documents (Insurance Upload page).
  - Explain the status of bills (paid, pending, denied).

If asked about specific user data (like "what is my bill ID 123?"), assume you don't have direct database access unless context is provided in the prompt, and ask the user to provide details or check the specific history page.
`;

const mockResponses: { [key: string]: string } = {
  default: "I understand you're asking about your healthcare. Since I'm currently running in demo mode (no API key connected), I can't generate a specific answer. To enable my full intelligence, please add a VITE_GEMINI_API_KEY to your .env file!",
  greeting: "Hello! I'm your United Health AI assistant. I can help you with questions about your insurance, bills, claims, and more. How can I assist you today?",
  deductible: "Your current deductible is $500 for in-network services and $1,000 for out-of-network services. You've met $320 of your in-network deductible so far this year.",
  claim: "To file a claim, you can:\n1. Upload your bill in the Hospital Bills section\n2. Our team will process it within 3-5 business days\n3. You'll receive an Explanation of Benefits (EOB) via email\n\nWould you like me to guide you through the upload process?",
  coverage: "Your Premium Gold plan includes:\n• Preventive care: 100% covered\n• Primary care visits: $25 copay\n• Specialist visits: $50 copay\n• Emergency room: $250 copay\n• Prescription drugs: $10/$30/$60 tiered copays\n\nIs there a specific service you'd like to know about?",
  status: "I can help you check your claim status! Please provide your claim number, or I can look up your recent claims. Your last submitted claim (#CLM-2024-78542) is currently in processing and should be resolved within 2 business days.",
};

export const generateAIResponse = async (userMessage: string, chatHistory: string): Promise<string> => {
  if (!API_KEY || !model) {
    // Fallback to mock logic if no key
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    
    const lowerInput = userMessage.toLowerCase();
    if (lowerInput.includes('deductible')) return mockResponses.deductible;
    if (lowerInput.includes('claim') || lowerInput.includes('file')) return mockResponses.claim;
    if (lowerInput.includes('coverage') || lowerInput.includes('explain')) return mockResponses.coverage;
    if (lowerInput.includes('status') || lowerInput.includes('check')) return mockResponses.status;
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) return mockResponses.greeting;
    
    return mockResponses.default;
  }

  try {
    // Construct the full prompt including history
    const fullPrompt = `${SYSTEM_PROMPT}\n\nChat History:\n${chatHistory}\n\nUser: ${userMessage}\nAssistant:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `I apologize, but I'm having trouble connecting to my AI services right now. Error details: ${error.message}`;
  }
};
