// Shared size normalization + canonical list for the admin dashboard.
// Keeping size handling in one place ensures the storefront, cart, checkout
// and orders all see the same normalized label.

export const COMMON_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "One Size",
  "Free Size",
];

// Standard letter sizes are uppercased for a consistent, readable label.
const LETTER_SIZE_MAP = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
  xxxl: "XXXL",
};

// Phrase sizes are `Title Cased` so the customer-facing label stays readable.
const PHRASE_SIZE_MAP = {
  "one size": "One Size",
  "free size": "Free Size",
};

// Normalizes an admin-entered size label to a canonical, readable form.
//
//   "m"  -> "M"
//   "M"  -> "M"
//   "xl" -> "XL"
//   "xL" -> "XL"
//   "one size" -> "One Size"
//   "FREE SIZE" -> "Free Size"
//   "38"       -> "38"   (custom — trimmed, otherwise preserved)
//   "2-3Y"     -> "2-3Y" (custom — trimmed, otherwise preserved)
//
// Custom values keep their meaningful content; only surrounding whitespace
// is stripped. Standard letter / phrase sizes are folded to one canonical
// spelling so capitalization differences never create separate variants.
export function normalizeSize(raw) {
  if (raw == null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (PHRASE_SIZE_MAP[lower]) return PHRASE_SIZE_MAP[lower];
  if (LETTER_SIZE_MAP[lower]) return LETTER_SIZE_MAP[lower];

  return trimmed;
}
