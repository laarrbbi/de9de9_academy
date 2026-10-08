import { getCollection, type CollectionEntry } from 'astro:content';
import { TRACKS, getTrack, type Track } from '../data/tracks';
import { isLocale, type Locale } from '../i18n/ui';

export type LessonEntry = CollectionEntry<'lessons'>;

export interface Lesson {
  readonly entry: LessonEntry;
  readonly locale: Locale;
  readonly track: Track;
  /** The lesson's file name, shared by both languages. */
  readonly slug: string;
  /** Locale-independent key, "<track>/<slug>", used for progress. */
  readonly key: string;
}

function toLesson(entry: LessonEntry): Lesson {
  const [locale, trackId, slug] = entry.id.split('/');
  if (!isLocale(locale) || trackId === undefined || slug === undefined) {
    throw new Error(`Lesson "${entry.id}" must live at <locale>/<track>/<lesson>.md`);
  }
  return { entry, locale, track: getTrack(trackId), slug, key: `${trackId}/${slug}` };
}

/** Every lesson in one language, in track order then lesson order. */
export async function getLessons(locale: Locale): Promise<Lesson[]> {
  const all = (await getCollection('lessons')).map(toLesson).filter((l) => l.locale === locale);
  const trackIndex = (l: Lesson) => TRACKS.findIndex((t) => t.id === l.track.id);
  return all.sort((a, b) => trackIndex(a) - trackIndex(b) || a.entry.data.order - b.entry.data.order);
}

export async function getTrackLessons(locale: Locale, trackId: string): Promise<Lesson[]> {
  return (await getLessons(locale)).filter((l) => l.track.id === trackId);
}

export function lessonUrl(lesson: Pick<Lesson, 'locale' | 'track' | 'slug'>): string {
  return `/${lesson.locale}/${lesson.track.id}/${lesson.slug}/`;
}

export function trackUrl(locale: Locale, trackId: string): string {
  return `/${locale}/${trackId}/`;
}
