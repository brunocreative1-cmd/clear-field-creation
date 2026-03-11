import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const PARADISE_API_BASE = 'https://multi.paradisepags.com/api/v1'

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

    const reqUrl = new URL(req.url)
    // path param: /transaction.php or /query.php
    const pathParam = reqUrl.searchParams.get('path') || '/transaction.php'

    // Build paradise URL correctly: base + path + extra query params
    const paradiseUrl = new URL(`${PARADISE_API_BASE}${pathParam}`)

    // Forward all query params except 'path'
    reqUrl.searchParams.forEach((value, key) => {
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

    console.log(`[pix-proxy] ${req.method} ${paradiseUrl.toString()}`)

    const response = await fetch(paradiseUrl.toString(), fetchOptions)
    const text = await response.text()

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[pix-proxy] Resposta não-JSON:', text.substring(0, 200))
      return new Response(JSON.stringify({ error: 'Resposta inválida da Paradise API', raw: text.substring(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[pix-proxy] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
