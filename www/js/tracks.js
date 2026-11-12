// A track is a short course on one store shelf. Its lessons live in
// content/lessons/<locale>/<track id>/, one Markdown file per lesson and
// language. To add a track: add it here, copy its pictures (below) into
// www/assets/, and write its lessons in both languages. `shelf` is the store
// shelf that sells the track's tools, or null when no shelf does (no button
// is shown).
//
// The pictures are de9de9.dz's own 3D art, as the store ships it
// (laarrbbi/de9de9, apps/storefront/src/assets/): `emoji` is the sub-category
// emoji of the same trade (subcategory-emoji/<emoji>.webp), or the group's
// (category-emoji/<group>.webp) when de9de9.dz has none, never a picture of
// something else; `scene` is the group's scene (category-scene/<scene>.webp);
// `groupEmoji` the group's emoji.
export const TRACKS = [
  {
    id: 'plomberie',
    name: { fr: 'Plomberie', ar: 'السباكة' },
    tagline: {
      fr: 'Déboucher, réparer une fuite, couper l’eau : les gestes qui évitent le dégât des eaux.',
      ar: 'تسريح الانسداد وإصلاح التسرب وقطع الماء: حركات بسيطة تجنبك الأضرار.',
    },
    group: { fr: 'Travaux', ar: 'أشغال' },
    shelf: 'travaux-plomberie',
    emoji: 'subcategory-emoji/travaux-plomberie',
    groupEmoji: 'travaux',
    scene: 'travaux',
  },
  {
    id: 'electricite',
    name: { fr: 'Électricité', ar: 'الكهرباء' },
    tagline: {
      fr: 'Comprendre son tableau, mesurer sans risque et changer une prise en sécurité.',
      ar: 'افهم لوحتك الكهربائية، وقِس دون خطر، وغيّر مقبسًا بأمان.',
    },
    group: { fr: 'Travaux', ar: 'أشغال' },
    shelf: 'travaux-electricite',
    emoji: 'subcategory-emoji/travaux-electricite',
    groupEmoji: 'travaux',
    scene: 'travaux',
  },
  {
    id: 'climatisation',
    name: { fr: 'Climatisation', ar: 'التكييف' },
    tagline: {
      fr: 'Comment marche un climatiseur, l’entretien que vous pouvez faire et quand appeler un technicien.',
      ar: 'كيف يعمل المكيف، والصيانة التي يمكنك القيام بها، ومتى تتصل بتقني.',
    },
    group: { fr: 'Travaux', ar: 'أشغال' },
    shelf: 'travaux-climatisation',
    emoji: 'subcategory-emoji/travaux-climatisation',
    groupEmoji: 'travaux',
    scene: 'travaux',
  },
  {
    id: 'magie',
    name: { fr: 'Magie de cartes', ar: 'خدع الورق' },
    tagline: {
      fr: 'Trois tours pour débuter et les règles d’or des magiciens pour bluffer votre public.',
      ar: 'ثلاث خدع للمبتدئين والقواعد الذهبية للسحرة لإبهار جمهورك.',
    },
    group: { fr: 'Évènement', ar: 'مناسبات' },
    // No shelf yet: the store sells no playing cards. Musique et spectacle
    // (evenement-musique-spectacle) only has speakers, lights and microphones.
    shelf: null,
    // de9de9.dz has no card-magic service: the group's party popper.
    emoji: 'category-emoji/evenement',
    groupEmoji: 'evenement',
    scene: 'evenement',
  },
];

export const LOCALES = ['fr', 'ar'];

// Picture paths, relative to www/.
export const trackEmoji = (track) => `assets/${track.emoji}.webp`;
export const groupEmoji = (track) => `assets/category-emoji/${track.groupEmoji}.webp`;
export const trackScene = (track) => `assets/category-scene/${track.scene}.webp`;
