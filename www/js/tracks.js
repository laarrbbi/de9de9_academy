// A track is a short course on one store shelf. Its lessons live in
// content/lessons/<locale>/<track id>/, one Markdown file per lesson and
// language. To add a track: add it here, draw www/assets/icons/<id>.svg,
// and write its lessons in both languages.
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
  },
  {
    id: 'magie',
    name: { fr: 'Magie de cartes', ar: 'خدع الورق' },
    tagline: {
      fr: 'Trois tours pour débuter et les règles d’or des magiciens pour bluffer votre public.',
      ar: 'ثلاث خدع للمبتدئين والقواعد الذهبية للسحرة لإبهار جمهورك.',
    },
    group: { fr: 'Évènement', ar: 'مناسبات' },
    shelf: 'evenement-musique-spectacle',
  },
];

export const LOCALES = ['fr', 'ar'];
