import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    console.log('🚀 Iniciando create-organization Edge Function...');
    
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
    const authHeader = req.headers.get('Authorization')
    console.log('🔑 Authorization header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Nenhum header de autorização encontrado');
      throw new Error('Não autenticado')
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Token extraído (primeiros 20 chars):', token.substring(0, 20) + '...');
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    console.log('👤 Resultado getUser - user:', user?.id);
    console.log('👤 Resultado getUser - error:', userError);
    
    if (userError) {
      console.error('❌ Erro ao verificar usuário:', userError);
      throw new Error('Não autenticado: ' + userError.message)
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado no token');
      throw new Error('Não autenticado')
    }

    console.log('✅ Usuário autenticado:', user.id);

    // Verificar se é super admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    console.log('👤 Profile encontrado:', profile);
    console.log('👤 Profile error:', profileError);
    console.log('👤 Is super admin:', profile?.is_super_admin);

    if (!profile || !profile.is_super_admin) {
      console.error('❌ Usuário não é super admin');
      throw new Error('Apenas super admins podem criar organizações')
    }
    
    console.log('✅ Verificação de super admin OK');

    // Pegar dados do request
    const { 
      organizationName, 
      adminEmail, 
      adminPassword, 
      adminFullName,
      isActive = true,
      subscriptionPlan = 'plano_a'
    } = await req.json()

    console.log('📋 Criando organização:', organizationName)

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário')
    }

    console.log('✅ Usuário criado:', authData.user.id)

    // 2. Gerar slug
    const slug = organizationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now()

    console.log('📝 Slug gerado:', slug)

    // 3. Criar organização
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: organizationName,
        slug,
        is_active: isActive,
        subscription_plan: subscriptionPlan,
      })
      .select()
      .single()

    if (orgError) {
      console.error('❌ Erro ao criar organização:', orgError)
      // Limpar: deletar usuário criado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw orgError
    }

    console.log('✅ Organização criada:', orgData.id)

    // 4. Criar perfil do admin
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        organization_id: orgData.id,
        full_name: adminFullName,
        role: 'admin',
        is_super_admin: false,
        is_active: true,
      })

    if (profileInsertError) {
      console.error('❌ Erro ao criar perfil:', profileInsertError)
      // Limpar: deletar organização e usuário
      await supabaseAdmin.from('organizations').delete().eq('id', orgData.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileInsertError
    }

    console.log('✅ Perfil criado')

    // 5. Criar settings padrão
    const { error: settingsError } = await supabaseAdmin
      .from('settings')
      .insert({
        organization_id: orgData.id,
        clinic_name: organizationName,
        doctor_name: adminFullName,
        subscription_plan: 'premium',
      })

    if (settingsError) {
      console.error('❌ Erro ao criar settings:', settingsError)
      // Limpar: deletar tudo
      await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
      await supabaseAdmin.from('organizations').delete().eq('id', orgData.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw settingsError
    }

    console.log('✅ Settings criadas')
    console.log('🎉 Organização criada com sucesso!')

    return new Response(
      JSON.stringify({
        success: true,
        organization: orgData,
        admin: {
          id: authData.user.id,
          email: adminEmail,
          full_name: adminFullName,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao criar organização',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
