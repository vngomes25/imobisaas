import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Receipt, Wrench, FileText, Loader2, Calendar, Building2 } from "lucide-react";

const tenantNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/tenant" },
  { icon: Receipt, label: "Boletos", path: "/tenant/payments" },
  { icon: Wrench, label: "Manutenções", path: "/tenant/maintenance" },
  { icon: FileText, label: "Contrato", path: "/tenant/contract" },
];

const statusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", terminated: "Rescindido", pending: "Pendente" };
const statusColors: Record<string, string> = { active: "bg-success/10 text-success", expired: "bg-muted text-muted-foreground", terminated: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };

export default function TenantContract() {
  return (
    <PortalLayout navItems={tenantNav} portalTitle="Portal Inquilino" portalRole="Inquilino" requiredRole="tenant">
      <ContractContent />
    </PortalLayout>
  );
}

function ContractContent() {
  const { data: tenant, isLoading: loadingTenant } = trpc.tenants.getMyProfile.useQuery();
  const { data: contracts, isLoading: loadingContracts } = trpc.contracts.listByTenant.useQuery(
    { tenantId: tenant?.id ?? 0 },
    { enabled: !!tenant?.id }
  );

  const isLoading = loadingTenant || loadingContracts;

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!contracts?.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold tracking-tight">Meu Contrato</h1>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum contrato encontrado.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold tracking-tight">Meus Contratos</h1>
      {contracts.map((contract) => (
        <ContractCard key={contract.id} contract={contract} />
      ))}
    </div>
  );
}

function ContractCard({ contract }: { contract: any }) {
  const { data: property } = trpc.properties.getById.useQuery({ id: contract.propertyId }, { enabled: !!contract.propertyId });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Contrato #{contract.id}</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[contract.status]}>{statusLabels[contract.status]}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Início</span><span>{new Date(contract.startDate).toLocaleDateString("pt-BR")}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Término</span><span>{new Date(contract.endDate).toLocaleDateString("pt-BR")}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dia Vencimento</span><span>Dia {contract.paymentDueDay}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Índice Reajuste</span><span>{contract.adjustmentIndex}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Valores</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">Aluguel</span><span className="font-bold text-primary">R$ {Number(contract.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
          {contract.condoFee && <div className="flex justify-between"><span className="text-muted-foreground">Condomínio</span><span>R$ {Number(contract.condoFee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
          {contract.iptuValue && <div className="flex justify-between"><span className="text-muted-foreground">IPTU</span><span>R$ {Number(contract.iptuValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
          {property && (
            <>
              <div className="border-t pt-3 mt-3"><p className="font-medium">{property.title}</p></div>
              {property.addressStreet && <p className="text-muted-foreground">{property.addressStreet}{property.addressNumber ? `, ${property.addressNumber}` : ""} - {property.addressCity}/{property.addressState}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
