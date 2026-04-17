export const CURRENCIES = [
  { code: 'USD', sym: '$',    flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', sym: '€',    flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', sym: '£',    flag: '🇬🇧', name: 'British Pound' },
  { code: 'INR', sym: '₹',    flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'CAD', sym: 'CA$',  flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'AUD', sym: 'A$',   flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'AED', sym: 'AED',  flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'SGD', sym: 'S$',   flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'JPY', sym: '¥',    flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'CNY', sym: '¥',    flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'CHF', sym: 'Fr',   flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'HKD', sym: 'HK$',  flag: '🇭🇰', name: 'Hong Kong Dollar' },
  { code: 'BRL', sym: 'R$',   flag: '🇧🇷', name: 'Brazilian Real' },
  { code: 'ZAR', sym: 'R',    flag: '🇿🇦', name: 'S.African Rand' },
  { code: 'NGN', sym: '₦',    flag: '🇳🇬', name: 'Nigerian Naira' },
  { code: 'KES', sym: 'KSh',  flag: '🇰🇪', name: 'Kenyan Shilling' },
  { code: 'PKR', sym: '₨',    flag: '🇵🇰', name: 'Pakistani Rupee' },
  { code: 'MXN', sym: '$',    flag: '🇲🇽', name: 'Mexican Peso' },
  { code: 'KRW', sym: '₩',    flag: '🇰🇷', name: 'S.Korean Won' },
  { code: 'IDR', sym: 'Rp',   flag: '🇮🇩', name: 'Indonesian Rupiah' },
  { code: 'NZD', sym: 'NZ$',  flag: '🇳🇿', name: 'New Zealand Dollar' },
  { code: 'RUB', sym: '₽',    flag: '🇷🇺', name: 'Russian Ruble' },
];

/** Map code → symbol for quick lookups */
export const CURRENCY_SYMBOLS = Object.fromEntries(CURRENCIES.map(c => [c.code, c.sym]));

/** Get the symbol for a currency code, falling back gracefully */
export const currSym = (code) => CURRENCY_SYMBOLS[code] || code || '$';
