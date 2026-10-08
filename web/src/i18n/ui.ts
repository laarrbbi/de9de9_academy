export const LOCALES = ['fr', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '');
}

export function dir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

const fr = {
  'site.name': 'De9De9 Academy',
  'site.description':
    'Des leçons courtes et des astuces pour réparer, entretenir et apprendre, avec le bon matériel De9De9.',
  'nav.home': 'Academy',
  'nav.breadcrumb': 'Fil d’Ariane',
  'nav.tracks': 'Parcours',
  'nav.store': 'Boutique De9De9',
  'nav.switch': 'العربية',
  'nav.switchLabel': 'Lire en arabe',

  'home.eyebrow': 'Nouveau chez De9De9',
  'home.title': 'Apprenez à réparer, entretenir et épater.',
  'home.lead':
    'Des leçons courtes, illustrées et testées, sur ce que vous achetez chez De9De9. Vous savez quoi faire vous-même, et quand appeler un pro.',
  'home.cta': 'Voir les parcours',
  'home.cardLesson': 'Leçon',
  'home.cardProgress': 'Votre progression',
  'home.tracksTitle': 'Choisissez un parcours',
  'home.tracksLead': 'Chaque parcours suit un rayon de la boutique. Commencez par la leçon 1.',
  'home.howTitle': 'Comment ça marche',
  'home.how1.title': 'Apprenez',
  'home.how1.body': 'Des leçons de 10 à 20 minutes, étape par étape, en français et en arabe.',
  'home.how2.title': 'Testez-vous',
  'home.how2.body': 'Un petit quiz à la fin de chaque leçon pour vérifier que c’est acquis.',
  'home.how3.title': 'Équipez-vous',
  'home.how3.body': 'Chaque leçon liste le matériel nécessaire, disponible dans le bon rayon De9De9.',
  'home.storeTitle': 'Le bon outil change tout',
  'home.storeBody': 'Paiement à la livraison, dans les 58 wilayas.',
  'home.storeCta': 'Ouvrir la boutique',

  'track.lessons': 'leçons',
  'track.lesson': 'Leçon',
  'track.done': 'terminées',
  'track.start': 'Commencer',
  'track.shop': 'Voir le rayon',
  'track.shopLead': 'Le matériel de ce parcours est dans le rayon',

  'lesson.minutes': 'min',
  'lesson.level.beginner': 'Débutant',
  'lesson.level.intermediate': 'Intermédiaire',
  'lesson.risk.low': 'Sans danger',
  'lesson.risk.medium': 'Prudence',
  'lesson.risk.high': 'Sécurité d’abord',
  'lesson.safety': 'Avant de commencer',
  'lesson.tools': 'Le matériel',
  'lesson.toolsShop': 'Voir sur De9De9',
  'lesson.pro': 'Arrêtez-vous et appelez un pro si…',
  'lesson.proCta': 'Trouver un professionnel',
  'lesson.prev': 'Leçon précédente',
  'lesson.next': 'Leçon suivante',
  'lesson.backToTrack': 'Retour au parcours',
  'lesson.trackDone': 'Parcours terminé, bravo !',
  'lesson.isDone': 'Leçon terminée',

  'quiz.title': 'Testez-vous',
  'quiz.lead': 'Répondez aux questions pour valider la leçon.',
  'quiz.check': 'Vérifier mes réponses',
  'quiz.retry': 'Réessayer',
  'quiz.incomplete': 'Répondez à toutes les questions.',
  'quiz.score': 'bonnes réponses sur',
  'quiz.success': 'Bravo ! Leçon validée.',
  'quiz.noscript': 'Activez JavaScript pour faire le quiz.',

  'notFound.title': 'Page introuvable',
  'notFound.body': 'Cette page n’existe pas ou a été déplacée.',
  'notFound.cta': 'Retour à l’accueil',

  'footer.note': 'Ces leçons donnent les gestes de base. En cas de doute, faites appel à un professionnel.',
} as const;

export type UiKey = keyof typeof fr;

