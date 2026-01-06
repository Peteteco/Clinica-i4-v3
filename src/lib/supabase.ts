import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Carregar variáveis de ambiente com fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qqlkyyefooxyosxlxlxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbGt5eWVmb294eW9zeGx4bHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMjE5NTAsImV4cCI6MjA2NTc5Nzk1MH0.NBNQARRNKi-8z-dGBQBGP177BlMWwlgn_clrAhJlXFA';

// Exportar URL para uso em outros lugares
export const SUPABASE_URL = supabaseUrl;

// Debug: Verificar variáveis de ambiente
console.log('🔍 Configuração Supabase:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NÃO DEFINIDA',
  keyLength: supabaseAnonKey?.length || 0,
  keyPrefix: supabaseAnonKey?.substring(0, 10) || 'NÃO DEFINIDA',
});

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`);
}

// Validar formato da chave
if (!supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length < 100) {
  console.warn('⚠️ A chave do Supabase parece estar incompleta ou incorreta. Chaves válidas geralmente começam com "eyJ" e têm mais de 100 caracteres.');
}

// Criar cliente Supabase com tratamento de erros melhorado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

