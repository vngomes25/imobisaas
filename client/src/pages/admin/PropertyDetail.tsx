import AdminLayout from "@/components/AdminLayout";
import DocumentManager from "@/components/DocumentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputCEP, InputCurrency, SelectUF, initCurrency, parseCurrency } from "@/components/ui/form-fields";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, MapPin, Bed, Bath, Car, Loader2, Pencil, FileText, Wrench, ClipboardCheck, Calendar, FolderOpen, Camera, X, Upload } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useRef, useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { available: "Disponível", rented: "Alugado", maintenance: "Manutenção" };
const statusColors: Record<string, string> = { available: "bg-success/10 text-success", rented: "bg-primary/10 text-primary", maintenance: "bg-warning/10 text-warning" };
const typeLabels: Record<string, string> = { apartment: "Apartamento", house: "Casa", commercial: "Comercial", land: "Terreno", other: "Outro" };
const contractStatusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", terminated: "Rescindido", pending: "Pendente" };
const contractStatusColors: Record<string, string> = { active: "bg-success/10 text-success", expired: "bg-muted text-muted-foreground", terminated: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };
const maintenanceStatusLabels: Record<string, string> = { open: "Aberta", in_progress: "Em Andamento", waiting_parts: "Aguardando", completed: "Concluída", cancelled: "Cancelada" };
const inspectionTypeLabels: Record<string, string> = { entry: "Entrada", exit: "Saída", periodic: "Periódica", maintenance: "Manutenção" };

export default function AdminPropertyDetail() {
  return <AdminLayout><PropertyDetailContent /></AdminLayout>;
}

