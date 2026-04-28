import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Receipt, Wrench, FileText, Loader2,
  CheckCircle, Clock, AlertTriangle, TrendingUp, DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const tenantNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/tenant" },
  { icon: Receipt, label: "Boletos", path: "/tenant/payments" },
  { icon: Wrench, label: "Manutenções", path: "/tenant/maintenance" },
  { icon: FileText, label: "Contrato", path: "/tenant/contract" },
];

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  cancelled: "Cancelado",
};
const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground",
};

export default function TenantPayments() {
  return (
    <PortalLayout navItems={tenantNav} portalTitle="Portal Inquilino" portalRole="Inquilino" requiredRole="tenant">
      <PaymentsContent />
    </PortalLayout>
  );
}

function PaymentsContent() {
  const { data: tenant } = trpc.tenants.getMyProfile.useQuery();
  const { data: payments, isLoading } = trpc.financial.listPaymentsByTenant.useQuery(
    { tenantId: tenant?.id ?? 0 },
    { enabled: !!tenant?.id }
  );

  const totalPaid = payments?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.totalAmount), 0) ?? 0;
  const totalPending = payments?.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.totalAmount), 0) ?? 0;
  const totalOverdue = payments?.filter(p => p.status === "overdue").reduce((s, p) => s + Number(p.totalAmount), 0) ?? 0;
  const countPaid = payments?.filter(p => p.status === "paid").length ?? 0;
  const countPending = payments?.filter(p => p.status === "pending").length ?? 0;
  const countOverdue = payments?.filter(p => p.status === "overdue").length ?? 0;

  // Chart: últimos 6 meses pagos
  const chartData = payments
    ?.filter(p => p.status === "paid" && p.paidAt)
    .reduce((acc: Record<string, number>, p) => {
      const month = new Date(p.paidAt!).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      acc[month] = (acc[month] ?? 0) + Number(p.totalAmount);
      return acc;
    }, {});

  const chartItems = Object.entries(chartData ?? {}).slice(-6).map(([month, valor]) => ({ month, valor }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Boletos e Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Histórico completo de cobranças</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-success/20">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-xl font-bold text-success">{countPaid}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
                <p className="text-xs font-medium mt-1">R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card className="border-warning/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-warning mx-auto mb-1" />
                <p className="text-xl font-bold text-warning">{countPending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xs font-medium mt-1">R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-xl font-bold text-destructive">{countOverdue}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
                <p className="text-xs font-medium mt-1">R$ {totalOverdue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de histórico */}
          {chartItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartItems} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Pago"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="valor" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Lista de cobranças */}
          {!payments?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum boleto encontrado.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Todas as cobranças</h2>
              {payments.sort((a, b) => b.dueDate - a.dueDate).map((p) => (
                <Card key={p.id} className={`transition-shadow hover:shadow-md border ${statusColors[p.status]?.includes("border") ? "" : "border-border"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                          ${p.status === "paid" ? "bg-success/10" : p.status === "overdue" ? "bg-destructive/10" : "bg-warning/10"}`}>
                          {p.status === "paid"
                            ? <CheckCircle className="h-4 w-4 text-success" />
                            : p.status === "overdue"
                            ? <AlertTriangle className="h-4 w-4 text-destructive" />
                            : <Clock className="h-4 w-4 text-warning" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{p.referenceMonth}</span>
                            <Badge variant="outline" className={`text-[11px] h-5 ${statusColors[p.status]}`}>
                              {statusLabels[p.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vencimento: {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                          {p.paidAt && (
                            <p className="text-xs text-success mt-0.5">
                              Pago em: {new Date(p.paidAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold">
                          R$ {Number(p.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        {p.paidAmount && Number(p.paidAmount) !== Number(p.totalAmount) && (
                          <p className="text-xs text-muted-foreground">
                            Pago: R$ {Number(p.paidAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
