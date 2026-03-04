import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, LogOut, MapPin, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import AdminOverviewTab from "./AdminOverviewTab";

interface Farmacia {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone: string | null;
  horario: string | null;
  user_id: string | null;
}

const emptyForm = { nome: "", endereco: "", latitude: "", longitude: "", telefone: "", horario: "", user_email: "" };

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchFarmacias = async () => {
    const { data } = await supabase.from("farmacias").select("*").order("nome");
    setFarmacias((data as Farmacia[]) ?? []);
  };

  useEffect(() => { fetchFarmacias(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let userId: string | null = null;

    if (form.user_email.trim()) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.user_email.trim(),
        password: "Farmacia2024!",
        options: { data: { nome: form.nome } },
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        toast.error("Erro ao criar utilizador: " + signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData?.user) {
        userId = signUpData.user.id;
        await supabase.from("user_roles").upsert({ user_id: userId, role: "farmacia" as any });
      }
    }

    const farmData = {
      nome: form.nome,
      endereco: form.endereco,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      telefone: form.telefone || null,
      horario: form.horario || null,
      ...(userId ? { user_id: userId } : {}),
    };

    if (editingId) {
      const { error } = await supabase.from("farmacias").update(farmData).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); } else { toast.success("Farmácia atualizada"); }
    } else {
      const { error } = await supabase.from("farmacias").insert(farmData);
      if (error) { toast.error("Erro ao criar: " + error.message); } else { toast.success("Farmácia criada"); }
    }

    setLoading(false);
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchFarmacias();
  };

  const handleEdit = (f: Farmacia) => {
    setForm({
      nome: f.nome,
      endereco: f.endereco,
      latitude: String(f.latitude),
      longitude: String(f.longitude),
      telefone: f.telefone ?? "",
      horario: f.horario ?? "",
      user_email: "",
    });
    setEditingId(f.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta farmácia?")) return;
    const { error } = await supabase.from("farmacias").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); } else { toast.success("Farmácia eliminada"); fetchFarmacias(); }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocalização não suportada"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({ ...prev, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
        toast.success("Localização obtida");
      },
      () => toast.error("Não foi possível obter localização"),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading text-foreground">Painel Administrador</h1>
            <p className="text-muted-foreground">Visão geral da plataforma</p>
          </div>
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Resumo</TabsTrigger>
            <TabsTrigger value="farmacias" className="gap-2"><Building2 className="h-4 w-4" />Farmácias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab />
          </TabsContent>

          <TabsContent value="farmacias">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Farmácias ({farmacias.length})</CardTitle>
                <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Nova Farmácia</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Editar Farmácia" : "Nova Farmácia"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Endereço *</Label>
                        <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Latitude *</Label>
                          <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitude *</Label>
                          <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleGetLocation}>
                        <MapPin className="h-4 w-4 mr-2" />Usar minha localização
                      </Button>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="Ex: Seg-Sex: 8h-20h" />
                      </div>
                      {!editingId && (
                        <div className="space-y-2">
                          <Label>Email do utilizador farmácia</Label>
                          <Input type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} placeholder="Cria conta com password padrão" />
                          <p className="text-xs text-muted-foreground">Password padrão: Farmacia2024!</p>
                        </div>
                      )}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "A guardar..." : editingId ? "Atualizar" : "Criar"}
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
                      <TableHead>Endereço</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmacias.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell>{f.endereco}</TableCell>
                        <TableCell>{f.telefone ?? "—"}</TableCell>
                        <TableCell>{f.horario ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {farmacias.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma farmácia cadastrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
