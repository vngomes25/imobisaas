import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Building2, DollarSign, FileText, Loader2, ArrowRightLeft, CheckCircle, Clock } from "lucide-react";

const ownerNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/owner" },
  { icon: Building2, label: "Imóveis", path: "/owner/properties" },
  { icon: DollarSign, label: "Financeiro", path: "/owner/financial" },
  { icon: FileText, label: "Contratos", path: "/owner/contracts" },
];

const transferStatusLabels: Record<string, string> = { pending: "Pendente", completed: "Concluído" };
const transferStatusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", completed: "bg-success/10 text-success" };

export default function OwnerFinancial() {
  return (
    <PortalLayout navItems={ownerNav} portalTitle="Portal Proprietário" portalRole="Proprietário" requiredRole="owner">
      <FinancialContent />
    </PortalLayout>
  );
}

function FinancialContent() {
  const { data: owner, isLoading: loadingOwner } = trpc.owners.getMyProfile.useQuery();
  const { data: transfers, isLoading } = trpc.financial.listTransfersByOwner.useQuery(
    { ownerId: owner?.id ?? 0 },
    { enabled: !!owner?.id }
  );

  if (loadingOwner || isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const totalReceived = transfers?.filter(t => t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const totalPending = transfers?.filter(t => t.status === "pending").reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Extrato Financeiro</h1>
        <p className="text-muted-foreground mt-1">Repasses e movimentações</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Recebido</p>
                <p className="text-2xl font-bold text-success">R$ {totalReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pendente</p>
                <p className="text-2xl font-bold text-warning">R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!transfers?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum repasse encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {transfers.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.status === "completed" ? "bg-success/10" : "bg-warning/10"}`}>
                      {t.status === "completed" ? <CheckCircle className="h-5 w-5 text-success" /> : <Clock className="h-5 w-5 text-warning" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Repasse #{t.id}</span>
                        <Badge className={transferStatusColors[t.status]}>{transferStatusLabels[t.status]}</Badge>
                      </div>
                      {t.transferredAt && <p className="text-xs text-muted-foreground mt-1">Transferido em: {new Date(t.transferredAt).toLocaleDateString("pt-BR")}</p>}
                    </div>
                  </div>
                  <p className="text-lg font-bold">R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
