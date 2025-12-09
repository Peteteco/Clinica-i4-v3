import { Calendar, Users, Clock, TrendingUp, Activity, CheckCircle2 } from "lucide-react";
import KPICard from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { useAppointments, useCreateAppointment } from "@/hooks/useAppointments";
import { usePatients, useCreatePatient } from "@/hooks/usePatients";
import { formatTime, isToday, isSameDay } from "@/lib/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface AppointmentFormData {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  patient_id: string;
  type: string;
  observations: string;
}

interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  observations: string;
}

export default function Dashboard() {
  const { data: allAppointments = [], isLoading: loadingAppointments } = useAppointments();
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const { profile } = useAuth();
  const createAppointment = useCreateAppointment();
  const createPatient = useCreatePatient();

  // Modals state
  const [isTodayModalOpen, setIsTodayModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // Forms
  const appointmentForm = useForm<AppointmentFormData>({
    defaultValues: {
      status: 'pending',
    },
  });

  const patientForm = useForm<PatientFormData>({
    defaultValues: {
      status: 'active',
    },
  });

  // Filtrar compromissos de hoje usando start_datetime
  const today = new Date();
  const todayAppointments = allAppointments.filter(apt => {
    // Tentar start_datetime primeiro, fallback para date
    if (apt.start_datetime) {
      return isToday(apt.start_datetime);
    }
    // Fallback para compatibilidade com dados antigos
    return apt.date === today.toISOString().split('T')[0];
  });

  // Estatísticas
  const activePatients = patients.filter(p => p.status === 'active').length;
  const confirmedToday = todayAppointments.filter(apt => apt.status === 'confirmed').length;
  const totalVisits = patients.reduce((sum, p) => sum + p.total_visits, 0);

  // Submit handlers
  const onSubmitAppointment = async (data: AppointmentFormData) => {
    if (!profile?.organization_id) {
      toast.error('Erro: organização não identificada');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        start_date: data.start_date,
        start_time: data.start_time,
        end_date: data.end_date,
        end_time: data.end_time,
        patient_id: data.patient_id,
        patient_name: patients.find(p => p.id === data.patient_id)?.name || '',
        type: data.type,
        status: 'pending',
        observations: data.observations,
        organization_id: profile.organization_id,
      });

      toast.success('Compromisso criado com sucesso!');
      setIsAppointmentModalOpen(false);
      appointmentForm.reset();
    } catch (error: any) {
      console.error('Erro ao criar compromisso:', error);
      toast.error(error.message || 'Erro ao criar compromisso');
    }
  };

  const onSubmitPatient = async (data: PatientFormData) => {
    if (!profile?.organization_id) {
      toast.error('Erro: organização não identificada');
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
      setIsPatientModalOpen(false);
      patientForm.reset();
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error);
      toast.error(error.message || 'Erro ao cadastrar paciente');
    }
  };

  const isLoading = loadingAppointments || loadingPatients;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-2">
          Bem-vindo, {profile?.full_name || 'Usuário'}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Seu dia está organizado. Aqui está sua visão geral.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Compromissos Hoje"
          value={todayAppointments.length}
          change={`${confirmedToday} confirmados`}
          changeType="positive"
          icon={Calendar}
          description="Agenda do dia"
        />
        <KPICard
          title="Pacientes Totais"
          value={patients.length}
          change={`${activePatients} ativos`}
          changeType="positive"
          icon={Users}
          description="Base de pacientes"
        />
        <KPICard
          title="Total de Visitas"
          value={totalVisits}
          change="Histórico completo"
          changeType="neutral"
          icon={Clock}
          description="Atendimentos realizados"
        />
        <KPICard
          title="Taxa de Confirmação"
          value={todayAppointments.length > 0 ? `${Math.round((confirmedToday / todayAppointments.length) * 100)}%` : "0%"}
          change="Hoje"
          changeType="positive"
          icon={CheckCircle2}
          description="Compromissos confirmados"
        />
        <KPICard
          title="Próximos 7 Dias"
          value={allAppointments.filter(apt => {
            const aptDate = apt.start_datetime ? new Date(apt.start_datetime) : new Date(apt.date);
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            return aptDate >= today && aptDate <= nextWeek;
          }).length}
          change="Agendados"
          changeType="neutral"
          icon={TrendingUp}
          description="Próxima semana"
        />
        <KPICard
          title="Status Geral"
          value="Ótimo"
          change="Sistema operacional"
          changeType="positive"
          icon={Activity}
          description="Tudo funcionando"
        />
      </div>

      {/* Today's Schedule */}
      <Card className="card-luxury p-4 md:p-6 lg:p-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="mb-4 md:mb-6">
          <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-2">
            Agenda de Hoje
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground mb-2">Nenhum compromisso hoje</p>
            <p className="text-sm text-muted-foreground">Aproveite para descansar ou planejar sua semana</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {todayAppointments
              .sort((a, b) => {
                // Ordenar por start_datetime ou fallback para time
                const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : a.time;
                const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : b.time;
                return timeA > timeB ? 1 : -1;
              })
              .map((appointment, index) => {
                // Usar start_datetime se disponível, senão usar time (compatibilidade)
                const displayTime = appointment.start_datetime 
                  ? formatTime(appointment.start_datetime)
                  : appointment.time;
                const [hours, minutes] = displayTime.split(":");
                
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 rounded-lg border border-border/50 bg-background p-3 md:p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-lg"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-accent/10">
                      <span className="text-xs font-medium text-accent">{hours}</span>
                      <span className="text-xl md:text-2xl font-bold text-accent">{minutes}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{appointment.patient_name}</h4>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                    </div>
                    <div
                      className={`self-start sm:self-center rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs font-medium whitespace-nowrap ${
                        appointment.status === "confirmed"
                          ? "bg-success/10 text-success"
                          : appointment.status === "pending"
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {appointment.status === "confirmed" ? "Confirmado" : appointment.status === "pending" ? "Pendente" : "Concluído"}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <button 
          onClick={() => setIsTodayModalOpen(true)}
          className="card-luxury group p-5 md:p-6 text-left transition-all hover-glow"
        >
          <div className="mb-3 md:mb-4 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          </div>
          <h3 className="mb-1.5 md:mb-2 font-semibold text-foreground">Hoje</h3>
          <p className="text-sm text-muted-foreground">Ver compromissos de hoje</p>
        </button>

        <button 
          onClick={() => setIsAppointmentModalOpen(true)}
          className="card-luxury group p-5 md:p-6 text-left transition-all hover-glow"
        >
          <div className="mb-3 md:mb-4 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
            <Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          </div>
          <h3 className="mb-1.5 md:mb-2 font-semibold text-foreground">Novo Compromisso</h3>
          <p className="text-sm text-muted-foreground">Agende um novo atendimento</p>
        </button>

        <button 
          onClick={() => setIsPatientModalOpen(true)}
          className="card-luxury group p-5 md:p-6 text-left transition-all hover-glow"
        >
          <div className="mb-3 md:mb-4 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          </div>
          <h3 className="mb-1.5 md:mb-2 font-semibold text-foreground">Adicionar Paciente</h3>
          <p className="text-sm text-muted-foreground">Cadastre um novo paciente</p>
        </button>

        <button 
          onClick={() => setIsReportsModalOpen(true)}
          className="card-luxury group p-5 md:p-6 text-left transition-all hover-glow"
        >
          <div className="mb-3 md:mb-4 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
            <Activity className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          </div>
          <h3 className="mb-1.5 md:mb-2 font-semibold text-foreground">Ver Relatórios</h3>
          <p className="text-sm text-muted-foreground">Analise suas métricas</p>
        </button>
      </div>

      {/* Modal: Compromissos de Hoje */}
      <Dialog open={isTodayModalOpen} onOpenChange={setIsTodayModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compromissos de Hoje</DialogTitle>
            <DialogDescription>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhum compromisso para hoje</p>
              </div>
            ) : (
              todayAppointments
                .sort((a, b) => {
                  const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : a.time;
                  const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : b.time;
                  return timeA > timeB ? 1 : -1;
                })
                .map((appointment) => {
                  const displayTime = appointment.start_datetime 
                    ? formatTime(appointment.start_datetime)
                    : appointment.time;
                  
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-4 rounded-lg border border-border/50 bg-background p-4"
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-accent/10">
                        <span className="text-xl font-bold text-accent">{displayTime}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{appointment.patient_name}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.type}</p>
                      </div>
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          appointment.status === "confirmed"
                            ? "bg-success/10 text-success"
                            : appointment.status === "pending"
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {appointment.status === "confirmed" ? "Confirmado" : appointment.status === "pending" ? "Pendente" : "Concluído"}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Compromisso */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Compromisso</DialogTitle>
            <DialogDescription>
              Agende um novo atendimento para um paciente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={appointmentForm.handleSubmit(onSubmitAppointment)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient_id">Paciente *</Label>
              <Select
                value={appointmentForm.watch('patient_id')}
                onValueChange={(value) => appointmentForm.setValue('patient_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name || 'Sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appointmentForm.formState.errors.patient_id && (
                <p className="text-xs text-red-500">{appointmentForm.formState.errors.patient_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...appointmentForm.register("start_date", { required: "Data é obrigatória" })}
                />
                {appointmentForm.formState.errors.start_date && (
                  <p className="text-xs text-red-500">{appointmentForm.formState.errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Hora Início *</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...appointmentForm.register("start_time", { required: "Hora é obrigatória" })}
                />
                {appointmentForm.formState.errors.start_time && (
                  <p className="text-xs text-red-500">{appointmentForm.formState.errors.start_time.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end_date">Data Fim *</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...appointmentForm.register("end_date", { required: "Data é obrigatória" })}
                />
                {appointmentForm.formState.errors.end_date && (
                  <p className="text-xs text-red-500">{appointmentForm.formState.errors.end_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Hora Fim *</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...appointmentForm.register("end_time", { required: "Hora é obrigatória" })}
                />
                {appointmentForm.formState.errors.end_time && (
                  <p className="text-xs text-red-500">{appointmentForm.formState.errors.end_time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Atendimento *</Label>
              <Input
                id="type"
                placeholder="Ex: Consulta, Retorno, Exame"
                {...appointmentForm.register("type", { required: "Tipo é obrigatório" })}
              />
              {appointmentForm.formState.errors.type && (
                <p className="text-xs text-red-500">{appointmentForm.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Observações adicionais"
                {...appointmentForm.register("observations")}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAppointmentModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createAppointment.isPending}>
                {createAppointment.isPending ? 'Criando...' : 'Criar Compromisso'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Adicionar Paciente */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>
              Adicione um novo paciente ao seu sistema de gestão.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={patientForm.handleSubmit(onSubmitPatient)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Ex: João da Silva"
                {...patientForm.register("name", { required: "Nome é obrigatório" })}
              />
              {patientForm.formState.errors.name && (
                <p className="text-xs text-red-500">{patientForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                {...patientForm.register("email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                {...patientForm.register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={patientForm.watch('status')}
                onValueChange={(value: 'active' | 'inactive') => patientForm.setValue('status', value)}
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
                {...patientForm.register("observations")}
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPatientModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createPatient.isPending}>
                {createPatient.isPending ? 'Criando...' : 'Adicionar Paciente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver Relatórios */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Relatórios e Estatísticas</DialogTitle>
            <DialogDescription>
              Visão geral do seu consultório
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold text-sm">Total de Pacientes</h4>
                </div>
                <p className="text-2xl font-bold text-foreground">{patients.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activePatients} ativos
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold text-sm">Compromissos Hoje</h4>
                </div>
                <p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {confirmedToday} confirmados
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold text-sm">Total de Visitas</h4>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Histórico completo
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold text-sm">Taxa de Confirmação</h4>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {todayAppointments.length > 0 ? `${Math.round((confirmedToday / todayAppointments.length) * 100)}%` : "0%"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hoje
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-background p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h4 className="font-semibold text-sm">Próximos 7 Dias</h4>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {allAppointments.filter(apt => {
                  const aptDate = apt.start_datetime ? new Date(apt.start_datetime) : new Date(apt.date);
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  return aptDate >= today && aptDate <= nextWeek;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agendamentos programados
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