function PropertyPhotos({ property, propertyId, onUpdate }: { property: any; propertyId: number; onUpdate: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadMutation = trpc.properties.uploadPhoto.useMutation();
  const updateMutation = trpc.properties.update.useMutation({ onSuccess: onUpdate });
  const photos: string[] = property.photos ?? [];

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { url } = await uploadMutation.mutateAsync({ propertyId, fileName: safeFileName, base64Data: base64, mimeType: file.type });
        newUrls.push(url);
      }
      await updateMutation.mutateAsync({ id: propertyId, photos: [...photos, ...newUrls] });
      toast.success(`${newUrls.length} foto${newUrls.length > 1 ? "s" : ""} adicionada${newUrls.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Erro ao fazer upload das fotos");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (url: string) => {
    const updated = photos.filter(p => p !== url);
    await updateMutation.mutateAsync({ id: propertyId, photos: updated });
    toast.success("Foto removida");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{photos.length} foto{photos.length !== 1 ? "s" : ""} cadastrada{photos.length !== 1 ? "s" : ""}</p>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          Adicionar Fotos
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      {photos.length === 0 ? (
        <div
          className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Clique para adicionar fotos do imóvel</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — múltiplas fotos de uma vez</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(url)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div
            className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyDetailContent() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: property, isLoading } = trpc.properties.getById.useQuery({ id }, { enabled: !!id });
  const { data: owner } = trpc.owners.getById.useQuery({ id: property?.ownerId ?? 0 }, { enabled: !!property?.ownerId });
  const { data: contracts } = trpc.contracts.list.useQuery({ propertyId: id }, { enabled: !!id });
  const { data: maintenances } = trpc.maintenances.listByProperty.useQuery({ propertyId: id }, { enabled: !!id });
  const { data: inspections } = trpc.inspections.listByProperty.useQuery({ propertyId: id }, { enabled: !!id });
  const [, setLocation] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const utils = trpc.useUtils();
  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => { utils.properties.getById.invalidate({ id }); toast.success("Imóvel atualizado"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const [editForm, setEditForm] = useState<any>({});

  const openEdit = () => {
    if (!property) return;
    setEditForm({
      title: property.title, type: property.type, status: property.status,
      addressStreet: property.addressStreet ?? "", addressNumber: property.addressNumber ?? "",
      addressNeighborhood: property.addressNeighborhood ?? "", addressCity: property.addressCity ?? "",
      addressState: property.addressState ?? "", addressZip: property.addressZip ?? "",
      bedrooms: property.bedrooms ?? 0, bathrooms: property.bathrooms ?? 0, parkingSpaces: property.parkingSpaces ?? 0,
      area: property.area ?? "",
      rentValue: initCurrency(property.rentValue), condoFee: initCurrency(property.condoFee),
      iptuValue: initCurrency(property.iptuValue), description: property.description ?? "",
    });
    setEditOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!property) return <div className="text-center py-20 text-muted-foreground">Imóvel não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/properties")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{property.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[property.status]}>{statusLabels[property.status]}</Badge>
              <Badge variant="outline">{typeLabels[property.type]}</Badge>
              {owner && <span className="text-sm text-muted-foreground">Proprietário: {owner.name}</span>}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={openEdit}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details"><Building2 className="h-4 w-4 mr-2" />Detalhes</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="h-4 w-4 mr-2" />Contratos ({contracts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="maintenances"><Wrench className="h-4 w-4 mr-2" />Manutenções ({maintenances?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="inspections"><ClipboardCheck className="h-4 w-4 mr-2" />Vistorias ({inspections?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="photos"><Camera className="h-4 w-4 mr-2" />Fotos ({(property.photos ?? []).length})</TabsTrigger>
          <TabsTrigger value="documents"><FolderOpen className="h-4 w-4 mr-2" />Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{property.addressStreet}{property.addressNumber ? `, ${property.addressNumber}` : ""}</p>
                {property.addressComplement && <p className="ml-6">{property.addressComplement}</p>}
                <p className="ml-6">{property.addressNeighborhood} - {property.addressCity}/{property.addressState}</p>
                {property.addressZip && <p className="ml-6">CEP: {property.addressZip}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Características</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><Bed className="h-4 w-4 text-muted-foreground" />{property.bedrooms ?? 0} quartos</div>
                  <div className="flex items-center gap-2"><Bath className="h-4 w-4 text-muted-foreground" />{property.bathrooms ?? 0} banheiros</div>
                  <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground" />{property.parkingSpaces ?? 0} vagas</div>
                  {property.area && <div>{property.area} m²</div>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Valores</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {property.rentValue && <div className="flex justify-between"><span className="text-muted-foreground">Aluguel</span><span className="font-semibold">R$ {Number(property.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
                {property.condoFee && <div className="flex justify-between"><span className="text-muted-foreground">Condomínio</span><span>R$ {Number(property.condoFee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
                {property.iptuValue && <div className="flex justify-between"><span className="text-muted-foreground">IPTU</span><span>R$ {Number(property.iptuValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
              </CardContent>
            </Card>
            {property.description && (
              <Card>
                <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4 space-y-3">
          {!contracts?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum contrato para este imóvel.</CardContent></Card>
          ) : contracts.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/admin/contracts/${c.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Contrato #{c.id}</span>
                      <Badge className={contractStatusColors[c.status]}>{contractStatusLabels[c.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.startDate).toLocaleDateString("pt-BR")} - {new Date(c.endDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <p className="text-lg font-bold">R$ {Number(c.rentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="maintenances" className="mt-4 space-y-3">
          {!maintenances?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma manutenção para este imóvel.</CardContent></Card>
          ) : maintenances.map(m => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{m.title}</span>
                      <Badge variant="outline">{maintenanceStatusLabels[m.status]}</Badge>
                    </div>
                    {m.description && <p className="text-sm text-muted-foreground line-clamp-1">{m.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="inspections" className="mt-4 space-y-3">
          {!inspections?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma vistoria para este imóvel.</CardContent></Card>
          ) : inspections.map(i => (
            <Card key={i.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Vistoria #{i.id}</span>
                      <Badge variant="outline">{inspectionTypeLabels[i.type ?? "periodic"]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(i.scheduledDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <PropertyPhotos property={property} propertyId={id} onUpdate={() => utils.properties.getById.invalidate({ id })} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentManager entityType="property" entityId={id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Imóvel</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Título</Label><Input value={editForm.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="rented">Alugado</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <InputCEP value={editForm.addressZip ?? ""} onChange={(v) => setEditForm({ ...editForm, addressZip: v })}
                  onAddressFound={(addr) => setEditForm((f: any) => ({
                    ...f,
                    addressStreet: addr.street ?? f.addressStreet,
                    addressNeighborhood: addr.neighborhood ?? f.addressNeighborhood,
                    addressCity: addr.city ?? f.addressCity,
                    addressState: addr.state ?? f.addressState,
                  }))} />
              </div>
              <div className="space-y-2 col-span-2"><Label>Rua</Label><Input value={editForm.addressStreet ?? ""} onChange={(e) => setEditForm({ ...editForm, addressStreet: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Número</Label><Input value={editForm.addressNumber ?? ""} onChange={(e) => setEditForm({ ...editForm, addressNumber: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bairro</Label><Input value={editForm.addressNeighborhood ?? ""} onChange={(e) => setEditForm({ ...editForm, addressNeighborhood: e.target.value })} /></div>
              <div className="space-y-2"><Label>UF</Label><SelectUF value={editForm.addressState ?? ""} onChange={(v) => setEditForm({ ...editForm, addressState: v })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={editForm.addressCity ?? ""} onChange={(e) => setEditForm({ ...editForm, addressCity: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Quartos</Label><Input type="number" value={editForm.bedrooms ?? 0} onChange={(e) => setEditForm({ ...editForm, bedrooms: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Banheiros</Label><Input type="number" value={editForm.bathrooms ?? 0} onChange={(e) => setEditForm({ ...editForm, bathrooms: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Vagas</Label><Input type="number" value={editForm.parkingSpaces ?? 0} onChange={(e) => setEditForm({ ...editForm, parkingSpaces: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Área (m²)</Label><Input value={editForm.area ?? ""} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Aluguel (R$)</Label><InputCurrency value={editForm.rentValue ?? ""} onChange={(v) => setEditForm({ ...editForm, rentValue: v })} /></div>
              <div className="space-y-2"><Label>Condomínio (R$)</Label><InputCurrency value={editForm.condoFee ?? ""} onChange={(v) => setEditForm({ ...editForm, condoFee: v })} /></div>
              <div className="space-y-2"><Label>IPTU (R$)</Label><InputCurrency value={editForm.iptuValue ?? ""} onChange={(v) => setEditForm({ ...editForm, iptuValue: v })} /></div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} /></div>
            <Button onClick={() => updateMutation.mutate({
              id, ...editForm,
              rentValue: parseCurrency(editForm.rentValue) || editForm.rentValue,
              condoFee: parseCurrency(editForm.condoFee) || editForm.condoFee,
              iptuValue: parseCurrency(editForm.iptuValue) || editForm.iptuValue,
            })} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
