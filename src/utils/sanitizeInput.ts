export function sanitizeInput(input: string): string {
  return input
    .replace(/["\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
