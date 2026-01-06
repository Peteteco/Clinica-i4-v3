import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Plus, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAppointments, useCreateAppointment } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { toast } from "sonner";
import { toSaoPauloISO } from "@/lib/dateUtils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type ViewMode = "day" | "week" | "month";

interface DaySchedule {
  inicio_trabalho: string;
  fim_trabalho: string;
  inicio_almoco: string;
  fim_almoco: string;
  is_active: boolean;
}

interface WorkSchedule {
  id?: string;
  domingo: DaySchedule;
  segunda: DaySchedule;
  terca: DaySchedule;
  quarta: DaySchedule;
  quinta: DaySchedule;
  sexta: DaySchedule;
  sabado: DaySchedule;
  consultation_duration: number; // Duração da consulta em minutos (15-240)
}

const diasDaSemana = [
  { key: 'domingo', nome: "Domingo" },
  { key: 'segunda', nome: "Segunda-feira" },
  { key: 'terca', nome: "Terça-feira" },
  { key: 'quarta', nome: "Quarta-feira" },
  { key: 'quinta', nome: "Quinta-feira" },
  { key: 'sexta', nome: "Sexta-feira" },
  { key: 'sabado', nome: "Sábado" },
] as const;

type DayKey = typeof diasDaSemana[number]['key'];

