import { useState, useEffect } from "react";
import { Bot, Sparkles, Save, Loader2, Edit, X, Clock, MessageSquare, Smile, Plus, Trash2, Bell, FileQuestion, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AgentConfig {
  id?: string;
  agent_name: string;
  personality: string;
  pause_duration_seconds: number;
  customer_pause_duration_seconds: number;
  greeting_message: string;
  closing_message: string;
  openai_api_key?: string | null;
  reminder_1_minutes: number;
  reminder_2_minutes: number;
  reminder_3_minutes: number;
  follow_up_1_minutes: number;
  follow_up_2_minutes: number;
  follow_up_3_minutes: number;
  qualification_questions: string[];
}

const personalityLabels: Record<string, string> = {
  profissional: "Profissional",
  amigavel: "Amigável",
  formal: "Formal",
  descontraido: "Descontraído",
};

export default function AgentIA() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  
  // Estados para unidades de tempo dos lembretes
  const [reminder1Value, setReminder1Value] = useState(15);
  const [reminder1Unit, setReminder1Unit] = useState<'minutos' | 'horas' | 'dias'>('minutos');
  const [reminder2Value, setReminder2Value] = useState(1);
  const [reminder2Unit, setReminder2Unit] = useState<'minutos' | 'horas' | 'dias'>('horas');
  const [reminder3Value, setReminder3Value] = useState(1);
  const [reminder3Unit, setReminder3Unit] = useState<'minutos' | 'horas' | 'dias'>('dias');
  
  // Estados para unidades de tempo dos follow ups
  const [followUp1Value, setFollowUp1Value] = useState(1);
  const [followUp1Unit, setFollowUp1Unit] = useState<'minutos' | 'horas' | 'dias'>('horas');
  const [followUp2Value, setFollowUp2Value] = useState(1);
  const [followUp2Unit, setFollowUp2Unit] = useState<'minutos' | 'horas' | 'dias'>('dias');
  const [followUp3Value, setFollowUp3Value] = useState(3);
  const [followUp3Unit, setFollowUp3Unit] = useState<'minutos' | 'horas' | 'dias'>('dias');
  const [config, setConfig] = useState<AgentConfig>({
    agent_name: "Assistente Virtual",
    personality: "profissional",
    pause_duration_seconds: 1800, // 30 minutos em segundos
    customer_pause_duration_seconds: 300, // 5 minutos em segundos
    greeting_message: "Olá! Sou o assistente virtual da clínica. Como posso ajudá-lo hoje?",
    closing_message: "Foi um prazer atendê-lo! Se precisar de algo mais, estou à disposição.",
    openai_api_key: null,
    reminder_1_minutes: 15,
    reminder_2_minutes: 60,
    reminder_3_minutes: 1440,
    follow_up_1_minutes: 60,
    follow_up_2_minutes: 1440,
    follow_up_3_minutes: 4320,
    qualification_questions: [],
  });
  const [editConfig, setEditConfig] = useState<AgentConfig>(config);

  useEffect(() => {
    loadConfig();
    loadTotalTokens();
  }, [profile?.organization_id]);

  // Funções auxiliares para converter segundos para minutos e vice-versa
  const secondsToMinutes = (seconds: number): number => {
    return Math.round(seconds / 60);
  };

  const minutesToSeconds = (minutes: number): number => {
    return minutes * 60;
  };

  // Funções auxiliares para converter unidades de tempo
  const minutesToUnit = (minutes: number, unit: 'minutos' | 'horas' | 'dias'): number => {
    switch (unit) {
      case 'minutos':
        return minutes;
      case 'horas':
        return Math.round(minutes / 60);
      case 'dias':
        return Math.round(minutes / (60 * 24));
      default:
        return minutes;
    }
  };

  const unitToMinutes = (value: number, unit: 'minutos' | 'horas' | 'dias'): number => {
    switch (unit) {
      case 'minutos':
        return value;
      case 'horas':
        return value * 60;
      case 'dias':
        return value * 60 * 24;
      default:
        return value;
    }
  };

  const formatReminderDisplay = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      const days = Math.round(minutes / 1440);
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
  };

  // Atualizar valores quando editConfig mudar
  useEffect(() => {
    if (isEditing) {
      // Detectar melhor unidade para cada lembrete
      const detectBestUnit = (minutes: number): 'minutos' | 'horas' | 'dias' => {
        if (minutes % 1440 === 0) return 'dias';
        if (minutes % 60 === 0) return 'horas';
        return 'minutos';
      };

      const unit1 = detectBestUnit(editConfig.reminder_1_minutes);
      const unit2 = detectBestUnit(editConfig.reminder_2_minutes);
      const unit3 = detectBestUnit(editConfig.reminder_3_minutes);

      setReminder1Unit(unit1);
      setReminder1Value(minutesToUnit(editConfig.reminder_1_minutes, unit1));
      
      setReminder2Unit(unit2);
      setReminder2Value(minutesToUnit(editConfig.reminder_2_minutes, unit2));
      
      setReminder3Unit(unit3);
      setReminder3Value(minutesToUnit(editConfig.reminder_3_minutes, unit3));

      // Atualizar follow ups
      const followUnit1 = detectBestUnit(editConfig.follow_up_1_minutes);
      const followUnit2 = detectBestUnit(editConfig.follow_up_2_minutes);
      const followUnit3 = detectBestUnit(editConfig.follow_up_3_minutes);

      setFollowUp1Unit(followUnit1);
      setFollowUp1Value(minutesToUnit(editConfig.follow_up_1_minutes, followUnit1));
      
      setFollowUp2Unit(followUnit2);
      setFollowUp2Value(minutesToUnit(editConfig.follow_up_2_minutes, followUnit2));
      
      setFollowUp3Unit(followUnit3);
      setFollowUp3Value(minutesToUnit(editConfig.follow_up_3_minutes, followUnit3));
    }
  }, [isEditing, editConfig.reminder_1_minutes, editConfig.reminder_2_minutes, editConfig.reminder_3_minutes, editConfig.follow_up_1_minutes, editConfig.follow_up_2_minutes, editConfig.follow_up_3_minutes]);

  const loadConfig = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoading(true);
      
      // Buscar configurações da organização
      const { data, error } = await supabase
        .from("agent_ia_config")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Buscar API Key global
      const { data: globalSettings } = await supabase
        .from("global_settings")
        .select("openai_api_key")
        .single();

      if (data) {
        // Combinar dados da organização com API Key global
        const configWithGlobalKey = {
          ...data,
          openai_api_key: globalSettings?.openai_api_key || null,
        };
        setConfig(configWithGlobalKey);
        setEditConfig(configWithGlobalKey);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTotalTokens = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoadingTokens(true);
      
      // Buscar todos os registros da organização
      const { data, error } = await supabase
        .from("token_usage")
        .select("total_tokens, cost_reais")
        .eq("organization_id", profile.organization_id);

      if (error) throw error;

      // Somar todos os tokens
      const totalTks = data?.reduce((sum, record) => sum + (record.total_tokens || 0), 0) || 0;
      setTotalTokens(totalTks);

      // Somar todos os custos em reais
      const totalCst = data?.reduce((sum, record) => sum + (record.cost_reais || 0), 0) || 0;
      setTotalCost(totalCst);
    } catch (error) {
      console.error("Erro ao carregar tokens:", error);
      // Não mostrar erro ao usuário, apenas log
      setTotalTokens(0);
      setTotalCost(0);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const handleEdit = () => {
    setEditConfig(config);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditConfig(config);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile?.organization_id) {
      toast.error("Erro: organização não identificada");
      return;
    }

    try {
      setIsSaving(true);

      const configData = {
        organization_id: profile.organization_id,
        agent_name: editConfig.agent_name,
        personality: editConfig.personality,
        pause_duration_seconds: editConfig.pause_duration_seconds,
        customer_pause_duration_seconds: editConfig.customer_pause_duration_seconds,
        greeting_message: editConfig.greeting_message,
        closing_message: editConfig.closing_message,
        // openai_api_key não é salvo aqui - apenas super admin pode configurar
        reminder_1_minutes: editConfig.reminder_1_minutes,
        reminder_2_minutes: editConfig.reminder_2_minutes,
        reminder_3_minutes: editConfig.reminder_3_minutes,
        follow_up_1_minutes: editConfig.follow_up_1_minutes,
        follow_up_2_minutes: editConfig.follow_up_2_minutes,
        follow_up_3_minutes: editConfig.follow_up_3_minutes,
        qualification_questions: editConfig.qualification_questions,
      } as any;

      if (config.id) {
        const { error } = await supabase
          .from("agent_ia_config")
          // @ts-ignore
          .update(configData)
          .eq("id", config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("agent_ia_config")
          // @ts-ignore
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setConfig(data);
          setEditConfig(data);
          setIsEditing(false);
          toast.success("Configurações salvas com sucesso!");
          return;
        }
      }

      setConfig(editConfig);
      setIsEditing(false);
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Bot className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Agent IA
              </h1>
            </div>
          </div>
          <Badge className="bg-accent/10 text-accent border-accent/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <p className="text-base md:text-lg text-muted-foreground">
          {isEditing ? "Editando configurações do assistente virtual" : "Configurações do seu assistente virtual"}
        </p>
      </div>

      {/* Configurações - Modo Visualização */}
      {!isEditing ? (
        <>
          <Card className="card-luxury p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" />
                Configurações do Atendimento
              </h2>
              <Button onClick={handleEdit} variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Nome do Agent */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Bot className="h-4 w-4" />
                  <span className="font-medium">Nome do Agent</span>
                </div>
                <p className="text-lg font-semibold text-foreground pl-6">
                  {config.agent_name}
                </p>
              </div>

              {/* Personalidade */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Smile className="h-4 w-4" />
                  <span className="font-medium">Personalidade</span>
                </div>
                <p className="text-lg font-semibold text-foreground pl-6">
                  {personalityLabels[config.personality] || config.personality}
                </p>
              </div>

              {/* Tempo de Pausa */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Tempo de Pausa</span>
                </div>
                <p className="text-lg font-semibold text-foreground pl-6">
                  {secondsToMinutes(config.pause_duration_seconds)} minutos
                </p>
                <p className="text-xs text-muted-foreground pl-6">
                  Pausa quando atendente humano assume
                </p>
              </div>

              {/* Pausa por Solicitação do Cliente */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Pausa por Solicitação</span>
                </div>
                <p className="text-lg font-semibold text-foreground pl-6">
                  {secondsToMinutes(config.customer_pause_duration_seconds)} minutos
                </p>
                <p className="text-xs text-muted-foreground pl-6">
                  Pausa quando cliente solicita
                </p>
              </div>

            </div>

            {/* Mensagens */}
            <div className="mt-8 space-y-6">
              {/* Mensagem de Saudação */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Mensagem de Saudação</span>
                </div>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {config.greeting_message}
                  </p>
                </div>
              </div>

              {/* Mensagem de Finalização */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Mensagem de Finalização</span>
                </div>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {config.closing_message}
                  </p>
                </div>
              </div>
            </div>

            {/* Lembretes */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-accent" />
                Lembretes de Agendamento
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">1º Lembrete</span>
                  <p className="text-lg font-semibold text-foreground">{formatReminderDisplay(config.reminder_1_minutes)} antes</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">2º Lembrete</span>
                  <p className="text-lg font-semibold text-foreground">{formatReminderDisplay(config.reminder_2_minutes)} antes</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">3º Lembrete</span>
                  <p className="text-lg font-semibold text-foreground">{formatReminderDisplay(config.reminder_3_minutes)} antes</p>
                </div>
              </div>
            </div>

            {/* Follow Up */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-accent" />
                Follow Up
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">1º Follow Up</span>
                  <p className="text-lg font-semibold text-foreground">{formatReminderDisplay(config.follow_up_1_minutes)} após a última mensagem não respondida</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">2º Follow Up</span>
                  <p className="text-lg font-semibold text-foreground">{formatReminderDisplay(config.follow_up_2_minutes)} após a última mensagem não respondida</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">3º Follow Up</span>
                  <p className="text-lg font-semibold text-foreground">{formatReminderDisplay(config.follow_up_3_minutes)} após a última mensagem não respondida</p>
                </div>
              </div>
            </div>

            {/* Perguntas de Qualificação */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileQuestion className="h-5 w-5 text-accent" />
                Perguntas de Qualificação
              </h3>
              {config.qualification_questions && config.qualification_questions.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {config.qualification_questions.map((q, i) => (
                    <li key={i} className="text-foreground">{q}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">Nenhuma pergunta configurada.</p>
              )}
            </div>

          </Card>
        </>
      ) : (
        /* Configurações - Modo Edição */
        <Card className="card-luxury p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              Editando Configurações
            </h2>
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Nome do Agent */}
            <div className="space-y-2">
              <Label htmlFor="agent_name">Nome do Agent *</Label>
              <Input
                id="agent_name"
                placeholder="Ex: Sofia, Assistente Virtual, Dr. Bot"
                value={editConfig.agent_name}
                onChange={(e) => setEditConfig({ ...editConfig, agent_name: e.target.value })}
              />
            </div>

            {/* Personalidade */}
            <div className="space-y-2">
              <Label htmlFor="personality">Personalidade *</Label>
              <Select
                value={editConfig.personality}
                onValueChange={(value) => setEditConfig({ ...editConfig, personality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="amigavel">Amigável</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="descontraido">Descontraído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tempo de Pausa */}
            <div className="space-y-2">
              <Label htmlFor="pause_duration">Tempo de Pausa (minutos) *</Label>
              <Input
                id="pause_duration"
                type="number"
                min="1"
                max="1440"
                value={secondsToMinutes(editConfig.pause_duration_seconds)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 30;
                  setEditConfig({ ...editConfig, pause_duration_seconds: minutesToSeconds(minutes) });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Quanto tempo o agent deve pausar quando um atendente humano assumir
              </p>
            </div>

            {/* Pausa por Solicitação do Cliente */}
            <div className="space-y-2">
              <Label htmlFor="customer_pause_duration">Pausa por Solicitação do Cliente (minutos) *</Label>
              <Input
                id="customer_pause_duration"
                type="number"
                min="1"
                max="1440"
                value={secondsToMinutes(editConfig.customer_pause_duration_seconds)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 5;
                  setEditConfig({ ...editConfig, customer_pause_duration_seconds: minutesToSeconds(minutes) });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Quanto tempo o agent deve pausar quando o cliente solicitar
              </p>
            </div>

            {/* Mensagem de Saudação */}
            <div className="space-y-2">
              <Label htmlFor="greeting_message">Mensagem de Saudação *</Label>
              <Textarea
                id="greeting_message"
                rows={4}
                value={editConfig.greeting_message}
                onChange={(e) =>
                  setEditConfig({ ...editConfig, greeting_message: e.target.value })
                }
              />
            </div>

            {/* Mensagem de Finalização */}
            <div className="space-y-2">
              <Label htmlFor="closing_message">Mensagem de Finalização *</Label>
              <Textarea
                id="closing_message"
                rows={4}
                value={editConfig.closing_message}
                onChange={(e) =>
                  setEditConfig({ ...editConfig, closing_message: e.target.value })
                }
              />
            </div>
          </div>

          {/* Lembretes */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Lembretes de Agendamento
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure quando os lembretes serão enviados antes do agendamento
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {/* 1º Lembrete */}
              <div className="space-y-2">
                <Label htmlFor="reminder_1">1º Lembrete</Label>
                <div className="flex gap-2">
                  <Input
                    id="reminder_1"
                    type="number"
                    min="1"
                    value={reminder1Value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setReminder1Value(val);
                      setEditConfig({ ...editConfig, reminder_1_minutes: unitToMinutes(val, reminder1Unit) });
                    }}
                    className="w-24"
                  />
                  <Select
                    value={reminder1Unit}
                    onValueChange={(value: 'minutos' | 'horas' | 'dias') => {
                      setReminder1Unit(value);
                      setEditConfig({ ...editConfig, reminder_1_minutes: unitToMinutes(reminder1Value, value) });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 2º Lembrete */}
              <div className="space-y-2">
                <Label htmlFor="reminder_2">2º Lembrete</Label>
                <div className="flex gap-2">
                  <Input
                    id="reminder_2"
                    type="number"
                    min="1"
                    value={reminder2Value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setReminder2Value(val);
                      setEditConfig({ ...editConfig, reminder_2_minutes: unitToMinutes(val, reminder2Unit) });
                    }}
                    className="w-24"
                  />
                  <Select
                    value={reminder2Unit}
                    onValueChange={(value: 'minutos' | 'horas' | 'dias') => {
                      setReminder2Unit(value);
                      setEditConfig({ ...editConfig, reminder_2_minutes: unitToMinutes(reminder2Value, value) });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 3º Lembrete */}
              <div className="space-y-2">
                <Label htmlFor="reminder_3">3º Lembrete</Label>
                <div className="flex gap-2">
                  <Input
                    id="reminder_3"
                    type="number"
                    min="1"
                    value={reminder3Value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setReminder3Value(val);
                      setEditConfig({ ...editConfig, reminder_3_minutes: unitToMinutes(val, reminder3Unit) });
                    }}
                    className="w-24"
                  />
                  <Select
                    value={reminder3Unit}
                    onValueChange={(value: 'minutos' | 'horas' | 'dias') => {
                      setReminder3Unit(value);
                      setEditConfig({ ...editConfig, reminder_3_minutes: unitToMinutes(reminder3Value, value) });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Follow Up */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Follow Up
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure quando os follow ups serão enviados após a última mensagem não respondida
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {/* 1º Follow Up */}
              <div className="space-y-2">
                <Label htmlFor="followup_1">1º Follow Up</Label>
                <div className="flex gap-2">
                  <Input
                    id="followup_1"
                    type="number"
                    min="1"
                    value={followUp1Value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFollowUp1Value(val);
                      setEditConfig({ ...editConfig, follow_up_1_minutes: unitToMinutes(val, followUp1Unit) });
                    }}
                    className="w-24"
                  />
                  <Select
                    value={followUp1Unit}
                    onValueChange={(value: 'minutos' | 'horas' | 'dias') => {
                      setFollowUp1Unit(value);
                      setEditConfig({ ...editConfig, follow_up_1_minutes: unitToMinutes(followUp1Value, value) });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 2º Follow Up */}
              <div className="space-y-2">
                <Label htmlFor="followup_2">2º Follow Up</Label>
                <div className="flex gap-2">
                  <Input
                    id="followup_2"
                    type="number"
                    min="1"
                    value={followUp2Value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFollowUp2Value(val);
                      setEditConfig({ ...editConfig, follow_up_2_minutes: unitToMinutes(val, followUp2Unit) });
                    }}
                    className="w-24"
                  />
                  <Select
                    value={followUp2Unit}
                    onValueChange={(value: 'minutos' | 'horas' | 'dias') => {
                      setFollowUp2Unit(value);
                      setEditConfig({ ...editConfig, follow_up_2_minutes: unitToMinutes(followUp2Value, value) });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 3º Follow Up */}
              <div className="space-y-2">
                <Label htmlFor="followup_3">3º Follow Up</Label>
                <div className="flex gap-2">
                  <Input
                    id="followup_3"
                    type="number"
                    min="1"
                    value={followUp3Value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFollowUp3Value(val);
                      setEditConfig({ ...editConfig, follow_up_3_minutes: unitToMinutes(val, followUp3Unit) });
                    }}
                    className="w-24"
                  />
                  <Select
                    value={followUp3Unit}
                    onValueChange={(value: 'minutos' | 'horas' | 'dias') => {
                      setFollowUp3Unit(value);
                      setEditConfig({ ...editConfig, follow_up_3_minutes: unitToMinutes(followUp3Value, value) });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Perguntas de Qualificação */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-accent" />
                Perguntas de Qualificação
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditConfig({
                  ...editConfig,
                  qualification_questions: [...(editConfig.qualification_questions || []), ""]
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
            <div className="space-y-3">
              {editConfig.qualification_questions?.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => {
                      const newQuestions = [...(editConfig.qualification_questions || [])];
                      newQuestions[index] = e.target.value;
                      setEditConfig({ ...editConfig, qualification_questions: newQuestions });
                    }}
                    placeholder="Digite a pergunta..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newQuestions = [...(editConfig.qualification_questions || [])];
                      newQuestions.splice(index, 1);
                      setEditConfig({ ...editConfig, qualification_questions: newQuestions });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!editConfig.qualification_questions || editConfig.qualification_questions.length === 0) && (
                <p className="text-sm text-muted-foreground italic">Nenhuma pergunta adicionada.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Card de Tokens */}
      <Card className="card-luxury p-6 animate-fade-in-up border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Consumo de Tokens</h3>
              <p className="text-sm text-muted-foreground">Total acumulado da organização</p>
            </div>
          </div>
          <Badge className="bg-accent/10 text-accent border-accent/20">
            IA
          </Badge>
        </div>

        <div className="bg-accent/5 rounded-lg p-6 border border-accent/20">
          {isLoadingTokens ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  {totalTokens.toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  tokens consumidos
                </p>
              </div>
              <div className="text-center border-l border-accent/20 pl-6">
                <p className="text-3xl md:text-4xl font-bold text-success mb-2">
                  {totalCost.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  custo total (R$)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-background rounded-lg p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Custo médio</p>
            <p className="text-lg font-semibold text-foreground">
              {totalCost > 0 
                ? (totalCost / (totalTokens / 1000)).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8
                  }) + '/1k'
                : 'R$ 0,00/1k'
              }
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <p className="text-lg font-semibold text-success">Ativo</p>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4 animate-fade-in-up">
        <div className="card-luxury p-4">
          <p className="text-sm text-muted-foreground mb-2">Conversas Hoje</p>
          <p className="text-2xl font-bold text-foreground">0</p>
        </div>
        <div className="card-luxury p-4">
          <p className="text-sm text-muted-foreground mb-2">Taxa de Resposta</p>
          <p className="text-2xl font-bold text-success">0%</p>
        </div>
        <div className="card-luxury p-4">
          <p className="text-sm text-muted-foreground mb-2">Leads Qualificados</p>
          <p className="text-2xl font-bold text-accent">0</p>
        </div>
        <div className="card-luxury p-4">
          <p className="text-sm text-muted-foreground mb-2">Tempo Médio</p>
          <p className="text-2xl font-bold text-foreground">0min</p>
        </div>
      </div>
    </div>
  );
}
