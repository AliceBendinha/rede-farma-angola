import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Clock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Farmacia {
  id: string;
  nome: string;
  endereco: string;
  telefone: string | null;
  horario: string | null;
}

interface Categoria {
  id: string;
  nome: string;
  total: number;
}

const FarmaciaDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const [farmacia, setFarmacia] = useState<Farmacia | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);

      const [farmRes, medRes] = await Promise.all([
        supabase.from("farmacias").select("id, nome, endereco, telefone, horario").eq("id", id).single(),
        supabase.from("medicamentos").select("categoria_id, categorias(id, nome)").eq("farmacia_id", id),
      ]);

      if (farmRes.data) setFarmacia(farmRes.data);

      if (medRes.data) {
        const catMap = new Map<string, { nome: string; total: number }>();
        for (const med of medRes.data as any[]) {
          const cat = med.categorias;
          if (!cat) continue;
          const existing = catMap.get(cat.id);
          if (existing) {
            existing.total += 1;
          } else {
            catMap.set(cat.id, { nome: cat.nome, total: 1 });
          }
        }
        setCategorias(
          Array.from(catMap.entries()).map(([id, val]) => ({ id, ...val })).sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      {farmacia && (
        <Seo
          title={`${farmacia.nome} — Farmácia em Angola | Rede Farma`}
          description={`${farmacia.nome} — ${farmacia.endereco}. Veja categorias de medicamentos disponíveis, contactos e horário.`}
          path={`/farmacias/${farmacia.id}`}
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Pharmacy",
            name: farmacia.nome,
            address: farmacia.endereco,
            telephone: farmacia.telefone ?? undefined,
            openingHours: farmacia.horario ?? undefined,
            url: `https://rede-farma-angola.lovable.app/farmacias/${farmacia.id}`,
          }}
        />
      )}
      <Navbar />
      <main className="container py-8">
        <Link to="/farmacias">
          <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar às farmácias
          </Button>
        </Link>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 mt-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ) : !farmacia ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-foreground">Farmácia não encontrada</h2>
            <p className="text-muted-foreground mt-2">A farmácia que procura não existe ou foi removida.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-3">{farmacia.nome}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {farmacia.endereco}
                </span>
                {farmacia.telefone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-primary" />
                    {farmacia.telefone}
                  </span>
                )}
                {farmacia.horario && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {farmacia.horario}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Categorias disponíveis
            </h2>

            {categorias.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorias.map((cat) => (
                  <Card key={cat.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{cat.nome}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="text-sm">
                        {cat.total} medicamento{cat.total !== 1 ? "s" : ""}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Nenhuma categoria registada nesta farmácia.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default FarmaciaDetalhes;
