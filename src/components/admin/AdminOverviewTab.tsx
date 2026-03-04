import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Pill, Users, Stethoscope, BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const AdminOverviewTab = () => {
  const [stats, setStats] = useState({
    totalFarmacias: 0,
    totalMedicamentos: 0,
    totalServicos: 0,
    totalUsers: 0,
  });
  const [topFarmacias, setTopFarmacias] = useState<{ nome: string; meds: number; servs: number }[]>([]);
  const [catChart, setCatChart] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [farmRes, medRes, servRes, rolesRes] = await Promise.all([
        supabase.from("farmacias").select("id, nome"),
        supabase.from("medicamentos").select("id, farmacia_id, categoria_id, categorias(nome)"),
        supabase.from("servicos").select("id, farmacia_id"),
        supabase.from("user_roles").select("id"),
      ]);

      const farms = (farmRes.data as any[]) ?? [];
      const meds = (medRes.data as any[]) ?? [];
      const servs = (servRes.data as any[]) ?? [];
      const roles = (rolesRes.data as any[]) ?? [];

      setStats({
        totalFarmacias: farms.length,
        totalMedicamentos: meds.length,
        totalServicos: servs.length,
        totalUsers: roles.length,
      });

      // Top farmacias by products
      const farmMap: Record<string, { nome: string; meds: number; servs: number }> = {};
      farms.forEach((f) => { farmMap[f.id] = { nome: f.nome, meds: 0, servs: 0 }; });
      meds.forEach((m) => { if (farmMap[m.farmacia_id]) farmMap[m.farmacia_id].meds++; });
      servs.forEach((s) => { if (farmMap[s.farmacia_id]) farmMap[s.farmacia_id].servs++; });
      setTopFarmacias(
        Object.values(farmMap)
          .sort((a, b) => (b.meds + b.servs) - (a.meds + a.servs))
          .slice(0, 10)
      );

      // Category distribution
      const catCount: Record<string, number> = {};
      meds.forEach((m) => {
        const catName = (m as any).categorias?.nome ?? "Sem categoria";
        catCount[catName] = (catCount[catName] || 0) + 1;
      });
      setCatChart(
        Object.entries(catCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );
    };
    fetch();
  }, []);

  const statCards = [
    { title: "Farmácias", value: stats.totalFarmacias, icon: Building2, color: "text-primary" },
    { title: "Medicamentos", value: stats.totalMedicamentos, icon: Pill, color: "text-secondary" },
    { title: "Serviços", value: stats.totalServicos, icon: Stethoscope, color: "text-accent-foreground" },
    { title: "Utilizadores", value: stats.totalUsers, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category chart */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Medicamentos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={catChart} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Medicamentos" fill="hsl(153, 55%, 39%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Top farmacias table */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ranking de Farmácias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmácia</TableHead>
                  <TableHead className="text-center">Medicamentos</TableHead>
                  <TableHead className="text-center">Serviços</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFarmacias.map((f) => (
                  <TableRow key={f.nome}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-center">{f.meds}</TableCell>
                    <TableCell className="text-center">{f.servs}</TableCell>
                    <TableCell className="text-center font-semibold">{f.meds + f.servs}</TableCell>
                  </TableRow>
                ))}
                {topFarmacias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem dados</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
