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
        if (bill.analysis_result) {
          const analysis = bill.analysis_result;
          if (analysis.overview?.summary) {
            context += `  Summary: ${analysis.overview.summary}\n`;
          }
          if (analysis.services && analysis.services.length > 0) {
            const servicesList = analysis.services
              .map((s: any) => `${s.name} ($${s.charge})`)
              .join(', ');
            context += `  Services: ${servicesList}\n`;
          }
          if (analysis.coveragePrediction) {
            context += `  Est. Coverage: ${analysis.coveragePrediction.estimatedInsuranceCoverage} (Patient: ${analysis.coveragePrediction.estimatedPatientResponsibility})\n`;
          }
        }
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

export const analyzeBillDetails = async (file: File, insuranceContext?: string): Promise<BillAnalysisResult | null> => {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      // Compress image before sending
      const base64Data = await compressImage(file);

      const prompt = `
        Analyze this hospital bill image/document in detail.

        ${insuranceContext ? `**CRITICAL CONTEXT - PATIENT INSURANCE:**\n${insuranceContext}\n\nUse this insurance information to strictly calculate the "Coverage Prediction" and provide a "Schemes" breakdown that relates to this specific policy.` : ''}

        Extract the following information and return ONLY a valid JSON object:

      1. ** Overview **: Total amount, patient name(if visible), hospital name, and date.Provide a brief summary.
        2. ** Services **: An itemized list of ALL services, procedures, or medications listed, with their individual charges.If codes(CPT / HCPCS) are present, include them.
        3. ** Coverage Prediction **: 
           - **STRICT RULE**: You must calcualte coverage based **EXCLUSIVELY** on the 'CRITICAL CONTEXT - PATIENT INSURANCE' section provided above.
           - Do **NOT** use general insurance knowledge or "typical" plan structures.
           - **DATE CHECK**: Compare the bill 'date' with the 'Effective Date' and 'Expiration Date' from the insurance context.
             - If the bill date is outside this range, coverage is **0%**. Reasoning must state: "Bill date is outside the policy validity period."
           - **CALCULATION LOGIC**:
             1. **Network Status**: Check if the hospital is In-Network or Out-of-Network based on the policy context. If unknown, assume In-Network but note this assumption.
             2. **Deductible**: Identify the applicable deductible. Has it been met? (If context doesn't track year-to-date, assume it has NOT been met and subtract it from the eligible amount).
             3. **Co-insurance**: Apply the co-insurance rate (e.g., if plan pays 80%, patient pays 20%) to the remaining amount.
             4. **Copays**: Add any specific copays (e.g., ER copay, Specialist copay).
             5. **Out-of-Pocket Max**: Ensure the total patient responsibility does not exceed the OOP Max (if known).
             5. **Out-of-Pocket Max**: Ensure the total patient responsibility does not exceed the OOP Max (if known).
           - **MISSING SERVICE DETAILS**: If the insurance context is general (e.g. "Medical Policy") and does not explicitly *exclude* the service:
             - Assume it IS covered as a standard medical benefit.
             - Apply standard In-Network Deductible and Co-insurance rates.
             - **CRITICAL APPLICABILITY CHECK**: Before calculating, check:
               1. **Patient Match**: Does the patient name on the bill match the policy holder? (If name is visible).
               2. **Service Type**: Is this bill for a service covered by this policy type? (e.g. don't apply Vision policy to ER bill).
               3. **Date Validity**: Check Bill Date vs Policy Effective/Expiration Dates.
             - If ANY of these fail, set coverage to **0** and state clear reason: "Policy not applicable due to [Reason]".
           - Providing detailed reasoning is CRITICAL. Show the math: "Bill $X - Deductible $Y = $Z. Insurance pays 80% of $Z = $A."
        4. ** Schemes **: Identify and explain any specific insurance terms mentioned(e.g., Deductible, Co - pay, Co - insurance, Out - of - Pocket Max).If not explicitly mentioned but relevant from the insurance context, explain them.

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
          "estimatedInsuranceCoverage": number(amount),
            "estimatedPatientResponsibility": number(amount),
              "confidence": "High" | "Medium" | "Low",
                "reasoning": "Explanation..."
        },
        "schemes": [
          { "name": "Term Name", "description": "What it means", "value": "Value found or 'N/A'" }
        ]
      }
      `;

      console.log(`Analyzing bill... Attempt ${attempt + 1}/${maxRetries}`);

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt,
          image: {
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'image/jpeg'
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
      console.error(`Detailed Bill Analysis Failed (Attempt ${attempt + 1}):`, error);
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error("Analysis failed after retries");
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
  financials: {
    deductible: { individual: string; family: string };
    outOfPocketMax: { individual: string; family: string };
    coinsuranceRate: { inNetwork: string; outOfNetwork: string };
    copay: { pcp: string; specialist: string; er: string; urgentCare: string };
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const compressImage = async (file: File, quality = 0.7, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Get base64 string (remove prefix)
        const base64 = canvas.toDataURL(file.type || 'image/jpeg', quality).split(',')[1];
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeInsuranceDetails = async (file: File): Promise<InsuranceAnalysisResult | null> => {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      // Compress image before sending
      const base64Data = await compressImage(file);

      const prompt = `
        Analyze this insurance document image/PDF in detail.
        
        Extract the following information and return ONLY a valid JSON object:

      1. ** Overview **: Policy number, insurer name, policy holder name, effective and expiration dates.Provide a brief summary.
        2. ** Financials **: Extract Deductibles (Individual/Family), Out-of-Pocket Max (Individual/Family), Co-insurance rates (In-Network/Out-of-Network), and standard Copays (PCP, Specialist, ER, Urgent Care).
        3. ** Coverage **: List all coverage types with their limits, deductibles, and copays.
        4. ** Benefits **: What services / items are covered under this policy.
        5. ** Exclusions **: What is NOT covered and why.
        6. ** Recommendations **: Personalized tips for the user based on this policy.

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
        "financials": {
          "deductible": { "individual": "$X", "family": "$Y" },
          "outOfPocketMax": { "individual": "$X", "family": "$Y" },
          "coinsuranceRate": { "inNetwork": "X%", "outOfNetwork": "Y%" },
          "copay": { "pcp": "$X", "specialist": "$Y", "er": "$Z", "urgentCare": "$W" }
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

      console.log(`Analyzing document... Attempt ${attempt + 1}/${maxRetries}`);

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt,
          image: {
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'image/jpeg' // Fallback to jpeg if type is missing
            }
          }
        }
      });

      if (error) {
        console.error("Gemini Function Error:", error);
        throw error;
      }

      let text = data.text;
      if (!text) throw new Error("No response from AI");

      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);

    } catch (error) {
      console.error(`Insurance Document Analysis Failed (Attempt ${attempt + 1}):`, error);
      attempt++;
      if (attempt >= maxRetries) {
        throw error; // Throw the last error to be caught by the UI
      }
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error("Analysis failed after retries");
};
