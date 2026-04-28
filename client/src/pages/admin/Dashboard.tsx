import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Building2, FileText, DollarSign, AlertTriangle, Users, UserCheck,
  Wrench, ArrowRight, Home, Loader2, CalendarClock, TrendingUp, PieChartIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

  // Monthly revenue + overdue combined chart
  const allMonths = Array.from(new Set([
    ...(stats?.monthlyRevenue ?? []).map(r => r.month),
    ...(stats?.monthlyOverdue ?? []).map(r => r.month),
  ])).sort();

  const chartData = allMonths.map(month => ({
    month: month.slice(5) + "/" + month.slice(2, 4),
    receita: parseFloat(stats?.monthlyRevenue?.find(r => r.month === month)?.revenue ?? "0"),
    inadimplencia: parseFloat(stats?.monthlyOverdue?.find(r => r.month === month)?.overdue ?? "0"),
  }));

  // Occupancy pie chart
  const occupancyData = [
    { name: "Alugados", value: stats?.rentedProperties ?? 0, color: "hsl(var(--primary))" },
    { name: "Vagos", value: stats?.availableProperties ?? 0, color: "hsl(var(--muted-foreground))" },
    { name: "Manutenção", value: stats?.maintenanceProperties ?? 0, color: "hsl(var(--warning))" },
  ].filter(d => d.value > 0);

  // Current month payments pie
  const cm = stats?.currentMonthPayments;
  const paymentStatusData = [
    { name: "Recebido", value: cm?.paidAmount ?? 0, color: "hsl(var(--success))" },
    { name: "Pendente", value: cm?.pendingAmount ?? 0, color: "hsl(var(--warning))" },
    { name: "Inadimplente", value: cm?.overdueAmount ?? 0, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

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

      {/* Charts Row */}
      {(chartData.length > 0 || occupancyData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue + Overdue Chart */}
          {chartData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Receita vs Inadimplência (últimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        name === "receita" ? "Receita" : "Inadimplência",
                      ]}
                      contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    />
                    <Legend formatter={(v) => v === "receita" ? "Receita" : "Inadimplência"} />
                    <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inadimplencia" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Occupancy Pie */}
          {occupancyData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Ocupação dos Imóveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                      labelLine={false}
                    >
                      {occupancyData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number, name) => [v, name]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Current Month Payments */}
      {paymentStatusData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-success" />
              Cobranças do Mês Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Recebido", count: cm?.paid ?? 0, amount: cm?.paidAmount ?? 0, color: "text-success" },
                { label: "Pendente", count: cm?.pending ?? 0, amount: cm?.pendingAmount ?? 0, color: "text-warning" },
                { label: "Inadimplente", count: cm?.overdue ?? 0, amount: cm?.overdueAmount ?? 0, color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  <p className="text-xs font-medium mt-1">
                    R$ {s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={16}>
              <BarChart data={[{ recebido: cm?.paidAmount ?? 0, pendente: cm?.pendingAmount ?? 0, inadimplente: cm?.overdueAmount ?? 0 }]}
                layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="recebido" fill="hsl(var(--success))" stackId="a" radius={[4, 0, 0, 4]} />
                <Bar dataKey="pendente" fill="hsl(var(--warning))" stackId="a" />
                <Bar dataKey="inadimplente" fill="hsl(var(--destructive))" stackId="a" radius={[0, 4, 4, 0]} />
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
