// Interface text, in both languages. Lesson text lives in content/lessons/.
const fr = {
  'app.name': 'De9De9 Academy',
  'nav.back': 'Retour',
  'nav.switch': 'العربية',
  'nav.switchLabel': 'Passer en arabe',

  'home.title': 'Apprenez les bons gestes.',
  'home.lead': 'Réparer, entretenir et épater, avec le bon matériel De9De9.',
  'home.progress': 'Votre progression',
  'home.lessons': 'leçons',
  'home.start': 'Commencer',
  'home.continue': 'Continuer',
  'home.allDone': 'Toutes les leçons sont terminées. Bravo !',
  'home.tracks': 'Parcours',
  'home.storeTitle': 'Le bon outil change tout',
  'home.storeBody': 'Paiement à la livraison, dans les 58 wilayas.',
  'home.storeCta': 'Ouvrir la boutique',
  'home.note': 'Ces leçons donnent les gestes de base. En cas de doute, faites appel à un professionnel.',

  'track.lessons': 'leçons',
  'track.lesson': 'Leçon',
  'track.done': 'terminées',
  'track.start': 'Commencer',
  'track.continue': 'Continuer',
  'track.review': 'Revoir le parcours',
  'track.shop': 'Voir le rayon',

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
  'lesson.isDone': 'Leçon terminée',

  'quiz.title': 'Testez-vous',
  'quiz.lead': 'Répondez aux questions pour valider la leçon.',
  'quiz.check': 'Vérifier mes réponses',
  'quiz.retry': 'Réessayer',
  'quiz.incomplete': 'Répondez à toutes les questions.',
  'quiz.score': 'bonnes réponses sur',
  'quiz.success': 'Bravo ! Leçon validée.',
};

const ar = {
  'app.name': 'أكاديمية De9De9',
  'nav.back': 'رجوع',
  'nav.switch': 'Français',
  'nav.switchLabel': 'Passer en français',

  'home.title': 'تعلّم الحركات الصحيحة.',
  'home.lead': 'الإصلاح والصيانة وإبهار من حولك، مع المعدات المناسبة من De9De9.',
  'home.progress': 'تقدّمك',
  'home.lessons': 'دروس',
  'home.start': 'ابدأ',
  'home.continue': 'تابع',
  'home.allDone': 'أكملت كل الدروس. أحسنت!',
  'home.tracks': 'المسارات',
  'home.storeTitle': 'الأداة المناسبة تصنع الفرق',
  'home.storeBody': 'الدفع عند الاستلام، في 58 ولاية.',
  'home.storeCta': 'افتح المتجر',
  'home.note': 'تقدّم هذه الدروس الحركات الأساسية. عند الشك، استعن بمحترف.',

  'track.lessons': 'دروس',
  'track.lesson': 'الدرس',
  'track.done': 'مكتملة',
  'track.start': 'ابدأ',
  'track.continue': 'تابع',
  'track.review': 'راجع المسار',
  'track.shop': 'زيارة القسم',

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
  'lesson.isDone': 'درس مكتمل',

  'quiz.title': 'اختبر نفسك',
  'quiz.lead': 'أجب عن الأسئلة لإتمام الدرس.',
  'quiz.check': 'تحقّق من إجاباتي',
  'quiz.retry': 'أعد المحاولة',
  'quiz.incomplete': 'أجب عن كل الأسئلة.',
  'quiz.score': 'إجابات صحيحة من',
  'quiz.success': 'أحسنت! تم إتمام الدرس.',
};

export const STRINGS = { fr, ar };

export function t(locale, key) {
  return STRINGS[locale][key] ?? STRINGS.fr[key] ?? key;
}

export function dir(locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
