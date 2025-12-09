import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Phone, 
  Plus,
  GripVertical,
  ArrowLeft
} from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Tipos
type KanbanStatus =
  | "novo_contato"
  | "qualificado"
  | "em_atendimento"
  | "agendado"
  | "aguardando_confirmacao"
  | "concluido";

interface KanbanCard {
  id: string;
  name: string;
  email: string;
  phone: string;
  kanban_status: KanbanStatus;
  created_at: string;
  organization_id: string;
}

interface Column {
  id: KanbanStatus;
  title: string;
  color: string;
}

// Configuração das colunas
const columns: Column[] = [
  { id: "novo_contato", title: "Novo Contato", color: "bg-blue-500" },
  { id: "qualificado", title: "Qualificado", color: "bg-purple-500" },
  { id: "em_atendimento", title: "Em Atendimento", color: "bg-yellow-500" },
  { id: "agendado", title: "Agendado", color: "bg-cyan-500" },
  { id: "aguardando_confirmacao", title: "Aguardando Confirmação", color: "bg-orange-500" },
  { id: "concluido", title: "Concluído", color: "bg-green-500" },
];

// Card arrastável
function SortableCard({ card }: { card: KanbanCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-luxury group p-4 mb-3 cursor-move touch-none",
        isDragging && "opacity-50 scale-105"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
            {card.name
              ? card.name.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "?"
            }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{card.name || "Sem nome"}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* Informações de contato */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{card.email || "Sem email"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{formatPhoneNumber(card.phone) || "Sem telefone"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(card.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
}

// Coluna do Kanban
function KanbanColumn({
  column,
  cards,
}: {
  column: Column;
  cards: KanbanCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full bg-secondary/30 rounded-lg p-4 min-w-[280px] max-w-[320px] transition-all",
        isOver && "ring-2 ring-accent bg-accent/5"
      )}
    >
      {/* Header da Coluna */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-full", column.color)} />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="ml-1">
            {cards.length}
          </Badge>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum card nesta coluna
            </div>
          ) : (
            cards.map((card) => <SortableCard key={card.id} card={card} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Kanban() {
  const { profile } = useAuth();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Carregar pacientes do banco de dados
  useEffect(() => {
    loadPatients();
  }, [profile?.organization_id]);

  const loadPatients = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, email, phone, kanban_status, created_at, organization_id")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCards(data || []);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast.error("Erro ao carregar pacientes");
    } finally {
      setIsLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) {
      setActiveCard(null);
      return;
    }

    // Determinar a nova coluna com base no over
    let newStatus: KanbanStatus | null = null;

    // Se arrastou sobre um card, pegar o status desse card
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      newStatus = overCard.kanban_status;
    } else {
      // Se arrastou sobre uma coluna (droppable), usar o ID da coluna
      const column = columns.find((col) => col.id === over.id);
      if (column) {
        newStatus = column.id;
      }
    }

    if (newStatus && activeCard.kanban_status !== newStatus) {
      // Atualizar otimisticamente na UI
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === active.id ? { ...card, kanban_status: newStatus } : card
        )
      );
      
      // Salvar no banco de dados
      try {
        const { error } = await supabase
          .from("patients")
          .update({ kanban_status: newStatus })
          .eq("id", active.id);

        if (error) throw error;

        const columnTitle = columns.find(c => c.id === newStatus)?.title;
        toast.success(`Card movido para ${columnTitle}`);
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        toast.error("Erro ao atualizar status");
        // Reverter mudança em caso de erro
        loadPatients();
      }
    }

    setActiveCard(null);
  };

  const handleCreateCard = async () => {
    if (!newCardForm.name || !newCardForm.email || !newCardForm.phone) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!profile?.organization_id) {
      toast.error("Erro: organização não identificada");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("patients")
        .insert({
          name: newCardForm.name,
          email: newCardForm.email,
          phone: newCardForm.phone,
          organization_id: profile.organization_id,
          kanban_status: "novo_contato",
          status: "active",
          total_visits: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar o novo card à lista
      if (data) {
        setCards((prev) => [data, ...prev]);
      }

      setNewCardForm({ name: "", email: "", phone: "" });
      setIsDialogOpen(false);
      toast.success("Novo contato adicionado!");
    } catch (error: any) {
      console.error("Erro ao criar contato:", error);
      if (error.code === "23505") {
        toast.error("Este email já está cadastrado");
      } else {
        toast.error("Erro ao criar contato");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 lg:p-8 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to="/app/clientes/crm" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Clientes</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Kanban</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-1 md:mb-2">
            Kanban
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Gerencie seu funil de vendas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
              <DialogDescription>
                Adicione um novo lead ao seu pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João da Silva"
                  value={newCardForm.name}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@example.com"
                  value={newCardForm.email}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="(11) 98888-8888"
                  value={newCardForm.phone}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewCardForm({ name: "", email: "", phone: "", notes: "" });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateCard}>Criar Contato</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 p-4 md:p-6 lg:p-8 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando leads...</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 h-full pb-4">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={cards.filter((card) => card.kanban_status === column.id)}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeCard ? <SortableCard card={activeCard} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}

