import { useState, useEffect, lazy, Suspense } from "react";
import { MapPin, Search, LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import FarmaciaCard from "@/components/FarmaciaCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MapaFarmacias = lazy(() => import("@/components/MapaFarmacias"));

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface FarmaciaDB {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone: string | null;
  horario: string | null;
}

const Farmacias = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [farmacias, setFarmacias] = useState<FarmaciaDB[]>([]);

  useEffect(() => {
    supabase
      .from("farmacias")
      .select("id, nome, endereco, latitude, longitude, telefone, horario")
      .order("nome")
      .then(({ data }) => {
      setFarmacias((data as FarmaciaDB[]) ?? []);
    });
  }, []);

  const farmaciasComDistancia = farmacias.map((f) => {
    if (userLocation) {
      const dist = haversineDistance(userLocation.lat, userLocation.lng, f.latitude, f.longitude);
      return { ...f, distancia: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`, distanciaNum: dist };
    }
    return { ...f, distancia: "", distanciaNum: 0 };
  }).sort((a, b) => userLocation ? a.distanciaNum - b.distanciaNum : 0);

  const filteredFarmacias = searchTerm.trim()
    ? farmaciasComDistancia.filter(
        (f) =>
          f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.endereco.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : farmaciasComDistancia;

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error("Geolocalização não suportada"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success("Localização obtida!"); },
      () => { setLocating(false); toast.error("Não foi possível obter localização"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-foreground">Farmácias Próximas</h1>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder="Pesquisar por nome ou localização..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 pl-12 pr-4" />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">Pesquisar</Button>
            <Button type="button" variant="outline" size="lg" className="h-12 px-4" onClick={handleGeolocate} disabled={locating} title="Usar minha localização">
              <LocateFixed className={`h-5 w-5 ${locating ? "animate-spin" : ""}`} />
            </Button>
          </form>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <p className="text-sm text-muted-foreground mb-4">{filteredFarmacias.length} farmácia(s) encontrada(s)</p>
            {filteredFarmacias.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFarmacias.map((f) => (
                  <FarmaciaCard key={f.id} id={f.id} nome={f.nome} endereco={f.endereco} telefone={f.telefone ?? ""} horario={f.horario ?? ""} distancia={f.distancia || undefined} latitude={f.latitude} longitude={f.longitude} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MapPin className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-xl font-semibold">Nenhuma farmácia encontrada</h3>
                <p className="text-muted-foreground">Tente pesquisar com outro termo</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="map">
            <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <MapaFarmacias farmacias={filteredFarmacias} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Farmacias;
