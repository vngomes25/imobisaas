import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputPhone, InputCpfCnpj } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Phone, Mail, Loader2, Search, Pencil, Trash2, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const emptyForm = {
  name: "", email: "", phone: "", cpfCnpj: "", address: "",
  bankName: "", bankAgency: "", bankAccount: "", pixKey: "", notes: "",
};

export default function AdminOwners() {
  return <AdminLayout><OwnersContent /></AdminLayout>;
}

function OwnersContent() {
  const { data: owners, isLoading } = trpc.owners.list.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.owners.create.useMutation({
    onSuccess: () => { utils.owners.list.invalidate(); toast.success("Proprietário cadastrado"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.owners.update.useMutation({
    onSuccess: () => { utils.owners.list.invalidate(); toast.success("Proprietário atualizado"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.owners.delete.useMutation({
    onSuccess: () => { utils.owners.list.invalidate(); toast.success("Proprietário removido"); },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const filtered = owners?.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.cpfCnpj?.includes(search)
  ) ?? [];

  const openEdit = (o: any) => {
    setEditId(o.id);
    setEditForm({
      name: o.name, email: o.email ?? "", phone: o.phone ?? "",
      cpfCnpj: o.cpfCnpj ?? "", address: o.address ?? "",
      bankName: o.bankName ?? "", bankAgency: o.bankAgency ?? "",
      bankAccount: o.bankAccount ?? "", pixKey: o.pixKey ?? "", notes: o.notes ?? "",
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
          <h1 className="text-2xl font-display font-bold tracking-tight">Proprietários</h1>
          <p className="text-muted-foreground mt-1">{owners?.length ?? 0} proprietários cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Proprietário</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Proprietário</DialogTitle></DialogHeader>
            <OwnerForm formData={form} setFormData={setForm} isPending={createMutation.isPending}
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
          {search ? "Nenhum resultado." : "Nenhum proprietário cadastrado ainda."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((o) => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0 text-chart-2 font-bold text-sm">
                      {o.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{o.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                        {o.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{o.email}</span>}
                        {o.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.phone}</span>}
                        {o.cpfCnpj && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{o.cpfCnpj}</span>}
                        {o.pixKey && <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded font-medium">PIX: {o.pixKey}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Remover ${o.name}?`)) deleteMutation.mutate({ id: o.id }); }}>
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
          <DialogHeader><DialogTitle>Editar Proprietário</DialogTitle></DialogHeader>
          <OwnerForm formData={editForm} setFormData={setEditForm} isPending={updateMutation.isPending}
            label="Salvar Alterações" onSubmit={validateAndUpdate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OwnerForm({ formData, setFormData, onSubmit, isPending, label }: {
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
          <Input value={formData.name} onChange={setE("name")} placeholder="João da Silva" autoFocus />
        </div>
        <div className="space-y-2">
          <Label>CPF / CNPJ</Label>
          <InputCpfCnpj value={formData.cpfCnpj} onChange={set("cpfCnpj")} placeholder="000.000.000-00" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={formData.email} onChange={setE("email")} placeholder="joao@email.com" />
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

      {/* Dados bancários */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados Bancários / Repasse</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input value={formData.pixKey} onChange={setE("pixKey")} placeholder="CPF, e-mail, telefone ou chave aleatória" />
          </div>
          <div className="space-y-2">
            <Label>Banco</Label>
            <Input value={formData.bankName} onChange={setE("bankName")} placeholder="Ex: Bradesco, Itaú, Nubank..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Agência</Label>
            <Input value={formData.bankAgency} onChange={setE("bankAgency")} placeholder="0001" />
          </div>
          <div className="space-y-2">
            <Label>Conta</Label>
            <Input value={formData.bankAccount} onChange={setE("bankAccount")} placeholder="12345-6" />
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
