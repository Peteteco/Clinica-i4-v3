import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContextType, Profile, Organization, SignUpData } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do perfil e organização
  const loadUserData = async (userId: string) => {
    try {
      // Buscar profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Buscar organization (apenas se não for super admin)
      if (profileData?.organization_id && !profileData?.is_super_admin) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);
      } else if (profileData?.is_super_admin) {
        // Super admins não têm organização
        setOrganization(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setProfile(null);
      setOrganization(null);
    }
  };

  // Verificar sessão inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
      setLoading(false);
    });

    // Listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setOrganization(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  // Cadastro
  const signUp = async ({ email, password, fullName, organizationName }: SignUpData) => {
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // 2. Gerar slug da organização
      const slug = organizationName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // 3. Criar organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          slug: slug + '-' + Date.now(), // Adicionar timestamp para unicidade
          settings: {},
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 4. Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          organization_id: orgData.id,
          full_name: fullName,
          role: 'admin', // Primeiro usuário é admin
        });

      if (profileError) throw profileError;

      // 5. Criar settings padrão para a organização
      const { error: settingsError } = await supabase
        .from('settings')
        .insert({
          organization_id: orgData.id,
          clinic_name: organizationName,
          doctor_name: fullName,
          subscription_plan: 'premium',
        });

      if (settingsError) throw settingsError;

      toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao fazer cadastro');
      throw error;
    }
  };

  // Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Limpar estado local independente do erro
      setUser(null);
      setProfile(null);
      setOrganization(null);
      
      // Se não for erro de sessão, mostrar erro
      if (error && error.message !== 'Auth session missing!') {
        console.error('Erro no logout:', error);
        toast.error(error.message || 'Erro ao fazer logout');
      } else {
        toast.success('Logout realizado com sucesso!');
      }
    } catch (error: any) {
      // Limpar estado mesmo com erro
      setUser(null);
      setProfile(null);
      setOrganization(null);
      
      console.error('Erro no logout:', error);
      
      // Só mostrar erro se não for sessão ausente
      if (error.message !== 'Auth session missing!') {
        toast.error('Erro ao fazer logout');
      } else {
        toast.success('Logout realizado com sucesso!');
      }
    }
  };

  // Reset de senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error.message || 'Erro ao enviar email');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    organization,
    isSuperAdmin: profile?.is_super_admin ?? false,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

