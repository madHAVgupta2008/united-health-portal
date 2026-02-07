import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Use REST API directly instead of SDK for better compatibility
    const model = 'gemini-2.5-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    let requestBody: any

    if (image) {
      // Handle image input
      requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: image.inlineData?.mimeType || 'image/jpeg',
                data: image.inlineData?.data || image
              }
            }
          ]
        }]
      }
    } else {
      // Handle text-only input
      const systemPrompt = `You are a helpful AI Health Assistant for United Health Financial Portal. 
Your role is to help users understand their healthcare coverage, explain medical bills, answer insurance questions, and provide general health information.
Be friendly, helpful, and concise. If you see any error messages in the conversation history, ignore them - they were technical glitches that have been resolved.
Now respond to the user's message.`;
      
      const fullPrompt = history 
        ? `${systemPrompt}\n\nPrevious conversation:\n${history}\n\nUser: ${prompt}`
        : `${systemPrompt}\n\nUser: ${prompt}`;
      
      requestBody = {
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API Error:', response.status, errorData)
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    
    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                 'Sorry, I could not generate a response.'

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
