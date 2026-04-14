import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Receipt, Wrench, FileText, Loader2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";

const tenantNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/tenant" },
  { icon: Receipt, label: "Boletos", path: "/tenant/payments" },
  { icon: Wrench, label: "Manutenções", path: "/tenant/maintenance" },
  { icon: FileText, label: "Contrato", path: "/tenant/contract" },
];

export default function TenantDashboard() {
  return (
    <PortalLayout navItems={tenantNav} portalTitle="Portal Inquilino" portalRole="Inquilino" requiredRole="tenant">
      <TenantDashboardContent />
    </PortalLayout>
  );
}

function TenantDashboardContent() {
  const { data: tenant, isLoading: loadingTenant } = trpc.tenants.getMyProfile.useQuery();
  const { data: payments, isLoading: loadingPayments } = trpc.financial.listPaymentsByTenant.useQuery(
    { tenantId: tenant?.id ?? 0 },
    { enabled: !!tenant?.id }
  );
  const { data: maintenances } = trpc.maintenances.listMyRequests.useQuery();
  const [, setLocation] = useLocation();

  if (loadingTenant) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!tenant) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-semibold">Perfil não encontrado</h2>
        <p className="text-muted-foreground">O seu perfil de inquilino ainda não foi vinculado. Contacte a imobiliária.</p>
      </div>
    );
  }

  const pendingPayments = payments?.filter(p => p.status === "pending" || p.status === "overdue") ?? [];
  const openMaintenances = maintenances?.filter(m => m.status !== "completed" && m.status !== "cancelled") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Olá, {tenant.name}</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao seu portal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/tenant/payments")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pendingPayments.length > 0 ? "bg-warning/10" : "bg-success/10"}`}>
                {pendingPayments.length > 0 ? <AlertTriangle className="h-5 w-5 text-warning" /> : <CheckCircle className="h-5 w-5 text-success" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Boletos Pendentes</p>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/tenant/maintenance")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Manutenções Abertas</p>
                <p className="text-2xl font-bold">{openMaintenances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/tenant/contract")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Contrato</p>
                <p className="text-lg font-bold">Ver Detalhes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      {pendingPayments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Pagamentos Pendentes</h2>
          <div className="grid gap-3">
            {pendingPayments.slice(0, 5).map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-warning" />
                    <div>
                      <p className="font-medium text-sm">Ref: {p.referenceMonth}</p>
                      <p className="text-xs text-muted-foreground">Vencimento: {new Date(p.dueDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <p className="font-bold">R$ {Number(p.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
