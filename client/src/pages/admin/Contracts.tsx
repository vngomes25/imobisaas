import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InputCurrency, parseCurrency, initCurrency } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Loader2, Search, Calendar, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", terminated: "Rescindido", pending: "Pendente" };
const statusColors: Record<string, string> = { active: "bg-success/10 text-success", expired: "bg-muted text-muted-foreground", terminated: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };

function toInputDate(brDate: string): string {
  // "DD/MM/AAAA" -> "AAAA-MM-DD"
  const parts = brDate.replace(/[^\d/]/g, "").split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return "";
}

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
    onSuccess: () => { utils.contracts.list.invalidate(); toast.success("Contrato criado"); setOpen(false); setForm(emptyForm); setAiPreview(null); },
    onError: (e) => toast.error(e.message),
  });
  const readFromImageMutation = trpc.contracts.readFromImage.useMutation({
    onSuccess: (data) => {
      setAiPreview(data);
      // Pre-fill form fields that can be directly mapped
      setForm(f => ({
        ...f,
        startDate: data.startDate ? toInputDate(data.startDate) : f.startDate,
        endDate: data.endDate ? toInputDate(data.endDate) : f.endDate,
        rentValue: data.rentValue ? initCurrency(data.rentValue.replace(",", ".")) : f.rentValue,
        condoFee: data.condoFee ? initCurrency(data.condoFee.replace(",", ".")) : f.condoFee,
        iptuValue: data.iptuValue ? initCurrency(data.iptuValue.replace(",", ".")) : f.iptuValue,
        notes: data.observations || f.notes,
      }));
      // Try to match tenant by name
      if (data.tenantName && tenantsList) {
        const match = tenantsList.find(t => t.name.toLowerCase().includes(data.tenantName.toLowerCase().split(" ")[0]));
        if (match) setForm(f => ({ ...f, tenantId: match.id }));
      }
      // Try to match owner by name
      if (data.ownerName && ownersList) {
        const match = ownersList.find(o => o.name.toLowerCase().includes(data.ownerName.toLowerCase().split(" ")[0]));
        if (match) setForm(f => ({ ...f, ownerId: match.id }));
      }
      toast.success("Contrato lido com sucesso! Revise os campos.");
    },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const [form, setForm] = useState(emptyForm);
  const [aiPreview, setAiPreview] = useState<null | Record<string, string>>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast.error("Use uma imagem JPG, PNG ou WEBP."); return;
      }
      readFromImageMutation.mutate({ imageBase64: base64, mediaType });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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

              {/* IA: Ler contrato por foto */}
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Preencher com IA</p>
                  <span className="text-xs text-muted-foreground">— Tire uma foto do contrato e a IA preenche os campos automaticamente</span>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  disabled={readFromImageMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {readFromImageMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Lendo contrato...</>
                    : <><Upload className="h-4 w-4 mr-2" />Enviar foto do contrato</>}
                </Button>

                {aiPreview && (
                  <div className="bg-background rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados extraídos pela IA</p>
                      <button onClick={() => setAiPreview(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {[
                        ["Inquilino", aiPreview.tenantName],
                        ["Proprietário", aiPreview.ownerName],
                        ["Endereço", aiPreview.propertyAddress],
                        ["Aluguel", aiPreview.rentValue ? `R$ ${aiPreview.rentValue}` : ""],
                        ["Início", aiPreview.startDate],
                        ["Término", aiPreview.endDate],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label as string}>
                          <span className="text-muted-foreground">{label}: </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Campos compatíveis foram pré-preenchidos. Revise antes de salvar.</p>
                  </div>
                )}
              </div>

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
