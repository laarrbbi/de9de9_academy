import { STORE_URL } from './config.js';

// Store shelves (De9De9 category pages) that lessons link to.
//
// The slugs are the ones the store's catalogue importer generates
// (laarrbbi/de9de9, apps/api/seeders/catalogue-import.ts): a level-2 shelf is
// `<group slug>-<sub-category slug>` in each language, and the Arabic store
// only resolves the Arabic slug. If the store renames a shelf it keeps a
// redirect, but update the slug here too.
export const SHELVES = {
  'travaux-outillage-general': {
    slug: { fr: 'travaux-outillage-general', ar: 'أشغال-عدد-عامة' },
    name: { fr: 'Outillage général', ar: 'عدد عامة' },
  },
  'travaux-plomberie': {
    slug: { fr: 'travaux-plomberie', ar: 'أشغال-سباكة' },
    name: { fr: 'Plomberie', ar: 'سباكة' },
  },
  'travaux-electricite': {
    slug: { fr: 'travaux-electricite', ar: 'أشغال-كهرباء' },
    name: { fr: 'Électricité', ar: 'كهرباء' },
  },
  'travaux-climatisation': {
    slug: { fr: 'travaux-climatisation', ar: 'أشغال-تكييف' },
    name: { fr: 'Climatisation', ar: 'تكييف' },
  },
  'travaux-groupe-electrogene-chantier': {
    slug: { fr: 'travaux-groupe-electrogene-chantier', ar: 'أشغال-مولدات-وورشات' },
    name: { fr: 'Groupe électrogène et chantier', ar: 'مولدات وورشات' },
  },
  'evenement-musique-spectacle': {
    slug: { fr: 'evenement-musique-spectacle', ar: 'مناسبات-موسيقى-وعروض' },
    name: { fr: 'Musique et spectacle', ar: 'موسيقى وعروض' },
  },
};

// Link to a store shelf, tagged so the store can tell Academy traffic apart.
export function shelfUrl(shelf, locale, campaign) {
  const slug = encodeURIComponent(SHELVES[shelf].slug[locale]);
  const query = new URLSearchParams({ utm_source: 'academy-app', utm_medium: 'lesson', utm_campaign: campaign });
  return `${STORE_URL}/${locale}/c/${slug}?${query}`;
}

export function storeUrl(locale, medium) {
  return `${STORE_URL}/${locale}?${new URLSearchParams({ utm_source: 'academy-app', utm_medium: medium })}`;
}
