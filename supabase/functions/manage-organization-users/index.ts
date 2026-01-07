import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const buildCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') ?? '*'

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, Authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }

  // Só envia credenciais quando a origem é explícita (browser não aceita "*" + credentials)
  if (origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com Service Role (admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se usuário logado é super admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      throw new Error('Não autenticado')
    }

    // Verificar se é super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_super_admin) {
      throw new Error('Apenas super admins podem gerenciar usuários')
    }

    // Pegar dados do request
    const body = await req.json()
    const { action, organizationId, userId, userData } = body

    console.log('📋 Ação:', action)

    if (action === 'create') {
      // Criar novo usuário
      const { fullName, email, password, role } = userData

      console.log('➕ Criando usuário:', email)

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      console.log('✅ Usuário criado no Auth:', authData.user.id)

      // 2. Criar perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          organization_id: organizationId,
          full_name: fullName,
          role: role,
          is_super_admin: false,
          is_active: true,
        })

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        // Limpar: deletar usuário criado
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      console.log('✅ Perfil criado')

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            role: role,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } else if (action === 'delete') {
      // Deletar usuário
      console.log('🗑️ Deletando usuário:', userId)

      // 1. Deletar perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('❌ Erro ao deletar perfil:', profileError)
        throw profileError
      }

      console.log('✅ Perfil deletado')

      // 2. Deletar usuário do Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('❌ Erro ao deletar usuário do Auth:', authError)
        throw authError
      }

      console.log('✅ Usuário deletado do Auth')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Usuário deletado com sucesso',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } else {
      throw new Error('Ação inválida')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao gerenciar usuário',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

