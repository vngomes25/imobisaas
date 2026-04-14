import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Building2, DollarSign, FileText, Loader2, Calendar } from "lucide-react";

const ownerNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/owner" },
  { icon: Building2, label: "Imóveis", path: "/owner/properties" },
  { icon: DollarSign, label: "Financeiro", path: "/owner/financial" },
  { icon: FileText, label: "Contratos", path: "/owner/contracts" },
];

const statusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", terminated: "Rescindido", pending: "Pendente" };
const statusColors: Record<string, string> = { active: "bg-success/10 text-success", expired: "bg-muted text-muted-foreground", terminated: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };

export default function OwnerContracts() {
  return (
    <PortalLayout navItems={ownerNav} portalTitle="Portal Proprietário" portalRole="Proprietário" requiredRole="owner">
      <ContractsContent />
    </PortalLayout>
  );
}

function ContractsContent() {
  const { data: owner, isLoading: loadingOwner } = trpc.owners.getMyProfile.useQuery();
  const { data: contracts, isLoading } = trpc.contracts.listByOwner.useQuery(
    { ownerId: owner?.id ?? 0 },
    { enabled: !!owner?.id }
  );

  if (loadingOwner || isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Meus Contratos</h1>
        <p className="text-muted-foreground mt-1">{contracts?.length ?? 0} contratos</p>
      </div>

      {!contracts?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum contrato encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((c) => (
            <OwnerContractCard key={c.id} contract={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerContractCard({ contract }: { contract: any }) {
  const { data: property } = trpc.properties.getById.useQuery({ id: contract.propertyId }, { enabled: !!contract.propertyId });
  const { data: tenant } = trpc.tenants.getById.useQuery({ id: contract.tenantId }, { enabled: !!contract.tenantId });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{property?.title ?? `Imóvel #${contract.propertyId}`}</h3>
                <Badge className={statusColors[contract.status]}>{statusLabels[contract.status]}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {tenant && <p>Inquilino: {tenant.name}</p>}
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(contract.startDate).toLocaleDateString("pt-BR")} - {new Date(contract.endDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">R$ {Number(contract.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Taxa: {contract.adminFeePercent}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
