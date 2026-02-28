import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "@/components/admin/AdminDashboard";
import FarmaciaDashboard from "@/components/farmacia/FarmaciaDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Sem permissões atribuídas. Contacte o administrador.</p>
      </div>
    );
  }

  if (role === "admin") return <AdminDashboard />;
  if (role === "farmacia") return <FarmaciaDashboard />;

  return <Navigate to="/" replace />;
};

export default Dashboard;
