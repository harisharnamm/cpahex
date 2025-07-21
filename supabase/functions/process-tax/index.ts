import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { document_id, ocr_text } = await req.json()

    if (!document_id || !ocr_text) {
      return new Response(
        JSON.stringify({ error: 'Missing document_id or ocr_text parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔄 Processing tax document:', document_id)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const EDEN_AI_API_KEY = Deno.env.get('EDEN_AI_API_KEY')

    // Call Eden AI Text Summarization
    console.log('🤖 Calling Eden AI Text Summarization...')
    const summarizeResponse = await fetch('https://api.edenai.run/v2/text/summarize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providers: ['openai/gpt-4o-mini'],
        text: ocr_text,
        output_sentences: 1,
        response_as_dict: true
      }),
    })

    if (!summarizeResponse.ok) {
      const errorText = await summarizeResponse.text()
      console.error('❌ Eden AI Summarization error:', errorText)
      throw new Error(`Eden AI Summarization failed: ${summarizeResponse.statusText} - ${errorText}`)
    }

    const summarizeResult = await summarizeResponse.json()
    console.log('✅ Tax document summarization result:', summarizeResult)

    // Get existing processed data to preserve classification results
    const { data: existingDoc, error: fetchError } = await supabaseClient
      .from('documents')
      .select('eden_ai_processed_data')
      .eq('id', document_id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching existing document data:', fetchError)
    }

    const existingData = existingDoc?.eden_ai_processed_data || {}

    // Update document with processed data
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ 
        eden_ai_processed_data: {
          ...existingData,
          tax_processing: summarizeResult,
          processing_completed_at: new Date().toISOString()
        }
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('❌ Error updating document with tax data:', updateError)
    } else {
      console.log('✅ Document updated with tax processing data.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id: document_id,
        processed_data: summarizeResult,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in process-tax function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})