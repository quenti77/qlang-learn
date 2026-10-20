// Small behaviours of the pages: the menus that fold on a narrow screen, the outline that follows
// the reading, and the lessons read (kept in this browser, see progress.js).
import { isRead, markRead, visit, lastLesson } from './progress.js';


// <details data-wide-open>: always open on a wide screen, folded on a narrow one
const wide = matchMedia('(min-width: 52.01rem)');
const wideDetails = [...document.querySelectorAll('details[data-wide-open]')];
const layoutDetails = () => wideDetails.forEach((d) => (d.open = wide.matches));
layoutDetails();
wide.addEventListener('change', layoutDetails);

// a current page that is far down the menu is scrolled into view
document.querySelector('.toc a[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });

// "On this page": highlight the section being read
const outline = document.querySelector('.outline');
if (outline) {
  const links = new Map([...outline.querySelectorAll('a')].map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const headings = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const setCurrent = () => {
    // the last heading that is above the top quarter of the window
    let current = headings[0];
    for (const h of headings) if (h.getBoundingClientRect().top < innerHeight * 0.25) current = h;
    for (const [id, a] of links) a.toggleAttribute('data-current', id === current?.id);
  };
  let waiting = false;
  addEventListener('scroll', () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => { waiting = false; setCurrent(); });
  }, { passive: true });
  setCurrent();
}

// lessons: remember the last one opened, and mark one "read" when its end is reached
const lesson = document.querySelector('article[data-lesson]')?.dataset.lesson;
if (lesson) {
  visit(lesson);
  const end = document.querySelector('nav.pager');
  if (end && !isRead(lesson)) {
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        markRead(lesson);
        seen.disconnect();
      }
    });
    seen.observe(end);
  }
}

function showReadings() {
  for (const a of document.querySelectorAll('[data-lesson-link]')) a.classList.toggle('is-read', isRead(a.dataset.lessonLink));
  for (const el of document.querySelectorAll('[data-part-progress]')) {
    const slugs = el.dataset.slugs.split(',');
    const done = slugs.filter(isRead).length;
    el.textContent = `${done}/${slugs.length}`;
    el.toggleAttribute('data-complete', done === slugs.length);
  }
}
showReadings();
document.addEventListener('qlang-progress', showReadings);

// the home page: a button to go on where the student stopped
const resume = document.querySelector('[data-resume]');
const last = lastLesson();
if (resume && last) {
  const titles = JSON.parse(resume.dataset.titles);
  if (titles[last]) {
    resume.href = resume.dataset.base + last + '/';
    resume.textContent = resume.dataset.template.replace('{title}', titles[last]);
    resume.hidden = false;
  }
}
