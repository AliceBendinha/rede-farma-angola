import { useState, useEffect } from "react";
import { Search, Pill, MapPin, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import ComparacaoPrecos from "@/components/ComparacaoPrecos";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [activeCategoriaId, setActiveCategoriaId] = useState<string>("");
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategorias = async () => {
      const { data } = await supabase
        .from("categorias")
        .select("id, nome")
        .order("nome");
      setCategorias(data ?? []);
    };
    fetchCategorias();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveSearch(searchTerm.trim());
      setActiveCategoriaId(categoriaId);
    }
  };

  const features = [
    {
      icon: Search,
      title: "Pesquisa Rápida",
      description: "Encontre medicamentos disponíveis em segundos",
      action: () => {
        const input = document.querySelector<HTMLInputElement>('input[placeholder*="Pesquisar medicamentos"]');
        if (input) {
          input.focus();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
    {
      icon: TrendingUp,
      title: "Compare Preços",
      description: "Veja os melhores preços entre farmácias próximas",
      action: () => navigate("/medicamentos"),
    },
    {
      icon: MapPin,
      title: "Localização",
      description: "Descubra farmácias perto de si com mapa interativo",
      action: () => navigate("/farmacias"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Pill className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Encontre Medicamentos com{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Facilidade
            </span>
          </h1>
          <p className="mb-12 text-lg text-muted-foreground md:text-xl">
            Pesquise, compare preços e localize farmácias próximas em Angola. 
            Acesso rápido à informação de saúde que precisa.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto mb-16 max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar medicamentos (ex: Paracetamol, Amoxicilina...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 pl-12 pr-4 text-base shadow-sm"
                />
              </div>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="h-14 w-[180px] shadow-sm">
                  <Filter className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="lg" className="h-14 px-8 font-semibold shadow-sm">
                Pesquisar
              </Button>
            </div>
          </form>
          
          {/* Inline search results with price comparison */}
          <ComparacaoPrecos searchTerm={activeSearch} categoriaId={activeCategoriaId === "all" ? "" : activeCategoriaId} />
        </div>
        {/* Features Grid */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              onClick={feature.action}
              className="cursor-pointer border-border transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-heading">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">250+</div>
              <div className="text-sm text-muted-foreground">Farmácias Registadas</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">5.000+</div>
              <div className="text-sm text-muted-foreground">Medicamentos Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">15.000+</div>
              <div className="text-sm text-muted-foreground">Pesquisas Mensais</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
