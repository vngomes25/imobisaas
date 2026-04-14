import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputPhone, InputCpfCnpj } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { UserCheck, Plus, Phone, Mail, Loader2, Search, Pencil, Trash2, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const emptyForm = {
  name: "", email: "", phone: "", cpfCnpj: "", address: "",
  emergencyContact: "", emergencyPhone: "", notes: "",
};

export default function AdminTenants() {
  return <AdminLayout><TenantsContent /></AdminLayout>;
}

function TenantsContent() {
  const { data: tenants, isLoading } = trpc.tenants.list.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.tenants.create.useMutation({
    onSuccess: () => { utils.tenants.list.invalidate(); toast.success("Inquilino cadastrado"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.tenants.update.useMutation({
    onSuccess: () => { utils.tenants.list.invalidate(); toast.success("Inquilino atualizado"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.tenants.delete.useMutation({
    onSuccess: () => { utils.tenants.list.invalidate(); toast.success("Inquilino removido"); },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const filtered = tenants?.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.cpfCnpj?.includes(search)
  ) ?? [];

  const openEdit = (t: any) => {
    setEditId(t.id);
    setEditForm({
      name: t.name, email: t.email ?? "", phone: t.phone ?? "",
      cpfCnpj: t.cpfCnpj ?? "", address: t.address ?? "",
      emergencyContact: t.emergencyContact ?? "", emergencyPhone: t.emergencyPhone ?? "",
      notes: t.notes ?? "",
    });
    setEditOpen(true);
  };

  const validateAndCreate = () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    createMutation.mutate(form);
  };

  const validateAndUpdate = () => {
    if (!editForm.name.trim() || !editId) { toast.error("Nome é obrigatório"); return; }
    updateMutation.mutate({ id: editId, ...editForm });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Inquilinos</h1>
          <p className="text-muted-foreground mt-1">{tenants?.length ?? 0} inquilinos cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Inquilino</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Inquilino</DialogTitle></DialogHeader>
            <TenantForm formData={form} setFormData={setForm} isPending={createMutation.isPending}
              label="Cadastrar" onSubmit={validateAndCreate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, e-mail ou CPF..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {search ? "Nenhum resultado." : "Nenhum inquilino cadastrado ainda."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0 text-success font-bold text-sm">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                        {t.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</span>}
                        {t.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span>}
                        {t.cpfCnpj && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{t.cpfCnpj}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Remover ${t.name}?`)) deleteMutation.mutate({ id: t.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Inquilino</DialogTitle></DialogHeader>
          <TenantForm formData={editForm} setFormData={setEditForm} isPending={updateMutation.isPending}
            label="Salvar Alterações" onSubmit={validateAndUpdate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TenantForm({ formData, setFormData, onSubmit, isPending, label }: {
  formData: typeof emptyForm;
  setFormData: (f: typeof emptyForm) => void;
  onSubmit: () => void;
  isPending: boolean;
  label: string;
}) {
  const set = (field: keyof typeof emptyForm) => (val: string) =>
    setFormData({ ...formData, [field]: val });
  const setE = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="grid gap-4 py-2">
      {/* Dados pessoais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome completo *</Label>
          <Input value={formData.name} onChange={setE("name")} placeholder="Maria Silva" autoFocus />
        </div>
        <div className="space-y-2">
          <Label>CPF / CNPJ</Label>
          <InputCpfCnpj value={formData.cpfCnpj} onChange={set("cpfCnpj")} placeholder="000.000.000-00" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={formData.email} onChange={setE("email")} placeholder="maria@email.com" />
        </div>
        <div className="space-y-2">
          <Label>Telefone / WhatsApp</Label>
          <InputPhone value={formData.phone} onChange={set("phone")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço completo</Label>
        <Input value={formData.address} onChange={setE("address")} placeholder="Rua das Flores, 100 - Bairro - Cidade/SP" />
      </div>

      {/* Contato de emergência */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contato de Emergência</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={formData.emergencyContact} onChange={setE("emergencyContact")} placeholder="Nome do contato" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <InputPhone value={formData.emergencyPhone} onChange={set("emergencyPhone")} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={formData.notes} onChange={setE("notes")} rows={2} placeholder="Informações adicionais..." />
      </div>

      <Button onClick={onSubmit} disabled={isPending || !formData.name.trim()} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{label}
      </Button>
    </div>
  );
}
