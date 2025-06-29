import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ProcessDocumentRequest {
  document_id: string
  user_id: string
  client_id?: string
}

interface NoticeAnalysis {
  noticeType: string
  noticeNumber?: string
  taxYear?: number
  amountOwed?: number
  deadlineDate?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  recommendations: string[]
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
    const { document_id, user_id, client_id }: ProcessDocumentRequest = await req.json()

    if (!document_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'document_id and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Processing document AI analysis for:', document_id)

    // Get document from database
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', user_id)
      .single()

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simulate OCR text extraction (in production, you'd use actual OCR service)
    let ocrText = document.ocr_text
    if (!ocrText) {
      ocrText = await simulateOCRExtraction(document)
    }

    // Analyze document with OpenAI
    const analysis = await analyzeDocumentWithAI(ocrText, document.original_filename)

    // Update document with OCR text and AI summary
    const { error: updateDocError } = await supabaseClient
      .from('documents')
      .update({
        ocr_text: ocrText,
        ai_summary: analysis.summary,
        is_processed: true,
      })
      .eq('id', document_id)

    if (updateDocError) {
      console.error('❌ Error updating document:', updateDocError)
    }

    // Check if IRS notice record exists
    const { data: existingNotice } = await supabaseClient
      .from('irs_notices')
      .select('id')
      .eq('document_id', document_id)
      .single()

    let noticeId = existingNotice?.id

    if (existingNotice) {
      // Update existing IRS notice
      const { error: updateNoticeError } = await supabaseClient
        .from('irs_notices')
        .update({
          notice_type: analysis.noticeType,
          notice_number: analysis.noticeNumber,
          tax_year: analysis.taxYear,
          amount_owed: analysis.amountOwed,
          deadline_date: analysis.deadlineDate,
          priority: analysis.priority,
          ai_summary: analysis.summary,
          ai_recommendations: analysis.recommendations.join('\n'),
        })
        .eq('id', existingNotice.id)

      if (updateNoticeError) {
        console.error('❌ Error updating IRS notice:', updateNoticeError)
      }
    } else {
      // Create new IRS notice record
      const { data: newNotice, error: createNoticeError } = await supabaseClient
        .from('irs_notices')
        .insert({
          user_id: user_id,
          client_id: client_id,
          document_id: document_id,
          notice_type: analysis.noticeType,
          notice_number: analysis.noticeNumber,
          tax_year: analysis.taxYear,
          amount_owed: analysis.amountOwed,
          deadline_date: analysis.deadlineDate,
          priority: analysis.priority,
          ai_summary: analysis.summary,
          ai_recommendations: analysis.recommendations.join('\n'),
        })
        .select()
        .single()

      if (createNoticeError) {
        console.error('❌ Error creating IRS notice:', createNoticeError)
      } else {
        noticeId = newNotice?.id
      }
    }

    console.log('✅ Document AI processing completed')

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        notice_id: noticeId,
        analysis: {
          summary: analysis.summary,
          recommendations: analysis.recommendations,
          notice_type: analysis.noticeType,
          priority: analysis.priority,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Process document AI error:', error)
    
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

async function simulateOCRExtraction(document: any): Promise<string> {
  // Simulate OCR processing based on filename
  const filename = document.original_filename.toLowerCase()
  
  if (filename.includes('cp2000')) {
    return `
      DEPARTMENT OF THE TREASURY
      INTERNAL REVENUE SERVICE
      
      NOTICE CP2000
      
      We have information that doesn't match what you reported on your tax return.
      
      Tax Year: 2023
      Notice Date: January 15, 2024
      
      PROPOSED CHANGES TO YOUR 2023 FORM 1040
      
      Income not reported on your return:
      1099-MISC from ACME Corporation - $5,200.00
      
      Proposed additional tax: $1,456.00
      Interest: $123.00
      Penalty: $111.00
      
      Total amount due: $1,690.00
      
      WHAT YOU NEED TO DO:
      If you agree with our proposed changes, sign and return this notice with your payment by March 15, 2024.
      
      If you disagree, you have 30 days from the date of this notice to respond.
    `
  }
  
  if (filename.includes('cp14')) {
    return `
      DEPARTMENT OF THE TREASURY
      INTERNAL REVENUE SERVICE
      
      NOTICE CP14
      
      You have an unpaid balance on your account.
      
      Tax Year: 2023
      Notice Date: January 10, 2024
      
      Balance due: $2,847.00
      
      Interest and penalties continue to accrue until the full amount is paid.
      
      Pay immediately to avoid additional interest and penalties.
      Payment due date: February 28, 2024
    `
  }

  // Generic IRS notice text
  return `
    DEPARTMENT OF THE TREASURY
    INTERNAL REVENUE SERVICE
    
    This is an official notice regarding your tax account.
    Please review the information carefully and respond as necessary.
    
    Tax Year: 2023
    Notice Date: ${new Date().toLocaleDateString()}
  `
}

async function analyzeDocumentWithAI(text: string, filename: string): Promise<NoticeAnalysis> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    console.warn('⚠️ OpenAI API key not found, using fallback analysis')
    return fallbackAnalysis(text, filename)
  }

  try {
    const prompt = `
You are a tax professional AI assistant specializing in IRS notice analysis. Analyze the following IRS notice document and provide a structured response.

Document filename: ${filename}
Document text:
${text}

Please analyze this document and respond with a JSON object containing:
{
  "noticeType": "string - Type of IRS notice (e.g., 'CP2000 - Proposed Changes to Tax Return')",
  "noticeNumber": "string - Notice number if found (e.g., 'CP2000')",
  "taxYear": "number - Tax year mentioned in the notice",
  "amountOwed": "number - Amount owed if mentioned",
  "deadlineDate": "string - Deadline date in ISO format if found",
  "priority": "string - Priority level: low, medium, high, or critical",
  "summary": "string - Clear, professional summary of the notice",
  "recommendations": ["array of strings - Specific actionable recommendations"]
}

Guidelines:
- Be accurate and professional
- Extract specific amounts and dates when available
- Provide clear, actionable recommendations
- Set priority based on urgency and potential consequences
- If information is not available, use null for that field
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional tax advisor AI that analyzes IRS notices and provides expert guidance. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.status)
      return fallbackAnalysis(text, filename)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.error('❌ No content in OpenAI response')
      return fallbackAnalysis(text, filename)
    }

    try {
      const analysis = JSON.parse(content)
      console.log('✅ OpenAI analysis completed')
      return analysis
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI JSON response:', parseError)
      return fallbackAnalysis(text, filename)
    }

  } catch (error) {
    console.error('❌ OpenAI API call failed:', error)
    return fallbackAnalysis(text, filename)
  }
}

function fallbackAnalysis(text: string, filename: string): NoticeAnalysis {
  const lowerText = text.toLowerCase()
  const lowerFilename = filename.toLowerCase()

  // Determine notice type and priority
  let noticeType = 'IRS Notice'
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  let noticeNumber: string | undefined

  if (lowerText.includes('cp2000') || lowerFilename.includes('cp2000')) {
    noticeType = 'CP2000 - Proposed Changes to Tax Return'
    priority = 'high'
    noticeNumber = 'CP2000'
  } else if (lowerText.includes('cp14') || lowerFilename.includes('cp14')) {
    noticeType = 'CP14 - Balance Due Notice'
    priority = 'medium'
    noticeNumber = 'CP14'
  } else if (lowerText.includes('cp90') || lowerFilename.includes('cp90')) {
    noticeType = 'CP90 - Final Notice of Intent to Levy'
    priority = 'critical'
    noticeNumber = 'CP90'
  }

  // Extract tax year
  const taxYearMatch = text.match(/tax year:?\s*(\d{4})/i)
  const taxYear = taxYearMatch ? parseInt(taxYearMatch[1]) : undefined

  // Extract amount owed
  const amountMatch = text.match(/(?:amount due|balance due|total.*due):?\s*\$?([\d,]+\.?\d*)/i)
  const amountOwed = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined

  // Extract deadline
  let deadlineDate: string | undefined
  const deadlineMatch = text.match(/(?:payment due date|respond by|due date):?\s*([\w\s,]+\d{4})/i)
  if (deadlineMatch) {
    const dateStr = deadlineMatch[1].trim()
    const parsedDate = new Date(dateStr)
    if (!isNaN(parsedDate.getTime())) {
      deadlineDate = parsedDate.toISOString()
    }
  }

  // Generate summary and recommendations
  let summary = ''
  let recommendations: string[] = []

  if (noticeType.includes('CP2000')) {
    summary = `The IRS has identified unreported income on your tax return and is proposing additional tax of $${amountOwed?.toLocaleString() || 'TBD'}. This notice indicates discrepancies between the income reported on your return and information the IRS received from third parties.`
    
    recommendations = [
      'Review all 1099 forms and income documents for the tax year',
      'Gather supporting documentation for any disputed amounts',
      'Consider filing an amended return if the proposed changes are correct',
      'Respond within 30 days to avoid automatic assessment',
      'Consult with a tax professional if you disagree with the proposed changes'
    ]
  } else if (noticeType.includes('CP14')) {
    summary = `You have an outstanding balance of $${amountOwed?.toLocaleString() || 'TBD'} on your tax account. Interest and penalties will continue to accrue until the balance is paid in full.`
    
    recommendations = [
      'Pay the full amount immediately to stop interest and penalty accrual',
      'Set up a payment plan if you cannot pay the full amount',
      'Verify the balance is correct by reviewing your account transcript',
      'Consider making a partial payment to reduce interest charges',
      'Contact the IRS if you believe the balance is incorrect'
    ]
  } else {
    summary = `This IRS notice requires your attention regarding your tax account. Please review the details carefully and take appropriate action within the specified timeframe.`
    
    recommendations = [
      'Read the notice carefully and understand what action is required',
      'Gather any supporting documentation mentioned in the notice',
      'Respond by the deadline specified in the notice',
      'Contact a tax professional if you need assistance',
      'Keep a copy of the notice and any correspondence for your records'
    ]
  }

  return {
    noticeType,
    noticeNumber,
    taxYear,
    amountOwed,
    deadlineDate,
    priority,
    summary,
    recommendations,
  }
}