import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Building2, DollarSign, FileText, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

const ownerNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/owner" },
  { icon: Building2, label: "Imóveis", path: "/owner/properties" },
  { icon: DollarSign, label: "Financeiro", path: "/owner/financial" },
  { icon: FileText, label: "Contratos", path: "/owner/contracts" },
];

export default function OwnerDashboard() {
  return (
    <PortalLayout navItems={ownerNav} portalTitle="Portal Proprietário" portalRole="Proprietário" requiredRole="owner">
      <OwnerDashboardContent />
    </PortalLayout>
  );
}

function OwnerDashboardContent() {
  const { data: owner, isLoading } = trpc.owners.getMyProfile.useQuery();
  const { data: properties } = trpc.properties.listByOwner.useQuery(
    { ownerId: owner?.id ?? 0 },
    { enabled: !!owner?.id }
  );
  const { data: contracts } = trpc.contracts.listByOwner.useQuery(
    { ownerId: owner?.id ?? 0 },
    { enabled: !!owner?.id }
  );
  const { data: transfers } = trpc.financial.listTransfersByOwner.useQuery(
    { ownerId: owner?.id ?? 0 },
    { enabled: !!owner?.id }
  );
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!owner) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-semibold">Perfil não encontrado</h2>
        <p className="text-muted-foreground">O seu perfil de proprietário ainda não foi vinculado. Contacte a imobiliária.</p>
      </div>
    );
  }

  const activeContracts = contracts?.filter(c => c.status === "active") ?? [];
  const totalTransfers = transfers?.filter(t => t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const pendingTransfers = transfers?.filter(t => t.status === "pending").reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Olá, {owner.name}</h1>
        <p className="text-muted-foreground mt-1">Acompanhe os seus imóveis e repasses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/owner/properties")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Imóveis</p>
                <p className="text-2xl font-bold">{properties?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/owner/contracts")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Contratos Ativos</p>
                <p className="text-2xl font-bold">{activeContracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/owner/financial")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Recebido</p>
                <p className="text-xl font-bold">R$ {totalTransfers.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/owner/financial")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Repasses Pendentes</p>
                <p className="text-xl font-bold">R$ {pendingTransfers.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
