// ── Colour palette ────────────────────────────────────────────────
export const G = {
  bg:       "#0a0c10",
  surface:  "#111318",
  card:     "#161a22",
  border:   "#1e2430",
  gold:     "#c9a84c",
  goldSoft: "#e8c97a",
  goldFade: "rgba(201,168,76,0.12)",
  green:    "#22c55e",
  red:      "#ef4444",
  blue:     "#3b82f6",
  muted:    "#4a5568",
  text:     "#e2e8f0",
  textSoft: "#94a3b8",
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const EXPENSE_CATS = {
  housing:"🏠",       food:"🍽️",       utilities:"⚡",      entertain:"🎬",
  health:"💪",        transport:"🚗",   shopping:"🛍️",       business:"💼",
  education:"📚",     insurance:"🛡️",  dining:"🍴",          travel:"✈️",
  subscriptions:"📱", taxes:"🏛️",      other:"📦",
};

export const INCOME_CATS = { salary:"💼", freelance:"💻", invest:"📈", other:"💰" };

export const PIE_COLORS = [
  G.gold, "#3b82f6", "#22c55e", "#a855f7",
  "#ef4444", "#f97316", "#06b6d4", "#ec4899",
];

// ── Currencies ────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: "USD", sym: "$",    flag: "🇺🇸", name: "US Dollar" },
  { code: "EUR", sym: "€",    flag: "🇪🇺", name: "Euro" },
  { code: "GBP", sym: "£",    flag: "🇬🇧", name: "British Pound" },
  { code: "INR", sym: "₹",    flag: "🇮🇳", name: "Indian Rupee" },
  { code: "CAD", sym: "CA$",  flag: "🇨🇦", name: "Canadian Dollar" },
  { code: "AUD", sym: "A$",   flag: "🇦🇺", name: "Australian Dollar" },
  { code: "AED", sym: "AED",  flag: "🇦🇪", name: "UAE Dirham" },
  { code: "SGD", sym: "S$",   flag: "🇸🇬", name: "Singapore Dollar" },
  { code: "JPY", sym: "¥",    flag: "🇯🇵", name: "Japanese Yen" },
  { code: "CNY", sym: "¥",    flag: "🇨🇳", name: "Chinese Yuan" },
  { code: "CHF", sym: "Fr",   flag: "🇨🇭", name: "Swiss Franc" },
  { code: "HKD", sym: "HK$",  flag: "🇭🇰", name: "Hong Kong Dollar" },
  { code: "BRL", sym: "R$",   flag: "🇧🇷", name: "Brazilian Real" },
  { code: "ZAR", sym: "R",    flag: "🇿🇦", name: "S.African Rand" },
  { code: "NGN", sym: "₦",    flag: "🇳🇬", name: "Nigerian Naira" },
  { code: "KES", sym: "KSh",  flag: "🇰🇪", name: "Kenyan Shilling" },
  { code: "PKR", sym: "₨",    flag: "🇵🇰", name: "Pakistani Rupee" },
  { code: "MXN", sym: "$",    flag: "🇲🇽", name: "Mexican Peso" },
  { code: "KRW", sym: "₩",    flag: "🇰🇷", name: "S.Korean Won" },
  { code: "IDR", sym: "Rp",   flag: "🇮🇩", name: "Indonesian Rupiah" },
  { code: "NZD", sym: "NZ$",  flag: "🇳🇿", name: "New Zealand Dollar" },
  { code: "RUB", sym: "₽",    flag: "🇷🇺", name: "Russian Ruble" },
];

// ── Country codes for phone registration ──────────────────────────
export const COUNTRY_CODES = [
  { code: "+1",   flag: "🇺🇸", name: "US / Canada" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "+52",  flag: "🇲🇽", name: "Mexico" },
  { code: "+7",   flag: "🇷🇺", name: "Russia" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea" },
];

export const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Asia/Shanghai", "Asia/Seoul", "Asia/Karachi", "Asia/Dhaka",
  "Australia/Sydney", "Africa/Nairobi", "Africa/Lagos",
];
