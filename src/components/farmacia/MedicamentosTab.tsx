import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Categoria } from "./FarmaciaDashboard";

interface Medicamento {
  id: string;
  nome: string;
  categoria_id: string | null;
  preco: number;
  descricao: string | null;
}

interface Props {
  farmaciaId: string;
  categorias: Categoria[];
  onCategoriasChange: () => void;
}

const emptyForm = { nome: "", categoria_id: "", preco: "", descricao: "" };

const MedicamentosTab = ({ farmaciaId, categorias, onCategoriasChange }: Props) => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCategoria, setNewCategoria] = useState("");

  const fetchMedicamentos = async () => {
    const { data } = await supabase.from("medicamentos").select("*").eq("farmacia_id", farmaciaId).order("nome");
    setMedicamentos((data as Medicamento[]) ?? []);
  };

  useEffect(() => { fetchMedicamentos(); }, [farmaciaId]);

  const handleAddCategoria = async () => {
    if (!newCategoria.trim()) return;
    const { error } = await supabase.from("categorias").insert({ nome: newCategoria.trim() });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Categoria já existe" : "Erro ao criar categoria");
    } else {
      toast.success("Categoria criada");
      setNewCategoria("");
      onCategoriasChange();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const medData = {
      farmacia_id: farmaciaId,
      nome: form.nome,
      categoria_id: form.categoria_id || null,
      preco: parseFloat(form.preco),
      descricao: form.descricao || null,
    };

    if (editingId) {
      const { error } = await supabase.from("medicamentos").update(medData).eq("id", editingId);
      if (error) toast.error("Erro ao atualizar"); else toast.success("Medicamento atualizado");
    } else {
      const { error } = await supabase.from("medicamentos").insert(medData);
      if (error) toast.error("Erro ao criar: " + error.message); else toast.success("Medicamento adicionado");
    }

    setLoading(false);
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchMedicamentos();
  };

  const handleEdit = (m: Medicamento) => {
    setForm({ nome: m.nome, categoria_id: m.categoria_id ?? "", preco: String(m.preco), descricao: m.descricao ?? "" });
    setEditingId(m.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar?")) return;
    const { error } = await supabase.from("medicamentos").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar"); else { toast.success("Eliminado"); fetchMedicamentos(); }
  };

  const getCategoriaName = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "—";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medicamentos ({medicamentos.length})</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Medicamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Medicamento" : "Novo Medicamento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input placeholder="Nova categoria" value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)} />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCategoria}>+</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preço (Kz) *</Label>
                <Input type="number" step="0.01" min="0" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
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
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicamentos.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{getCategoriaName(m.categoria_id)}</TableCell>
                <TableCell>{Number(m.preco).toLocaleString("pt-AO")} Kz</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {medicamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum medicamento cadastrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MedicamentosTab;
