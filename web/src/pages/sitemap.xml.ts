import type { APIRoute } from 'astro';
import { TRACKS } from '../data/tracks';
import { LOCALES } from '../i18n/ui';
import { getLessons, getTrackLessons, lessonUrl, trackUrl } from '../lib/lessons';

export const GET: APIRoute = async ({ site }) => {
  const paths: string[] = [];
  for (const locale of LOCALES) {
    paths.push(`/${locale}/`);
    for (const track of TRACKS) {
      if ((await getTrackLessons(locale, track.id)).length > 0) paths.push(trackUrl(locale, track.id));
    }
    for (const lesson of await getLessons(locale)) paths.push(lessonUrl(lesson));
  }
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
