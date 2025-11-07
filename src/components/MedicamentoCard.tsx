import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, MapPin } from "lucide-react";

interface MedicamentoCardProps {
  nome: string;
  descricao: string;
  preco: number;
  farmacia: string;
  farmaciaEndereco: string;
}

const MedicamentoCard = ({
  nome,
  descricao,
  preco,
  farmacia,
  farmaciaEndereco,
}: MedicamentoCardProps) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Pill className="h-6 w-6 text-primary" />
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
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicamentoCard;
