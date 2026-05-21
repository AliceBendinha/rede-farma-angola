import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import MedicamentoCard from "@/components/MedicamentoCard";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";

interface MedWithFarmacia {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  quantidade_stock: number;
  stock_minimo: number;
  farmacias: { nome: string; endereco: string } | null;
}

const Medicamentos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [medicamentos, setMedicamentos] = useState<MedWithFarmacia[]>([]);

  const fetchMedicamentos = async (query: string) => {
    let q = supabase
      .from("medicamentos")
      .select("id, nome, descricao, preco, imagem_url, quantidade_stock, stock_minimo, farmacias(nome, endereco)")
      .order("nome");

    if (query.trim()) {
      q = q.or(`nome.ilike.%${query}%,descricao.ilike.%${query}%`);
    }

    const { data } = await q;
    setMedicamentos((data as unknown as MedWithFarmacia[]) ?? []);
  };

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchTerm(query);
    fetchMedicamentos(query);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchTerm ? { search: searchTerm } : {});
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={searchTerm ? `Resultados para "${searchTerm}" — Rede Farma` : "Medicamentos disponíveis — Rede Farma"}
        description={searchTerm ? `Veja farmácias com ${searchTerm} disponível em Angola, com preços e stock atualizados.` : "Catálogo de medicamentos com preços, disponibilidade e farmácias em Angola."}
        path={searchTerm ? `/medicamentos?search=${encodeURIComponent(searchTerm)}` : "/medicamentos"}
      />
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-foreground">Pesquisar Medicamentos</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder="Digite o nome do medicamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 pl-12 pr-4" />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">Pesquisar</Button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {medicamentos.length} resultado(s) encontrado(s)
          {searchTerm && ` para "${searchTerm}"`}
        </p>

        {medicamentos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {medicamentos.map((m) => (
              <MedicamentoCard
                key={m.id}
                nome={m.nome}
                descricao={m.descricao ?? ""}
                preco={Number(m.preco)}
                farmacia={m.farmacias?.nome ?? "—"}
                farmaciaEndereco={m.farmacias?.endereco ?? ""}
                imagemUrl={m.imagem_url}
                quantidadeStock={m.quantidade_stock}
                stockMinimo={m.stock_minimo}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-xl font-semibold">Nenhum medicamento encontrado</h3>
            <p className="text-muted-foreground">Tente pesquisar com outro termo</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Medicamentos;
