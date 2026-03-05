import { supabase } from "@/integrations/supabase/client";

/**
 * Chama uma edge function com o token JWT do utilizador autenticado.
 * Lança erro se não houver sessão activa.
 */
export async function callFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessão expirada — faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: body ?? {},
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data as T;
}
