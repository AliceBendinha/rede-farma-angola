// Validação de telefone em formato E.164 (ex.: +244923456789).
// Permite "+" seguido de 8 a 15 dígitos.
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function isValidE164(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return E164_REGEX.test(phone.trim());
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s().-]/g, "").trim();
}

export const PHONE_HINT =
  "Use o formato internacional, ex.: +244923456789";
