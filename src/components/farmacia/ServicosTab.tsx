import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Servico {
  id: string;
  nome: string;
  preco: number;
  descricao: string | null;
  imagem_url: string | null;
}

interface Props {
  farmaciaId: string;
}

const emptyForm = { nome: "", preco: "", descricao: "" };

const ServicosTab = ({ farmaciaId }: Props) => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchServicos = async () => {
    const { data } = await supabase.from("servicos").select("*").eq("farmacia_id", farmaciaId).order("nome");
    setServicos((data as Servico[]) ?? []);
  };

  useEffect(() => { fetchServicos(); }, [farmaciaId]);

  const uploadImage = async (file: File, servicoId: string): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande (máx. 5MB)");
      return null;
    }
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      toast.error("Apenas imagens JPG, PNG, GIF ou WebP são permitidas");
      return null;
    }
    const mimeToExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };
    const ext = mimeToExt[file.type];
    const path = `${farmaciaId}/${servicoId}.${ext}`;
    const { error } = await supabase.storage.from("servicos").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); return null; }
    const { data } = supabase.storage.from("servicos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const servicoData = {
      farmacia_id: farmaciaId,
      nome: form.nome,
      preco: parseFloat(form.preco),
      descricao: form.descricao || null,
    };

    let savedId = editingId;

    if (editingId) {
      const { error } = await supabase.from("servicos").update(servicoData).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("servicos").insert(servicoData).select("id").single();
      if (error || !data) { toast.error("Erro ao criar: " + (error?.message ?? "")); setLoading(false); return; }
      savedId = data.id;
    }

    if (imageFile && savedId) {
      const url = await uploadImage(imageFile, savedId);
      if (url) {
        await supabase.from("servicos").update({ imagem_url: url }).eq("id", savedId);
      }
    }

    toast.success(editingId ? "Serviço atualizado" : "Serviço adicionado");
    setLoading(false);
    setOpen(false);
    setForm(emptyForm);
    setImageFile(null);
    setEditingId(null);
    fetchServicos();
  };

  const handleEdit = (s: Servico) => {
    setForm({ nome: s.nome, preco: String(s.preco), descricao: s.descricao ?? "" });
    setEditingId(s.id);
    setImageFile(null);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar?")) return;
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar"); else { toast.success("Eliminado"); fetchServicos(); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Serviços ({servicos.length})</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); setImageFile(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Preço (Kz) *</Label>
                <Input type="number" step="0.01" min="0" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Imagem</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                {imageFile && <p className="text-sm text-muted-foreground">{imageFile.name}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "A guardar..." : editingId ? "Atualizar" : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  {s.imagem_url ? (
                    <img src={s.imagem_url} alt={s.nome} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{s.nome}</TableCell>
                <TableCell>{Number(s.preco).toLocaleString("pt-AO")} Kz</TableCell>
                <TableCell className="max-w-[200px] truncate">{s.descricao ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {servicos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum serviço cadastrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ServicosTab;
