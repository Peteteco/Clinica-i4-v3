import { Search, UserPlus, Mail, Phone, Filter, X, FileText, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { LimitAlert } from "@/components/LimitAlert";
import { usePatients, useCreatePatient } from "@/hooks/usePatients";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { cn, formatPhoneNumber } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  observations: string;
}

type KanbanStatus =
  | "novo_contato"
  | "qualificado"
  | "em_atendimento"
  | "agendado"
  | "aguardando_confirmacao"
  | "concluido"
  | "all";

const kanbanStatuses = [
  { id: "novo_contato", title: "Novo Contato", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "qualificado", title: "Qualificado", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "em_atendimento", title: "Em Atendimento", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { id: "agendado", title: "Agendado", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  { id: "aguardando_confirmacao", title: "Aguardando Confirmação", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "concluido", title: "Concluído", color: "bg-green-500/10 text-green-600 border-green-500/20" },
];

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<KanbanStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [resumoPatient, setResumoPatient] = useState<any | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ current: number; max: number | null } | null>(null);
  const { data: patients = [], isLoading } = usePatients();
  const { profile } = useAuth();
  const createPatient = useCreatePatient();
  const { checkLimit } = usePlanFeatures();

  // Verificar limite ao abrir dialog
  useEffect(() => {
    if (isDialogOpen) {
      checkLimit('max_pacientes').then(result => {
        setLimitInfo({ current: result.current, max: result.max });
      });
    }
  }, [isDialogOpen, checkLimit]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PatientFormData>({
    defaultValues: {
      status: 'active',
    },
  });

  const status = watch('status');

  const onSubmit = async (data: PatientFormData) => {
    if (!profile?.organization_id) {
      toast.error('Erro: organização não identificada');
      return;
    }

    // Verificar limite antes de criar
    const limitCheck = await checkLimit('max_pacientes');
    if (!limitCheck.allowed) {
      toast.error(`Limite de ${limitCheck.max} pacientes atingido! Faça upgrade do seu plano.`);
      return;
    }

    try {
      await createPatient.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        observations: data.observations || null,
        organization_id: profile.organization_id,
        total_visits: 0,
      });

      toast.success('Paciente cadastrado com sucesso!');
      setIsDialogOpen(false);
      reset();
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error);
      toast.error(error.message || 'Erro ao cadastrar paciente');
    }
  };

  // Filtrar pacientes pela busca e status
  const filteredPatients = patients.filter((patient) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (patient.name?.toLowerCase() || "").includes(search) ||
      (patient.email?.toLowerCase() || "").includes(search) ||
      (patient.phone?.toLowerCase() || "").includes(search)
    );
    
    const matchesStatus = statusFilter === "all" || patient.kanban_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-1 md:mb-2">
            CRM
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Gerencie seus pacientes com cuidado
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Adicionar Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Paciente</DialogTitle>
              <DialogDescription>
                Adicione um novo paciente ao seu sistema de gestão.
              </DialogDescription>
            </DialogHeader>
            {limitInfo && limitInfo.max && (
              <LimitAlert
                current={limitInfo.current}
                max={limitInfo.max}
                limitName="pacientes"
                onUpgrade={() => {
                  setIsDialogOpen(false);
                  window.dispatchEvent(new CustomEvent('open-plan-modal'));
                }}
              />
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Ex: João da Silva"
                  {...register('name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@example.com"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 98888-8888"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setValue('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Anotações sobre o paciente..."
                  {...register('observations')}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createPatient.isPending}>
                  {createPatient.isPending ? 'Criando...' : 'Criar Paciente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative animate-fade-in-up">
        <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar pacientes por nome, email ou telefone..."
          className="pl-10 md:pl-12 h-11 md:h-12 bg-card border-border/50 focus:border-accent text-sm md:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filtros por Status */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtrar por:</span>
          
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs"
          >
            Todos ({patients.length})
          </Button>

          {kanbanStatuses.map((status) => {
            const count = patients.filter(p => p.kanban_status === status.id).length;
            return (
              <Button
                key={status.id}
                variant={statusFilter === status.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.id as KanbanStatus)}
                className={cn(
                  "h-8 text-xs",
                  statusFilter === status.id && status.id === "novo_contato" && "bg-blue-500 hover:bg-blue-600",
                  statusFilter === status.id && status.id === "qualificado" && "bg-purple-500 hover:bg-purple-600",
                  statusFilter === status.id && status.id === "em_atendimento" && "bg-yellow-500 hover:bg-yellow-600",
                  statusFilter === status.id && status.id === "agendado" && "bg-cyan-500 hover:bg-cyan-600",
                  statusFilter === status.id && status.id === "aguardando_confirmacao" && "bg-orange-500 hover:bg-orange-600",
                  statusFilter === status.id && status.id === "concluido" && "bg-green-500 hover:bg-green-600"
                )}
              >
                {status.title} ({count})
              </Button>
            );
          })}

          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-8 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-2 md:grid-cols-4 animate-fade-in-up">
        <div className="card-luxury p-3 md:p-4">
          <p className="text-caption mb-1.5 md:mb-2 text-[10px] md:text-xs">Total de Pacientes</p>
          <p className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            {patients.length}
          </p>
        </div>
        <div className="card-luxury p-3 md:p-4">
          <p className="text-caption mb-1.5 md:mb-2 text-[10px] md:text-xs">Ativos</p>
          <p className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-success">
            {patients.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="card-luxury p-3 md:p-4">
          <p className="text-caption mb-1.5 md:mb-2 text-[10px] md:text-xs">Inativos</p>
          <p className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground">
            {patients.filter(p => p.status === 'inactive').length}
          </p>
        </div>
        <div className="card-luxury p-3 md:p-4">
          <p className="text-caption mb-1.5 md:mb-2 text-[10px] md:text-xs">Total Visitas</p>
          <p className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-accent">
            {patients.reduce((sum, p) => sum + p.total_visits, 0)}
          </p>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12 card-luxury">
          <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Tente buscar com outros termos" : "Adicione seu primeiro paciente para começar"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient, index) => (
            <div
              key={patient.id}
              className="card-luxury group p-4 md:p-5 lg:p-6 animate-fade-in-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              {/* Patient Header */}
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-base md:text-lg font-semibold text-accent">
                    {patient.name
                      ? patient.name.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "?"
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                      {patient.name || "Sem nome"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-medium ${
                          patient.status === "active"
                            ? "text-success"
                            : "text-muted-foreground"
                        }`}
                      >
                        {patient.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                      {patient.kanban_status && (() => {
                        const statusInfo = kanbanStatuses.find(s => s.id === patient.kanban_status);
                        return statusInfo ? (
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] h-5 px-2", statusInfo.color)}
                          >
                            {statusInfo.title}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 rounded-full bg-accent/10 px-2.5 md:px-3 py-1 text-xs font-medium text-accent whitespace-nowrap">
                  {patient.total_visits} {patient.total_visits === 1 ? "visita" : "visitas"}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 border-t border-border/50 pt-3 md:pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span className="truncate text-xs md:text-sm">
                    {patient.email || "Sem email"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span className="text-xs md:text-sm">
                    {formatPhoneNumber(patient.phone) || "Sem telefone"}
                  </span>
                </div>
                
                {/* Observações */}
                {patient.observations && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t border-border/30">
                    <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm line-clamp-2">
                      {patient.observations}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 md:mt-4 border-t border-border/50 pt-3 md:pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">
                    Última visita: {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span>
                  <button 
                    onClick={() => setSelectedPatient(patient)}
                    className="text-xs md:text-sm font-medium text-accent transition-colors hover:text-accent/80 self-start"
                  >
                    Ver Detalhes
                  </button>
                </div>
                
                {/* Botão Ver Resumo */}
                {patient.resumo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResumoPatient(patient)}
                    className="w-full gap-2 text-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Ver resumo da conversa
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes do Paciente */}
      <Dialog open={selectedPatient !== null} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-display text-base font-semibold text-accent">
                {selectedPatient?.name
                  ? selectedPatient.name.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                  : "?"
                }
              </div>
              {selectedPatient?.name || "Paciente"}
            </DialogTitle>
            <DialogDescription>
              Informações completas do paciente
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline"
                  className={selectedPatient.status === 'active' ? 'border-green-500/50 text-green-600' : 'border-gray-500/50 text-gray-600'}
                >
                  {selectedPatient.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                {selectedPatient.kanban_status && (() => {
                  const statusInfo = kanbanStatuses.find(s => s.id === selectedPatient.kanban_status);
                  return statusInfo ? (
                    <Badge variant="outline" className={statusInfo.color}>
                      {statusInfo.title}
                    </Badge>
                  ) : null;
                })()}
              </div>

              {/* Informações de Contato */}
              <div className="space-y-3 rounded-lg border border-border/50 bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground">Informações de Contato</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {selectedPatient.email || "Sem email"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {formatPhoneNumber(selectedPatient.phone) || "Sem telefone"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total de Visitas</p>
                  <p className="text-2xl font-bold text-accent">{selectedPatient.total_visits}</p>
                </div>
                
                <div className="rounded-lg border border-border/50 bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-1">Última Visita</p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedPatient.last_visit 
                      ? new Date(selectedPatient.last_visit).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>

              {/* Observações */}
              {selectedPatient.observations && (
                <div className="space-y-2 rounded-lg border border-border/50 bg-background p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Observações</h3>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPatient.observations}
                  </p>
                </div>
              )}

              {/* Data de Cadastro */}
              <div className="text-xs text-muted-foreground">
                Cadastrado em: {new Date(selectedPatient.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resumo da Conversa */}
      <Dialog open={resumoPatient !== null} onOpenChange={() => setResumoPatient(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Resumo da Conversa
            </DialogTitle>
            <DialogDescription>
              {resumoPatient?.name && `Resumo da conversa com ${resumoPatient.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {resumoPatient && (
            <div className="space-y-4">
              {/* Informações do Paciente */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 font-display text-base font-semibold text-accent">
                  {resumoPatient.name
                    ? resumoPatient.name.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "?"
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{resumoPatient.name || "Paciente"}</h3>
                  <p className="text-sm text-muted-foreground">{formatPhoneNumber(resumoPatient.phone)}</p>
                </div>
              </div>

              {/* Resumo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-foreground">Resumo Gerado</h3>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {resumoPatient.resumo}
                  </p>
                </div>
              </div>

              {/* Metadados */}
              <div className="flex items-center gap-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>Gerado automaticamente</span>
                </div>
                {resumoPatient.last_visit && (
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>Última atualização: {new Date(resumoPatient.last_visit).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResumoPatient(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
