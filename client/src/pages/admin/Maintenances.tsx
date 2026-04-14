import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Wrench, Loader2, Search, Pencil, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { open: "Aberta", in_progress: "Em Andamento", waiting_parts: "Aguardando Peças", completed: "Concluída", cancelled: "Cancelada" };
const statusColors: Record<string, string> = { open: "bg-warning/10 text-warning", in_progress: "bg-primary/10 text-primary", waiting_parts: "bg-chart-3/10 text-chart-3", completed: "bg-success/10 text-success", cancelled: "bg-muted text-muted-foreground" };
const priorityLabels: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };
const priorityColors: Record<string, string> = { low: "bg-muted text-muted-foreground", medium: "bg-warning/10 text-warning", high: "bg-destructive/10 text-destructive", urgent: "bg-destructive text-destructive-foreground" };
const categoryLabels: Record<string, string> = { plumbing: "Hidráulica", electrical: "Elétrica", structural: "Estrutural", painting: "Pintura", appliance: "Eletrodoméstico", general: "Geral", other: "Outro" };

type MaintenanceItem = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string;
  cost: string | null;
  notes: string | null;
  propertyId: number;
  propertyTitle: string | null;
  createdAt: Date;
};

export default function AdminMaintenances() {
  return <AdminLayout><MaintenancesContent /></AdminLayout>;
}

function MaintenancesContent() {
  const { data: maintenances, isLoading } = trpc.maintenances.list.useQuery({});
  const utils = trpc.useUtils();
  const updateMutation = trpc.maintenances.update.useMutation({
    onSuccess: () => { utils.maintenances.list.invalidate(); toast.success("Manutenção atualizada"); setEditDialog(null); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialog, setEditDialog] = useState<MaintenanceItem | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "general", priority: "medium", status: "open", cost: "", notes: "" });

  const filtered = (maintenances as MaintenanceItem[] | undefined)?.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.propertyTitle?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) ?? [];

  const openEdit = (m: MaintenanceItem) => {
    setEditForm({
      title: m.title,
      description: m.description ?? "",
      category: m.category ?? "general",
      priority: m.priority ?? "medium",
      status: m.status,
      cost: m.cost ?? "",
      notes: m.notes ?? "",
    });
    setEditDialog(m);
  };

  const handleSave = () => {
    if (!editDialog) return;
    updateMutation.mutate({
      id: editDialog.id,
      title: editForm.title,
      description: editForm.description || undefined,
      category: editForm.category as any,
      priority: editForm.priority as any,
      status: editForm.status as any,
      cost: editForm.cost || undefined,
      notes: editForm.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Manutenções</h1>
        <p className="text-muted-foreground mt-1">{maintenances?.length ?? 0} solicitações</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma manutenção encontrada.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                      <Wrench className="h-5 w-5 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{m.title}</h3>
                        <Badge className={statusColors[m.status]}>{statusLabels[m.status]}</Badge>
                        <Badge className={priorityColors[m.priority ?? "medium"]}>{priorityLabels[m.priority ?? "medium"]}</Badge>
                        <Badge variant="outline">{categoryLabels[m.category ?? "general"]}</Badge>
                      </div>
                      {m.propertyTitle && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                          <Building2 className="h-3 w-3" />
                          <span>{m.propertyTitle}</span>
                        </div>
                      )}
                      {m.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{m.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Aberta em: {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                        {m.cost && ` · Custo: R$ ${Number(m.cost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={m.status}
                      onValueChange={(v: any) => updateMutation.mutate({ id: m.id, status: v })}
                    >
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(o) => { if (!o) setEditDialog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Manutenção</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4 py-2">
              {editDialog.propertyTitle && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <Building2 className="h-4 w-4" />
                  <span>{editDialog.propertyTitle}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Hidráulica</SelectItem>
                      <SelectItem value="electrical">Elétrica</SelectItem>
                      <SelectItem value="structural">Estrutural</SelectItem>
                      <SelectItem value="painting">Pintura</SelectItem>
                      <SelectItem value="appliance">Eletrodoméstico</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberta</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custo (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={editForm.cost}
                    onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações internas</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Notas para a equipe..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!editForm.title || updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
