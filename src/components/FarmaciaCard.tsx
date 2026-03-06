import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Navigation, Tag } from "lucide-react";
import { Link } from "react-router-dom";

interface FarmaciaCardProps {
  id?: string;
  nome: string;
  endereco: string;
  telefone: string;
  horario: string;
  distancia?: string;
  latitude?: number;
  longitude?: number;
}

const FarmaciaCard = ({
  id,
  nome,
  endereco,
  telefone,
  horario,
  distancia,
  latitude,
  longitude,
}: FarmaciaCardProps) => {
  const handleOpenMap = () => {
    if (latitude !== undefined && longitude !== undefined) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      window.open(url, "_blank", "noopener,noreferrer");
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
        <a
          href={latitude !== undefined && longitude !== undefined
            ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
            : "#"
          }
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
          onClick={(e) => {
            if (latitude === undefined || longitude === undefined) e.preventDefault();
          }}
        >
          <Button
            variant="outline"
            className="w-full"
            disabled={latitude === undefined || longitude === undefined}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Ver no Mapa
          </Button>
        </a>
      </CardFooter>
      {id && (
        <div className="px-6 pb-6">
          <Link to={`/farmacias/${id}`}>
            <Button variant="ghost" className="w-full gap-2 text-primary hover:text-primary">
              <Tag className="h-4 w-4" />
              Ver Categorias
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

export default FarmaciaCard;
