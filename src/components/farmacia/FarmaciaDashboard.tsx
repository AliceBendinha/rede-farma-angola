import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface Medicamento {
  id: string;
  nome: string;
  categoria_id: string | null;
  servicos: string | null;
  preco: number;
  descricao: string | null;
}

interface Categoria {
  id: string;
  nome: string;
}

const emptyForm = { nome: "", categoria_id: "", servicos: "", preco: "", descricao: "" };

const FarmaciaDashboard = () => {
  const { signOut, farmaciaId } = useAuth();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCategoria, setNewCategoria] = useState("");

  const fetchData = async () => {
    if (!farmaciaId) return;
    const [medRes, catRes] = await Promise.all([
      supabase.from("medicamentos").select("*").eq("farmacia_id", farmaciaId).order("nome"),
      supabase.from("categorias").select("*").order("nome"),
    ]);
    setMedicamentos((medRes.data as Medicamento[]) ?? []);
    setCategorias((catRes.data as Categoria[]) ?? []);
  };

  useEffect(() => { fetchData(); }, [farmaciaId]);

  const handleAddCategoria = async () => {
    if (!newCategoria.trim()) return;
    const { error } = await supabase.from("categorias").insert({ nome: newCategoria.trim() });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Categoria já existe");
      else toast.error("Erro ao criar categoria");
    } else {
      toast.success("Categoria criada");
      setNewCategoria("");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmaciaId) { toast.error("Farmácia não associada"); return; }
    setLoading(true);

    const medData = {
      farmacia_id: farmaciaId,
      nome: form.nome,
      categoria_id: form.categoria_id || null,
      servicos: form.servicos || null,
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
    fetchData();
  };

  const handleEdit = (m: Medicamento) => {
    setForm({
      nome: m.nome,
      categoria_id: m.categoria_id ?? "",
      servicos: m.servicos ?? "",
      preco: String(m.preco),
      descricao: m.descricao ?? "",
    });
    setEditingId(m.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar?")) return;
    const { error } = await supabase.from("medicamentos").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar"); else { toast.success("Eliminado"); fetchData(); }
  };

  const getCategoriaName = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "—";

  if (!farmaciaId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Nenhuma farmácia associada à sua conta. Contacte o administrador.</p>
          <Button variant="outline" className="mt-4" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Farmácia</h1>
            <p className="text-muted-foreground">Gestão de medicamentos</p>
          </div>
          <div className="flex gap-2">
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
                    <Label>Serviços</Label>
                    <Input value={form.servicos} onChange={(e) => setForm({ ...form, servicos: e.target.value })} placeholder="Ex: Entrega ao domicílio" />
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
            <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medicamentos ({medicamentos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicamentos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell>{getCategoriaName(m.categoria_id)}</TableCell>
                    <TableCell>{Number(m.preco).toLocaleString("pt-AO")} Kz</TableCell>
                    <TableCell>{m.servicos ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {medicamentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum medicamento cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmaciaDashboard;
