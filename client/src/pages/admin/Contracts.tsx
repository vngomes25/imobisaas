import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InputCurrency, parseCurrency } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Loader2, Search, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", terminated: "Rescindido", pending: "Pendente" };
const statusColors: Record<string, string> = { active: "bg-success/10 text-success", expired: "bg-muted text-muted-foreground", terminated: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };

const emptyForm = {
  propertyId: 0, tenantId: 0, ownerId: 0, status: "active" as const,
  startDate: "", endDate: "", rentValue: "", adminFeePercent: "10",
  condoFee: "", iptuValue: "", paymentDueDay: 10, adjustmentIndex: "IGPM",
  guaranteeType: "none" as const, guaranteeDetails: "", notes: "",
};

export default function AdminContracts() {
  return <AdminLayout><ContractsContent /></AdminLayout>;
}

function ContractsContent() {
  const { data: contracts, isLoading } = trpc.contracts.list.useQuery({});
  const { data: ownersList } = trpc.owners.list.useQuery();
  const { data: tenantsList } = trpc.tenants.list.useQuery();
  const { data: propertiesList } = trpc.properties.list.useQuery({});
  const utils = trpc.useUtils();
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => { utils.contracts.list.invalidate(); toast.success("Contrato criado"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const [form, setForm] = useState(emptyForm);

  const filtered = contracts?.filter(c => {
    const tenant = tenantsList?.find(t => t.id === c.tenantId);
    const property = propertiesList?.find(p => p.id === c.propertyId);
    return tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
      property?.title.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  const handleCreate = () => {
    if (!form.propertyId || !form.tenantId || !form.ownerId || !form.startDate || !form.endDate || !form.rentValue) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    createMutation.mutate({
      ...form,
      startDate: new Date(form.startDate).getTime(),
      endDate: new Date(form.endDate).getTime(),
      rentValue: parseCurrency(form.rentValue) || form.rentValue,
      condoFee: parseCurrency(form.condoFee) || form.condoFee,
      iptuValue: parseCurrency(form.iptuValue) || form.iptuValue,
    });
  };

  const setF = (field: keyof typeof emptyForm) => (val: any) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground mt-1">{contracts?.length ?? 0} contratos</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Contrato</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Contrato de Locação</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">

              {/* Partes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Imóvel *</Label>
                  <Select onValueChange={(v) => {
                    const p = propertiesList?.find(x => x.id === Number(v));
                    setForm(f => ({ ...f, propertyId: Number(v), ownerId: p?.ownerId ?? 0 }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{propertiesList?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inquilino *</Label>
                  <Select onValueChange={(v) => setF("tenantId")(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{tenantsList?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proprietário *</Label>
                  <Select value={form.ownerId ? String(form.ownerId) : ""} onValueChange={(v) => setF("ownerId")(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                    <SelectContent>{ownersList?.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vigência */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vigência</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início *</Label>
                    <Input type="date" value={form.startDate} onChange={(e) => setF("startDate")(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Término *</Label>
                    <Input type="date" value={form.endDate} onChange={(e) => setF("endDate")(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dia de Vencimento</Label>
                    <Input type="number" min={1} max={31} value={form.paymentDueDay}
                      onChange={(e) => setF("paymentDueDay")(Number(e.target.value))} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Índice de Reajuste</Label>
                    <Input value={form.adjustmentIndex} onChange={(e) => setF("adjustmentIndex")(e.target.value)} placeholder="IGPM" />
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valores</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Aluguel (R$) *</Label>
                    <InputCurrency value={form.rentValue} onChange={setF("rentValue")} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Condomínio (R$)</Label>
                    <InputCurrency value={form.condoFee} onChange={setF("condoFee")} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>IPTU (R$)</Label>
                    <InputCurrency value={form.iptuValue} onChange={setF("iptuValue")} placeholder="0,00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxa Administrativa (%)</Label>
                    <Input value={form.adminFeePercent} onChange={(e) => setF("adminFeePercent")(e.target.value)} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Garantia</Label>
                    <Select value={form.guaranteeType} onValueChange={(v: any) => setF("guaranteeType")(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="deposit">Caução</SelectItem>
                        <SelectItem value="guarantor">Fiador</SelectItem>
                        <SelectItem value="insurance">Seguro Fiança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Criar Contrato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por inquilino ou imóvel..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {search ? "Nenhum resultado." : "Nenhum contrato encontrado."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => {
            const tenant = tenantsList?.find(t => t.id === c.tenantId);
            const property = propertiesList?.find(p => p.id === c.propertyId);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/admin/contracts/${c.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-chart-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{property?.title ?? `Imóvel #${c.propertyId}`}</h3>
                          <Badge className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Inquilino: {tenant?.name ?? "-"}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(c.startDate).toLocaleDateString("pt-BR")} — {new Date(c.endDate).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">R$ {Number(c.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">Taxa: {c.adminFeePercent}%</p>
                    </div>
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
