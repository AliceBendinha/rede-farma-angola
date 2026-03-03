import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import MedicamentosTab from "./MedicamentosTab";
import ServicosTab from "./ServicosTab";

export interface Categoria {
  id: string;
  nome: string;
}

const FarmaciaDashboard = () => {
  const { signOut, farmaciaId } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const fetchCategorias = async () => {
    const { data } = await supabase.from("categorias").select("*").order("nome");
    setCategorias((data as Categoria[]) ?? []);
  };

  useEffect(() => { fetchCategorias(); }, []);

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
            <p className="text-muted-foreground">Gestão de medicamentos e serviços</p>
          </div>
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>

        <Tabs defaultValue="medicamentos">
          <TabsList className="mb-4">
            <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
          </TabsList>
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
