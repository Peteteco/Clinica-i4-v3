import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PlanLimits {
  max_agendamentos_mes: number | null;
  max_mensagens_whatsapp_mes: number | null;
  max_usuarios: number | null;
  max_pacientes: number | null;
}

export interface PlanFeatures {
  atendimento_inteligente: boolean;
  agendamento_automatico: boolean;
  lembretes_automaticos: boolean;
  confirmacao_email: boolean;
  base_conhecimento: boolean;
  relatorios_avancados: boolean;
  integracao_whatsapp: boolean;
  multi_usuarios: boolean;
  personalizacao_agente: boolean;
  analytics: boolean;
}

export function usePlanFeatures() {
  const { organization } = useAuth();

  // Buscar configuração do plano da organização
  const { data: planConfig, isLoading } = useQuery({
    queryKey: ['plan-features', organization?.subscription_plan],
    queryFn: async () => {
      if (!organization?.subscription_plan) return null;

      const { data, error } = await supabase
        .from('subscription_plan_configs')
        .select('*')
        .eq('plan_id', organization.subscription_plan)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.subscription_plan,
  });

  // Features do plano
  const features: PlanFeatures = {
    atendimento_inteligente: planConfig?.atendimento_inteligente ?? false,
    agendamento_automatico: planConfig?.agendamento_automatico ?? false,
    lembretes_automaticos: planConfig?.lembretes_automaticos ?? false,
    confirmacao_email: planConfig?.confirmacao_email ?? false,
    base_conhecimento: planConfig?.base_conhecimento ?? false,
    relatorios_avancados: planConfig?.relatorios_avancados ?? false,
    integracao_whatsapp: planConfig?.integracao_whatsapp ?? false,
    multi_usuarios: planConfig?.multi_usuarios ?? false,
    personalizacao_agente: planConfig?.personalizacao_agente ?? false,
    analytics: planConfig?.analytics ?? false,
  };

  // Limites do plano
  const limits: PlanLimits = {
    max_agendamentos_mes: planConfig?.max_agendamentos_mes ?? null,
    max_mensagens_whatsapp_mes: planConfig?.max_mensagens_whatsapp_mes ?? null,
    max_usuarios: planConfig?.max_usuarios ?? null,
    max_pacientes: planConfig?.max_pacientes ?? null,
  };

  // Função para verificar se tem acesso a uma feature
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    return features[feature];
  };

  // Função para verificar se atingiu um limite
  const checkLimit = async (limitType: keyof PlanLimits): Promise<{ allowed: boolean; current: number; max: number | null }> => {
    const maxValue = limits[limitType];
    
    // Se não tem limite, permite
    if (maxValue === null) {
      return { allowed: true, current: 0, max: null };
    }

    let current = 0;

    try {
      // Buscar contagem atual baseado no tipo de limite
      switch (limitType) {
        case 'max_pacientes': {
          const { count } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization?.id || '');
          current = count || 0;
          break;
        }
        case 'max_usuarios': {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization?.id || '');
          current = count || 0;
          break;
        }
        case 'max_agendamentos_mes': {
          const firstDayOfMonth = new Date();
          firstDayOfMonth.setDate(1);
          firstDayOfMonth.setHours(0, 0, 0, 0);

          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization?.id || '')
            .gte('created_at', firstDayOfMonth.toISOString());
          current = count || 0;
          break;
        }
        case 'max_mensagens_whatsapp_mes': {
          // TODO: Implementar quando houver tabela de mensagens
          current = 0;
          break;
        }
      }

      const allowed = current < maxValue;
      return { allowed, current, max: maxValue };
    } catch (error) {
      console.error('Erro ao verificar limite:', error);
      return { allowed: false, current, max: maxValue };
    }
  };

  return {
    features,
    limits,
    hasFeature,
    checkLimit,
    isLoading,
    planName: planConfig?.plan_name || 'Sem Plano',
    planId: organization?.subscription_plan || null,
  };
}


