import { MessageSquare, Loader2, QrCode, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PlanGuard } from "@/components/PlanGuard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface WhatsAppInstance {
  id: string;
  token: string;
  name: string;
  adminField01: string;
  created: string;
  phone: string;
}

interface DBInstance {
  id: string;
  instance_id: string;
  token: string;
  instance_name: string;
  admin_field_01: string;
  phone: string;
  status: string;
  webhook_created: string | null;
  qr_code: string | null;
  pairing_code: string | null;
}

export default function Integrations() {
  const { organization, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingInstance, setIsLoadingInstance] = useState(true);
  const [showPairingCard, setShowPairingCard] = useState(false);
  const [instanceData, setInstanceData] = useState<WhatsAppInstance | null>(null);
  const [dbInstance, setDbInstance] = useState<DBInstance | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
  });
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isListingInstance, setIsListingInstance] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState<any>(null);
  const [isDeletingInstance, setIsDeletingInstance] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Carregar instância existente do banco ao montar o componente
  useEffect(() => {
    console.log("useEffect disparado, organization?.id:", organization?.id);
    if (organization?.id) {
      loadExistingInstance();
    }
  }, [organization?.id]);

  // Debug: monitorar mudanças no dbInstance
  useEffect(() => {
    console.log("dbInstance mudou:", dbInstance);
  }, [dbInstance]);

  // Carregar detalhes da instância automaticamente se já estiver conectado
  useEffect(() => {
    if (dbInstance?.status === "connected" && !instanceDetails) {
      console.log("Instância já conectada, carregando detalhes...");
      handleListInstance();
    }
  }, [dbInstance?.status]);

  // Verificar conexão automaticamente a cada 2 segundos quando tiver QR ou Pairing Code
  useEffect(() => {
    if (!dbInstance) return;
    if (dbInstance.status === "connected") return;
    if (!dbInstance.qr_code && !dbInstance.pairing_code) return;

    console.log("Iniciando verificação automática de conexão...");
    setIsCheckingConnection(true);

    const checkConnection = async () => {
      try {
        console.log("Verificando conexão...");
        
        const payload = {
          instanceId: dbInstance.instance_id,
          token: dbInstance.token,
          instanceName: dbInstance.instance_name,
          adminField01: dbInstance.admin_field_01,
          phone: dbInstance.phone,
          organizationId: organization?.id,
          organizationName: organization?.name,
        };

        const response = await fetch("https://webhook.n8nlabz.com.br/webhook/verificar-conexao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.log("Erro na verificação:", response.status);
          return;
        }

        const result = await response.json();
        console.log("Resultado da verificação:", result);

        // Verificar se está conectado (aceitar vários formatos de resposta)
        const data = Array.isArray(result) ? result[0] : result;
        
        // Aceita: response: "sucesso", connected: true, status: "connected", state: "open"
        const isConnected = 
          data.response === "sucesso" || 
          data.connected === true || 
          data.status === "connected" || 
          data.state === "open";

        console.log("isConnected:", isConnected, "data:", data);

        if (isConnected) {
          console.log("✅ WhatsApp conectado com sucesso!");
          
          // Atualizar status no banco
          const { error: updateError } = await supabase
            .from("whatsapp_instances")
            .update({ status: "connected" })
            .eq("id", dbInstance.id);

          if (updateError) {
            console.error("Erro ao atualizar status:", updateError);
          } else {
            console.log("Status atualizado no banco para 'connected'");
          }

          // Atualizar estado local
          setDbInstance({
            ...dbInstance,
            status: "connected",
          });

          setIsCheckingConnection(false);
          toast.success("WhatsApp conectado com sucesso! 🎉");
        } else {
          console.log("⏳ Ainda não conectado, continuando verificação...");
        }
      } catch (error) {
        console.error("Erro ao verificar conexão:", error);
      }
    };

    // Verificar imediatamente
    checkConnection();

    // Continuar verificando a cada 2 segundos
    const interval = setInterval(checkConnection, 2000);

    // Limpar interval ao desmontar ou quando conectar
    return () => {
      console.log("Limpando interval de verificação");
      clearInterval(interval);
      setIsCheckingConnection(false);
    };
  }, [dbInstance?.id, dbInstance?.status, dbInstance?.qr_code, dbInstance?.pairing_code, organization?.id]);

  const loadExistingInstance = async () => {
    if (!organization?.id) {
      console.log("Organization ID não disponível");
      setIsLoadingInstance(false);
      return;
    }

    try {
      setIsLoadingInstance(true);
      console.log("Buscando instância para organization_id:", organization.id);
      
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = not found
        console.error("Erro ao buscar instância:", error);
        throw error;
      }

      if (data) {
        console.log("Instância encontrada:", data);
        setDbInstance(data);
        
        // Converter dados do banco para o formato da interface
        const instance: WhatsAppInstance = {
          id: data.instance_id,
          token: data.token,
          name: data.instance_name,
          adminField01: data.admin_field_01,
          phone: data.phone,
          created: data.webhook_created || data.created_at,
        };
        
        console.log("Instance data convertida:", instance);
        setInstanceData(instance);
        setShowPairingCard(true);
      } else {
        console.log("Nenhuma instância encontrada no banco");
      }
    } catch (error) {
      console.error("Erro ao carregar instância:", error);
    } finally {
      setIsLoadingInstance(false);
    }
  };

  // Preencher nome da empresa quando abrir o modal
  useEffect(() => {
    if (isModalOpen && organization?.name) {
      const formattedName = organization.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      
      setFormData((prev) => ({ ...prev, companyName: formattedName }));
    }
  }, [isModalOpen, organization]);

  const handleConnect = () => {
    setIsModalOpen(true);
  };

  const saveToDatabase = async (instance: WhatsAppInstance) => {
    try {
      const { error } = await supabase
        .from("whatsapp_instances")
        .insert({
          organization_id: organization?.id,
          instance_id: instance.id,
          token: instance.token,
          instance_name: instance.name,
          admin_field_01: instance.adminField01,
          phone: instance.phone,
          webhook_created: instance.created,
          status: "pending",
        });

      if (error) throw error;
      
      console.log("Instância salva no banco de dados");
    } catch (error) {
      console.error("Erro ao salvar no banco:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  const handleSubmit = async () => {
    if (!formData.companyName.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }

    const phoneNumbers = formData.phone.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      toast.error("Telefone inválido. Use o formato: (11) 98888-8888");
      return;
    }

    try {
      setIsConnecting(true);

      const response = await fetch("https://webhook.n8nlabz.com.br/webhook/criar-instancia-cliente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          phone: formData.phone,
          organizationId: organization?.id,
          organizationName: organization?.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao conectar WhatsApp");
      }

      const result = await response.json();
      
      // O webhook retorna um array, pegar o primeiro item
      const instance = Array.isArray(result) ? result[0] : result;
      
      if (!instance || !instance.id) {
        throw new Error("Resposta inválida do servidor");
      }

      // Salvar no banco de dados
      await saveToDatabase(instance);
      
      // Mostrar card de pareamento
      setInstanceData(instance);
      setIsModalOpen(false);
      setShowPairingCard(true);
      setFormData({ companyName: "", phone: "" });
      
      toast.success("Instância criada com sucesso!");
      
    } catch (error: any) {
      console.error("Erro ao conectar WhatsApp:", error);
      toast.error(error.message || "Erro ao conectar WhatsApp");
    } finally {
      setIsConnecting(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleDeleteInstance = async () => {
    if (!dbInstance) {
      toast.error("Nenhuma instância encontrada");
      return;
    }

    try {
      setIsDeletingInstance(true);
      
      const payload = {
        instanceId: dbInstance.instance_id,
        token: dbInstance.token,
        instanceName: dbInstance.instance_name,
        adminField01: dbInstance.admin_field_01,
        phone: dbInstance.phone,
        organizationId: organization?.id,
        organizationName: organization?.name,
      };
      
      console.log("Apagando instância, payload:", payload);
      
      const response = await fetch("https://webhook.n8nlabz.com.br/webhook/apagar-instancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao apagar instância");
      }

      const result = await response.json();
      console.log("Resultado apagar instância:", result);
      
      // Deletar do banco de dados local
      const { error: deleteError } = await supabase
        .from("whatsapp_instances")
        .delete()
        .eq("id", dbInstance.id);

      if (deleteError) {
        console.error("Erro ao deletar do banco:", deleteError);
        toast.error("Erro ao remover instância do banco de dados");
        return;
      }

      // Limpar estados
      setInstanceDetails(null);
      setDbInstance(null);
      setInstanceData(null);
      setShowPairingCard(false);
      setShowDeleteDialog(false);
      
      toast.success("Instância apagada com sucesso!");
      
    } catch (error: any) {
      console.error("Erro ao apagar instância:", error);
      toast.error(error.message || "Erro ao apagar instância");
    } finally {
      setIsDeletingInstance(false);
    }
  };

  const handleListInstance = async () => {
    if (!dbInstance) {
      toast.error("Nenhuma instância encontrada");
      return;
    }

    try {
      setIsListingInstance(true);
      
      const payload = {
        instanceId: dbInstance.instance_id,
        token: dbInstance.token,
        instanceName: dbInstance.instance_name,
        adminField01: dbInstance.admin_field_01,
        phone: dbInstance.phone,
        organizationId: organization?.id,
        organizationName: organization?.name,
      };
      
      console.log("Listando instância, payload:", payload);
      
      const response = await fetch("https://webhook.n8nlabz.com.br/webhook/listar-instancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao listar instância");
      }

      const result = await response.json();
      console.log("Resultado listar instância:", result);
      
      // Processar resposta (pode ser array ou objeto)
      const data = Array.isArray(result) ? result[0] : result;
      
      if (data) {
        setInstanceDetails(data);
        toast.success("Instância carregada com sucesso!");
      } else {
        toast.info("Nenhum detalhe retornado");
      }
      
    } catch (error: any) {
      console.error("Erro ao listar instância:", error);
      toast.error(error.message || "Erro ao listar instância");
    } finally {
      setIsListingInstance(false);
    }
  };

  const handleGenerateQRCode = async () => {
    console.log("handleGenerateQRCode chamado");
    console.log("dbInstance atual:", dbInstance);
    console.log("organization:", organization);
    
    if (!dbInstance) {
      console.error("dbInstance está null/undefined");
      toast.error("Nenhuma instância encontrada");
      return;
    }

    try {
      setIsGeneratingQR(true);
      
      const payload = {
        instanceId: dbInstance.instance_id,
        token: dbInstance.token,
        instanceName: dbInstance.instance_name,
        adminField01: dbInstance.admin_field_01,
        phone: dbInstance.phone,
        organizationId: organization?.id,
        organizationName: organization?.name,
      };
      
      console.log("Payload enviado:", payload);
      
      const response = await fetch("https://webhook.n8nlabz.com.br/webhook/gerar-qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao gerar QR Code");
      }

      const result = await response.json();
      console.log("Resultado do webhook:", result);
      
      // O endpoint pode retornar um array ou objeto direto
      const data = Array.isArray(result) ? result[0] : result;
      
      console.log("Data processada:", data);
      
      // Extrair qrCode e pairingCode (aceita vários formatos de nome)
      const qrCode = data.qrCode || data.qrcode || data.QRCode || null;
      const pairingCode = data.pairCode || data.paircode || data.pairingCode || data.pairing_code || null;
      
      console.log("QR Code extraído:", qrCode);
      console.log("Pairing Code extraído:", pairingCode);
      
      // Processar resposta - pode ter qrCode ou pairingCode
      if (qrCode || pairingCode) {
        // Atualizar no banco de dados
        const { error: updateError } = await supabase
          .from("whatsapp_instances")
          .update({
            qr_code: qrCode,
            pairing_code: pairingCode,
          })
          .eq("id", dbInstance.id);

        if (updateError) {
          console.error("Erro ao salvar QR/Pairing code:", updateError);
          toast.error("Erro ao salvar código");
        } else {
          console.log("Código salvo no banco com sucesso!");
        }

        // Atualizar estado local
        setDbInstance({
          ...dbInstance,
          qr_code: qrCode,
          pairing_code: pairingCode,
        });

        if (pairingCode) {
          toast.success("Código de pareamento gerado com sucesso!");
        } else if (qrCode) {
          toast.success("QR Code gerado com sucesso!");
        }
      } else {
        console.warn("Resposta do webhook não contém qrCode nem pairingCode");
        toast.info("Processando conexão...");
      }
      
    } catch (error: any) {
      console.error("Erro ao gerar QR Code:", error);
      toast.error(error.message || "Erro ao gerar QR Code");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Loading ao carregar instância
  if (isLoadingInstance) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se tiver detalhes da instância, mostra card detalhado
  if (instanceDetails && dbInstance?.status === "connected") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">WhatsApp Conectado</h1>
            <p className="text-muted-foreground">
              Sua instância está ativa e funcionando
        </p>
      </div>

          {/* Card da Instância */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* Header do Card com Avatar */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={instanceDetails.profilePicUrl || "/placeholder.svg"}
                    alt={instanceDetails.profileName || "Profile"}
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  {/* Status Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                    <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />
      </div>
                </div>

                {/* Nome e Status */}
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {instanceDetails.profileName || "WhatsApp"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-600">
                      Conectado
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Telefone</span>
                  <span className="text-sm font-semibold text-foreground font-mono">
                    {instanceDetails.owner || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Empresa</span>
                  <span className="text-sm font-semibold text-foreground">
                    {instanceDetails.adminField01 || instanceData?.adminField01}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plataforma</span>
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {instanceDetails.plataform || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="text-sm font-semibold text-foreground">
                    {instanceDetails.isBusiness ? "Business" : "Pessoal"}
                  </span>
                </div>
              </div>

              {/* Botão Apagar */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={isDeletingInstance}
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar Instância
                </Button>
              </div>

            </div>
          </Card>

          {/* Dialog de Confirmação */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar Instância do WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A instância <strong>{instanceDetails?.name}</strong> será 
                  permanentemente removida e você precisará conectar novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingInstance}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteInstance();
                  }}
                  disabled={isDeletingInstance}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingInstance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Apagando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Apagar
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  // Tela de pareamento - mostra se já existe instância no banco
  if (showPairingCard && instanceData && dbInstance) {
    const statusColor = dbInstance.status === "connected" ? "text-green-500" : "text-yellow-500";
    const statusBg = dbInstance.status === "connected" ? "bg-green-500" : "bg-yellow-500";
    const statusText = dbInstance.status === "connected" ? "Conectado" : "Aguardando Pareamento";

    return (
      <div className="flex items-center justify-center min-h-screen p-4 md:p-6 lg:p-8">
        <Card className="card-luxury p-8 max-w-2xl w-full animate-fade-in">
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {dbInstance.status === "connected" ? "WhatsApp Conectado" : "Conecte seu WhatsApp"}
              </h2>
              <p className="text-muted-foreground">
                {dbInstance.status === "connected" 
                  ? "Sua instância está conectada e funcionando"
                  : "Escaneie o QR Code ou use o código de pareamento abaixo"
                }
              </p>
            </div>

            {/* Informações da Instância */}
            <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Empresa</span>
                <span className="text-sm font-semibold text-foreground">
                  {instanceData.adminField01}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Telefone</span>
                <span className="text-sm font-semibold text-foreground">
                  {instanceData.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`flex items-center gap-2 text-sm font-semibold ${statusColor}`}>
                  <div className={`h-2 w-2 rounded-full ${statusBg} animate-pulse`} />
                  {statusText}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-sm text-muted-foreground">Instance ID</span>
                <span className="text-xs font-mono text-foreground">
                  {dbInstance.instance_id}
                </span>
              </div>
            </div>

            {/* Instruções - só mostra se não estiver conectado */}
            {dbInstance.status !== "connected" && (
              <>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-6 space-y-4 text-left">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-accent" />
                    Como conectar:
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-xs shrink-0">
                        1
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Abra o WhatsApp no seu celular
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-xs shrink-0">
                        2
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vá em Configurações → Aparelhos conectados → Conectar um aparelho
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-xs shrink-0">
                        3
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Escaneie o QR Code que aparecerá ou use o código de pareamento
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code ou Pairing Code */}
                <div className="space-y-4">
                  {dbInstance.qr_code ? (
                    // Exibir QR Code
                    <div className="flex flex-col items-center space-y-3">
                      <div className="bg-white p-6 rounded-lg shadow-lg relative">
                        <img 
                          src={dbInstance.qr_code} 
                          alt="QR Code do WhatsApp" 
                          className="w-64 h-64 object-contain"
                        />
                        {isCheckingConnection && (
                          <div className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                            <div className="bg-white/95 rounded-lg px-4 py-2 shadow-lg">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                <span className="text-sm font-medium">Verificando...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Escaneie este QR Code com seu WhatsApp
                      </p>
                    </div>
                  ) : dbInstance.pairing_code ? (
                    // Exibir Código de Pareamento
                    <div className="bg-secondary/30 border-2 border-accent/20 rounded-lg p-8 relative">
                      {isCheckingConnection && (
                        <div className="absolute top-2 right-2">
                          <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs font-medium">Verificando conexão...</span>
                          </div>
                        </div>
                      )}
                      <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground font-medium">
                          CÓDIGO DE PAREAMENTO
                        </p>
                        <p className="text-5xl font-bold text-foreground tracking-wider font-mono">
                          {dbInstance.pairing_code}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(dbInstance.pairing_code || "");
                            toast.success("Código copiado!");
                          }}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copiar Código
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Digite este código no WhatsApp para conectar
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Placeholder - aguardando geração
                    <div className="bg-white p-8 rounded-lg inline-block">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <QrCode className="h-48 w-48 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          Clique em "Gerar QR Code" abaixo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-3 items-center pt-4">
              {dbInstance.status === "connected" ? (
                // Nenhum botão quando conectado - detalhes carregam automaticamente
                null
              ) : (
                // Botão Gerar QR Code quando não conectado
                <>
                  <Button
                    onClick={() => {
                      console.log("Botão clicado, dbInstance no momento do clique:", dbInstance);
                      handleGenerateQRCode();
                    }}
                    disabled={isGeneratingQR}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isGeneratingQR ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Gerando QR Code...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-5 w-5" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                  
                  {isCheckingConnection && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <span>Aguardando conexão do WhatsApp...</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Tela inicial - só mostra se NÃO houver instância no banco
  return (
    <PlanGuard feature="integracao_whatsapp">
      <>
        <div className="flex items-center justify-center min-h-screen p-4 md:p-6 lg:p-8">
        <div className="text-center space-y-6 max-w-md animate-fade-in">
          {/* Ícone */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <MessageSquare className="h-10 w-10 text-accent" />
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <p className="text-base md:text-lg text-muted-foreground">
              Clique no botão para integrarmos o seu whatsapp
            </p>
        </div>

          {/* Botão */}
          <Button
            onClick={handleConnect}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white gap-2 text-lg px-8 py-6"
          >
            <MessageSquare className="h-5 w-5" />
            Comece por aqui
          </Button>
        </div>
      </div>

      {/* Modal de Conexão */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para integrar seu WhatsApp Business
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome da Empresa */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="ex: clinica-gabriella"
                disabled={isConnecting}
              />
              <p className="text-xs text-muted-foreground">
                Será usado como identificador único (sem espaços)
              </p>
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone do WhatsApp *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 98888-8888"
                disabled={isConnecting}
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                Número que será conectado ao WhatsApp Business
              </p>
      </div>
    </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isConnecting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isConnecting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Conectar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    </PlanGuard>
  );
}
