export function shortHash(hex: string, n = 8): string {
  return hex ? `${hex.slice(0, n)}…${hex.slice(-n)}` : "";
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function streams(n: number): string {
  return new Intl.NumberFormat("en-KE").format(n);
}
