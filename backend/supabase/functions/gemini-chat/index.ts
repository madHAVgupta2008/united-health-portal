import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const { prompt, history, image } = await req.json()

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    
    let result;
    if (image) {
       const modelVision = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
       result = await modelVision.generateContent([prompt, image]);
    } else {
       const modelText = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
       const fullPrompt = history ? `${history}\n\nUser: ${prompt}` : prompt;
       result = await modelText.generateContent(fullPrompt);
    }

    const response = result.response;
    const text = response.text();

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
