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

// The De9De9 app (the services app) and the brand's social pages, as
// de9de9.dz and the store's footer link them (laarrbbi/de9de9,
// apps/storefront/src/components/site-footer.tsx).
export const APP_LINKS = {
  googlePlay: 'https://play.google.com/store/apps/details?id=dz.avalonlabs.de9de9',
  appStore: 'https://apps.apple.com/dz/app/de9de9/id6747710951',
};
export const SOCIAL_LINKS = [
  { name: 'Facebook', icon: 'facebook', href: 'https://web.facebook.com/people/De9De9/61572270343215' },
  { name: 'Instagram', icon: 'instagram', href: 'https://instagram.com/de9de9.dz' },
  { name: 'TikTok', icon: 'tiktok', href: 'https://tiktok.com/@de9de9.dz' },
  { name: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/company/de9-de9/' },
];
