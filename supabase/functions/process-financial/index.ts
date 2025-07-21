```typescript
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
    const { document_id } = await req.json()

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'Missing document_id parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔄 Processing financial document:', document_id)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('storage_path, document_type')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      console.error('❌ Document not found:', docError)
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const bucketName = document.document_type === 'irs_notice' ? 'irs-notices' : 'client-documents';
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from(bucketName)
      .createSignedUrl(document.storage_path, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('❌ Error creating signed URL:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Failed to create signed URL for document' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const file_url = signedUrlData.signedUrl
    const EDEN_AI_API_KEY = Deno.env.get('EDEN_AI_API_KEY')

    // Call Eden AI Financial Parser
    console.log('🤖 Calling Eden AI Financial Parser...')
    const financialResponse = await fetch('https://api.edenai.run/v2/ocr/financial_parser', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providers: ['microsoft'],
        fallback_providers: ['amazon'],
        file_url: file_url,
        response_as_dict: true
      }),
    })

    if (!financialResponse.ok) {
      const errorText = await financialResponse.text()
      console.error('❌ Eden AI Financial Parser error:', errorText)
      throw new Error(`Eden AI Financial Parser failed: ${financialResponse.statusText} - ${errorText}`)
    }

    const financialResult = await financialResponse.json()
    console.log('✅ Financial processing result:', financialResult)

    // Update document with processed data
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ eden_ai_processed_data: financialResult })
      .eq('id', document_id)

    if (updateError) {
      console.error('❌ Error updating document with financial data:', updateError)
    } else {
      console.log('✅ Document updated with financial processing data.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id: document_id,
        processed_data: financialResult,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in process-financial function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```