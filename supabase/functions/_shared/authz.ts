// Regras puras de autorização, partilhadas e testáveis.

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/**
 * Um utilizador só pode agir sobre recursos da sua própria farmácia.
 * Admins podem agir sobre qualquer farmácia.
 */
export function canActOnFarmacia(opts: {
  isAdmin: boolean;
  isFarmacia: boolean;
  ownFarmaciaId: string | null;
  targetFarmaciaId: string | null;
}): boolean {
  const { isAdmin, isFarmacia, ownFarmaciaId, targetFarmaciaId } = opts;
  if (isAdmin) return true;
  if (!isFarmacia) return false;
  if (!ownFarmaciaId || !targetFarmaciaId) return false;
  return ownFarmaciaId === targetFarmaciaId;
}
