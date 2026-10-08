// The end-of-lesson quiz. The answers are in the markup (data-answer); this
// checks them, shows each explanation, and calls onPass when all are right.
export function setupQuiz(form, { incomplete, score, onPass }) {
  const questions = [...form.querySelectorAll('fieldset[data-answer]')];
  const status = form.querySelector('[data-quiz-status]');
  const submit = form.querySelector('[data-quiz-submit]');
  const retry = form.querySelector('[data-quiz-retry]');
  const success = form.querySelector('[data-quiz-success]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const picked = questions.map((q) => q.querySelector('input:checked'));
    if (picked.some((input) => input === null)) {
      status.textContent = incomplete;
      return;
    }
    let right = 0;
    questions.forEach((q, i) => {
      const ok = picked[i].value === q.dataset.answer;
      if (ok) right += 1;
      q.classList.toggle('is-right', ok);
      q.classList.toggle('is-wrong', !ok);
      q.disabled = true;
    });
    submit.hidden = true;
    if (right === questions.length) {
      status.textContent = '';
      success.hidden = false;
      success.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      onPass();
    } else {
      status.textContent = `${right} ${score} ${questions.length}`;
      retry.hidden = false;
    }
  });

  retry.addEventListener('click', () => {
    form.reset();
    questions.forEach((q) => {
      q.classList.remove('is-right', 'is-wrong');
      q.disabled = false;
    });
    status.textContent = '';
    retry.hidden = true;
    submit.hidden = false;
    questions[0]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}
