import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import FarmaciaCard from "@/components/FarmaciaCard";

// Dados de exemplo
const farmaciasExemplo = [
  {
    id: 1,
    nome: "Farmácia Central",
    endereco: "Rua Comandante Valódia, nº 45, Luanda",
    telefone: "+244 222 334 455",
    horario: "Seg-Sex: 8h-20h | Sáb: 9h-18h",
    distancia: "0.5 km",
    latitude: -8.8368,
    longitude: 13.2343,
  },
  {
    id: 2,
    nome: "Farmácia Sagrada Esperança",
    endereco: "Av. 4 de Fevereiro, nº 123, Luanda",
    telefone: "+244 222 445 566",
    horario: "Seg-Dom: 7h-22h",
    distancia: "1.2 km",
    latitude: -8.8145,
    longitude: 13.2302,
  },
  {
    id: 3,
    nome: "Farmácia Girassol",
    endereco: "Bairro Maculusso, Rua Ndunduma, Luanda",
    telefone: "+244 222 556 677",
    horario: "Seg-Sex: 8h-19h | Sáb: 9h-17h",
    distancia: "2.1 km",
    latitude: -8.8281,
    longitude: 13.2456,
  },
  {
    id: 4,
    nome: "Farmácia Maianga",
    endereco: "Rua do Congo, nº 78, Maianga, Luanda",
    telefone: "+244 222 667 788",
    horario: "Seg-Sáb: 8h-20h",
    distancia: "2.8 km",
    latitude: -8.8402,
    longitude: 13.2589,
  },
  {
    id: 5,
    nome: "Farmácia do Povo",
    endereco: "Av. Hoji-ya-Henda, nº 234, Luanda",
    telefone: "+244 222 778 899",
    horario: "Seg-Sex: 8h-18h",
    distancia: "3.5 km",
    latitude: -8.8521,
    longitude: 13.2698,
  },
  {
    id: 6,
    nome: "Farmácia Talatona",
    endereco: "Rua da Samba, Talatona, Luanda",
    telefone: "+244 222 889 900",
    horario: "Seg-Dom: 8h-21h",
    distancia: "5.2 km",
    latitude: -8.9145,
    longitude: 13.1876,
  },
];

const Farmacias = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFarmacias, setFilteredFarmacias] = useState(farmaciasExemplo);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredFarmacias(farmaciasExemplo);
      return;
    }

    const filtered = farmaciasExemplo.filter((farmacia) =>
      farmacia.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmacia.endereco.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFarmacias(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            Farmácias Próximas
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou localização..."
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

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredFarmacias.length} {filteredFarmacias.length === 1 ? "farmácia encontrada" : "farmácias encontradas"}
              </p>
            </div>

            {filteredFarmacias.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFarmacias.map((farmacia) => (
                  <FarmaciaCard
                    key={farmacia.id}
                    nome={farmacia.nome}
                    endereco={farmacia.endereco}
                    telefone={farmacia.telefone}
                    horario={farmacia.horario}
                    distancia={farmacia.distancia}
                    latitude={farmacia.latitude}
                    longitude={farmacia.longitude}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MapPin className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Nenhuma farmácia encontrada
                </h3>
                <p className="text-muted-foreground">
                  Tente pesquisar com outro termo
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map">
            <div className="rounded-lg border bg-muted/30 p-8 text-center">
              <MapPin className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                Mapa Interativo em Breve
              </h3>
              <p className="text-muted-foreground">
                A funcionalidade de mapa interativo será adicionada em breve.
                Por enquanto, use os botões "Ver no Mapa" nos cards das farmácias.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Farmacias;
