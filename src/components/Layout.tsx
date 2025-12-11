import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Plug, 
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Kanban as KanbanIcon,
  Bot,
  BookOpen,
  Crown,
  Check,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import SupportButton from "@/components/SupportButton";

const navigation = [
  { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { name: "Agenda", href: "/app/agenda", icon: Calendar },
  { 
    name: "Clientes", 
    href: "/app/clientes", 
    icon: Users,
    subItems: [
      { name: "Contatos", href: "/app/clientes/crm", icon: Users },
      { name: "CRM", href: "/app/clientes/kanban", icon: KanbanIcon }
    ]
  },
  { name: "Agent IA", href: "/app/agent-ia", icon: Bot },
  { name: "Conhecimento do Agent", href: "/app/conhecimento", icon: BookOpen },
  { name: "Integração", href: "/app/integrations", icon: Plug },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { profile, organization, signOut } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanForRequest, setSelectedPlanForRequest] = useState<string | null>(null);

  // Listener para abrir modal de planos via evento customizado
  useEffect(() => {
    const handleOpenPlanModal = () => setIsPlanModalOpen(true);
    window.addEventListener('open-plan-modal', handleOpenPlanModal);
    return () => window.removeEventListener('open-plan-modal', handleOpenPlanModal);
  }, []);

  // Carregar planos disponíveis
  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plan_configs')
        .select('*')
        .order('plan_id', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar plano atual da organização
  const currentPlan = plans.find(p => p.plan_id === organization?.subscription_plan);

  const getPlanBadgeColor = (planId: string) => {
    switch (planId) {
      case 'plano_a': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'plano_b': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'plano_c': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'plano_d': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleRequestPlanChange = async () => {
    if (!selectedPlanForRequest || !organization?.id) {
      toast.error('Por favor, selecione um plano');
      return;
    }

    try {
      // Aqui você pode enviar email para o super admin, criar um ticket, etc
      toast.success('Solicitação enviada! Entraremos em contato em breve.', {
        description: `Plano solicitado: ${plans.find(p => p.plan_id === selectedPlanForRequest)?.plan_name}`,
      });
      setIsPlanModalOpen(false);
      setSelectedPlanForRequest(null);
    } catch (error) {
      console.error('Erro ao solicitar mudança de plano:', error);
      toast.error('Erro ao enviar solicitação');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navegar para login após logout
      window.location.href = '/login';
    } catch (error) {
      // Erro já tratado no AuthContext
      // Navegar para login mesmo com erro
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo & Organization */}
      <div className="border-b border-border/50 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          {/* Logo ou Nome */}
          {organization?.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-10 md:h-12 w-auto max-w-[160px] object-contain"
            />
          ) : (
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Lux<span className="text-accent">Clinic</span>
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 shrink-0"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
        </div>
        {organization && (
          <div className="px-2">
            <p className="text-xs font-medium text-muted-foreground">Organização</p>
            <p className="text-sm font-semibold text-foreground truncate">{organization.name}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 md:px-4 py-6 md:py-8 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
          const isSubItemActive = hasSubItems && item.subItems?.some(sub => location.pathname === sub.href);
          const isOpen = openMenus[item.name] ?? (isActive || isSubItemActive);

          if (hasSubItems) {
            return (
              <Collapsible 
                key={item.name} 
                open={isOpen} 
                onOpenChange={(open) => setOpenMenus(prev => ({ ...prev, [item.name]: open }))}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "group flex items-center justify-between gap-3 rounded-lg px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                      isActive || isSubItemActive
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-all duration-200",
                          isActive || isSubItemActive ? "text-accent" : "text-foreground/50 group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-6 mt-1">
                  {item.subItems?.map((subItem) => {
                    const isSubActive = location.pathname === subItem.href;
                    return (
                      <NavLink
                        key={subItem.name}
                        to={subItem.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium transition-all duration-200",
                          isSubActive
                            ? "bg-accent/10 text-accent"
                            : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <subItem.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-all duration-200",
                            isSubActive ? "text-accent" : "text-foreground/50 group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{subItem.name}</span>
                      </NavLink>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-200",
                  isActive ? "text-accent" : "text-foreground/50 group-hover:text-foreground"
                )}
              />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 p-3 md:p-4 space-y-3">
        {/* Badge do Plano */}
        {currentPlan && (
          <div 
            onClick={() => setIsPlanModalOpen(true)}
            className={cn(
              "rounded-lg border-2 p-3 cursor-pointer transition-all hover:border-accent hover:shadow-lg",
              getPlanBadgeColor(currentPlan.plan_id).replace('bg-', 'border-').replace('/10', '/30')
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className={cn(
                  "h-4 w-4",
                  currentPlan.plan_id === 'plano_a' && "text-blue-500",
                  currentPlan.plan_id === 'plano_b' && "text-purple-500",
                  currentPlan.plan_id === 'plano_c' && "text-amber-500",
                  currentPlan.plan_id === 'plano_d' && "text-emerald-500"
                )} />
                <span className="text-xs font-semibold text-foreground">
                  {currentPlan.plan_name}
                </span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-accent/20">
            <span className="font-display text-xs md:text-sm font-semibold text-accent">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {profile?.role || 'doctor'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      {/* Modal de Planos */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Alterar Plano de Assinatura
            </DialogTitle>
            <DialogDescription>
              Seu plano atual: <strong>{currentPlan?.plan_name}</strong>. 
              Selecione um novo plano para solicitar a alteração.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.plan_id === organization?.subscription_plan;
              const isSelected = selectedPlanForRequest === plan.plan_id;
              
              return (
                <div
                  key={plan.plan_id}
                  onClick={() => !isCurrentPlan && setSelectedPlanForRequest(plan.plan_id)}
                  className={cn(
                    "relative p-5 rounded-lg border-2 transition-all cursor-pointer",
                    isCurrentPlan && "border-accent bg-accent/5 cursor-not-allowed opacity-75",
                    isSelected && !isCurrentPlan && "border-accent bg-accent/5 ring-2 ring-accent",
                    !isSelected && !isCurrentPlan && "border-border hover:border-accent/50"
                  )}
                >
                  {/* Badge Plano Atual */}
                  {isCurrentPlan && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-accent text-accent-foreground">
                        Plano Atual
                      </Badge>
                    </div>
                  )}

                  {/* Checkmark quando selecionado */}
                  {isSelected && !isCurrentPlan && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                      <Check className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}

                  {/* Nome e Preço */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Crown className={cn(
                        "h-5 w-5",
                        plan.plan_id === 'plano_a' && "text-blue-500",
                        plan.plan_id === 'plano_b' && "text-purple-500",
                        plan.plan_id === 'plano_c' && "text-amber-500",
                        plan.plan_id === 'plano_d' && "text-emerald-500"
                      )} />
                      {plan.plan_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.plan_description}
                    </p>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-foreground">
                        R$ {plan.price_monthly?.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  {/* Recursos */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Recursos:
                    </p>
                    <div className="space-y-1.5">
                      {plan.atendimento_inteligente && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Atendimento Inteligente</span>
                        </div>
                      )}
                      {plan.agendamento_automatico && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Agendamento Automático</span>
                        </div>
                      )}
                      {plan.lembretes_automaticos && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Lembretes Automáticos</span>
                        </div>
                      )}
                      {plan.confirmacao_email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Confirmação por Email</span>
                        </div>
                      )}
                      {plan.base_conhecimento && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Base de Conhecimento</span>
                        </div>
                      )}
                      {plan.relatorios_avancados && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Relatórios Avançados</span>
                        </div>
                      )}
                      {plan.integracao_whatsapp && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Integração WhatsApp</span>
                        </div>
                      )}
                      {plan.multi_usuarios && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Múltiplos Usuários</span>
                        </div>
                      )}
                      {plan.personalizacao_agente && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Personalização do Agente</span>
                        </div>
                      )}
                      {plan.analytics && (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Analytics</span>
                        </div>
                      )}
                    </div>

                    {/* Limites */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                        Limites:
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Agendamentos:</span>{' '}
                          {plan.max_agendamentos_mes || '∞'}
                        </div>
                        <div>
                          <span className="font-medium">Mensagens:</span>{' '}
                          {plan.max_mensagens_whatsapp_mes || '∞'}
                        </div>
                        <div>
                          <span className="font-medium">Usuários:</span>{' '}
                          {plan.max_usuarios || '∞'}
                        </div>
                        <div>
                          <span className="font-medium">Pacientes:</span>{' '}
                          {plan.max_pacientes || '∞'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestPlanChange}
              disabled={!selectedPlanForRequest}
            >
              Solicitar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-64 lg:border-r lg:border-border/50 lg:bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-sm px-4 lg:hidden">
        <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
          Lux<span className="text-accent">Clinic</span>
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full lg:ml-64 h-screen pt-16 lg:pt-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Support Button */}
      <SupportButton />
    </div>
  );
}
