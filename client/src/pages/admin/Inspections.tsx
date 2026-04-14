import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, Plus, Loader2, Search, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { scheduled: "Agendada", in_progress: "Em Andamento", completed: "Concluída", cancelled: "Cancelada" };
const statusColors: Record<string, string> = { scheduled: "bg-primary/10 text-primary", in_progress: "bg-warning/10 text-warning", completed: "bg-success/10 text-success", cancelled: "bg-muted text-muted-foreground" };
const typeLabels: Record<string, string> = { entry: "Entrada", exit: "Saída", periodic: "Periódica", maintenance: "Manutenção" };
const conditionLabels: Record<string, string> = { excellent: "Excelente", good: "Bom", fair: "Regular", poor: "Ruim" };

export default function AdminInspections() {
  return <AdminLayout><InspectionsContent /></AdminLayout>;
}

function InspectionsContent() {
  const { data: inspections, isLoading } = trpc.inspections.list.useQuery({});
  const { data: propertiesList } = trpc.properties.list.useQuery({});
  const utils = trpc.useUtils();
  const createMutation = trpc.inspections.create.useMutation({
    onSuccess: () => { utils.inspections.list.invalidate(); toast.success("Vistoria agendada"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.inspections.update.useMutation({
    onSuccess: () => { utils.inspections.list.invalidate(); toast.success("Vistoria atualizada"); },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ propertyId: 0, type: "periodic" as const, scheduledDate: "", overallNotes: "" });

  const filtered = inspections?.filter(i => {
    const prop = propertiesList?.find(p => p.id === i.propertyId);
    return prop?.title.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Vistorias</h1>
          <p className="text-muted-foreground mt-1">{inspections?.length ?? 0} vistorias</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Vistoria</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar Vistoria</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Imóvel *</Label>
                <Select onValueChange={(v) => setForm({ ...form, propertyId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{propertiesList?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data *</Label><Input type="datetime-local" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={form.overallNotes} onChange={(e) => setForm({ ...form, overallNotes: e.target.value })} rows={3} /></div>
              <Button onClick={() => {
                if (!form.propertyId || !form.scheduledDate) { toast.error("Preencha os campos obrigatórios"); return; }
                createMutation.mutate({ ...form, scheduledDate: new Date(form.scheduledDate).getTime() });
              }} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar vistorias..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma vistoria encontrada.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((i) => {
            const prop = propertiesList?.find(p => p.id === i.propertyId);
            return (
              <Card key={i.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="h-5 w-5 text-chart-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{prop?.title ?? `Imóvel #${i.propertyId}`}</h3>
                          <Badge className={statusColors[i.status]}>{statusLabels[i.status]}</Badge>
                          <Badge variant="outline">{typeLabels[i.type ?? "periodic"]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(i.scheduledDate).toLocaleDateString("pt-BR")} às {new Date(i.scheduledDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {i.generalCondition && <p className="text-xs text-muted-foreground mt-1">Condição: {conditionLabels[i.generalCondition]}</p>}
                      </div>
                    </div>
                    <Select value={i.status} onValueChange={(v: any) => updateMutation.mutate({ id: i.id, status: v })}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendada</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
