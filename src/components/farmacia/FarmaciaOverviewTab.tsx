import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callFunction } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Stethoscope, TrendingUp, Package, BarChart3, ShieldCheck, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface Props {
  farmaciaId: string;
}

const COLORS = [
  "hsl(153, 55%, 39%)",
  "hsl(153, 55%, 64%)",
  "hsl(29, 87%, 62%)",
  "hsl(215, 16%, 35%)",
  "hsl(142, 76%, 36%)",
  "hsl(0, 84%, 60%)",
];

const FarmaciaOverviewTab = ({ farmaciaId }: Props) => {
  const [stats, setStats] = useState({
    totalMedicamentos: 0,
    totalServicos: 0,
    totalCategorias: 0,
    precoMedio: 0,
    precoMax: 0,
    precoMin: 0,
  });
  const [catData, setCatData] = useState<{ name: string; value: number }[]>([]);
  const [priceRanges, setPriceRanges] = useState<{ range: string; count: number }[]>([]);
  const [apiStats, setApiStats] = useState<{ farmacia: string; totalMedicamentos: number; totalServicos: number; precoMedio: number } | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [medsRes, servRes] = await Promise.all([
        supabase.from("medicamentos").select("id, preco, categoria_id, categorias(nome)").eq("farmacia_id", farmaciaId),
        supabase.from("servicos").select("id").eq("farmacia_id", farmaciaId),
      ]);

      const meds = (medsRes.data as any[]) ?? [];
      const servicos = (servRes.data as any[]) ?? [];
      const precos = meds.map((m) => Number(m.preco));

      const categoriaCount: Record<string, number> = {};
      meds.forEach((m) => {
        const catName = m.categorias?.nome ?? "Sem categoria";
        categoriaCount[catName] = (categoriaCount[catName] || 0) + 1;
      });

      setCatData(
        Object.entries(categoriaCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // Price range distribution
      const ranges = [
        { range: "0-500", min: 0, max: 500 },
        { range: "500-1k", min: 500, max: 1000 },
        { range: "1k-5k", min: 1000, max: 5000 },
        { range: "5k-10k", min: 5000, max: 10000 },
        { range: "10k+", min: 10000, max: Infinity },
      ];
      setPriceRanges(
        ranges.map((r) => ({
          range: r.range,
          count: precos.filter((p) => p >= r.min && p < r.max).length,
        }))
      );

      setStats({
        totalMedicamentos: meds.length,
        totalServicos: servicos.length,
        totalCategorias: Object.keys(categoriaCount).length,
        precoMedio: precos.length ? precos.reduce((a, b) => a + b, 0) / precos.length : 0,
        precoMax: precos.length ? Math.max(...precos) : 0,
        precoMin: precos.length ? Math.min(...precos) : 0,
      });
    };
    fetchData();
  }, [farmaciaId]);

  const fetchApiStats = async () => {
    setApiLoading(true);
    try {
      const data = await callFunction<{ farmacia: string; totalMedicamentos: number; totalServicos: number; precoMedio: number }>("farmacia-stats");
      setApiStats(data);
      toast.success("Dados obtidos via JWT");
    } catch (err: any) {
      toast.error(err.message || "Erro ao chamar API");
    } finally {
      setApiLoading(false);
    }
  };

  const statCards = [
    { title: "Medicamentos", value: stats.totalMedicamentos, icon: Pill, color: "text-primary" },
    { title: "Serviços", value: stats.totalServicos, icon: Stethoscope, color: "text-secondary" },
    { title: "Categorias", value: stats.totalCategorias, icon: Package, color: "text-accent-foreground" },
    { title: "Preço Médio", value: `${stats.precoMedio.toLocaleString("pt-AO", { maximumFractionDigits: 0 })} Kz`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.title} className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold font-heading text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price range + min/max */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Preço Mínimo</p>
            <p className="text-2xl font-bold font-heading text-primary">{stats.precoMin.toLocaleString("pt-AO")} Kz</p>
          </CardContent>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Preço Máximo</p>
            <p className="text-2xl font-bold font-heading text-destructive">{stats.precoMax.toLocaleString("pt-AO")} Kz</p>
          </CardContent>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Total Produtos + Serviços</p>
            <p className="text-2xl font-bold font-heading text-foreground">{stats.totalMedicamentos + stats.totalServicos}</p>
          </CardContent>
        </Card>
      </div>

      {/* API Stats via JWT */}
      <Card className="shadow-[var(--shadow-card)] border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Estatísticas via Backend (JWT)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchApiStats} disabled={apiLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${apiLoading ? "animate-spin" : ""}`} />
            {apiLoading ? "A carregar..." : "Carregar via API"}
          </Button>
        </CardHeader>
        <CardContent>
          {apiStats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Medicamentos</p>
                <p className="text-2xl font-bold font-heading text-foreground">{apiStats.totalMedicamentos}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold font-heading text-foreground">{apiStats.totalServicos}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Preço Médio</p>
                <p className="text-2xl font-bold font-heading text-primary">{apiStats.precoMedio.toLocaleString("pt-AO")} Kz</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Clique em "Carregar via API" para obter dados autenticados com JWT
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição de Preços
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceRanges.some((r) => r.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priceRanges}>
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Medicamentos" fill="hsl(153, 55%, 39%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Medicamentos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmaciaOverviewTab;
