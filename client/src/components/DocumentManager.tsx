import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { FileUp, FileText, Trash2, Loader2, Download, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface DocumentManagerProps {
  entityType: "property" | "contract" | "owner" | "tenant" | "inspection" | "maintenance";
  entityId: number;
  title?: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export default function DocumentManager({ entityType, entityId, title = "Documentos", canUpload = true, canDelete = true }: DocumentManagerProps) {
  const { data: documents, isLoading } = trpc.documents.list.useQuery({ entityType, entityId }, { enabled: !!entityId });
  const utils = trpc.useUtils();
  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => { utils.documents.list.invalidate({ entityType, entityId }); toast.success("Documento enviado"); setUploadOpen(false); setDocName(""); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { utils.documents.list.invalidate({ entityType, entityId }); toast.success("Documento removido"); },
    onError: (e) => toast.error(e.message),
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile || !docName) { toast.error("Preencha o nome e selecione um ficheiro"); return; }
    if (selectedFile.size > 10 * 1024 * 1024) { toast.error("Ficheiro muito grande (máx. 10MB)"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        entityType,
        entityId,
        name: docName,
        fileName: selectedFile.name,
        base64Data: base64,
        mimeType: selectedFile.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith("image/")) return "🖼️";
    if (mimeType?.includes("pdf")) return "📄";
    if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) return "📊";
    return "📎";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {canUpload && (
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              <FileUp className="h-3.5 w-3.5 mr-1.5" />Enviar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !documents?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{getFileIcon(doc.mimeType)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.fileUrl && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.fileUrl, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: doc.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Documento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Documento *</Label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Ex: Contrato assinado" />
            </div>
            <div className="space-y-2">
              <Label>Ficheiro *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {selectedFile ? (
                  <div>
                    <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">Máx. 10MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="w-full">
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enviar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
