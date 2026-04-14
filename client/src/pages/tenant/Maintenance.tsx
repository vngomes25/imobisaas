import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Receipt, Wrench, FileText, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const tenantNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/tenant" },
  { icon: Receipt, label: "Boletos", path: "/tenant/payments" },
  { icon: Wrench, label: "Manutenções", path: "/tenant/maintenance" },
  { icon: FileText, label: "Contrato", path: "/tenant/contract" },
];

const statusLabels: Record<string, string> = { open: "Aberta", in_progress: "Em Andamento", waiting_parts: "Aguardando", completed: "Concluída", cancelled: "Cancelada" };
const statusColors: Record<string, string> = { open: "bg-warning/10 text-warning", in_progress: "bg-primary/10 text-primary", waiting_parts: "bg-chart-3/10 text-chart-3", completed: "bg-success/10 text-success", cancelled: "bg-muted text-muted-foreground" };
const categoryLabels: Record<string, string> = { plumbing: "Hidráulica", electrical: "Elétrica", structural: "Estrutural", painting: "Pintura", appliance: "Eletrodoméstico", general: "Geral", other: "Outro" };

export default function TenantMaintenance() {
  return (
    <PortalLayout navItems={tenantNav} portalTitle="Portal Inquilino" portalRole="Inquilino" requiredRole="tenant">
      <MaintenanceContent />
    </PortalLayout>
  );
}

function MaintenanceContent() {
  const { data: tenant } = trpc.tenants.getMyProfile.useQuery();
  const { data: contracts } = trpc.contracts.listByTenant.useQuery(
    { tenantId: tenant?.id ?? 0 },
    { enabled: !!tenant?.id }
  );
  const { data: maintenances, isLoading } = trpc.maintenances.listMyRequests.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.maintenances.create.useMutation({
    onSuccess: () => { utils.maintenances.listMyRequests.invalidate(); toast.success("Solicitação enviada"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const activeContract = contracts?.find(c => c.status === "active");
  const [form, setForm] = useState({ title: "", description: "", category: "general" as const, priority: "medium" as const });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Manutenções</h1>
          <p className="text-muted-foreground mt-1">Solicite e acompanhe manutenções</p>
        </div>
        {activeContract && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Solicitação</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Solicitar Manutenção</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Vazamento na cozinha" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Prioridade</Label>
                    <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
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
                <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Descreva o problema em detalhe..." /></div>
                <Button onClick={() => {
                  if (!form.title) { toast.error("Título é obrigatório"); return; }
                  createMutation.mutate({ ...form, propertyId: activeContract.propertyId, contractId: activeContract.id });
                }} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enviar Solicitação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !maintenances?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma manutenção encontrada.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {maintenances.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Wrench className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{m.title}</h3>
                        <Badge className={statusColors[m.status]}>{statusLabels[m.status]}</Badge>
                      </div>
                      {m.description && <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{categoryLabels[m.category ?? "general"]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
