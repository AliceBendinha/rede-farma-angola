import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Endpoints that must never work without a valid user JWT.
const PROTECTED = [
  { name: "list-users", method: "POST", body: {} },
  { name: "create-farmacia-user", method: "POST", body: { email: "x@y.com", password: "Abcd1234", farmacia_id: crypto.randomUUID() } },
  { name: "reset-farmacia-password", method: "POST", body: { user_id: crypto.randomUUID(), password: "Abcd1234" } },
  { name: "farmacia-stats", method: "POST", body: {} },
  { name: "send-stock-alert", method: "POST", body: { medicamento_id: crypto.randomUUID() } },
];

async function call(
  name: string,
  method: string,
  body: unknown,
  authorization?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
  };
  if (authorization) headers["Authorization"] = authorization;

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  const text = await res.text(); // always consume the body
  return { status: res.status, text };
}

for (const ep of PROTECTED) {
  Deno.test(`${ep.name}: sem Authorization devolve 401`, async () => {
    const { status, text } = await call(ep.name, ep.method, ep.body);
    assertEquals(status, 401, `esperado 401, recebido ${status}: ${text}`);
  });

  Deno.test(`${ep.name}: Authorization malformada devolve 401`, async () => {
    const { status, text } = await call(ep.name, ep.method, ep.body, "NotBearer abc");
    assertEquals(status, 401, `esperado 401, recebido ${status}: ${text}`);
  });

  Deno.test(`${ep.name}: JWT inválido devolve 401`, async () => {
    const { status, text } = await call(ep.name, ep.method, ep.body, "Bearer eyJhbGciOiJIUzI1NiJ9.invalid.signature");
    assertEquals(status, 401, `esperado 401, recebido ${status}: ${text}`);
  });

  Deno.test(`${ep.name}: anon key como token não concede acesso`, async () => {
    const { status, text } = await call(ep.name, ep.method, ep.body, `Bearer ${ANON_KEY}`);
    assert(
      status === 401 || status === 403,
      `esperado 401/403, recebido ${status}: ${text}`,
    );
  });

  Deno.test(`${ep.name}: nunca expõe segredos nas respostas de erro`, async () => {
    const { text } = await call(ep.name, ep.method, ep.body);
    const lowered = text.toLowerCase();
    for (const leak of ["service_role", "secret", "twilio", "sid", "password"]) {
      assert(!lowered.includes(leak), `resposta de erro expõe "${leak}": ${text}`);
    }
  });

  Deno.test(`${ep.name}: responde ao preflight CORS`, async () => {
    const res = await fetch(`${FUNCTIONS_URL}/${ep.name}`, { method: "OPTIONS" });
    await res.text();
    assert(res.status < 400, `preflight falhou com ${res.status}`);
    assert(
      res.headers.get("access-control-allow-origin") !== null,
      "cabeçalhos CORS ausentes",
    );
  });
}
