import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string
  client_id?: string
  context_documents?: string[]
}

interface OpenAIMessage {
  role: 'user' | 'assistant'
  content: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { message, client_id, context_documents }: ChatRequest = await req.json()

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Processing chat request for user:', user.id)

    // Get recent chat history for context (last 10 messages)
    const { data: recentMessages, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('client_id', client_id || null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('❌ Error fetching chat history:', historyError)
    }

    // Build conversation history for OpenAI
    const conversationHistory: OpenAIMessage[] = []
    
    // Add system message with context
    let systemMessage = `You are an AI tax assistant helping CPAs and tax professionals. You provide expert advice on tax deductions, compliance, document analysis, and tax strategies.

Key capabilities:
- Analyze tax documents and identify deductions
- Provide tax compliance guidance
- Answer questions about tax law and regulations
- Help with tax planning strategies
- Assist with IRS notice interpretation

Guidelines:
- Always provide accurate, up-to-date tax information
- When uncertain, recommend consulting current tax codes or a tax professional
- Be helpful but conservative with tax advice
- Focus on legitimate deductions and compliance`

    // Add client context if available
    if (client_id) {
      const { data: client } = await supabaseClient
        .from('clients')
        .select('name, entity_type, tax_year')
        .eq('id', client_id)
        .single()

      if (client) {
        systemMessage += `\n\nCurrent client context:
- Client: ${client.name}
- Entity Type: ${client.entity_type}
- Tax Year: ${client.tax_year}`
      }
    }

    // Add document context if available
    if (context_documents && context_documents.length > 0) {
      const { data: documents } = await supabaseClient
        .from('documents')
        .select('original_filename, document_type, ocr_text, ai_summary')
        .in('id', context_documents)
        .limit(5) // Limit to avoid token overflow

      if (documents && documents.length > 0) {
        systemMessage += `\n\nRelevant documents:`
        documents.forEach(doc => {
          systemMessage += `\n- ${doc.original_filename} (${doc.document_type})`
          if (doc.ai_summary) {
            systemMessage += `: ${doc.ai_summary.substring(0, 200)}...`
          }
        })
      }
    }

    // Add recent conversation history (reverse order for chronological)
    if (recentMessages && recentMessages.length > 0) {
      recentMessages.reverse().forEach(msg => {
        conversationHistory.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      })
    }

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: message
    })

    console.log('🤖 Calling OpenAI Assistant...')

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemMessage },
          ...conversationHistory
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('❌ OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const assistantMessage = openaiData.choices[0]?.message?.content

    if (!assistantMessage) {
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Got response from OpenAI')

    // Save user message to database
    const { error: userMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        user_id: user.id,
        client_id: client_id || null,
        role: 'user',
        content: message,
        context_documents: context_documents || null,
        ai_model: 'gpt-4',
        tokens_used: openaiData.usage?.total_tokens || null,
      })

    if (userMessageError) {
      console.error('❌ Error saving user message:', userMessageError)
    }

    // Save assistant message to database
    const { error: assistantMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        user_id: user.id,
        client_id: client_id || null,
        role: 'assistant',
        content: assistantMessage,
        context_documents: context_documents || null,
        ai_model: 'gpt-4',
        tokens_used: openaiData.usage?.total_tokens || null,
      })

    if (assistantMessageError) {
      console.error('❌ Error saving assistant message:', assistantMessageError)
    }

    console.log('✅ Chat messages saved to database')

    // Return the assistant's response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        tokens_used: openaiData.usage?.total_tokens || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Chat function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})