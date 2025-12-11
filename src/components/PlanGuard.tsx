import { ReactNode } from "react";
import { usePlanFeatures, PlanFeatures } from "@/hooks/usePlanFeatures";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanGuardProps {
  children: ReactNode;
  feature: keyof PlanFeatures;
  fallback?: ReactNode;
}

export function PlanGuard({ children, feature, fallback }: PlanGuardProps) {
  const { hasFeature, isLoading, planName } = usePlanFeatures();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  const hasAccess = hasFeature(feature);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const featureNames: Record<keyof PlanFeatures, string> = {
      atendimento_inteligente: "Atendimento Inteligente",
      agendamento_automatico: "Agendamento Automático",
      lembretes_automaticos: "Lembretes Automáticos",
      confirmacao_email: "Confirmação por Email",
      base_conhecimento: "Base de Conhecimento",
      relatorios_avancados: "Relatórios Avançados",
      integracao_whatsapp: "Integração WhatsApp",
      multi_usuarios: "Multi Usuários",
      personalizacao_agente: "Personalização do Agente",
      analytics: "Analytics",
    };

    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 text-center border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 border-2 border-accent/20">
                <Lock className="h-10 w-10 text-accent" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Recurso Bloqueado
          </h2>
          
          <p className="text-lg text-muted-foreground mb-6">
            A funcionalidade <span className="font-semibold text-accent">{featureNames[feature]}</span> não está disponível no seu plano atual.
          </p>

          <div className="bg-background/50 rounded-lg p-4 mb-6 border border-border/50">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Seu Plano Atual</span>
            </div>
            <p className="text-lg font-bold text-foreground">{planName}</p>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            Faça upgrade do seu plano para ter acesso a esta e outras funcionalidades premium.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/app/dashboard')}
              className="gap-2"
            >
              Voltar ao Dashboard
            </Button>
            <Button
              onClick={() => {
                // Abrir modal de planos no Layout
                window.dispatchEvent(new CustomEvent('open-plan-modal'));
              }}
              className="gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
            >
              <Sparkles className="h-4 w-4" />
              Ver Planos Disponíveis
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}


