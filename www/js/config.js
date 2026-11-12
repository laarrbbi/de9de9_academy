// The De9De9 shop. Lesson tools and tracks link to its category pages
// (apps/storefront in laarrbbi/de9de9: /{locale}/c/{slug}). Links open in the
// phone's browser. Swap in the store app's deep links once they exist.
export const STORE_URL = 'https://de9de9.dz';

// Whether the shop is online at STORE_URL. Not yet: de9de9.dz is the client's
// services site, which has no /{locale}/c/{slug} pages, and the shop has no
// public address. Until it does, the app shows no store link at all: tools
// keep their names, the track's shelf button and the store card go. The
// `shelf:` of each lesson stays in place, so setting this to true (with
// STORE_URL pointing at the shop) brings every link back as it was.
export const STORE_LIVE = false;

// Where "Find a professional" goes: de9de9.dz, the client's services site
// (plumbers, electricians, AC technicians...). It is online today.
export const SERVICES_URL = 'https://de9de9.dz';