const ar: Record<UiKey, string> = {
  'site.name': 'أكاديمية De9De9',
  'site.description': 'دروس قصيرة ونصائح للإصلاح والصيانة والتعلّم، مع المعدات المناسبة من De9De9.',
  'nav.home': 'الأكاديمية',
  'nav.breadcrumb': 'مسار التنقل',
  'nav.tracks': 'المسارات',
  'nav.store': 'متجر De9De9',
  'nav.switch': 'Français',
  'nav.switchLabel': 'Lire en français',

  'home.eyebrow': 'جديد من De9De9',
  'home.title': 'تعلّم الإصلاح والصيانة وإبهار من حولك.',
  'home.lead':
    'دروس قصيرة ومجرَّبة حول ما تشتريه من De9De9. تعرف ما يمكنك فعله بنفسك، ومتى تتصل بمحترف.',
  'home.cta': 'اكتشف المسارات',
  'home.cardLesson': 'درس',
  'home.cardProgress': 'تقدّمك',
  'home.tracksTitle': 'اختر مسارًا',
  'home.tracksLead': 'كل مسار مرتبط بقسم من المتجر. ابدأ بالدرس الأول.',
  'home.howTitle': 'كيف تعمل الأكاديمية',
  'home.how1.title': 'تعلّم',
  'home.how1.body': 'دروس من 10 إلى 20 دقيقة، خطوة بخطوة، بالعربية والفرنسية.',
  'home.how2.title': 'اختبر نفسك',
  'home.how2.body': 'اختبار قصير في نهاية كل درس للتأكد من أنك فهمت.',
  'home.how3.title': 'جهّز نفسك',
  'home.how3.body': 'كل درس يذكر المعدات اللازمة، المتوفرة في القسم المناسب من De9De9.',
  'home.storeTitle': 'الأداة المناسبة تصنع الفرق',
  'home.storeBody': 'الدفع عند الاستلام، في 58 ولاية.',
  'home.storeCta': 'افتح المتجر',

  'track.lessons': 'دروس',
  'track.lesson': 'الدرس',
  'track.done': 'مكتملة',
  'track.start': 'ابدأ',
  'track.shop': 'زيارة القسم',
  'track.shopLead': 'معدات هذا المسار متوفرة في قسم',

  'lesson.minutes': 'د',
  'lesson.level.beginner': 'مبتدئ',
  'lesson.level.intermediate': 'متوسط',
  'lesson.risk.low': 'بدون خطر',
  'lesson.risk.medium': 'بحذر',
  'lesson.risk.high': 'السلامة أولًا',
  'lesson.safety': 'قبل أن تبدأ',
  'lesson.tools': 'المعدات',
  'lesson.toolsShop': 'شاهد في De9De9',
  'lesson.pro': 'توقّف واتصل بمحترف إذا…',
  'lesson.proCta': 'ابحث عن محترف',
  'lesson.prev': 'الدرس السابق',
  'lesson.next': 'الدرس التالي',
  'lesson.backToTrack': 'العودة إلى المسار',
  'lesson.trackDone': 'أكملت المسار، أحسنت!',
  'lesson.isDone': 'درس مكتمل',

  'quiz.title': 'اختبر نفسك',
  'quiz.lead': 'أجب عن الأسئلة لإتمام الدرس.',
  'quiz.check': 'تحقّق من إجاباتي',
  'quiz.retry': 'أعد المحاولة',
  'quiz.incomplete': 'أجب عن كل الأسئلة.',
  'quiz.score': 'إجابات صحيحة من',
  'quiz.success': 'أحسنت! تم إتمام الدرس.',
  'quiz.noscript': 'فعّل JavaScript لإجراء الاختبار.',

  'notFound.title': 'الصفحة غير موجودة',
  'notFound.body': 'هذه الصفحة غير موجودة أو تم نقلها.',
  'notFound.cta': 'العودة إلى الرئيسية',

  'footer.note': 'تقدّم هذه الدروس الحركات الأساسية. عند الشك، استعن بمحترف.',
};

const STRINGS: Record<Locale, Record<UiKey, string>> = { fr, ar };

export function t(locale: Locale, key: UiKey): string {
  return STRINGS[locale][key];
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'fr' ? 'ar' : 'fr';
}
