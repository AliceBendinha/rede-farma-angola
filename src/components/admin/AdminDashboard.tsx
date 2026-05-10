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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, LogOut, MapPin, BarChart3, Building2, UserPlus, UserCheck, UserX, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminOverviewTab from "./AdminOverviewTab";
import {
  PASSWORD_REQUIREMENTS,
  validatePasswordStrength,
} from "@/lib/passwordStrength";

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

interface AuthUser {
  id: string;
  email: string;
}

const emptyForm = { nome: "", endereco: "", latitude: "", longitude: "", telefone: "", horario: "", user_email: "", user_id: "", user_password: "", reset_password: "" };

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false);

  const fetchFarmacias = async () => {
    const { data } = await supabase.from("farmacias").select("*").order("nome");
    setFarmacias((data as Farmacia[]) ?? []);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("list-users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error("Erro ao carregar utilizadores:", error);
      } else {
        setUsers(data?.users ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchFarmacias();
    fetchUsers();
  }, []);

  // Users already associated to a pharmacy
  const associatedUserIds = new Set(farmacias.filter((f) => f.user_id).map((f) => f.user_id!));

  // Available users for assignment (not already linked, excluding the one being edited)
  const availableUsers = users.filter(
    (u) => !associatedUserIds.has(u.id) || (editingId && farmacias.find((f) => f.id === editingId)?.user_id === u.id)
  );

  const getUserEmail = (userId: string | null) => {
    if (!userId) return null;
    return users.find((u) => u.id === userId)?.email ?? null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let userId: string | null = form.user_id || null;

    // If creating new and email provided, create user via edge function
    if (!editingId && form.user_email.trim() && !userId) {
      // Password is required when creating a new user
      if (!form.user_password.trim()) {
        toast.error("Defina uma palavra-passe para o novo utilizador.");
        setLoading(false);
        return;
      }
      const strength = validatePasswordStrength(form.user_password.trim());
      if (!strength.valid) {
        toast.error(strength.message ?? "Palavra-passe inválida");
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast.error("Sessão expirada"); setLoading(false); return; }

        const { data: createData, error: createError } = await supabase.functions.invoke("create-farmacia-user", {
          body: {
            email: form.user_email.trim(),
            nome: form.nome,
            password: form.user_password.trim(),
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (createError) {
          toast.error("Erro ao criar utilizador: " + (createError.message ?? "Erro desconhecido"));
          setLoading(false);
          return;
        }

        if (createData?.user?.id) {
          userId = createData.user.id;
        }

        if (createData?.temp_password) {
          setTempPassword(createData.temp_password as string);
          setTempPasswordCopied(false);
          toast.success("Utilizador criado. Guarde a password temporária mostrada.");
        } else {
          toast.success("Utilizador criado com a password definida.");
        }
      } catch (err: any) {
        toast.error("Erro ao criar utilizador: " + (err?.message ?? ""));
        setLoading(false);
        return;
      }
    }

    const farmData = {
      nome: form.nome,
      endereco: form.endereco,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      telefone: form.telefone || null,
      horario: form.horario || null,
      user_id: userId,
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
      user_id: f.user_id ?? "",
      user_password: "",
      reset_password: "",
    });
    setEditingId(f.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta farmácia?")) return;
    const { error } = await supabase.from("farmacias").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); } else { toast.success("Farmácia eliminada"); fetchFarmacias(); }
  };

  const handleUnlinkUser = async (farmaciaId: string) => {
    if (!confirm("Deseja desassociar o utilizador desta farmácia?")) return;
    const { error } = await supabase.from("farmacias").update({ user_id: null }).eq("id", farmaciaId);
    if (error) { toast.error("Erro ao desassociar"); } else { toast.success("Utilizador desassociado"); fetchFarmacias(); }
  };

  const handleResetPassword = async () => {
    const editing = editingId ? farmacias.find((f) => f.id === editingId) : null;
    const targetUserId = editing?.user_id;
    if (!targetUserId) { toast.error("Sem utilizador associado"); return; }
    const strength = validatePasswordStrength(form.reset_password);
    if (!strength.valid) { toast.error(strength.message ?? "Palavra-passe inválida"); return; }

    setResettingPwd(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada"); return; }
      const { error } = await supabase.functions.invoke("reset-farmacia-password", {
        body: { user_id: targetUserId, password: form.reset_password, force_reset: false },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        toast.error("Erro ao redefinir password");
      } else {
        toast.success("Password redefinida com sucesso");
        setForm((prev) => ({ ...prev, reset_password: "" }));
      }
    } finally {
      setResettingPwd(false);
    }
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container py-8 flex-1">
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

                      {/* User association */}
                      <div className="space-y-2 rounded-lg border border-border p-4 bg-accent/30">
                        <Label className="flex items-center gap-2 text-sm font-semibold">
                          <UserPlus className="h-4 w-4 text-primary" />
                          Associar Utilizador
                        </Label>

                        {availableUsers.length > 0 ? (
                          <Select
                            value={form.user_id}
                            onValueChange={(v) => setForm({ ...form, user_id: v === "__none__" ? "" : v, user_email: "" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar utilizador existente..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Nenhum</SelectItem>
                              {availableUsers.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-muted-foreground">Todos os utilizadores já estão associados.</p>
                        )}

                        {!editingId && !form.user_id && (
                          <div className="space-y-2 pt-2 border-t border-border mt-2">
                            <Label className="text-xs text-muted-foreground">Ou criar novo utilizador:</Label>
                            <Input
                              type="email"
                              value={form.user_email}
                              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
                              placeholder="email@exemplo.com"
                            />
                            <Label className="text-xs text-muted-foreground">Password (opcional):</Label>
                            <Input
                              type="password"
                              value={form.user_password}
                              onChange={(e) => setForm({ ...form, user_password: e.target.value })}
                              placeholder="Deixe vazio para gerar automática"
                              minLength={8}
                            />
                            <p className="text-xs text-muted-foreground">
                              {PASSWORD_REQUIREMENTS} Se vazio, será gerada uma password temporária e pedida nova no 1.º login.
                            </p>
                            {form.user_password.trim() && !validatePasswordStrength(form.user_password.trim()).valid && (
                              <p className="text-xs text-destructive" role="alert">
                                {validatePasswordStrength(form.user_password.trim()).message}
                              </p>
                            )}
                          </div>
                        )}

                        {editingId && form.user_id && (
                          <div className="space-y-2 pt-2 border-t border-border mt-2">
                            <Label className="text-xs text-muted-foreground">Redefinir password do utilizador:</Label>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                value={form.reset_password}
                                onChange={(e) => setForm({ ...form, reset_password: e.target.value })}
                                placeholder="Nova password"
                                minLength={8}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={handleResetPassword}
                                disabled={resettingPwd || !validatePasswordStrength(form.reset_password).valid}
                              >
                                {resettingPwd ? "..." : "Redefinir"}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
                            {form.reset_password && !validatePasswordStrength(form.reset_password).valid && (
                              <p className="text-xs text-destructive" role="alert">
                                {validatePasswordStrength(form.reset_password).message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

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
                      <TableHead>Utilizador</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmacias.map((f) => {
                      const email = getUserEmail(f.user_id);
                      return (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.nome}</TableCell>
                          <TableCell>{f.endereco}</TableCell>
                          <TableCell>{f.telefone ?? "—"}</TableCell>
                          <TableCell>
                            {email ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <UserCheck className="h-3 w-3" />
                                  {email}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleUnlinkUser(f.id)}
                                  title="Desassociar utilizador"
                                >
                                  <UserX className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sem utilizador</span>
                            )}
                          </TableCell>
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
                      );
                    })}
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
      <Footer />
      <Dialog
        open={tempPassword !== null}
        onOpenChange={(o) => {
          if (!o) {
            setTempPassword(null);
            setTempPasswordCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password temporária gerada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Guarde e partilhe esta password com o utilizador. Será pedida uma nova password no 1.º login.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={tempPassword ?? ""}
                className="font-mono"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  if (!tempPassword) return;
                  try {
                    await navigator.clipboard.writeText(tempPassword);
                    setTempPasswordCopied(true);
                    toast.success("Password copiada");
                  } catch {
                    toast.error("Não foi possível copiar");
                  }
                }}
              >
                {tempPasswordCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setTempPassword(null);
                setTempPasswordCopied(false);
              }}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
