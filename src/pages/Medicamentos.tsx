import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import MedicamentoCard from "@/components/MedicamentoCard";

// Dados de exemplo
const medicamentosExemplo = [
  {
    id: 1,
    nome: "Paracetamol 500mg",
    descricao: "Analgésico e antipirético - 20 comprimidos",
    preco: 1200,
    farmacia: "Farmácia Central",
    farmaciaEndereco: "Rua Comandante Valódia, Luanda",
  },
  {
    id: 2,
    nome: "Paracetamol 500mg",
    descricao: "Analgésico e antipirético - 20 comprimidos",
    preco: 1500,
    farmacia: "Farmácia Sagrada Esperança",
    farmaciaEndereco: "Av. 4 de Fevereiro, Luanda",
  },
  {
    id: 3,
    nome: "Amoxicilina 500mg",
    descricao: "Antibiótico - 21 cápsulas",
    preco: 3500,
    farmacia: "Farmácia Girassol",
    farmaciaEndereco: "Bairro Maculusso, Luanda",
  },
  {
    id: 4,
    nome: "Amoxicilina 500mg",
    descricao: "Antibiótico - 21 cápsulas",
    preco: 3200,
    farmacia: "Farmácia Central",
    farmaciaEndereco: "Rua Comandante Valódia, Luanda",
  },
  {
    id: 5,
    nome: "Ibuprofeno 400mg",
    descricao: "Anti-inflamatório - 30 comprimidos",
    preco: 2800,
    farmacia: "Farmácia Maianga",
    farmaciaEndereco: "Rua do Congo, Maianga, Luanda",
  },
  {
    id: 6,
    nome: "Omeprazol 20mg",
    descricao: "Antiácido - 28 cápsulas",
    preco: 4500,
    farmacia: "Farmácia Sagrada Esperança",
    farmaciaEndereco: "Av. 4 de Fevereiro, Luanda",
  },
];

const Medicamentos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [filteredMedicamentos, setFilteredMedicamentos] = useState(medicamentosExemplo);

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchTerm(query);
    filterMedicamentos(query);
  }, [searchParams]);

  const filterMedicamentos = (query: string) => {
    if (!query.trim()) {
      setFilteredMedicamentos(medicamentosExemplo);
      return;
    }

    const filtered = medicamentosExemplo.filter((med) =>
      med.nome.toLowerCase().includes(query.toLowerCase()) ||
      med.descricao.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMedicamentos(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            Pesquisar Medicamentos
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Digite o nome do medicamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-4"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              Pesquisar
            </Button>
          </form>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredMedicamentos.length} {filteredMedicamentos.length === 1 ? "resultado encontrado" : "resultados encontrados"}
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        </div>

        {filteredMedicamentos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMedicamentos.map((medicamento) => (
              <MedicamentoCard
                key={medicamento.id}
                nome={medicamento.nome}
                descricao={medicamento.descricao}
                preco={medicamento.preco}
                farmacia={medicamento.farmacia}
                farmaciaEndereco={medicamento.farmaciaEndereco}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Nenhum medicamento encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente pesquisar com outro termo
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicamentos;
