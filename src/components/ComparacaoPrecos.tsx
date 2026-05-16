import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, MapPin, ArrowUpDown, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockStatus } from "@/lib/stock";

interface MedResult {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  quantidade_stock: number;
  stock_minimo: number;
  farmacias: { nome: string; endereco: string } | null;
}

interface GroupedMed {
  nome: string;
  items: MedResult[];
  minPreco: number;
  maxPreco: number;
}

interface Props {
  searchTerm: string;
  categoriaId?: string;
}

const ComparacaoPrecos = ({ searchTerm, categoriaId }: Props) => {
  const [grouped, setGrouped] = useState<GroupedMed[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setGrouped([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from("medicamentos")
        .select("id, nome, descricao, preco, quantidade_stock, stock_minimo, farmacias(nome, endereco)")
        .or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
        .order("preco", { ascending: true });

      if (categoriaId) {
        query = query.eq("categoria_id", categoriaId);
      }

      const { data } = await query;

      const results = (data as unknown as MedResult[]) ?? [];

      // Group by medicine name (case-insensitive)
      const map = new Map<string, MedResult[]>();
      for (const r of results) {
        const key = r.nome.toLowerCase();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }

      const groups: GroupedMed[] = Array.from(map.entries()).map(([, items]) => ({
        nome: items[0].nome,
        items: items.sort((a, b) => a.preco - b.preco),
        minPreco: Math.min(...items.map((i) => i.preco)),
        maxPreco: Math.max(...items.map((i) => i.preco)),
      }));

      setGrouped(groups);
      setLoading(false);
    };

    fetchData();
  }, [searchTerm, categoriaId]);

  if (!searchTerm.trim()) return null;

  if (loading) {
    return (
      <div className="mt-10 space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center text-center py-12">
        <Pill className="mb-4 h-14 w-14 text-muted-foreground/40" />
        <h3 className="text-xl font-semibold text-foreground">Nenhum resultado</h3>
        <p className="text-muted-foreground mt-1">
          Não encontrámos medicamentos para "<span className="font-medium">{searchTerm}</span>"
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowUpDown className="h-4 w-4" />
        <span>
          {grouped.length} medicamento(s) encontrado(s) &middot; ordenados por menor preço
        </span>
      </div>

      {grouped.map((group) => (
        <Card key={group.nome} className="overflow-hidden border-border">
          <CardHeader className="bg-accent/40 pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-heading">{group.nome}</CardTitle>
              </div>
              {group.items.length > 1 && (
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Desde {group.minPreco.toLocaleString("pt-AO")} Kz
                  </span>
                  {group.maxPreco !== group.minPreco && (
                    <span className="text-xs text-muted-foreground">
                      até {group.maxPreco.toLocaleString("pt-AO")} Kz
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {group.items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                  idx === 0 && group.items.length > 1 ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.farmacias?.nome ?? "Farmácia"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.farmacias?.endereco ?? ""}
                    </p>
                    {item.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {item.descricao}
                      </p>
                    )}
                    {(() => {
                      const s = getStockStatus(item.quantidade_stock ?? 0, item.stock_minimo ?? 0);
                      return (
                        <Badge variant="outline" className={`mt-1 gap-1.5 ${s.badgeClass}`}>
                          <span className={`h-2 w-2 rounded-full ${s.dotClass}`} />
                          {s.label}
                          {s.status !== "esgotado" && (
                            <span className="opacity-70">· {item.quantidade_stock} un.</span>
                          )}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {idx === 0 && group.items.length > 1 && (
                    <Badge className="bg-primary/10 text-primary border-0 text-xs">
                      Melhor preço
                    </Badge>
                  )}
                  <span className={`text-lg font-bold ${idx === 0 ? "text-primary" : "text-foreground"}`}>
                    {item.preco.toLocaleString("pt-AO")} Kz
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ComparacaoPrecos;
