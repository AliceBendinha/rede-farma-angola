import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";

interface FarmaciaCardProps {
  nome: string;
  endereco: string;
  telefone: string;
  horario: string;
  distancia?: string;
  latitude?: number;
  longitude?: number;
}

const FarmaciaCard = ({
  nome,
  endereco,
  telefone,
  horario,
  distancia,
  latitude,
  longitude,
}: FarmaciaCardProps) => {
  const handleOpenMap = () => {
    if (latitude && longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        "_blank"
      );
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            {nome}
          </CardTitle>
          {distancia && (
            <Badge variant="secondary" className="shrink-0">
              {distancia}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span>{endereco}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <span>{telefone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <span>{horario}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleOpenMap}
          disabled={!latitude || !longitude}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Ver no Mapa
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FarmaciaCard;
