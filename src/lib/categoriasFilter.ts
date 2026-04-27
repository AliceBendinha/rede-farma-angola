import type { QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

export const CATEGORIAS_QUERY_KEY = ["categorias-com-medicamentos"] as const;

export interface CategoriaJoinRow {
  id: string;
  nome: string;
  medicamentos?: unknown;
}

export interface Categoria {
  id: string;
  nome: string;
}

/**
 * Deduplicates categories returned by an inner join against medicamentos.
 * Each categoria can repeat once per related medicamento — keep first occurrence.
 */
export function dedupeCategorias(rows: CategoriaJoinRow[] | null | undefined): Categoria[] {
  if (!rows) return [];
  const seen = new Set<string>();
  const out: Categoria[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push({ id: row.id, nome: row.nome });
  }
  return out;
}

/**
 * Fetches categorias that have at least one medicamento using a single inner join.
 */
export async function fetchCategoriasComMedicamentos(
  client: Pick<SupabaseClient, "from">
): Promise<Categoria[]> {
  const { data, error } = await (client.from("categorias") as any)
    .select("id, nome, medicamentos!inner(id)")
    .order("nome");

  if (error) return [];
  return dedupeCategorias(data as CategoriaJoinRow[] | null);
}

/**
 * Returns a realtime handler that invalidates the categorias query.
 * Exported so it can be unit-tested independently from React lifecycles.
 */
export function createCategoriasInvalidator(queryClient: QueryClient) {
  return () => {
    queryClient.invalidateQueries({ queryKey: CATEGORIAS_QUERY_KEY });
  };
}