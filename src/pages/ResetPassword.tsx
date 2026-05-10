import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PASSWORD_REQUIREMENTS,
  validatePasswordStrength,
} from "@/lib/passwordStrength";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      setError(strength.message ?? "Palavra-passe inválida");
      toast.error(strength.message ?? "Palavra-passe inválida");
      return;
    }
    if (password !== confirm) {
      setError("As palavras-passe não coincidem");
      toast.error("As palavras-passe não coincidem");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_reset_password: false },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao actualizar palavra-passe");
      return;
    }
    toast.success("Palavra-passe actualizada");
    navigate("/dashboard", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Definir nova palavra-passe</CardTitle>
          <CardDescription>
            Por segurança, defina uma nova palavra-passe para substituir a temporária.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova palavra-passe</Label>
              <Input
                id="password"
                type="password"
                placeholder={PASSWORD_REQUIREMENTS}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar palavra-passe</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repita a palavra-passe"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError(null);
                }}
                required
                minLength={8}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "A guardar..." : "Actualizar palavra-passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;