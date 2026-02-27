import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Farmacia {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  horario: string;
  distancia?: string;
  latitude: number;
  longitude: number;
}

interface MapaFarmaciasProps {
  farmacias: Farmacia[];
}

const MapaFarmacias = ({ farmacias }: MapaFarmaciasProps) => {
  const center: [number, number] = farmacias.length > 0
    ? [farmacias[0].latitude, farmacias[0].longitude]
    : [-8.8368, 13.2343]; // Luanda default

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-border shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {farmacias.map((farmacia) => (
          <Marker key={farmacia.id} position={[farmacia.latitude, farmacia.longitude]}>
            <Popup>
              <div className="min-w-[200px] space-y-2 p-1">
                <h3 className="font-semibold text-sm">{farmacia.nome}</h3>
                <p className="text-xs text-gray-600">{farmacia.endereco}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  {farmacia.telefone}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {farmacia.horario}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${farmacia.latitude},${farmacia.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline mt-1"
                >
                  <Navigation className="h-3 w-3" />
                  Obter direcções
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaFarmacias;
