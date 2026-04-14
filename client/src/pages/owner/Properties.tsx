import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, Building2, DollarSign, FileText, Loader2, MapPin, Bed, Bath, Car } from "lucide-react";

const ownerNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/owner" },
  { icon: Building2, label: "Imóveis", path: "/owner/properties" },
  { icon: DollarSign, label: "Financeiro", path: "/owner/financial" },
  { icon: FileText, label: "Contratos", path: "/owner/contracts" },
];

const statusLabels: Record<string, string> = { available: "Disponível", rented: "Alugado", maintenance: "Manutenção" };
const statusColors: Record<string, string> = { available: "bg-success/10 text-success", rented: "bg-primary/10 text-primary", maintenance: "bg-warning/10 text-warning" };

export default function OwnerProperties() {
  return (
    <PortalLayout navItems={ownerNav} portalTitle="Portal Proprietário" portalRole="Proprietário" requiredRole="owner">
      <PropertiesContent />
    </PortalLayout>
  );
}

function PropertiesContent() {
  const { data: owner, isLoading: loadingOwner } = trpc.owners.getMyProfile.useQuery();
  const { data: properties, isLoading } = trpc.properties.listByOwner.useQuery(
    { ownerId: owner?.id ?? 0 },
    { enabled: !!owner?.id }
  );

  if (loadingOwner || isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Meus Imóveis</h1>
        <p className="text-muted-foreground mt-1">{properties?.length ?? 0} imóveis</p>
      </div>

      {!properties?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum imóvel encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {properties.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{p.title}</h3>
                        <Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                      </div>
                      {p.addressStreet && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{p.addressStreet}{p.addressNumber ? `, ${p.addressNumber}` : ""} - {p.addressCity}/{p.addressState}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {(p.bedrooms ?? 0) > 0 && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms}</span>}
                        {(p.bathrooms ?? 0) > 0 && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
                        {(p.parkingSpaces ?? 0) > 0 && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{p.parkingSpaces}</span>}
                      </div>
                    </div>
                  </div>
                  {p.rentValue && (
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">R$ {Number(p.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">/ mês</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
