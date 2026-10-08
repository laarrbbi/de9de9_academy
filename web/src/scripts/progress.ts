/**
 * Progress and quizzes, on the reader's own device.
 *
 * Finished lessons are kept in localStorage as "<track>/<lesson>" keys, the
 * same in both languages. Storage can be missing or blocked (private mode,
 * cleared data); every page still works, it just forgets progress.
 *
 * Markup contract (rendered by the Astro components):
 *   [data-lesson-key="k"]             gets .is-done when k is finished
 *   [data-progress="k1 k2 k3"]        a track's lessons; holds
 *     [data-progress-bar]             <i> whose width becomes the share done
 *     [data-progress-count]           text set to the number done
 *   form[data-quiz="k"]               the lesson quiz (see Quiz.astro)
 */
const STORAGE_KEY = 'de9de9-academy:done:v1';

function readDone(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

function markDone(key: string): void {
  const done = readDone();
  done.add(key);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
  } catch {
    // Storage blocked: the quiz still shows its result, progress is just not kept.
  }
}

function paint(): void {
  const done = readDone();
  document.querySelectorAll<HTMLElement>('[data-lesson-key]').forEach((el) => {
    el.classList.toggle('is-done', done.has(el.dataset.lessonKey ?? ''));
  });
  document.querySelectorAll<HTMLElement>('[data-progress]').forEach((el) => {
    const keys = (el.dataset.progress ?? '').split(' ').filter(Boolean);
    const count = keys.filter((k) => done.has(k)).length;
    const bar = el.querySelector<HTMLElement>('[data-progress-bar]');
    if (bar) bar.style.width = keys.length ? `${(100 * count) / keys.length}%` : '0';
    el.querySelectorAll<HTMLElement>('[data-progress-count]').forEach((c) => (c.textContent = String(count)));
  });
}

function setupQuiz(form: HTMLFormElement): void {
  const key = form.dataset.quiz ?? '';
  const questions = [...form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-answer]')];
  const status = form.querySelector<HTMLElement>('[data-quiz-status]');
  const submit = form.querySelector<HTMLButtonElement>('[data-quiz-submit]');
  const retry = form.querySelector<HTMLButtonElement>('[data-quiz-retry]');
  const success = form.querySelector<HTMLElement>('[data-quiz-success]');
  if (!status || !submit || !retry || !success) return;

  form.classList.add('is-ready');

  const reset = () => {
    form.reset();
    questions.forEach((q) => {
      q.classList.remove('is-right', 'is-wrong');
      q.disabled = false;
    });
    status.textContent = '';
    retry.hidden = true;
    submit.hidden = false;
    questions[0]?.querySelector('input')?.focus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const picked = questions.map((q) => q.querySelector<HTMLInputElement>('input:checked'));
    if (picked.some((input) => input === null)) {
      status.textContent = form.dataset.msgIncomplete ?? '';
      return;
    }
    let right = 0;
    questions.forEach((q, i) => {
      const ok = picked[i]?.value === q.dataset.answer;
      if (ok) right += 1;
      q.classList.toggle('is-right', ok);
      q.classList.toggle('is-wrong', !ok);
      q.disabled = true;
    });
    submit.hidden = true;
    if (right === questions.length) {
      markDone(key);
      paint();
      status.textContent = '';
      success.hidden = false;
      success.focus();
    } else {
      status.textContent = `${right} ${form.dataset.msgScore ?? ''} ${questions.length}`;
      retry.hidden = false;
    }
  });

  retry.addEventListener('click', reset);
}

paint();
document.querySelectorAll<HTMLFormElement>('form[data-quiz]').forEach(setupQuiz);
// Another tab may finish a lesson; keep this one in step.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) paint();
});
