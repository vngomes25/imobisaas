import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InputCEP, InputCurrency, SelectUF, parseCurrency } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, MapPin, Bed, Bath, Car, Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusLabels: Record<string, string> = { available: "Disponível", rented: "Alugado", maintenance: "Manutenção" };
const statusColors: Record<string, string> = { available: "bg-success/10 text-success", rented: "bg-primary/10 text-primary", maintenance: "bg-warning/10 text-warning" };
const typeLabels: Record<string, string> = { apartment: "Apartamento", house: "Casa", commercial: "Comercial", land: "Terreno", other: "Outro" };

const emptyForm = {
  ownerId: 0, title: "", type: "apartment" as const, status: "available" as const,
  addressStreet: "", addressNumber: "", addressNeighborhood: "", addressCity: "",
  addressState: "", addressZip: "",
  bedrooms: 0, bathrooms: 0, parkingSpaces: 0, area: "",
  rentValue: "", condoFee: "", iptuValue: "", description: "",
};

export default function AdminProperties() {
  return <AdminLayout><PropertiesContent /></AdminLayout>;
}

function PropertiesContent() {
  const { data: properties, isLoading } = trpc.properties.list.useQuery({});
  const { data: ownersList } = trpc.owners.list.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => { utils.properties.list.invalidate(); toast.success("Imóvel criado com sucesso"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const [form, setForm] = useState(emptyForm);

  const filtered = properties?.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.addressCity?.toLowerCase().includes(search.toLowerCase()) ||
    p.addressNeighborhood?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleCreate = () => {
    if (!form.ownerId || !form.title.trim()) { toast.error("Preencha proprietário e título"); return; }
    createMutation.mutate({
      ...form,
      rentValue: parseCurrency(form.rentValue) || form.rentValue,
      condoFee: parseCurrency(form.condoFee) || form.condoFee,
      iptuValue: parseCurrency(form.iptuValue) || form.iptuValue,
    });
  };

  const setF = (field: keyof typeof emptyForm) => (val: any) => setForm(f => ({ ...f, [field]: val }));
  const setE = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Imóveis</h1>
          <p className="text-muted-foreground mt-1">{properties?.length ?? 0} imóveis cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Imóvel</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Imóvel</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">

              {/* Proprietário + Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proprietário *</Label>
                  <Select onValueChange={(v) => setF("ownerId")(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                    <SelectContent>
                      {ownersList?.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Imóvel</Label>
                  <Select value={form.type} onValueChange={(v: any) => setF("type")(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={setE("title")} placeholder="Ex: Apartamento 3 quartos no Centro" autoFocus />
              </div>

              {/* Endereço */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <InputCEP
                      value={form.addressZip}
                      onChange={setF("addressZip")}
                      onAddressFound={(addr) => setForm(f => ({
                        ...f,
                        addressStreet: addr.street ?? f.addressStreet,
                        addressNeighborhood: addr.neighborhood ?? f.addressNeighborhood,
                        addressCity: addr.city ?? f.addressCity,
                        addressState: addr.state ?? f.addressState,
                      }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Rua / Logradouro</Label>
                    <Input value={form.addressStreet} onChange={setE("addressStreet")} placeholder="Rua das Flores" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={form.addressNumber} onChange={setE("addressNumber")} placeholder="100" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Bairro</Label>
                    <Input value={form.addressNeighborhood} onChange={setE("addressNeighborhood")} placeholder="Centro" />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <SelectUF value={form.addressState} onChange={setF("addressState")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={form.addressCity} onChange={setE("addressCity")} placeholder="São Paulo" />
                </div>
              </div>

              {/* Características */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Características</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Quartos</Label>
                    <Input type="number" min={0} value={form.bedrooms} onChange={(e) => setF("bedrooms")(Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Banheiros</Label>
                    <Input type="number" min={0} value={form.bathrooms} onChange={(e) => setF("bathrooms")(Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vagas</Label>
                    <Input type="number" min={0} value={form.parkingSpaces} onChange={(e) => setF("parkingSpaces")(Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Área (m²)</Label>
                    <Input value={form.area} onChange={setE("area")} placeholder="80" />
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valores</p>
                  <RentSuggestionButton
                    form={{
                      addressStreet: form.addressStreet,
                      addressNeighborhood: form.addressNeighborhood,
                      addressCity: form.addressCity,
                      addressState: form.addressState,
                      type: form.type,
                      area: form.area,
                      bedrooms: form.bedrooms,
                      bathrooms: form.bathrooms,
                      parkingSpaces: form.parkingSpaces,
                      condoFee: form.condoFee,
                    }}
                    onSuggest={(v) => setF("rentValue")(v)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Aluguel (R$)</Label>
                    <InputCurrency value={form.rentValue} onChange={setF("rentValue")} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Condomínio (R$)</Label>
                    <InputCurrency value={form.condoFee} onChange={setF("condoFee")} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>IPTU (R$)</Label>
                    <InputCurrency value={form.iptuValue} onChange={setF("iptuValue")} placeholder="0,00" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={setE("description")} rows={3} placeholder="Descreva o imóvel..." />
              </div>

              <Button onClick={handleCreate} disabled={createMutation.isPending || !form.ownerId || !form.title.trim()} className="w-full">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cadastrar Imóvel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar imóveis..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {search ? "Nenhum resultado." : "Nenhum imóvel cadastrado ainda."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/admin/properties/${p.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{p.title}</h3>
                        <Badge variant="secondary" className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                        <Badge variant="outline" className="text-xs">{typeLabels[p.type]}</Badge>
                      </div>
                      {p.addressStreet && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {p.addressStreet}{p.addressNumber ? `, ${p.addressNumber}` : ""} — {p.addressNeighborhood}, {p.addressCity}/{p.addressState}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {(p.bedrooms ?? 0) > 0 && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms} qtos</span>}
                        {(p.bathrooms ?? 0) > 0 && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms} bans</span>}
                        {(p.parkingSpaces ?? 0) > 0 && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{p.parkingSpaces} vagas</span>}
                        {p.area && <span>{p.area} m²</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {p.rentValue && <p className="text-lg font-bold text-primary">R$ {Number(p.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                    <p className="text-xs text-muted-foreground">/ mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const AMENITIES_OPTIONS = [
  "Piscina", "Academia", "Churrasqueira", "Portaria 24h", "Salão de Festas",
  "Playground", "Elevador", "Ar-condicionado", "Varanda", "Quintal",
  "Segurança 24h", "Câmeras", "Gerador", "Energia Solar",
];

function RentSuggestionButton({ form, onSuggest }: {
  form: {
    addressStreet: string; addressNeighborhood: string; addressCity: string;
    addressState: string; type: string; area: string;
    bedrooms: number; bathrooms: number; parkingSpaces: number; condoFee: string;
  };
  onSuggest: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "result">("form");
  const [furnished, setFurnished] = useState<"yes" | "no" | "partial">("no");
  const [condition, setCondition] = useState<"new" | "excellent" | "good" | "regular" | "needs_renovation">("good");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [freeDescription, setFreeDescription] = useState("");

  const suggestMutation = trpc.ai.suggestRentValue.useMutation({
    onSuccess: () => setStep("result"),
    onError: (e) => toast.error(e.message),
  });

  const typeLabels: Record<string, string> = {
    apartment: "Apartamento", house: "Casa", commercial: "Comercial",
    land: "Terreno", studio: "Studio", room: "Quarto",
  };

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleOpen = () => {
    if (!form.addressCity) { toast.error("Preencha a cidade antes de sugerir valor."); return; }
    setStep("form");
    suggestMutation.reset();
    setOpen(true);
  };

  const handleAnalyze = () => {
    suggestMutation.mutate({
      address: form.addressStreet || "não informado",
      neighborhood: form.addressNeighborhood || undefined,
      city: form.addressCity,
      state: form.addressState,
      type: typeLabels[form.type] || form.type,
      area: form.area ? Number(form.area) : undefined,
      bedrooms: form.bedrooms || undefined,
      bathrooms: form.bathrooms || undefined,
      parkingSpaces: form.parkingSpaces || undefined,
      condoFee: form.condoFee ? parseCurrency(form.condoFee) as unknown as number | undefined : undefined,
      furnished,
      condition,
      amenities: amenities.length > 0 ? amenities : undefined,
      freeDescription: freeDescription.trim() || undefined,
    });
  };

  const data = suggestMutation.data;

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10" onClick={handleOpen}>
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />Sugerir valor com IA
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep("form"); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Sugestão de Aluguel com IA
            </DialogTitle>
          </DialogHeader>

          {step === "form" && !suggestMutation.isPending && (
            <div className="space-y-4 py-1">
              <p className="text-xs text-muted-foreground">Quanto mais detalhes você fornecer, mais precisa será a sugestão.</p>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-0.5">
                <p><span className="font-medium text-foreground">Imóvel:</span> {typeLabels[form.type] || form.type}{form.area ? ` · ${form.area}m²` : ""}{form.bedrooms ? ` · ${form.bedrooms} qtos` : ""}</p>
                <p><span className="font-medium text-foreground">Local:</span> {form.addressNeighborhood ? `${form.addressNeighborhood}, ` : ""}{form.addressCity}/{form.addressState}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mobília</Label>
                  <Select value={furnished} onValueChange={(v: any) => setFurnished(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Sem mobília</SelectItem>
                      <SelectItem value="partial">Semi-mobiliado</SelectItem>
                      <SelectItem value="yes">Totalmente mobiliado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Estado do imóvel</Label>
                  <Select value={condition} onValueChange={(v: any) => setCondition(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo / Na planta</SelectItem>
                      <SelectItem value="excellent">Excelente estado</SelectItem>
                      <SelectItem value="good">Bom estado</SelectItem>
                      <SelectItem value="regular">Estado regular</SelectItem>
                      <SelectItem value="needs_renovation">Precisa de reforma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Comodidades / Diferenciais</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITIES_OPTIONS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        amenities.includes(a)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição livre (opcional)</Label>
                <Textarea
                  value={freeDescription}
                  onChange={(e) => setFreeDescription(e.target.value)}
                  placeholder="Ex: Vista para o mar, recém reformado, portaria 24h, próximo ao metrô..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={handleAnalyze}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />Analisar com IA
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {suggestMutation.isPending && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando o mercado imobiliário...</p>
              <p className="text-xs text-muted-foreground/60">Isso pode levar alguns segundos</p>
            </div>
          )}

          {step === "result" && data && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Valor sugerido</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {data.valorSugerido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Faixa: R$ {data.faixaMinima.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — R$ {data.faixaMaxima.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <p className="text-sm text-foreground leading-relaxed">{data.justificativa}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.fatoresValorizacao?.length > 0 && (
                  <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                    <p className="text-xs font-semibold text-success uppercase mb-1.5">Valorização</p>
                    <ul className="text-xs space-y-1">
                      {data.fatoresValorizacao.map((f, i) => <li key={i} className="flex gap-1">✓ {f}</li>)}
                    </ul>
                  </div>
                )}
                {data.fatoresDesvalorizacao?.length > 0 && (
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <p className="text-xs font-semibold text-destructive uppercase mb-1.5">Atenção</p>
                    <ul className="text-xs space-y-1">
                      {data.fatoresDesvalorizacao.map((f, i) => <li key={i} className="flex gap-1">⚠ {f}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {data.comparacaoMercado && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{data.comparacaoMercado}</p>
              )}
              <p className="text-xs text-muted-foreground italic">{data.observacao}</p>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  const formatted = data.valorSugerido.toFixed(2).replace(".", ",");
                  onSuggest(formatted);
                  setOpen(false);
                  toast.success("Valor aplicado ao campo!");
                }}>Usar este valor</Button>
                <Button variant="outline" onClick={() => { setStep("form"); suggestMutation.reset(); }}>Refazer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
