// Screens are addressed by the URL hash, so every screen is a history entry
// and Android's back button walks back through them (@capacitor/app).
//
//   #/               home
//   #/t/<track>      a track and its lessons
//   #/l/<track>/<l>  a lesson
export function parseRoute(hash) {
  const parts = String(hash).replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 't' && parts.length === 2) return { name: 'track', track: parts[1] };
  if (parts[0] === 'l' && parts.length === 3) return { name: 'lesson', track: parts[1], lesson: parts[2] };
  return { name: 'home' };
}

export const homeHref = () => '#/';
export const trackHref = (track) => `#/t/${track}`;
export const lessonHref = (lesson) => `#/l/${lesson.track}/${lesson.slug}`;

// Where the on-screen back arrow goes when there is no screen to go back to,
// for example when the app was opened straight onto a lesson.
export function parentHref(route) {
  if (route.name === 'lesson') return trackHref(route.track);
  return homeHref();
}

// The lesson to suggest next: the first one not done, in course order.
// Returns undefined when everything in `lessons` is done.
export function nextLesson(lessons, done) {
  return lessons.find((l) => !done.has(l.key));
}
