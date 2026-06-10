export const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 155,
  CAD: 1.36,
  AUD: 1.5,
  SGD: 1.34,
  AED: 3.67
};

export const REGION_CURRENCY: Record<string, string> = {
  AE: "AED",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  HK: "HKD",
  IN: "INR",
  JP: "JPY",
  SG: "SGD",
  US: "USD"
};

export type FxRatesPayload = {
  base: "USD";
  date: string;
  rates: Record<string, number>;
  provider: string;
  fallback: boolean;
};
