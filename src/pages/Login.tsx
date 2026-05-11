import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pill, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Credenciais inválidas");
      return;
    }
    const mustReset = Boolean(
      (data.user?.user_metadata as Record<string, unknown> | undefined)?.must_reset_password
    );
    toast.success("Login efectuado com sucesso");
    navigate(mustReset ? "/reset-password" : "/dashboard");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Indique o seu e-mail");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    toast.success("Se o e-mail existir, receberá instruções para redefinir a palavra-passe.");
    setMode("login");
    setResetEmail("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Pill className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Rede Farma</CardTitle>
          <CardDescription>
            {mode === "login" ? "Aceda ao painel de gestão" : "Recuperar palavra-passe por e-mail"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? "A entrar..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setResetEmail(email);
              }}
              className="block w-full text-center text-sm text-primary hover:underline"
            >
              Esqueceu a palavra-passe?
            </button>
          </form>
          ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email da conta</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="email@exemplo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enviaremos um link para definir uma nova palavra-passe.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A enviar..." : "Enviar link de recuperação"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao login
            </button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
