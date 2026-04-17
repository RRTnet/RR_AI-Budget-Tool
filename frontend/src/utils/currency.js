import { CURRENCIES } from "../constants";

export const CURRENCY_SYMBOLS = Object.fromEntries(CURRENCIES.map(c => [c.code, c.sym]));

export const currSym = (code) => CURRENCY_SYMBOLS[code] || code || "$";

export const fmt = (n, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: currency || "USD", maximumFractionDigits: 2,
    }).format(n ?? 0);
  } catch {
    return `${currSym(currency)}${(n ?? 0).toFixed(2)}`;
  }
};

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// rates = { USD: 1, GBP: 0.79, EUR: 0.92, ... } (relative to USD)
export const toBase = (amount, fromCcy, baseCcy, rates) => {
  if (!rates || !fromCcy || fromCcy === baseCcy) return amount;
  const fromRate = rates[fromCcy] || 1;
  const toRate   = rates[baseCcy] || 1;
  return (amount / fromRate) * toRate;
};
