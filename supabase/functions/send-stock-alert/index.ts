import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const E164_REGEX = /^\+[1-9]\d{7,14}$/;
const COOLDOWN_HOURS = 24;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

interface ReqBody {
  medicamento_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Require a valid JWT ────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } =
        await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return json({ error: "Não autenticado" }, 401);
      }
      userId = claimsData.claims.sub as string;
    } catch (_e) {
      return json({ error: "Não autenticado" }, 401);
    }


    // ── 2. Require farmacia or admin role ─────────────────────
    const [{ data: isFarmacia }, { data: isAdmin }] = await Promise.all([
      userClient.rpc("has_role", { _user_id: userId, _role: "farmacia" }),
      userClient.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);

    if (!isFarmacia && !isAdmin) {
      return json({ error: "Acesso negado" }, 403);
    }

    const { medicamento_id } = (await req.json().catch(() => ({}))) as ReqBody;
    if (!isUuid(medicamento_id)) {
      return json({ error: "medicamento_id inválido" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: med, error: medErr } = await supabase
      .from("medicamentos")
      .select(
        "id, nome, quantidade_stock, stock_minimo, ultimo_alerta_em, farmacia_id, farmacias(nome, telefone)"
      )
      .eq("id", medicamento_id)
      .single();

    if (medErr || !med) {
      return json({ error: "Medicamento não encontrado" }, 404);
    }

    // ── 3. Pharmacy users may only alert their own medicines ──
    const { data: ownFarmacia } = isAdmin
      ? { data: null }
      : await userClient
          .from("farmacias")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

    if (
      !canActOnFarmacia({
        isAdmin: !!isAdmin,
        isFarmacia: !!isFarmacia,
        ownFarmaciaId: ownFarmacia?.id ?? null,
        targetFarmaciaId: med.farmacia_id ?? null,
      })
    ) {
      return json({ error: "Acesso negado" }, 403);
    }



    const qty = med.quantidade_stock ?? 0;
    const min = med.stock_minimo ?? 0;
    if (qty > min) {
      return json({ skipped: "Stock acima do mínimo" }, 200);
    }

    // Cooldown 24h
    if (med.ultimo_alerta_em) {
      const last = new Date(med.ultimo_alerta_em).getTime();
      const elapsedH = (Date.now() - last) / 1000 / 3600;
      if (elapsedH < COOLDOWN_HOURS) {
        return json({ skipped: "Alerta já enviado nas últimas 24h" }, 200);
      }
    }

    const farmacia = (med as any).farmacias as
      | { nome: string; telefone: string | null }
      | null;
    const phone = farmacia?.telefone?.trim();

    if (!phone || !E164_REGEX.test(phone)) {
      return json(
        { error: "Telefone da farmácia inválido ou não definido (E.164)" },
        400
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      console.warn("Twilio não configurado — alerta SMS ignorado");
      return json(
        {
          skipped:
            "Twilio não configurado. Ligue o conector Twilio para activar alertas SMS.",
        },
        200
      );
    }
    if (!TWILIO_FROM) {
      return json(
        { error: "TWILIO_FROM_NUMBER não configurado" },
        500
      );
    }

    const body =
      qty === 0
        ? `Rede Farma: ${med.nome} está ESGOTADO. Reponha o stock o quanto antes.`
        : `Rede Farma: stock baixo de ${med.nome} (${qty} unidades). Reponha em breve.`;

    const params = new URLSearchParams({
      To: phone,
      From: TWILIO_FROM,
      Body: body,
    });

    const twilioRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const twilioData = await twilioRes.json().catch(() => ({}));
    if (!twilioRes.ok) {
      console.error("Twilio falhou", twilioRes.status, twilioData);
      return json({ error: "Falha ao enviar SMS" }, 502);

    }

    await supabase
      .from("medicamentos")
      .update({ ultimo_alerta_em: new Date().toISOString() })
      .eq("id", med.id);

    return json({ ok: true, sid: twilioData.sid });
  } catch (err) {
    console.error(err);
    return json({ error: "Erro interno" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
