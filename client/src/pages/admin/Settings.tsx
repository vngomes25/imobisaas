import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Settings2, Building2, Banknote, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  return <AdminLayout><SettingsContent /></AdminLayout>;
}

function SettingsContent() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => { utils.settings.get.invalidate(); toast.success("Configurações salvas com sucesso"); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    agencyName: "",
    agencySlogan: "",
    agencyCnpj: "",
    agencyPhone: "",
    agencyEmail: "",
    agencyAddress: "",
    agencyPixKey: "",
    agencyBank: "",
    agencyBankAgency: "",
    agencyBankAccount: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        agencyName: settings.agencyName ?? "",
        agencySlogan: settings.agencySlogan ?? "",
        agencyCnpj: settings.agencyCnpj ?? "",
        agencyPhone: settings.agencyPhone ?? "",
        agencyEmail: settings.agencyEmail ?? "",
        agencyAddress: settings.agencyAddress ?? "",
        agencyPixKey: settings.agencyPixKey ?? "",
        agencyBank: settings.agencyBank ?? "",
        agencyBankAgency: settings.agencyBankAgency ?? "",
        agencyBankAccount: settings.agencyBankAccount ?? "",
      });
    }
  }, [settings]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    if (!form.agencyName.trim()) { toast.error("Nome da imobiliária é obrigatório"); return; }
    updateMutation.mutate({
      agencyName: form.agencyName || undefined,
      agencySlogan: form.agencySlogan || null,
      agencyCnpj: form.agencyCnpj || null,
      agencyPhone: form.agencyPhone || null,
      agencyEmail: form.agencyEmail || null,
      agencyAddress: form.agencyAddress || null,
      agencyPixKey: form.agencyPixKey || null,
      agencyBank: form.agencyBank || null,
      agencyBankAgency: form.agencyBankAgency || null,
      agencyBankAccount: form.agencyBankAccount || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Dados da imobiliária exibidos em recibos, portais e cabeçalhos</p>
      </div>

      {/* Dados da Imobiliária */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Dados da Imobiliária
          </CardTitle>
          <CardDescription>Informações de identificação exibidas na plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Imobiliária *</Label>
              <Input value={form.agencyName} onChange={set("agencyName")} placeholder="JR Imobiliária" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.agencyCnpj} onChange={set("agencyCnpj")} placeholder="00.000.000/0001-00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Slogan / Descrição curta</Label>
            <Input value={form.agencySlogan} onChange={set("agencySlogan")} placeholder="Sua imobiliária de confiança" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input value={form.agencyPhone} onChange={set("agencyPhone")} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.agencyEmail} onChange={set("agencyEmail")} placeholder="contato@jrimobiliaria.com.br" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Textarea value={form.agencyAddress} onChange={set("agencyAddress")} placeholder="Rua das Flores, 100 — Centro — São Paulo/SP" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Dados bancários */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4" />
            Dados Bancários
          </CardTitle>
          <CardDescription>Usados para exibir a chave PIX e conta nos repasses e portais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input value={form.agencyPixKey} onChange={set("agencyPixKey")} placeholder="CNPJ, e-mail, telefone ou chave aleatória" />
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-1">
              <Label>Banco</Label>
              <Input value={form.agencyBank} onChange={set("agencyBank")} placeholder="Bradesco" />
            </div>
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input value={form.agencyBankAgency} onChange={set("agencyBankAgency")} placeholder="0001" />
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Input value={form.agencyBankAccount} onChange={set("agencyBankAccount")} placeholder="12345-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full sm:w-auto">
        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
