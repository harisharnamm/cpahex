import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, userId, clientId } = await req.json()

    if (!documentId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simulate AI processing for now
    // In production, this would call OpenAI API or other AI services
    const mockAnalysis = {
      summary: `This IRS notice has been analyzed by AI. The document appears to be a ${getNoticeType()} notice regarding tax year 2023. Key findings include potential discrepancies in reported income and recommended actions for resolution.`,
      recommendations: [
        'Review all 1099 forms and income documents for the tax year',
        'Gather supporting documentation for any disputed amounts',
        'Consider filing an amended return if the proposed changes are correct',
        'Respond within 30 days to avoid automatic assessment',
        'Consult with a tax professional if you disagree with the proposed changes'
      ],
      noticeType: getNoticeType(),
      priority: 'high',
      confidence: 0.85
    }

    // Return the analysis
    return new Response(
      JSON.stringify({
        success: true,
        analysis: mockAnalysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getNoticeType(): string {
  const types = ['CP2000', 'CP14', 'CP504', 'CP90', 'General Notice']
  return types[Math.floor(Math.random() * types.length)]
}