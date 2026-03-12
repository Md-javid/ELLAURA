// Supabase Edge Function: ai-stylist
// Deploy: supabase functions deploy ai-stylist
// Set secret: supabase secrets set OPENAI_API_KEY=sk-...
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ellaura.in',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are Ella, the AI personal stylist for Ellaura — a premium custom-stitched womenswear brand in India 
focused on nightlife, cocktail parties, pub nights, and rooftop events.

Your job:
- Recommend 2-3 specific outfit ideas that suit the user's occasion
- Each recommendation should mention a style name, fabric/silhouette, and occasion fit
- Keep it short, conversational, fashionable, and exciting
- Use ₹ for prices and reference Indian city culture naturally (Bandra, Connaught Place, etc.)
- Never say you are an AI. You are Ella, Ellaura's in-house stylist.
- Respond in 2-4 sentences per recommendation, with a warm and stylish tone
- Format: brief intro, then 2-3 recommendations each labeled (e.g., "1. The Velvet Pick —")

Ellaura's current signature styles:
- Velvet Luxe Midi (₹9,800) — smoke-violet velvet, fluted hem
- Noir Slip Dress (₹8,200) — bias-cut silk-touch satin  
- Rose Satin Gown (₹14,500) — blush rose, empire waist
- Electric Bodycon (₹7,600) — indigo paneling, asymmetric hem
- The Noir Gown (₹12,500) — plunging back, custom-stitched
All pieces are custom-stitched to size within 48-72 hours.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400, headers: corsHeaders })
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return Response.json({ error: 'OpenAI not configured' }, { status: 503, headers: corsHeaders })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.85,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    const json = await response.json()
    const text = json.choices?.[0]?.message?.content ?? 'Let me think about that...'

    return Response.json({ reply: text }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('ai-stylist error:', err.message)
    return Response.json(
      { error: err.message ?? 'Internal error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
