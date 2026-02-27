import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Phone, Clock, Navigation } from "lucide-react";

// Fix default marker icons
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: [number, number] = farmacias.length > 0
      ? [farmacias[0].latitude, farmacias[0].longitude]
      : [-8.8368, 13.2343];

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    farmacias.forEach((farmacia) => {
      const marker = L.marker([farmacia.latitude, farmacia.longitude]).addTo(map);
      marker.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif;">
          <h3 style="font-weight:600;font-size:14px;margin:0 0 4px;">${farmacia.nome}</h3>
          <p style="font-size:12px;color:#475569;margin:0 0 4px;">${farmacia.endereco}</p>
          <p style="font-size:12px;color:#475569;margin:0 0 4px;">📞 ${farmacia.telefone}</p>
          <p style="font-size:12px;color:#475569;margin:0 0 8px;">🕐 ${farmacia.horario}</p>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${farmacia.latitude},${farmacia.longitude}" 
             target="_blank" rel="noopener noreferrer"
             style="font-size:12px;color:#2D9C6E;font-weight:500;text-decoration:none;">
            🧭 Obter direcções
          </a>
        </div>
      `);
    });

    // Fit bounds if multiple pharmacies
    if (farmacias.length > 1) {
      const bounds = L.latLngBounds(farmacias.map((f) => [f.latitude, f.longitude]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [farmacias]);

  return (
    <div
      ref={mapRef}
      className="h-[500px] w-full rounded-lg overflow-hidden border border-border shadow-md"
    />
  );
};

export default MapaFarmacias;
