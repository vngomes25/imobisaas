import AdminLayout from "@/components/AdminLayout";
import DocumentManager from "@/components/DocumentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputCurrency, initCurrency, parseCurrency } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Loader2, Pencil, DollarSign, RefreshCw, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", terminated: "Rescindido", pending: "Pendente" };
const statusColors: Record<string, string> = { active: "bg-success/10 text-success", expired: "bg-muted text-muted-foreground", terminated: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };
const guaranteeLabels: Record<string, string> = { none: "Nenhuma", deposit: "Caução", guarantor: "Fiador", insurance: "Seguro Fiança" };
const paymentStatusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado" };
const paymentStatusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", paid: "bg-success/10 text-success", overdue: "bg-destructive/10 text-destructive", cancelled: "bg-muted text-muted-foreground" };

export default function AdminContractDetail() {
  return <AdminLayout><ContractDetailContent /></AdminLayout>;
}

function ContractDetailContent() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: contract, isLoading } = trpc.contracts.getById.useQuery({ id }, { enabled: !!id });
  const { data: owner } = trpc.owners.getById.useQuery({ id: contract?.ownerId ?? 0 }, { enabled: !!contract?.ownerId });
  const { data: tenant } = trpc.tenants.getById.useQuery({ id: contract?.tenantId ?? 0 }, { enabled: !!contract?.tenantId });
  const { data: property } = trpc.properties.getById.useQuery({ id: contract?.propertyId ?? 0 }, { enabled: !!contract?.propertyId });
  const { data: payments } = trpc.financial.listPayments.useQuery({ contractId: id }, { enabled: !!id });
  const utils = trpc.useUtils();

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => { utils.contracts.getById.invalidate({ id }); toast.success("Contrato atualizado"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const renewMutation = trpc.contracts.renew.useMutation({
    onSuccess: () => { utils.contracts.getById.invalidate({ id }); toast.success("Contrato renovado com sucesso"); setRenewOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const [, setLocation] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [renewForm, setRenewForm] = useState({ endDate: "", rentValue: "", adjustmentPercent: "" });

  const openEdit = () => {
    if (!contract) return;
    setEditForm({
      status: contract.status,
      rentValue: initCurrency(contract.rentValue),
      adminFeePercent: contract.adminFeePercent,
      condoFee: initCurrency(contract.condoFee),
      iptuValue: initCurrency(contract.iptuValue),
      paymentDueDay: contract.paymentDueDay,
      adjustmentIndex: contract.adjustmentIndex,
      guaranteeType: contract.guaranteeType ?? "none",
      guaranteeDetails: contract.guaranteeDetails ?? "",
      notes: contract.notes ?? "",
    });
    setEditOpen(true);
  };

  const openRenew = () => {
    if (!contract) return;
    const currentEnd = new Date(contract.endDate);
    const newEnd = new Date(currentEnd);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    setRenewForm({
      endDate: newEnd.toISOString().split("T")[0],
      rentValue: initCurrency(contract.rentValue),
      adjustmentPercent: "",
    });
    setRenewOpen(true);
  };

  const applyAdjustment = () => {
    if (!contract || !renewForm.adjustmentPercent) return;
    const pct = parseFloat(renewForm.adjustmentPercent.replace(",", "."));
    if (isNaN(pct)) return;
    const base = parseFloat(parseCurrency(renewForm.rentValue) || contract.rentValue);
    const newValue = (base * (1 + pct / 100)).toFixed(2);
    setRenewForm(f => ({ ...f, rentValue: initCurrency(newValue) }));
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!contract) return <div className="text-center py-20 text-muted-foreground">Contrato não encontrado.</div>;

  const totalPaid = payments?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.paidAmount || p.totalAmount), 0) ?? 0;
  const totalPending = payments?.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + Number(p.totalAmount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/contracts")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Contrato #{contract.id}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[contract.status]}>{statusLabels[contract.status]}</Badge>
              {property && <span className="text-sm text-muted-foreground">{property.title}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === "active" && (
            <Button variant="outline" onClick={openRenew}><RefreshCw className="h-4 w-4 mr-2" />Renovar</Button>
          )}
          <Button variant="outline" onClick={openEdit}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details"><FileText className="h-4 w-4 mr-2" />Detalhes</TabsTrigger>
          <TabsTrigger value="payments"><DollarSign className="h-4 w-4 mr-2" />Pagamentos ({payments?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Imóvel</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{property?.title ?? "-"}</p>
                {property?.addressStreet && <p className="text-muted-foreground">{property.addressStreet}{property.addressNumber ? `, ${property.addressNumber}` : ""} - {property.addressCity}/{property.addressState}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Partes</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Proprietário</span><span className="font-medium">{owner?.name ?? "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Inquilino</span><span className="font-medium">{tenant?.name ?? "-"}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Vigência</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Início</span><span>{new Date(contract.startDate).toLocaleDateString("pt-BR")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Término</span><span>{new Date(contract.endDate).toLocaleDateString("pt-BR")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dia Vencimento</span><span>Dia {contract.paymentDueDay}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Índice Reajuste</span><span>{contract.adjustmentIndex}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Valores</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Aluguel</span><span className="font-bold text-primary">R$ {Number(contract.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxa Administrativa</span><span>{contract.adminFeePercent}%</span></div>
                {contract.condoFee && <div className="flex justify-between"><span className="text-muted-foreground">Condomínio</span><span>R$ {Number(contract.condoFee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
                {contract.iptuValue && <div className="flex justify-between"><span className="text-muted-foreground">IPTU</span><span>R$ {Number(contract.iptuValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
                <div className="border-t pt-2 flex justify-between"><span className="text-muted-foreground">Garantia</span><span>{guaranteeLabels[contract.guaranteeType ?? "none"]}</span></div>
                {contract.guaranteeDetails && <div className="flex justify-between"><span className="text-muted-foreground">Detalhes Garantia</span><span>{contract.guaranteeDetails}</span></div>}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Resumo Financeiro</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-success/5 border border-success/10">
                    <p className="text-2xl font-bold text-success">R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Recebido</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/10">
                    <p className="text-2xl font-bold text-warning">R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pendente</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-2xl font-bold text-primary">{payments?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Cobranças</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-3">
          {!payments?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum pagamento para este contrato.</CardContent></Card>
          ) : payments.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.status === "paid" ? "bg-success/10" : p.status === "overdue" ? "bg-destructive/10" : "bg-warning/10"}`}>
                      {p.status === "paid" ? <CheckCircle className="h-5 w-5 text-success" /> : p.status === "overdue" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-warning" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Ref: {p.referenceMonth}</span>
                        <Badge className={paymentStatusColors[p.status]}>{paymentStatusLabels[p.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Vencimento: {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                        {p.paidAt && <span className="ml-2">| Pago em: {new Date(p.paidAt).toLocaleDateString("pt-BR")}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">R$ {Number(p.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    {p.paidAmount && <p className="text-xs text-success">Pago: R$ {Number(p.paidAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentManager entityType="contract" entityId={id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="terminated">Rescindido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Dia Vencimento</Label><Input type="number" min={1} max={31} value={editForm.paymentDueDay ?? 10} onChange={(e) => setEditForm({ ...editForm, paymentDueDay: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Aluguel (R$)</Label><InputCurrency value={editForm.rentValue ?? ""} onChange={(v) => setEditForm({ ...editForm, rentValue: v })} /></div>
              <div className="space-y-2"><Label>Taxa Admin (%)</Label><Input value={editForm.adminFeePercent ?? ""} onChange={(e) => setEditForm({ ...editForm, adminFeePercent: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Condomínio (R$)</Label><InputCurrency value={editForm.condoFee ?? ""} onChange={(v) => setEditForm({ ...editForm, condoFee: v })} /></div>
              <div className="space-y-2"><Label>IPTU (R$)</Label><InputCurrency value={editForm.iptuValue ?? ""} onChange={(v) => setEditForm({ ...editForm, iptuValue: v })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Índice Reajuste</Label><Input value={editForm.adjustmentIndex ?? ""} onChange={(e) => setEditForm({ ...editForm, adjustmentIndex: e.target.value })} /></div>
              <div className="space-y-2"><Label>Garantia</Label>
                <Select value={editForm.guaranteeType ?? "none"} onValueChange={(v) => setEditForm({ ...editForm, guaranteeType: v })}>
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
            <Button onClick={() => updateMutation.mutate({
              id, ...editForm,
              rentValue: parseCurrency(editForm.rentValue) || editForm.rentValue,
              condoFee: parseCurrency(editForm.condoFee) || editForm.condoFee,
              iptuValue: parseCurrency(editForm.iptuValue) || editForm.iptuValue,
            })} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renovar Contrato</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p><span className="font-medium">Aluguel atual:</span> R$ {Number(contract?.rentValue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p><span className="font-medium">Término atual:</span> {contract ? new Date(contract.endDate).toLocaleDateString("pt-BR") : "—"}</p>
              <p><span className="font-medium">Índice contratual:</span> {contract?.adjustmentIndex ?? "IGPM"}</p>
            </div>

            {/* IGPM Calculator */}
            <div className="space-y-2">
              <Label>Calcular Reajuste ({contract?.adjustmentIndex ?? "IGPM"}) %</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 5.12"
                  value={renewForm.adjustmentPercent}
                  onChange={(e) => setRenewForm(f => ({ ...f, adjustmentPercent: e.target.value }))}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={applyAdjustment}>Aplicar</Button>
              </div>
              <p className="text-xs text-muted-foreground">Informe o percentual do índice e clique em Aplicar para calcular o novo valor automaticamente.</p>
            </div>

            <div className="space-y-2">
              <Label>Nova Data de Término *</Label>
              <Input type="date" value={renewForm.endDate} onChange={(e) => setRenewForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Novo Valor do Aluguel (R$) *</Label>
              <InputCurrency value={renewForm.rentValue} onChange={(v) => setRenewForm(f => ({ ...f, rentValue: v }))} />
            </div>

            <Button onClick={() => {
              if (!renewForm.endDate || !renewForm.rentValue) { toast.error("Preencha todos os campos"); return; }
              const rentRaw = parseCurrency(renewForm.rentValue) || renewForm.rentValue;
              renewMutation.mutate({ id, newEndDate: new Date(renewForm.endDate).getTime(), newRentValue: rentRaw });
            }} disabled={renewMutation.isPending} className="w-full">
              {renewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirmar Renovação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
