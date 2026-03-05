import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── 1. Validate JWT explicitly ──────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Token JWT em falta" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "JWT inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub as string;

  // ── 2. Check role ──────────────────────────────────────────
  const { data: hasRole } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "farmacia",
  });

  if (!hasRole) {
    return new Response(JSON.stringify({ error: "Sem permissão" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 3. Get pharmacy data scoped to this user ───────────────
  const { data: farmacia } = await supabase
    .from("farmacias")
    .select("id, nome")
    .eq("user_id", userId)
    .maybeSingle();

  if (!farmacia) {
    return new Response(JSON.stringify({ error: "Farmácia não encontrada" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const [medsRes, servRes] = await Promise.all([
    supabase
      .from("medicamentos")
      .select("id, preco", { count: "exact" })
      .eq("farmacia_id", farmacia.id),
    supabase
      .from("servicos")
      .select("id, preco", { count: "exact" })
      .eq("farmacia_id", farmacia.id),
  ]);

  const totalMeds = medsRes.count ?? 0;
  const totalServicos = servRes.count ?? 0;
  const avgPreco =
    totalMeds > 0
      ? (medsRes.data ?? []).reduce((s, m) => s + Number(m.preco), 0) /
        totalMeds
      : 0;

  return new Response(
    JSON.stringify({
      farmacia: farmacia.nome,
      totalMedicamentos: totalMeds,
      totalServicos,
      precoMedio: Math.round(avgPreco * 100) / 100,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
