import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Building2, FileText, DollarSign, AlertTriangle, Users, UserCheck,
  Wrench, ArrowRight, Home, Loader2, CalendarClock, TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}

function DashboardContent() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { title: "Imóveis Totais", value: stats?.totalProperties ?? 0, icon: Building2, color: "text-primary", bg: "bg-primary/10", sub: `${stats?.availableProperties ?? 0} disponíveis` },
    { title: "Contratos Ativos", value: stats?.activeContracts ?? 0, icon: FileText, color: "text-chart-4", bg: "bg-chart-4/10", sub: `${stats?.rentedProperties ?? 0} imóveis alugados` },
    { title: "Receita Total", value: `R$ ${Number(stats?.totalRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-success", bg: "bg-success/10", sub: "Pagamentos recebidos" },
    { title: "Inadimplência", value: stats?.overduePayments ?? 0, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", sub: `${stats?.pendingPayments ?? 0} pendentes` },
    { title: "Proprietários", value: stats?.totalOwners ?? 0, icon: Users, color: "text-chart-2", bg: "bg-chart-2/10" },
    { title: "Inquilinos", value: stats?.totalTenants ?? 0, icon: UserCheck, color: "text-chart-3", bg: "bg-chart-3/10" },
    { title: "Manutenções Abertas", value: stats?.pendingMaintenances ?? 0, icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
    { title: "Imóveis Vagos", value: stats?.availableProperties ?? 0, icon: Home, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  // Alerts
  const alerts = [
    stats?.overduePayments && stats.overduePayments > 0
      ? { type: "destructive", icon: AlertTriangle, msg: `${stats.overduePayments} cobrança${stats.overduePayments > 1 ? "s" : ""} em atraso`, action: () => setLocation("/admin/financial") }
      : null,
    stats?.expiringContracts && stats.expiringContracts > 0
      ? { type: "warning", icon: CalendarClock, msg: `${stats.expiringContracts} contrato${stats.expiringContracts > 1 ? "s" : ""} vencendo nos próximos 60 dias`, action: () => setLocation("/admin/contracts") }
      : null,
    stats?.pendingMaintenances && stats.pendingMaintenances > 0
      ? { type: "info", icon: Wrench, msg: `${stats.pendingMaintenances} manutenção${stats.pendingMaintenances > 1 ? "ões" : ""} pendente${stats.pendingMaintenances > 1 ? "s" : ""}`, action: () => setLocation("/admin/maintenances") }
      : null,
  ].filter(Boolean) as Array<{ type: string; icon: any; msg: string; action: () => void }>;

  const alertColors: Record<string, string> = {
    destructive: "border-destructive/30 bg-destructive/5 text-destructive",
    warning: "border-warning/30 bg-warning/5 text-warning",
    info: "border-primary/30 bg-primary/5 text-primary",
  };

  // Revenue chart data
  const chartData = stats?.monthlyRevenue?.map(r => ({
    month: r.month.slice(5) + "/" + r.month.slice(2, 4),
    receita: parseFloat(r.revenue),
  })) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua imobiliária</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <button
              key={i}
              onClick={a.action}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm font-medium transition-opacity hover:opacity-80 ${alertColors[a.type]}`}
            >
              <a.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{a.msg}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-success" />
              Receita Mensal (últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"]}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction title="Novo Imóvel" icon={Building2} onClick={() => setLocation("/admin/properties")} />
          <QuickAction title="Novo Contrato" icon={FileText} onClick={() => setLocation("/admin/contracts")} />
          <QuickAction title="Gerar Cobranças" icon={DollarSign} onClick={() => setLocation("/admin/financial")} />
          <QuickAction title="Ver Manutenções" icon={Wrench} onClick={() => setLocation("/admin/maintenances")} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, icon: Icon, onClick }: { title: string; icon: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all group text-left w-full"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{title}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
