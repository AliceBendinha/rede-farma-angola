import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, MapPin, ImageIcon } from "lucide-react";
import { getStockStatus } from "@/lib/stock";

interface MedicamentoCardProps {
  nome: string;
  descricao: string;
  preco: number;
  farmacia: string;
  farmaciaEndereco: string;
  imagemUrl?: string | null;
  quantidadeStock?: number;
  stockMinimo?: number;
}

const MedicamentoCard = ({
  nome,
  descricao,
  preco,
  farmacia,
  farmaciaEndereco,
  imagemUrl,
  quantidadeStock,
  stockMinimo,
}: MedicamentoCardProps) => {
  const stock =
    typeof quantidadeStock === "number" && typeof stockMinimo === "number"
      ? getStockStatus(quantidadeStock, stockMinimo)
      : null;
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border">
      {imagemUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img src={imagemUrl} alt={nome} className="h-full w-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {imagemUrl ? (
                <ImageIcon className="h-6 w-6 text-primary" />
              ) : (
                <Pill className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {nome}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{descricao}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg font-bold shrink-0">
            {preco.toLocaleString("pt-AO")} Kz
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{farmacia}</p>
              <p className="text-xs text-muted-foreground">{farmaciaEndereco}</p>
            </div>
          </div>
          {stock && (
            <Badge
              variant="outline"
              className={`mt-2 w-fit gap-1.5 ${stock.badgeClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${stock.dotClass}`} />
              {stock.label}
              {stock.status !== "esgotado" && (
                <span className="opacity-70">· {quantidadeStock} un.</span>
              )}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicamentoCard;
