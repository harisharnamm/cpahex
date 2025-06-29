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
    const { document_id, user_id, client_id } = await req.json()

    if (!document_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔄 Processing document:', document_id, 'for user:', user_id)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the document details
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
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

    console.log('📄 Document found:', document.original_filename)

    // Generate AI analysis (mock for now - in production this would call OpenAI)
    const mockAnalysis = {
      summary: `AI Analysis of ${document.original_filename}:

This IRS notice has been processed and analyzed. The document appears to be a ${getNoticeType()} notice regarding tax year 2023. 

Key findings:
• Notice type: ${getNoticeType()}
• Estimated amount owed: $${Math.floor(Math.random() * 5000 + 500)}
• Response deadline: ${getRandomFutureDate()}
• Priority level: High

The AI has identified potential discrepancies in reported income that require immediate attention. This notice indicates that the IRS has information that doesn't match what was reported on the tax return.`,

      recommendations: `Recommended Actions:

1. Review all 1099 forms and income documents for the tax year
2. Gather supporting documentation for any disputed amounts  
3. Consider filing an amended return if the proposed changes are correct
4. Respond within 30 days to avoid automatic assessment
5. Consult with a tax professional if you disagree with the proposed changes
6. Prepare detailed documentation to support your position
7. Consider setting up a payment plan if additional tax is owed`,

      noticeType: getNoticeType(),
      priority: 'high',
      confidence: 0.85
    }

    console.log('🤖 Generated AI analysis')

    // Update the document with AI summary
    const { error: docUpdateError } = await supabaseClient
      .from('documents')
      .update({
        ai_summary: mockAnalysis.summary,
        is_processed: true
      })
      .eq('id', document_id)

    if (docUpdateError) {
      console.error('❌ Error updating document:', docUpdateError)
    } else {
      console.log('✅ Document updated with AI summary')
    }

    // Check if an IRS notice already exists for this document
    const { data: existingNotice, error: noticeCheckError } = await supabaseClient
      .from('irs_notices')
      .select('*')
      .eq('document_id', document_id)
      .maybeSingle()

    if (noticeCheckError) {
      console.error('❌ Error checking for existing notice:', noticeCheckError)
    }

    let noticeId = null

    if (existingNotice) {
      console.log('📋 Updating existing IRS notice:', existingNotice.id)
      
      // Update existing notice with AI analysis
      const { data: updatedNotice, error: updateError } = await supabaseClient
        .from('irs_notices')
        .update({
          ai_summary: mockAnalysis.summary,
          ai_recommendations: mockAnalysis.recommendations,
          notice_type: mockAnalysis.noticeType,
          priority: mockAnalysis.priority,
          amount_owed: Math.floor(Math.random() * 5000 + 500),
          deadline_date: getRandomFutureDate(),
          tax_year: 2023
        })
        .eq('id', existingNotice.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating IRS notice:', updateError)
      } else {
        console.log('✅ IRS notice updated successfully')
        noticeId = updatedNotice.id
      }
    } else {
      console.log('📋 Creating new IRS notice for document')
      
      // Create new IRS notice
      const { data: newNotice, error: createError } = await supabaseClient
        .from('irs_notices')
        .insert({
          user_id: user_id,
          client_id: client_id,
          document_id: document_id,
          notice_type: mockAnalysis.noticeType,
          ai_summary: mockAnalysis.summary,
          ai_recommendations: mockAnalysis.recommendations,
          priority: mockAnalysis.priority,
          status: 'pending',
          amount_owed: Math.floor(Math.random() * 5000 + 500),
          deadline_date: getRandomFutureDate(),
          tax_year: 2023
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating IRS notice:', createError)
      } else {
        console.log('✅ IRS notice created successfully')
        noticeId = newNotice.id
      }
    }

    // Return the analysis
    return new Response(
      JSON.stringify({
        success: true,
        analysis: mockAnalysis,
        notice_id: noticeId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error processing document:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
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

function getRandomFutureDate(): string {
  const now = new Date()
  const futureDate = new Date(now.getTime() + (Math.random() * 60 + 30) * 24 * 60 * 60 * 1000) // 30-90 days from now
  return futureDate.toISOString()
}