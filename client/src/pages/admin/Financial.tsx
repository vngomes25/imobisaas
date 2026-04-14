import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Loader2, CheckCircle, Clock, AlertTriangle, ArrowRightLeft,
  Receipt, Download, Printer, User, Building2, Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const paymentStatusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado" };
const paymentStatusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", paid: "bg-success/10 text-success", overdue: "bg-destructive/10 text-destructive", cancelled: "bg-muted text-muted-foreground" };
const transferStatusLabels: Record<string, string> = { pending: "Pendente", completed: "Concluído" };
const transferStatusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", completed: "bg-success/10 text-success" };

function exportCSV(payments: any[]) {
  const header = ["Ref. Mês", "Inquilino", "Proprietário", "Imóvel", "Vencimento", "Total", "Repasse", "Status", "Pago Em", "Valor Pago"];
  const rows = payments.map(p => [
    p.referenceMonth,
    p.tenantName ?? p.tenantId,
    p.ownerName ?? p.ownerId,
    p.propertyTitle ?? "",
    new Date(p.dueDate).toLocaleDateString("pt-BR"),
    Number(p.totalAmount).toFixed(2).replace(".", ","),
    Number(p.ownerTransferAmount).toFixed(2).replace(".", ","),
    paymentStatusLabels[p.status] ?? p.status,
    p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "",
    p.paidAmount ? Number(p.paidAmount).toFixed(2).replace(".", ",") : "",
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cobranças_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReceipt(p: any, agencyName: string) {
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  const paid = p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "—";
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Recibo de Pagamento</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #555; font-weight: normal; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  td { padding: 8px 12px; border: 1px solid #ddd; font-size: 14px; }
  td:first-child { font-weight: bold; width: 40%; background: #f9f9f9; }
  .total { font-size: 18px; font-weight: bold; color: #15803d; }
  .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 16px; }
  @media print { button { display: none; } }
</style></head><body>
<button onclick="window.print()" style="margin-bottom:20px;padding:8px 16px;background:#0f172a;color:#fff;border:none;border-radius:6px;cursor:pointer;">🖨️ Imprimir</button>
<h1>${agencyName}</h1>
<h2>Recibo de Pagamento de Aluguel</h2>
<table>
  <tr><td>Referência</td><td>${p.referenceMonth}</td></tr>
  <tr><td>Inquilino</td><td>${p.tenantName ?? p.tenantId}</td></tr>
  <tr><td>Imóvel</td><td>${p.propertyTitle ?? "—"}</td></tr>
  <tr><td>Vencimento</td><td>${new Date(p.dueDate).toLocaleDateString("pt-BR")}</td></tr>
  <tr><td>Aluguel</td><td>R$ ${Number(p.rentAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
  ${p.condoAmount && Number(p.condoAmount) > 0 ? `<tr><td>Condomínio</td><td>R$ ${Number(p.condoAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>` : ""}
  ${p.iptuAmount && Number(p.iptuAmount) > 0 ? `<tr><td>IPTU</td><td>R$ ${Number(p.iptuAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>` : ""}
  <tr><td class="total">Total</td><td class="total">R$ ${Number(p.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
  <tr><td>Data do Pagamento</td><td>${paid}</td></tr>
  <tr><td>Valor Pago</td><td>${p.paidAmount ? "R$ " + Number(p.paidAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—"}</td></tr>
</table>
<div class="footer">Documento gerado em ${new Date().toLocaleString("pt-BR")} · ${agencyName}</div>
</body></html>`);
  win.document.close();
}

export default function AdminFinancial() {
  return <AdminLayout><FinancialContent /></AdminLayout>;
}

function FinancialContent() {
  const { data: payments, isLoading: loadingPayments } = trpc.financial.listPayments.useQuery({});
  const { data: transfers, isLoading: loadingTransfers } = trpc.financial.listTransfers.useQuery({});
  const { data: settings } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const generateMutation = trpc.financial.generateMonthlyPayments.useMutation({
    onSuccess: (data) => { utils.financial.listPayments.invalidate(); toast.success(`${data.generated} cobranças geradas`); },
    onError: (e) => toast.error(e.message),
  });
  const markPaidMutation = trpc.financial.markAsPaid.useMutation({
    onSuccess: () => { utils.financial.listPayments.invalidate(); utils.financial.listTransfers.invalidate(); toast.success("Pagamento registrado"); setPayDialog(null); },
    onError: (e) => toast.error(e.message),
  });
  const markTransferMutation = trpc.financial.markTransferCompleted.useMutation({
    onSuccess: () => { utils.financial.listTransfers.invalidate(); toast.success("Repasse concluído"); },
    onError: (e) => toast.error(e.message),
  });
  const cancelPaymentMutation = trpc.financial.cancelPayment.useMutation({
    onSuccess: () => { utils.financial.listPayments.invalidate(); toast.success("Cobrança cancelada"); },
    onError: (e) => toast.error(e.message),
  });

  const [refMonth, setRefMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payDialog, setPayDialog] = useState<any | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const agencyName = settings?.agencyName ?? "Imobiliária";

  const filteredPayments = payments?.filter(p => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || (p.tenantName ?? "").toLowerCase().includes(q) ||
      (p.ownerName ?? "").toLowerCase().includes(q) ||
      (p.propertyTitle ?? "").toLowerCase().includes(q) ||
      p.referenceMonth.includes(q);
    return matchesStatus && matchesSearch;
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Cobranças, pagamentos e repasses</p>
        </div>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments"><Receipt className="h-4 w-4 mr-2" />Cobranças</TabsTrigger>
          <TabsTrigger value="transfers"><ArrowRightLeft className="h-4 w-4 mr-2" />Repasses</TabsTrigger>
        </TabsList>

        {/* ── Cobranças ── */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Mês de Referência</Label>
                  <Input type="month" value={refMonth} onChange={(e) => setRefMonth(e.target.value)} className="w-48" />
                </div>
                <Button onClick={() => generateMutation.mutate({ referenceMonth: refMonth })} disabled={generateMutation.isPending}>
                  {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Gerar Cobranças
                </Button>
                <Button variant="outline" onClick={() => payments && exportCSV(payments)} disabled={!payments?.length}>
                  <Download className="h-4 w-4 mr-2" />Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por inquilino, imóvel..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingPayments ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !filteredPayments.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma cobrança encontrada.</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {filteredPayments.map((p) => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.status === "paid" ? "bg-success/10" : p.status === "overdue" ? "bg-destructive/10" : "bg-warning/10"}`}>
                          {p.status === "paid" ? <CheckCircle className="h-5 w-5 text-success" /> : p.status === "overdue" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-warning" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">Ref: {p.referenceMonth}</span>
                            <Badge className={paymentStatusColors[p.status]}>{paymentStatusLabels[p.status]}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                            {(p as any).tenantName && (
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{(p as any).tenantName}</span>
                            )}
                            {(p as any).propertyTitle && (
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{(p as any).propertyTitle}</span>
                            )}
                            <span>Venc: {new Date(p.dueDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-right">
                          <p className="text-lg font-bold">R$ {Number(p.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">Repasse: R$ {Number(p.ownerTransferAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex gap-1">
                          {p.status === "paid" && (
                            <Button size="sm" variant="outline" onClick={() => printReceipt(p, agencyName)} title="Imprimir recibo">
                              <Printer className="h-4 w-4" />
                            </Button>
                          )}
                          {(p.status === "pending" || p.status === "overdue") && (
                            <>
                              <Button size="sm" onClick={() => { setPaidAmount(p.totalAmount); setPayDialog(p); }}>
                                Registrar Pgto
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => { if (confirm("Cancelar esta cobrança?")) cancelPaymentMutation.mutate({ id: p.id }); }}>
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Repasses ── */}
        <TabsContent value="transfers" className="space-y-4 mt-4">
          {loadingTransfers ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !transfers?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum repasse encontrado.</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {transfers.map((t) => (
                <Card key={t.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                          <ArrowRightLeft className="h-5 w-5 text-chart-2" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{(t as any).ownerName ?? `Proprietário #${t.ownerId}`}</span>
                            <Badge className={transferStatusColors[t.status]}>{transferStatusLabels[t.status]}</Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                            {(t as any).ownerPixKey && (
                              <span>PIX: {(t as any).ownerPixKey}</span>
                            )}
                            <span>Repasse #{t.id}</span>
                            {t.transferredAt && (
                              <span>Transferido em: {new Date(t.transferredAt).toLocaleDateString("pt-BR")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold">R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        {t.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => markTransferMutation.mutate({ id: t.id })}
                            disabled={markTransferMutation.isPending}>
                            {markTransferMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pay dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="font-medium">Inquilino:</span> {(payDialog as any).tenantName ?? "—"}</p>
                <p><span className="font-medium">Imóvel:</span> {(payDialog as any).propertyTitle ?? "—"}</p>
                <p><span className="font-medium">Referência:</span> {payDialog.referenceMonth}</p>
                <p><span className="font-medium">Vencimento:</span> {new Date(payDialog.dueDate).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="space-y-2">
                <Label>Valor Pago (R$)</Label>
                <Input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => { if (payDialog) markPaidMutation.mutate({ id: payDialog.id, paidAmount }); }} disabled={markPaidMutation.isPending}>
                {markPaidMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirmar Pagamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
