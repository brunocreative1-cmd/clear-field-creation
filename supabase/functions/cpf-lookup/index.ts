import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const cpf = url.searchParams.get('cpf')

    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      return new Response(JSON.stringify({ error: 'CPF inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const rawCpf = cpf.replace(/\D/g, '')
    const apiKey = Deno.env.get('VITE_CPF_API_KEY') || ''

    console.log(`[cpf-lookup] Consultando CPF ${rawCpf.substring(0, 3)}...`)

    const response = await fetch(`https://apicpf.com/api/consulta?cpf=${rawCpf}`, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json'
      }
    })

    const text = await response.text()
    console.log(`[cpf-lookup] Status: ${response.status}, Body: ${text.substring(0, 200)}`)

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return new Response(JSON.stringify({ error: 'Resposta inválida da API de CPF', raw: text.substring(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[cpf-lookup] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
