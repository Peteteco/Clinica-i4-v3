export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
          settings: Json
          is_active: boolean
          logo_url: string | null
          contact_email: string | null
          subscription_plan: 'plano_a' | 'plano_b' | 'plano_c' | 'plano_d'
          plan_features: Json
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          settings?: Json
          is_active?: boolean
          logo_url?: string | null
          contact_email?: string | null
          subscription_plan?: 'plano_a' | 'plano_b' | 'plano_c' | 'plano_d'
          plan_features?: Json
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          settings?: Json
          is_active?: boolean
          logo_url?: string | null
          contact_email?: string | null
          subscription_plan?: 'plano_a' | 'plano_b' | 'plano_c' | 'plano_d'
          plan_features?: Json
        }
      }
      global_settings: {
        Row: {
          id: string
          support_whatsapp: string | null
          openai_api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          support_whatsapp?: string | null
          openai_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          support_whatsapp?: string | null
          openai_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null  // NULL para super admins
          created_at: string
          full_name: string
          role: 'admin' | 'doctor' | 'assistant'
          avatar_url: string | null
          is_active: boolean
          is_super_admin: boolean  // TRUE para super admins
        }
        Insert: {
          id: string
          organization_id?: string | null  // NULL para super admins
          created_at?: string
          full_name: string
          role?: 'admin' | 'doctor' | 'assistant'
          avatar_url?: string | null
          is_active?: boolean
          is_super_admin?: boolean
        }
        Update: {
          id?: string
          organization_id?: string | null
          created_at?: string
          full_name?: string
          role?: 'admin' | 'doctor' | 'assistant'
          avatar_url?: string | null
          is_active?: boolean
          is_super_admin?: boolean
        }
      }
      patients: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          name: string
          email: string
          phone: string
          status: 'active' | 'inactive'
          last_visit: string | null
          total_visits: number
          kanban_status: 'novo_contato' | 'qualificado' | 'em_atendimento' | 'agendado' | 'aguardando_confirmacao' | 'concluido'
          observations: string | null
          resumo: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          name: string
          email: string
          phone: string
          status?: 'active' | 'inactive'
          last_visit?: string | null
          total_visits?: number
          kanban_status?: 'novo_contato' | 'qualificado' | 'em_atendimento' | 'agendado' | 'aguardando_confirmacao' | 'concluido'
          observations?: string | null
          resumo?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          name?: string
          email?: string
          phone?: string
          status?: 'active' | 'inactive'
          last_visit?: string | null
          total_visits?: number
          kanban_status?: 'novo_contato' | 'qualificado' | 'em_atendimento' | 'agendado' | 'aguardando_confirmacao' | 'concluido'
          observations?: string | null
          resumo?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          date: string
          time: string
          start_datetime: string | null  // TEXT: formato ISO8601 com TZ (2025-11-25T09:00:00-03:00)
          end_datetime: string | null    // TEXT: formato ISO8601 com TZ (2025-11-25T10:00:00-03:00)
          patient_id: string
          patient_name: string
          type: string
          status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
          notes: string | null
          observations: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          date: string
          time: string
          start_datetime?: string | null  // TEXT: formato ISO8601 com TZ (2025-11-25T09:00:00-03:00)
          end_datetime?: string | null    // TEXT: formato ISO8601 com TZ (2025-11-25T10:00:00-03:00)
          patient_id: string
          patient_name: string
          type: string
          status?: 'confirmed' | 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          observations?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          date?: string
          time?: string
          start_datetime?: string | null  // TEXT: formato ISO8601 com TZ (2025-11-25T09:00:00-03:00)
          end_datetime?: string | null    // TEXT: formato ISO8601 com TZ (2025-11-25T10:00:00-03:00)
          patient_id?: string
          patient_name?: string
          type?: string
          status?: 'confirmed' | 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          observations?: string | null
          session_id?: string | null
        }
      }
      settings: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          clinic_name: string
          doctor_name: string
          subscription_plan: string
          subscription_renews_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          clinic_name: string
          doctor_name: string
          subscription_plan?: string
          subscription_renews_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          clinic_name?: string
          doctor_name?: string
          subscription_plan?: string
          subscription_renews_at?: string | null
        }
      }
      agent_ia_config: {
        Row: {
          id: string
          organization_id: string
          created_at: string
          updated_at: string
          agent_name: string
          personality: string
          pause_duration_seconds: number
          customer_pause_duration_seconds: number
          greeting_message: string
          closing_message: string
          openai_api_key: string | null
          confirmation_email_html: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          created_at?: string
          updated_at?: string
          agent_name?: string
          personality?: string
          pause_duration_seconds?: number
          customer_pause_duration_seconds?: number
          greeting_message?: string
          closing_message?: string
          openai_api_key?: string | null
          confirmation_email_html?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
          agent_name?: string
          personality?: string
          pause_duration_seconds?: number
          customer_pause_duration_seconds?: number
          greeting_message?: string
          closing_message?: string
          openai_api_key?: string | null
          confirmation_email_html?: string | null
        }
      }
      whatsapp_instances: {
        Row: {
          id: string
          organization_id: string
          created_at: string
          updated_at: string
          instance_id: string
          token: string
          instance_name: string
          admin_field_01: string
          phone: string
          webhook_created: string | null
          status: 'pending' | 'connected' | 'disconnected' | 'error'
          qr_code: string | null
          pairing_code: string | null
          webhook_url: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          created_at?: string
          updated_at?: string
          instance_id: string
          token: string
          instance_name: string
          admin_field_01: string
          phone: string
          webhook_created?: string | null
          status?: 'pending' | 'connected' | 'disconnected' | 'error'
          qr_code?: string | null
          pairing_code?: string | null
          webhook_url?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
          instance_id?: string
          token?: string
          instance_name?: string
          admin_field_01?: string
          phone?: string
          webhook_created?: string | null
          status?: 'pending' | 'connected' | 'disconnected' | 'error'
          qr_code?: string | null
          pairing_code?: string | null
          webhook_url?: string | null
        }
      }
      work_schedules: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          // Domingo
          domingo_is_active: boolean
          domingo_inicio_trabalho: string | null
          domingo_fim_trabalho: string | null
          domingo_inicio_almoco: string | null
          domingo_fim_almoco: string | null
          // Segunda
          segunda_is_active: boolean
          segunda_inicio_trabalho: string | null
          segunda_fim_trabalho: string | null
          segunda_inicio_almoco: string | null
          segunda_fim_almoco: string | null
          // Terça
          terca_is_active: boolean
          terca_inicio_trabalho: string | null
          terca_fim_trabalho: string | null
          terca_inicio_almoco: string | null
          terca_fim_almoco: string | null
          // Quarta
          quarta_is_active: boolean
          quarta_inicio_trabalho: string | null
          quarta_fim_trabalho: string | null
          quarta_inicio_almoco: string | null
          quarta_fim_almoco: string | null
          // Quinta
          quinta_is_active: boolean
          quinta_inicio_trabalho: string | null
          quinta_fim_trabalho: string | null
          quinta_inicio_almoco: string | null
          quinta_fim_almoco: string | null
          // Sexta
          sexta_is_active: boolean
          sexta_inicio_trabalho: string | null
          sexta_fim_trabalho: string | null
          sexta_inicio_almoco: string | null
          sexta_fim_almoco: string | null
          // Sábado
          sabado_is_active: boolean
          sabado_inicio_trabalho: string | null
          sabado_fim_trabalho: string | null
          sabado_inicio_almoco: string | null
          sabado_fim_almoco: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          // Domingo
          domingo_is_active?: boolean
          domingo_inicio_trabalho?: string | null
          domingo_fim_trabalho?: string | null
          domingo_inicio_almoco?: string | null
          domingo_fim_almoco?: string | null
          // Segunda
          segunda_is_active?: boolean
          segunda_inicio_trabalho?: string | null
          segunda_fim_trabalho?: string | null
          segunda_inicio_almoco?: string | null
          segunda_fim_almoco?: string | null
          // Terça
          terca_is_active?: boolean
          terca_inicio_trabalho?: string | null
          terca_fim_trabalho?: string | null
          terca_inicio_almoco?: string | null
          terca_fim_almoco?: string | null
          // Quarta
          quarta_is_active?: boolean
          quarta_inicio_trabalho?: string | null
          quarta_fim_trabalho?: string | null
          quarta_inicio_almoco?: string | null
          quarta_fim_almoco?: string | null
          // Quinta
          quinta_is_active?: boolean
          quinta_inicio_trabalho?: string | null
          quinta_fim_trabalho?: string | null
          quinta_inicio_almoco?: string | null
          quinta_fim_almoco?: string | null
          // Sexta
          sexta_is_active?: boolean
          sexta_inicio_trabalho?: string | null
          sexta_fim_trabalho?: string | null
          sexta_inicio_almoco?: string | null
          sexta_fim_almoco?: string | null
          // Sábado
          sabado_is_active?: boolean
          sabado_inicio_trabalho?: string | null
          sabado_fim_trabalho?: string | null
          sabado_inicio_almoco?: string | null
          sabado_fim_almoco?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          // Domingo
          domingo_is_active?: boolean
          domingo_inicio_trabalho?: string | null
          domingo_fim_trabalho?: string | null
          domingo_inicio_almoco?: string | null
          domingo_fim_almoco?: string | null
          // Segunda
          segunda_is_active?: boolean
          segunda_inicio_trabalho?: string | null
          segunda_fim_trabalho?: string | null
          segunda_inicio_almoco?: string | null
          segunda_fim_almoco?: string | null
          // Terça
          terca_is_active?: boolean
          terca_inicio_trabalho?: string | null
          terca_fim_trabalho?: string | null
          terca_inicio_almoco?: string | null
          terca_fim_almoco?: string | null
          // Quarta
          quarta_is_active?: boolean
          quarta_inicio_trabalho?: string | null
          quarta_fim_trabalho?: string | null
          quarta_inicio_almoco?: string | null
          quarta_fim_almoco?: string | null
          // Quinta
          quinta_is_active?: boolean
          quinta_inicio_trabalho?: string | null
          quinta_fim_trabalho?: string | null
          quinta_inicio_almoco?: string | null
          quinta_fim_almoco?: string | null
          // Sexta
          sexta_is_active?: boolean
          sexta_inicio_trabalho?: string | null
          sexta_fim_trabalho?: string | null
          sexta_inicio_almoco?: string | null
          sexta_fim_almoco?: string | null
          // Sábado
          sabado_is_active?: boolean
          sabado_inicio_trabalho?: string | null
          sabado_fim_trabalho?: string | null
          sabado_inicio_almoco?: string | null
          sabado_fim_almoco?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plan_configs: {
        Row: {
          id: string
          plan_id: 'plano_a' | 'plano_b' | 'plano_c' | 'plano_d'
          plan_name: string
          plan_description: string | null
          atendimento_inteligente: boolean
          agendamento_automatico: boolean
          lembretes_automaticos: boolean
          confirmacao_email: boolean
          base_conhecimento: boolean
          relatorios_avancados: boolean
          integracao_whatsapp: boolean
          multi_usuarios: boolean
          personalizacao_agente: boolean
          analytics: boolean
          max_agendamentos_mes: number | null
          max_mensagens_whatsapp_mes: number | null
          max_usuarios: number | null
          max_pacientes: number | null
          price_monthly: number | null
          price_annual: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: 'plano_a' | 'plano_b' | 'plano_c' | 'plano_d'
          plan_name: string
          plan_description?: string | null
          atendimento_inteligente?: boolean
          agendamento_automatico?: boolean
          lembretes_automaticos?: boolean
          confirmacao_email?: boolean
          base_conhecimento?: boolean
          relatorios_avancados?: boolean
          integracao_whatsapp?: boolean
          multi_usuarios?: boolean
          personalizacao_agente?: boolean
          analytics?: boolean
          max_agendamentos_mes?: number | null
          max_mensagens_whatsapp_mes?: number | null
          max_usuarios?: number | null
          max_pacientes?: number | null
          price_monthly?: number | null
          price_annual?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: 'plano_a' | 'plano_b' | 'plano_c' | 'plano_d'
          plan_name?: string
          plan_description?: string | null
          atendimento_inteligente?: boolean
          agendamento_automatico?: boolean
          lembretes_automaticos?: boolean
          confirmacao_email?: boolean
          base_conhecimento?: boolean
          relatorios_avancados?: boolean
          integracao_whatsapp?: boolean
          multi_usuarios?: boolean
          personalizacao_agente?: boolean
          analytics?: boolean
          max_agendamentos_mes?: number | null
          max_mensagens_whatsapp_mes?: number | null
          max_usuarios?: number | null
          max_pacientes?: number | null
          price_monthly?: number | null
          price_annual?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      token_usage: {
        Row: {
          id: string
          organization_id: string
          total_tokens: number
          cost_reais: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          total_tokens?: number
          cost_reais?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          total_tokens?: number
          cost_reais?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

