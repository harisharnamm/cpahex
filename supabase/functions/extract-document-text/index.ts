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
    const { documentId, storagePath } = await req.json()

    if (!documentId || !storagePath) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simulate OCR text extraction
    // In production, this would use actual OCR services like Tesseract or cloud OCR APIs
    const mockExtractedText = generateMockIRSNoticeText()

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: mockExtractedText
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error extracting text:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateMockIRSNoticeText(): string {
  const notices = [
    `DEPARTMENT OF THE TREASURY
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

If you disagree, you have 30 days from the date of this notice to respond.`,

    `DEPARTMENT OF THE TREASURY
INTERNAL REVENUE SERVICE

NOTICE CP14

You have an unpaid balance on your account.

Tax Year: 2023
Notice Date: January 10, 2024

Balance due: $2,847.00

Interest and penalties continue to accrue until the full amount is paid.

Pay immediately to avoid additional interest and penalties.
Payment due date: February 28, 2024`
  ]

  return notices[Math.floor(Math.random() * notices.length)]
}