export default function Agenda() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWorkScheduleModalOpen, setIsWorkScheduleModalOpen] = useState(false);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    patient_id: "",
    patient_name: "",
    type: "",
    status: "pending" as "confirmed" | "pending" | "completed",
    observations: ""
  });

  // Buscar compromissos e pacientes
  const { data: allAppointments = [], isLoading, refetch } = useAppointments();
  const { data: patients = [] } = usePatients();
  const createAppointment = useCreateAppointment();
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { profile } = useAuth();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Carregar horários de trabalho quando o modal abrir
  useEffect(() => {
    if (isWorkScheduleModalOpen) {
      loadWorkSchedules();
    }
  }, [isWorkScheduleModalOpen, profile?.id, organizationId]);

  const loadWorkSchedules = async () => {
    if (!profile?.id || !organizationId) {
      setIsLoadingSchedules(false);
      return;
    }

    try {
      setIsLoadingSchedules(true);
      console.log('🔍 Carregando horários do banco...');
      
      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('user_id', profile.id)
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
        throw error;
      }

      console.log('📊 Dados do banco:', data);

      if (data) {
        // ✅ TEM DADOS NO BANCO: Converter estrutura do banco para UI
        const schedule: WorkSchedule = {
          id: data.id,
          domingo: {
            is_active: data.domingo_is_active,
            inicio_trabalho: data.domingo_inicio_trabalho || "08:00",
            fim_trabalho: data.domingo_fim_trabalho || "18:00",
            inicio_almoco: data.domingo_inicio_almoco || "12:00",
            fim_almoco: data.domingo_fim_almoco || "13:00",
          },
          segunda: {
            is_active: data.segunda_is_active,
            inicio_trabalho: data.segunda_inicio_trabalho || "08:00",
            fim_trabalho: data.segunda_fim_trabalho || "18:00",
            inicio_almoco: data.segunda_inicio_almoco || "12:00",
            fim_almoco: data.segunda_fim_almoco || "13:00",
          },
          terca: {
            is_active: data.terca_is_active,
            inicio_trabalho: data.terca_inicio_trabalho || "08:00",
            fim_trabalho: data.terca_fim_trabalho || "18:00",
            inicio_almoco: data.terca_inicio_almoco || "12:00",
            fim_almoco: data.terca_fim_almoco || "13:00",
          },
          quarta: {
            is_active: data.quarta_is_active,
            inicio_trabalho: data.quarta_inicio_trabalho || "08:00",
            fim_trabalho: data.quarta_fim_trabalho || "18:00",
            inicio_almoco: data.quarta_inicio_almoco || "12:00",
            fim_almoco: data.quarta_fim_almoco || "13:00",
          },
          quinta: {
            is_active: data.quinta_is_active,
            inicio_trabalho: data.quinta_inicio_trabalho || "08:00",
            fim_trabalho: data.quinta_fim_trabalho || "18:00",
            inicio_almoco: data.quinta_inicio_almoco || "12:00",
            fim_almoco: data.quinta_fim_almoco || "13:00",
          },
          sexta: {
            is_active: data.sexta_is_active,
            inicio_trabalho: data.sexta_inicio_trabalho || "08:00",
            fim_trabalho: data.sexta_fim_trabalho || "18:00",
            inicio_almoco: data.sexta_inicio_almoco || "12:00",
            fim_almoco: data.sexta_fim_almoco || "13:00",
          },
          sabado: {
            is_active: data.sabado_is_active,
            inicio_trabalho: data.sabado_inicio_trabalho || "08:00",
            fim_trabalho: data.sabado_fim_trabalho || "18:00",
            inicio_almoco: data.sabado_inicio_almoco || "12:00",
            fim_almoco: data.sabado_fim_almoco || "13:00",
          },
          consultation_duration: data.consultation_duration || 30,
        };
        console.log('✅ Horários carregados do banco:', schedule);
        setWorkSchedule(schedule);
      } else {
        // ❌ NÃO TEM DADOS NO BANCO: Criar horários padrão (segunda a sexta)
        console.log('⚠️ Nenhum horário no banco, criando padrão...');
        const defaultSchedule: WorkSchedule = {
          domingo: { is_active: false, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          segunda: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          terca: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          quarta: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          quinta: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          sexta: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          sabado: { is_active: false, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
          consultation_duration: 30,
        };
        console.log('📝 Horários padrão criados:', defaultSchedule);
        setWorkSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários de trabalho');
      
      // Em caso de erro, criar horários padrão
      const defaultSchedule: WorkSchedule = {
        domingo: { is_active: false, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        segunda: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        terca: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        quarta: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        quinta: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        sexta: { is_active: true, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        sabado: { is_active: false, inicio_trabalho: "08:00", fim_trabalho: "18:00", inicio_almoco: "12:00", fim_almoco: "13:00" },
        consultation_duration: 30,
      };
      setWorkSchedule(defaultSchedule);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const saveWorkSchedules = async () => {
    if (!profile?.id || !organizationId || !workSchedule) {
      toast.error('Erro: usuário não identificado');
      return;
    }

    try {
      toast.loading('Salvando horários...', { id: 'save-schedules' });

      // Converter estrutura da UI para banco
      const dataToSave = {
        organization_id: organizationId,
        user_id: profile.id,
        // Domingo
        domingo_is_active: workSchedule.domingo.is_active,
        domingo_inicio_trabalho: workSchedule.domingo.is_active ? workSchedule.domingo.inicio_trabalho : null,
        domingo_fim_trabalho: workSchedule.domingo.is_active ? workSchedule.domingo.fim_trabalho : null,
        domingo_inicio_almoco: workSchedule.domingo.is_active ? workSchedule.domingo.inicio_almoco : null,
        domingo_fim_almoco: workSchedule.domingo.is_active ? workSchedule.domingo.fim_almoco : null,
        // Segunda
        segunda_is_active: workSchedule.segunda.is_active,
        segunda_inicio_trabalho: workSchedule.segunda.is_active ? workSchedule.segunda.inicio_trabalho : null,
        segunda_fim_trabalho: workSchedule.segunda.is_active ? workSchedule.segunda.fim_trabalho : null,
        segunda_inicio_almoco: workSchedule.segunda.is_active ? workSchedule.segunda.inicio_almoco : null,
        segunda_fim_almoco: workSchedule.segunda.is_active ? workSchedule.segunda.fim_almoco : null,
        // Terça
        terca_is_active: workSchedule.terca.is_active,
        terca_inicio_trabalho: workSchedule.terca.is_active ? workSchedule.terca.inicio_trabalho : null,
        terca_fim_trabalho: workSchedule.terca.is_active ? workSchedule.terca.fim_trabalho : null,
        terca_inicio_almoco: workSchedule.terca.is_active ? workSchedule.terca.inicio_almoco : null,
        terca_fim_almoco: workSchedule.terca.is_active ? workSchedule.terca.fim_almoco : null,
        // Quarta
        quarta_is_active: workSchedule.quarta.is_active,
        quarta_inicio_trabalho: workSchedule.quarta.is_active ? workSchedule.quarta.inicio_trabalho : null,
        quarta_fim_trabalho: workSchedule.quarta.is_active ? workSchedule.quarta.fim_trabalho : null,
        quarta_inicio_almoco: workSchedule.quarta.is_active ? workSchedule.quarta.inicio_almoco : null,
        quarta_fim_almoco: workSchedule.quarta.is_active ? workSchedule.quarta.fim_almoco : null,
        // Quinta
        quinta_is_active: workSchedule.quinta.is_active,
        quinta_inicio_trabalho: workSchedule.quinta.is_active ? workSchedule.quinta.inicio_trabalho : null,
        quinta_fim_trabalho: workSchedule.quinta.is_active ? workSchedule.quinta.fim_trabalho : null,
        quinta_inicio_almoco: workSchedule.quinta.is_active ? workSchedule.quinta.inicio_almoco : null,
        quinta_fim_almoco: workSchedule.quinta.is_active ? workSchedule.quinta.fim_almoco : null,
        // Sexta
        sexta_is_active: workSchedule.sexta.is_active,
        sexta_inicio_trabalho: workSchedule.sexta.is_active ? workSchedule.sexta.inicio_trabalho : null,
        sexta_fim_trabalho: workSchedule.sexta.is_active ? workSchedule.sexta.fim_trabalho : null,
        sexta_inicio_almoco: workSchedule.sexta.is_active ? workSchedule.sexta.inicio_almoco : null,
        sexta_fim_almoco: workSchedule.sexta.is_active ? workSchedule.sexta.fim_almoco : null,
        // Sábado
        sabado_is_active: workSchedule.sabado.is_active,
        sabado_inicio_trabalho: workSchedule.sabado.is_active ? workSchedule.sabado.inicio_trabalho : null,
        sabado_fim_trabalho: workSchedule.sabado.is_active ? workSchedule.sabado.fim_trabalho : null,
        sabado_inicio_almoco: workSchedule.sabado.is_active ? workSchedule.sabado.inicio_almoco : null,
        sabado_fim_almoco: workSchedule.sabado.is_active ? workSchedule.sabado.fim_almoco : null,
        // Duração da consulta
        consultation_duration: workSchedule.consultation_duration,
      };

      console.log('💾 Salvando no banco:', dataToSave);

      // Upsert: insere se não existe, atualiza se existe
      const { error } = await supabase
        .from('work_schedules')
        .upsert(dataToSave, {
          onConflict: 'organization_id,user_id'
        });

      if (error) throw error;

      toast.success('Horários salvos com sucesso!', { id: 'save-schedules' });
      setIsWorkScheduleModalOpen(false);
      loadWorkSchedules();
    } catch (error) {
      console.error('❌ Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários', { id: 'save-schedules' });
    }
  };

  const updateSchedule = (dayKey: DayKey, field: keyof DaySchedule, value: any) => {
    console.log('🔄 Atualizando horário:', { dayKey, field, value });
    setWorkSchedule(prev => {
      if (!prev) return prev;
      console.log('📋 Estado anterior:', prev);
      const updated = {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          [field]: value
        }
      };
      console.log('📋 Estado atualizado:', updated);
      return updated;
    });
  };

  // Função para sincronizar agenda com webhook
  const syncAgendaWithWebhook = async () => {
    try {
      console.log('🔄 Iniciando sincronização com webhook...');
      
      // Formatar eventos para enviar ao webhook
      const eventsToSync = allAppointments.map(apt => {
        const patient = patients.find(p => p.id === apt.patient_id);
        
        // Usar start_datetime/end_datetime se disponível, senão criar a partir de date/time
        const startDateTime = apt.start_datetime || `${apt.date}T${apt.time}:00-03:00`;
        const endDateTime = apt.end_datetime || `${apt.date}T${apt.time}:00-03:00`;
        
        return {
          id: apt.id,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          patient_name: apt.patient_name,
          patient_email: patient?.email || '',
          type: apt.type,
          status: apt.status,
          observations: apt.observations || apt.notes || ''
        };
      });

      console.log(`📤 Enviando ${eventsToSync.length} eventos para conferência...`);

      // Enviar para webhook de conferência
      const response = await fetch('https://n8n.main.iseed.cloud/webhook/labz-conferir-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSync,
          total: eventsToSync.length,
          synced_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sincronização concluída:', result);
        return result;
      } else {
        console.warn('⚠️ Erro na sincronização:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar agenda:', error);
    }
  };

  // Função para atualizar dados
  const handleRefresh = async () => {
    toast.loading("Atualizando agenda...", { id: "refresh" });
    try {
      // 1. Recarregar dados do banco
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['patients'] })
      ]);
      
      // 2. Sincronizar com webhook (não bloqueia)
      syncAgendaWithWebhook();
      
      toast.success("Agenda atualizada!", { id: "refresh" });
    } catch (error) {
      toast.error("Erro ao atualizar", { id: "refresh" });
    }
  };

  // Funções de navegação
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obter dias da semana atual
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  // Obter dias do mês
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  // Converter appointment do banco para formato local
  const parseAppointment = (apt: any) => {
    // Usar start_datetime se disponível, senão usar date+time (compatibilidade)
    let date: Date;
    let time: string;
    
    if (apt.start_datetime) {
      // Extrair data/hora LITERAL do banco, sem conversão de timezone
      const match = apt.start_datetime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
        time = `${hours}:${minutes}`;
      } else {
        // Fallback
        date = new Date(apt.start_datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;
      }
    } else {
      // Fallback para dados antigos
      const [hours, minutes] = apt.time.split(':');
      date = new Date(apt.date);
      date.setHours(parseInt(hours), parseInt(minutes));
      time = apt.time;
    }
    
    return {
      id: apt.id,
      date: date,
      time: time,
      patient: apt.patient_name,
      type: apt.type,
      status: apt.status as "confirmed" | "pending" | "completed"
    };
  };

  // Verificar se um dia tem compromissos
  const getAppointmentsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return allAppointments
      .map(parseAppointment)
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getFullYear() === year &&
               aptDate.getMonth() === month &&
               aptDate.getDate() === day;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Obter compromissos para uma data específica
  const getAppointmentsForDate = (date: Date) => {
    return allAppointments
      .map(parseAppointment)
      .filter(apt => {
        return apt.date.getFullYear() === date.getFullYear() &&
               apt.date.getMonth() === date.getMonth() &&
               apt.date.getDate() === date.getDate();
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Obter compromissos em um horário específico
  const getAppointmentsForHour = (date: Date, hour: number) => {
    return getAppointmentsForDate(date).filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getHours() === hour;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  const weekDays = getWeekDays();
  const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const getSelectedDayName = () => {
    if (!selectedDay) return "";
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const handlePrevious = () => {
    if (viewMode === "day") goToPreviousDay();
    else if (viewMode === "week") goToPreviousWeek();
    else goToPreviousMonth();
  };

  const handleNext = () => {
    if (viewMode === "day") goToNextDay();
    else if (viewMode === "week") goToNextWeek();
    else goToNextMonth();
  };

  const getHeaderTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } else if (viewMode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()} - ${end.getDate()} de ${currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  // Abrir modal de criação com data pré-preenchida
  const handleOpenCreateModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setFormData({
      start_date: todayStr,
      start_time: "09:00",
      end_date: todayStr,
      end_time: "10:00",
      patient_id: "",
      patient_name: "",
      type: "",
      status: "pending",
      observations: ""
    });
    setIsCreateModalOpen(true);
  };

  // Selecionar paciente
  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patient_id: patientId,
        patient_name: patient.name
      }));
    }
  };

  // Criar compromisso
  const handleCreateAppointment = async () => {
    // Validação
    if (!formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time || !formData.patient_id || !formData.type) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar se data/hora fim é maior que início
    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
    
    if (endDateTime <= startDateTime) {
      toast.error("Data/hora de fim deve ser posterior ao início");
      return;
    }

    try {
      // Converter para ISO8601 - duas versões:
      // 1. Para o banco (ajustado -3h para armazenar literal)
      const startISOForDB = toSaoPauloISO(formData.start_date, formData.start_time);
      const endISOForDB = toSaoPauloISO(formData.end_date, formData.end_time);
      
      // 2. Para o webhook (horário original)
      const startISOForWebhook = `${formData.start_date}T${formData.start_time}:00-03:00`;
      const endISOForWebhook = `${formData.end_date}T${formData.end_time}:00-03:00`;

      console.log('🕐 Horários digitados:', {
        start: `${formData.start_date} ${formData.start_time}`,
        end: `${formData.end_date} ${formData.end_time}`
      });
      
      console.log('🗄️ ISO8601 para banco (ajustado):', {
        startISO: startISOForDB,
        endISO: endISOForDB
      });
      
      console.log('🌐 ISO8601 para webhook (original):', {
        startISO: startISOForWebhook,
        endISO: endISOForWebhook
      });

      // Validar organization_id
      if (!organizationId) {
        toast.error("Erro: Organização não identificada");
        return;
      }

      // 1. Criar no banco de dados
      const newAppointment = await createAppointment.mutateAsync({
        organization_id: organizationId,
        date: formData.start_date,
        time: formData.start_time,
        start_datetime: startISOForDB,
        end_datetime: endISOForDB,
        patient_id: formData.patient_id,
        patient_name: formData.patient_name,
        type: formData.type,
        status: formData.status,
        observations: formData.observations || null
      });

      // 2. Enviar para webhook N8N
      try {
        const patient = patients.find(p => p.id === formData.patient_id);
        
        const webhookData = {
          id: newAppointment?.id,
          start_datetime: startISOForWebhook,
          end_datetime: endISOForWebhook,
          patient_id: formData.patient_id,
          patient_name: formData.patient_name,
          patient_email: patient?.email || '',
          patient_phone: patient?.phone || '',
          type: formData.type,
          status: formData.status,
          observations: formData.observations || '',
          created_at: new Date().toISOString()
        };

        await fetch('https://n8n.main.iseed.cloud/webhook/labz-criar-agenda', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        console.log('✅ Webhook disparado com sucesso');
        console.log('📤 Payload:', webhookData);
      } catch (webhookError) {
        console.warn('⚠️ Erro ao disparar webhook (compromisso foi criado):', webhookError);
      }

      toast.success("Compromisso criado com sucesso!");
      setIsCreateModalOpen(false);
      
      // Limpar formulário
      setFormData({
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        patient_id: "",
        patient_name: "",
        type: "",
        status: "pending",
        observations: ""
      });
    } catch (error) {
      console.error('Erro ao criar compromisso:', error);
      toast.error("Erro ao criar compromisso");
    }
  };

  // Sincronizar agenda quando carregar os dados
  useEffect(() => {
    const doSync = async () => {
      if (!isLoading && allAppointments.length > 0 && patients.length > 0) {
        // Pequeno delay para garantir que todos os dados carregaram
        await new Promise(resolve => setTimeout(resolve, 500));
        await syncAgendaWithWebhook();
      }
    };
    
    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, allAppointments.length, patients.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-5 p-4 md:p-6 lg:p-8 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-1">
            Agenda
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie sua agenda com precisão
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={goToToday}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-foreground transition-all hover:bg-secondary w-full sm:w-auto"
          >
            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Hoje
          </button>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isLoading && "animate-spin")} />
            Atualizar
          </button>
          <button 
            onClick={() => setIsWorkScheduleModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-foreground transition-all hover:bg-secondary w-full sm:w-auto"
          >
            <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Horários
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-accent-foreground transition-all hover:shadow-[0_0_40px_hsl(var(--accent)/0.4)] hover-scale w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Novo Evento
        </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 card-luxury p-2.5 md:p-3 animate-fade-in-up">
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-foreground text-xs md:text-sm min-w-[180px] md:min-w-[220px] text-center capitalize">
            {getHeaderTitle()}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 md:gap-1.5 rounded-lg bg-secondary p-0.5 md:p-1">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex-1 sm:flex-none rounded-md px-2.5 md:px-3 lg:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-medium capitalize transition-all duration-200",
                viewMode === mode
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* DAY VIEW - Grade de Horários */}
      {viewMode === "day" && (
        <div className="card-luxury p-3 md:p-4 lg:p-6 animate-fade-in-up overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              {hours.map((hour) => {
                const appointments = getAppointmentsForHour(currentDate, hour);
                return (
                  <div
                    key={hour}
                    className={cn(
                      "flex border-b border-border/30 min-h-[60px]",
                      hour === new Date().getHours() && currentDate.toDateString() === today.toDateString() && "bg-accent/5"
                    )}
                  >
                    <div className="w-16 md:w-20 shrink-0 pr-3 py-2 text-xs md:text-sm text-muted-foreground font-medium">
                      {formatHour(hour)}
                    </div>
                    <div className="flex-1 py-1 space-y-1">
                      {appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            "rounded-md p-2 text-xs md:text-sm border-l-4 transition-all hover:shadow-md cursor-pointer",
                            apt.status === "confirmed" 
                              ? "bg-accent/10 border-accent" 
                              : apt.status === "pending"
                              ? "bg-muted border-muted-foreground"
                              : "bg-success/10 border-success"
                          )}
                        >
                          <div className="font-semibold text-foreground">{apt.time} - {apt.patient}</div>
                          <div className="text-muted-foreground">{apt.type}</div>
            </div>
          ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW - 7 Colunas de Dias */}
      {viewMode === "week" && (
        <div className="card-luxury p-3 md:p-4 lg:p-6 animate-fade-in-up overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2 pb-2 border-b border-border">
                <div></div>
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === today.toDateString();
                  return (
                    <div key={i} className="text-center">
                      <div className={cn(
                        "text-xs font-medium text-muted-foreground uppercase",
                        isToday && "text-accent"
                      )}>
                        {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </div>
                      <div className={cn(
                        "text-lg md:text-xl font-bold",
                        isToday ? "text-accent" : "text-foreground"
                      )}>
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-0">
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 border-b border-border/20 min-h-[50px]">
                    <div className="text-xs text-muted-foreground font-medium py-1">
                      {formatHour(hour)}
                    </div>
                    {weekDays.map((day, i) => {
                      const appointments = getAppointmentsForHour(day, hour);
                      const isToday = day.toDateString() === today.toDateString();
                      const isCurrentHour = hour === new Date().getHours();

            return (
              <div
                key={i}
                className={cn(
                            "py-0.5 px-1",
                            isToday && isCurrentHour && "bg-accent/5"
                          )}
                        >
                          {appointments.map((apt) => (
                            <div
                              key={apt.id}
                              className={cn(
                                "rounded p-1 text-[10px] border-l-2 mb-1 truncate cursor-pointer hover:shadow-sm transition-all",
                                apt.status === "confirmed" 
                                  ? "bg-accent/10 border-accent" 
                                  : apt.status === "pending"
                                  ? "bg-muted border-muted-foreground"
                                  : "bg-success/10 border-success"
                              )}
                              title={`${apt.time} - ${apt.patient} - ${apt.type}`}
                            >
                              <div className="font-semibold truncate">{apt.patient}</div>
                              <div className="text-muted-foreground truncate">{apt.type}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
                      </div>
                    )}

      {/* MONTH VIEW - Calendário */}
      {viewMode === "month" && (
        <div className="card-luxury p-3 md:p-4 lg:p-6 animate-fade-in-up">
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 lg:gap-3">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-center pb-1 md:pb-2">
                <span className="text-caption text-[9px] md:text-[10px] lg:text-xs">{day}</span>
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12 md:h-14 lg:h-16" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && day === today.getDate();
              const dayAppointments = getAppointmentsForDay(day);
              const hasAppointments = dayAppointments.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative rounded-md md:rounded-lg border border-border/50 transition-all duration-200",
                    "h-10 sm:h-12 md:h-14 lg:h-16",
                    "flex flex-col items-center justify-center p-0.5 md:p-1",
                    "hover:border-accent/50 hover:shadow-md cursor-pointer",
                    "hover:bg-secondary/50",
                    isToday && "border-accent bg-accent/10 font-bold"
                  )}
                >
                  <div className={cn(
                    "text-[10px] md:text-xs lg:text-sm font-medium",
                    isToday ? "text-accent" : "text-foreground"
                  )}>
                    {day}
                  </div>
                  {hasAppointments && (
                    <div className="absolute bottom-0.5 md:bottom-1 flex gap-0.5">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div 
                          key={apt.id}
                          className={cn(
                            "h-0.5 w-0.5 md:h-1 md:w-1 rounded-full",
                            apt.status === "confirmed" ? "bg-accent" : "bg-muted-foreground/50"
                          )} 
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <span className="text-[6px] md:text-[8px] text-muted-foreground">+{dayAppointments.length - 3}</span>
                )}
              </div>
                  )}
                </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Modal de Eventos do Dia */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg md:text-xl capitalize">
              {getSelectedDayName()}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {selectedDayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum compromisso neste dia
                </p>
              </div>
            ) : (
        <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? "compromisso" : "compromissos"}
                </p>
                {selectedDayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg border border-border/50 bg-background p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">
                        {appointment.time}
                      </span>
                      <div
                        className={cn(
                          "ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium",
                          appointment.status === "confirmed"
                            ? "bg-success/10 text-success"
                            : appointment.status === "pending"
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {appointment.status === "confirmed" ? "Confirmado" : appointment.status === "pending" ? "Pendente" : "Concluído"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                <div>
                        <p className="text-sm font-medium text-foreground">
                          {appointment.patient}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.type}
                        </p>
                </div>
              </div>
            </div>
          ))}
        </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação de Evento */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg md:text-xl">
              Novo Compromisso
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Data e Hora Início */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    start_date: e.target.value,
                    end_date: e.target.value // Preencher data fim automaticamente
                  }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Hora Início *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Data e Hora Fim */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="end_date">Data Fim *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Hora Fim *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente *</Label>
              <Select value={formData.patient_id} onValueChange={handleSelectPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Atendimento *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consulta">Consulta</SelectItem>
                  <SelectItem value="Retorno">Retorno</SelectItem>
                  <SelectItem value="Tratamento">Tratamento</SelectItem>
                  <SelectItem value="Avaliação">Avaliação</SelectItem>
                  <SelectItem value="Exame">Exame</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Digite observações ou notas sobre o compromisso..."
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Opcional - Informações adicionais sobre o compromisso
              </p>
      </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={createAppointment.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {createAppointment.isPending ? "Criando..." : "Criar Compromisso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Horários de Trabalho */}
      <Dialog open={isWorkScheduleModalOpen} onOpenChange={setIsWorkScheduleModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg md:text-xl">
              Horários de Trabalho
            </DialogTitle>
            <DialogDescription>
              Configure seus horários de atendimento para cada dia da semana
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingSchedules ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : workSchedule ? (
              <>
                {/* Configuração de Duração da Consulta */}
                <div className="card-luxury p-4 space-y-3 border-accent/30 border-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold text-base">Duração da Consulta</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Defina o tempo padrão de cada consulta. O agente IA usará esse valor para calcular os horários disponíveis.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="consultation_duration">Tempo de cada consulta</Label>
                    <Select
                      value={String(workSchedule.consultation_duration)}
                      onValueChange={(value) => setWorkSchedule(prev => prev ? { ...prev, consultation_duration: Number(value) } : prev)}
                    >
                      <SelectTrigger id="consultation_duration" className="w-full">
                        <SelectValue placeholder="Selecione a duração" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="20">20 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="40">40 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="50">50 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1 hora e 30 min</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="180">3 horas</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Horários por Dia da Semana */}
                {diasDaSemana.map((dia) => {
                const daySchedule = workSchedule[dia.key];

                return (
                  <div key={dia.key} className="card-luxury p-4 space-y-3">
                    {/* Header do Dia */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{dia.nome}</h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`working-${dia.key}`} className="text-sm">
                          Trabalho neste dia
                        </Label>
                        <Switch
                          id={`working-${dia.key}`}
                          checked={daySchedule.is_active}
                          onCheckedChange={(checked) =>
                            updateSchedule(dia.key, 'is_active', checked)
                          }
                        />
                      </div>
                    </div>

                    {/* Campos de Horário (só aparecem se is_active = true) */}
                    {daySchedule.is_active && (
                      <div className="space-y-3 animate-fade-in">
                        {/* Horário de Trabalho */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`inicio-${dia.key}`} className="text-sm">
                              Início do Expediente *
                            </Label>
                            <Input
                              id={`inicio-${dia.key}`}
                              type="time"
                              value={daySchedule.inicio_trabalho}
                              onChange={(e) =>
                                updateSchedule(dia.key, 'inicio_trabalho', e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`fim-${dia.key}`} className="text-sm">
                              Fim do Expediente *
                            </Label>
                            <Input
                              id={`fim-${dia.key}`}
                              type="time"
                              value={daySchedule.fim_trabalho}
                              onChange={(e) =>
                                updateSchedule(dia.key, 'fim_trabalho', e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Horário de Almoço */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`almoco-inicio-${dia.key}`} className="text-sm">
                              Início do Almoço
                            </Label>
                            <Input
                              id={`almoco-inicio-${dia.key}`}
                              type="time"
                              value={daySchedule.inicio_almoco}
                              onChange={(e) =>
                                updateSchedule(dia.key, 'inicio_almoco', e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`almoco-fim-${dia.key}`} className="text-sm">
                              Fim do Almoço
                            </Label>
                            <Input
                              id={`almoco-fim-${dia.key}`}
                              type="time"
                              value={daySchedule.fim_almoco}
                              onChange={(e) =>
                                updateSchedule(dia.key, 'fim_almoco', e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Erro ao carregar horários
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveWorkSchedules} disabled={isLoadingSchedules}>
              Salvar Horários
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
