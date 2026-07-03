// Shared input validation helpers

/** Keep only digits, capped at 10 chars — use as an onChange sanitizer. */
export function sanitizePhone(v: string): string {
  return v.replace(/\D/g, "").slice(0, 10);
}

/** Indian mobile: exactly 10 digits, starting 6-9. */
export function isValidPhone(v: string): boolean {
  return /^[6-9]\d{9}$/.test(v.trim());
}

export const PHONE_ERROR = "Enter a valid 10-digit mobile number";

/** 6-digit Indian PIN code. */
export function isValidPincode(v: string): boolean {
  return /^\d{6}$/.test(v.trim());
}

export function sanitizePincode(v: string): string {
  return v.replace(/\D/g, "").slice(0, 6);
}
