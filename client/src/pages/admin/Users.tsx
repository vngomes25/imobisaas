import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, UserCog, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = { user: "Usuário", admin: "Administrador", owner: "Proprietário", tenant: "Inquilino" };
const roleColors: Record<string, string> = {
  user: "bg-muted text-muted-foreground",
  admin: "bg-primary/10 text-primary",
  owner: "bg-chart-4/10 text-chart-4",
  tenant: "bg-success/10 text-success",
};

export default function AdminUsers() {
  return <AdminLayout><UsersContent /></AdminLayout>;
}

function UsersContent() {
  const { data: usersList, isLoading } = trpc.users.list.useQuery();
  const { data: ownersList } = trpc.owners.list.useQuery();
  const { data: tenantsList } = trpc.tenants.list.useQuery();
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Papel atualizado com sucesso"); },
    onError: (e) => toast.error(e.message),
  });
  const linkOwnerMutation = trpc.users.linkToOwner.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); utils.owners.list.invalidate(); toast.success("Usuário vinculado ao proprietário"); setLinkDialog(null); },
    onError: (e) => toast.error(e.message),
  });
  const linkTenantMutation = trpc.users.linkToTenant.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); utils.tenants.list.invalidate(); toast.success("Usuário vinculado ao inquilino"); setLinkDialog(null); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [linkDialog, setLinkDialog] = useState<{ userId: number; userName: string | null; mode: "owner" | "tenant" } | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const filtered = usersList?.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleLink = () => {
    if (!linkDialog || !selectedId) { toast.error("Selecione um vínculo"); return; }
    if (linkDialog.mode === "owner") {
      linkOwnerMutation.mutate({ userId: linkDialog.userId, ownerId: Number(selectedId) });
    } else {
      linkTenantMutation.mutate({ userId: linkDialog.userId, tenantId: Number(selectedId) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground mt-1">
          {usersList?.length ?? 0} usuários cadastrados — gerencie papéis e vínculos com proprietários/inquilinos
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum usuário encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{u.name ?? "(sem nome)"}</p>
                        <Badge className={roleColors[u.role]}>{roleLabels[u.role]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{u.email ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {new Date(u.lastSignedIn).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Role selector */}
                    <Select
                      value={u.role}
                      onValueChange={(v: "user" | "admin" | "owner" | "tenant") =>
                        updateRoleMutation.mutate({ id: u.id, role: v })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <UserCog className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="owner">Proprietário</SelectItem>
                        <SelectItem value="tenant">Inquilino</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Link button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedId("");
                        setLinkDialog({
                          userId: u.id,
                          userName: u.name,
                          mode: u.role === "tenant" ? "tenant" : "owner",
                        });
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Vincular
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(o) => { if (!o) setLinkDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular usuário: {linkDialog?.userName ?? "—"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de vínculo</Label>
              <Select
                value={linkDialog?.mode}
                onValueChange={(v: "owner" | "tenant") => {
                  setSelectedId("");
                  setLinkDialog(d => d ? { ...d, mode: v } : d);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Proprietário</SelectItem>
                  <SelectItem value="tenant">Inquilino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {linkDialog?.mode === "owner" ? (
              <div className="space-y-2">
                <Label>Proprietário</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                  <SelectContent>
                    {ownersList?.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Inquilino</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o inquilino" /></SelectTrigger>
                  <SelectContent>
                    {tenantsList?.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Ao vincular, o papel do usuário será automaticamente alterado para{" "}
              <strong>{linkDialog?.mode === "owner" ? "Proprietário" : "Inquilino"}</strong>.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setLinkDialog(null)}>Cancelar</Button>
              <Button
                onClick={handleLink}
                disabled={!selectedId || linkOwnerMutation.isPending || linkTenantMutation.isPending}
              >
                {(linkOwnerMutation.isPending || linkTenantMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirmar Vínculo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
