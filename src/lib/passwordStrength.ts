export const PASSWORD_REQUIREMENTS =
  "Mínimo 8 caracteres, com pelo menos uma letra e um número.";

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePasswordStrength(
  password: string,
): PasswordValidationResult {
  if (!password || password.length < 8) {
    return { valid: false, message: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: "A palavra-passe deve conter pelo menos uma letra." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "A palavra-passe deve conter pelo menos um número." };
  }
  return { valid: true };
}