import { trpc } from "@/lib/trpc";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building2, Users, UserCheck, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: properties } = trpc.properties.list.useQuery({}, { enabled: open });
  const { data: owners } = trpc.owners.list.useQuery(undefined, { enabled: open });
  const { data: tenants } = trpc.tenants.list.useQuery(undefined, { enabled: open });
  const { data: contracts } = trpc.contracts.list.useQuery({}, { enabled: open });

  const q = query.toLowerCase();

  const filteredProperties = (properties ?? []).filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.addressCity ?? "").toLowerCase().includes(q) ||
    (p.addressStreet ?? "").toLowerCase().includes(q)
  ).slice(0, 5);

  const filteredOwners = (owners ?? []).filter(o =>
    o.name.toLowerCase().includes(q) ||
    (o.email ?? "").toLowerCase().includes(q) ||
    (o.cpfCnpj ?? "").includes(q)
  ).slice(0, 5);

  const filteredTenants = (tenants ?? []).filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.email ?? "").toLowerCase().includes(q) ||
    (t.cpfCnpj ?? "").includes(q)
  ).slice(0, 5);

  const filteredContracts = (contracts ?? []).filter(c =>
    String(c.id).includes(q) ||
    c.status.includes(q)
  ).slice(0, 5);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery("");
    setLocation(path);
  };

  const hasResults = filteredProperties.length + filteredOwners.length + filteredTenants.length + filteredContracts.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        Buscar...
        <kbd className="ml-2 text-[10px] bg-background border rounded px-1 py-0.5 font-mono">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar imóveis, proprietários, inquilinos..." value={query} onValueChange={setQuery} />
        <CommandList>
          {!hasResults && query.length > 0 && <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>}
          {!hasResults && query.length === 0 && <CommandEmpty>Digite para pesquisar...</CommandEmpty>}

          {filteredProperties.length > 0 && (
            <CommandGroup heading="Imóveis">
              {filteredProperties.map(p => (
                <CommandItem key={p.id} onSelect={() => navigate(`/admin/properties/${p.id}`)} className="gap-3">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    {p.addressCity && <p className="text-xs text-muted-foreground">{p.addressCity}/{p.addressState}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredOwners.length > 0 && (
            <CommandGroup heading="Proprietários">
              {filteredOwners.map(o => (
                <CommandItem key={o.id} onSelect={() => navigate("/admin/owners")} className="gap-3">
                  <Users className="h-4 w-4 text-chart-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.name}</p>
                    {o.email && <p className="text-xs text-muted-foreground">{o.email}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredTenants.length > 0 && (
            <CommandGroup heading="Inquilinos">
              {filteredTenants.map(t => (
                <CommandItem key={t.id} onSelect={() => navigate("/admin/tenants")} className="gap-3">
                  <UserCheck className="h-4 w-4 text-success shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    {t.email && <p className="text-xs text-muted-foreground">{t.email}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredContracts.length > 0 && (
            <CommandGroup heading="Contratos">
              {filteredContracts.map(c => (
                <CommandItem key={c.id} onSelect={() => navigate(`/admin/contracts/${c.id}`)} className="gap-3">
                  <FileText className="h-4 w-4 text-chart-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">Contrato #{c.id}</p>
                    <p className="text-xs text-muted-foreground">Status: {c.status}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
