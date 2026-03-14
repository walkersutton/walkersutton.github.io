export const SHIPPING_RATES = {
  US: { name: "United States", amount: 500 },
  CA: { name: "Canada", amount: 1500 },
  INTL: { name: "International", amount: 2500 },
};

export const SUPPORTED_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "NZ", name: "New Zealand" },
];

export function getShippingPrice(countryCode: string, quantity: number = 1): number {
  let baseRate: number;
  let isUS = false;

  if (countryCode === "US") {
    baseRate = SHIPPING_RATES.US.amount;
    isUS = true;
  } else if (countryCode === "CA") {
    baseRate = SHIPPING_RATES.CA.amount;
  } else {
    baseRate = SHIPPING_RATES.INTL.amount;
  }

  // If quantity is 1, return base rate
  if (quantity <= 1) {
    return baseRate;
  }

  // For multiple items:
  // US: base rate + ((quantity - 1) * base rate / 2)
  // CA/INTL: base rate + ((quantity - 1) * base rate / 6)
  const divisor = isUS ? 2 : 6;
  const additionalItemsRate = (quantity - 1) * (baseRate / divisor);
  return baseRate + additionalItemsRate;
}
