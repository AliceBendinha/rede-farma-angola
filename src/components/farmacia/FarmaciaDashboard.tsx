import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BarChart3, Pill, Stethoscope } from "lucide-react";
import Navbar from "@/components/Navbar";
import MedicamentosTab from "./MedicamentosTab";
import ServicosTab from "./ServicosTab";
import FarmaciaOverviewTab from "./FarmaciaOverviewTab";

export interface Categoria {
  id: string;
  nome: string;
}

const FarmaciaDashboard = () => {
  const { signOut, farmaciaId } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [farmaNome, setFarmaNome] = useState("");

  const fetchCategorias = async () => {
    const { data } = await supabase.from("categorias").select("*").order("nome");
    setCategorias((data as Categoria[]) ?? []);
  };

  useEffect(() => {
    fetchCategorias();
    if (farmaciaId) {
      supabase.from("farmacias").select("nome").eq("id", farmaciaId).single().then(({ data }) => {
        setFarmaNome(data?.nome ?? "");
      });
    }
  }, [farmaciaId]);

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
            <h1 className="text-3xl font-bold font-heading text-foreground">Painel Farmácia</h1>
            {farmaNome && <p className="text-muted-foreground">{farmaNome}</p>}
          </div>
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Resumo</TabsTrigger>
            <TabsTrigger value="medicamentos" className="gap-2"><Pill className="h-4 w-4" />Medicamentos</TabsTrigger>
            <TabsTrigger value="servicos" className="gap-2"><Stethoscope className="h-4 w-4" />Serviços</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <FarmaciaOverviewTab farmaciaId={farmaciaId} />
          </TabsContent>
          <TabsContent value="medicamentos">
            <MedicamentosTab farmaciaId={farmaciaId} categorias={categorias} onCategoriasChange={fetchCategorias} />
          </TabsContent>
          <TabsContent value="servicos">
            <ServicosTab farmaciaId={farmaciaId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FarmaciaDashboard;
