import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Receipt, Wrench, FileText, Loader2, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const tenantNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/tenant" },
  { icon: Receipt, label: "Boletos", path: "/tenant/payments" },
  { icon: Wrench, label: "Manutenções", path: "/tenant/maintenance" },
  { icon: FileText, label: "Contrato", path: "/tenant/contract" },
];

const statusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado" };
const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", paid: "bg-success/10 text-success", overdue: "bg-destructive/10 text-destructive", cancelled: "bg-muted text-muted-foreground" };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Boletos e Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Histórico de cobranças e pagamentos</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !payments?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum boleto encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {payments.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.status === "paid" ? "bg-success/10" : p.status === "overdue" ? "bg-destructive/10" : "bg-warning/10"}`}>
                      {p.status === "paid" ? <CheckCircle className="h-5 w-5 text-success" /> : p.status === "overdue" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-warning" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Referência: {p.referenceMonth}</span>
                        <Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Vencimento: {new Date(p.dueDate).toLocaleDateString("pt-BR")}</p>
                      {p.paidAt && <p className="text-xs text-success">Pago em: {new Date(p.paidAt).toLocaleDateString("pt-BR")}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">R$ {Number(p.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    {p.paidAmount && <p className="text-xs text-muted-foreground">Pago: R$ {Number(p.paidAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
