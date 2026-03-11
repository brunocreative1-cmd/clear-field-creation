import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const PARADISE_API_URL = 'https://multi.paradisepags.com/api/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const secretKey = Deno.env.get('PARADISE_SECRET_KEY') || ''
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'PARADISE_SECRET_KEY não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    // Extract the path after /pix-proxy (e.g., /transaction.php or /query.php)
    const pathParam = url.searchParams.get('path') || '/transaction.php'
    const paradiseUrl = new URL(pathParam, PARADISE_API_URL + '/')

    // Forward all query params except 'path'
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') paradiseUrl.searchParams.set(key, value)
    })

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': secretKey
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.json().catch(() => ({}))
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(paradiseUrl.toString(), fetchOptions)
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
