function resetScrollPosition() {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
}

resetScrollPosition();

function setupToggle(buttonId, contentSelector, expandedLabel, collapsedLabel) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const contents = document.querySelectorAll(contentSelector);
  if (!contents.length) return;

  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    button.setAttribute('aria-expanded', String(nextState));
    button.textContent = nextState ? expandedLabel : collapsedLabel;

    contents.forEach((el) => {
      el.hidden = !nextState;
    });
  });
}

setupToggle('bio-toggle', '.bio-full', 'Read less', 'Read more');
setupToggle('affiliations-toggle', '.affiliation-more', 'see less', 'see more');

function setupEntryAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.querySelector('.page-loader');
  const onLoadItems = document.querySelectorAll('.entry-on-load');
  const scrollItems = document.querySelectorAll('.entry-on-scroll');

  function animateOnLoadItems() {
    onLoadItems.forEach((el, index) => {
      const customDelay = el.dataset.entryDelay;
      el.style.transitionDelay = prefersReducedMotion
        ? '0ms'
        : customDelay != null
          ? `${customDelay}ms`
          : `${100 + index * 200}ms`;
      el.classList.add('is-animated');
    });
  }

  function finishLoad() {
    document.body.classList.remove('is-loading');
    document.body.classList.add('load-finish');
    resetScrollPosition();
    animateOnLoadItems();

    if (loader) {
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }

    window.requestAnimationFrame(() => {
      observeScrollItems();
      bindScrollObservers();
    });
  }

  function markCurrentNavLink() {
    let page = window.location.pathname.split('/').pop() || 'index.html';
    if (!page) page = 'index.html';

    const siteName = document.querySelector('.site-name');
    const worksLink = document.querySelector('.site-nav a[href="works.html"]');

    siteName?.removeAttribute('aria-current');
    worksLink?.removeAttribute('aria-current');

    if (page === 'works.html') {
      worksLink?.setAttribute('aria-current', 'page');
    } else {
      siteName?.setAttribute('aria-current', 'page');
    }
  }

  markCurrentNavLink();

  if (prefersReducedMotion) {
    document.body.classList.remove('is-loading');
    document.body.classList.add('load-finish');
    document.querySelectorAll('.entry-animate').forEach((el) => el.classList.add('is-animated'));
    loader?.remove();
    markCurrentNavLink();
    return;
  }

  document.body.classList.add('is-loading');

  if (document.readyState === 'complete') {
    window.setTimeout(finishLoad, 250);
  } else {
    window.addEventListener('load', () => window.setTimeout(finishLoad, 250), { once: true });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-animated');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );

  const softObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-animated');
        softObserver.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: '0px 0px 120px 0px' }
  );

  function revealIfInView(el) {
    if (el.classList.contains('is-animated')) return true;

    const marginBottom = el.classList.contains('entry-scroll-soft') ? 120 : 32;
    const rect = el.getBoundingClientRect();
    const viewHeight = window.innerHeight;

    if (rect.top <= viewHeight + marginBottom && rect.bottom >= 0) {
      el.classList.add('is-animated');
      return true;
    }

    return false;
  }

  function observeScrollItems() {
    scrollItems.forEach((el) => {
      if (el.classList.contains('is-animated')) return;
      revealIfInView(el);
    });
  }

  function bindScrollObservers() {
    scrollItems.forEach((el) => {
      if (el.classList.contains('is-animated') || el.dataset.scrollObserved) return;

      el.dataset.scrollObserved = 'true';

      if (el.classList.contains('entry-scroll-soft')) {
        softObserver.observe(el);
      } else {
        observer.observe(el);
      }
    });
  }

  window.addEventListener('scroll', observeScrollItems, { passive: true });
}

function setupWorksSidebar() {
  const sidebar = document.querySelector('.works-sidebar');
  if (!sidebar) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = [...sidebar.querySelectorAll('a[data-section]')];
  const sections = links
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);

  if (!sections.length) return;

  function clearUrlHash() {
    if (!window.location.hash) return;

    const page = window.location.pathname.split('/').pop() || 'works.html';
    history.replaceState(null, '', page);
  }

  clearUrlHash();

  function setActiveSection(sectionId) {
    links.forEach((link) => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveSection() {
    const marker = window.innerHeight * 0.32;
    let currentId = sections[0].id;

    sections.forEach((section) => {
      const { top } = section.getBoundingClientRect();
      if (top <= marker) {
        currentId = section.id;
      }
    });

    setActiveSection(currentId);
  }

  if (!prefersReducedMotion) {
    let ticking = false;

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const section = document.getElementById(link.dataset.section);
      if (section) {
        section.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }

      setActiveSection(link.dataset.section);
    });
  });

  updateActiveSection();
}

function setupBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const threshold = 320;

  function toggleVisibility() {
    const show = window.scrollY > threshold;
    button.classList.toggle('is-visible', show);
    button.toggleAttribute('hidden', !show);
  }

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });

  toggleVisibility();
  window.addEventListener('scroll', toggleVisibility, { passive: true });
}

function setupPdfViewer() {
  const modal = document.getElementById('pdf-viewer');
  if (!modal) return;

  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const triggers = document.querySelectorAll('.pdf-view-trigger');
  if (!triggers.length) return;

  const pagesContainer = document.getElementById('pdf-viewer-pages');
  const scrollContainer = modal.querySelector('.pdf-viewer__body');
  const titleEl = document.getElementById('pdf-viewer-title');
  const statusEl = document.getElementById('pdf-viewer-status');
  const closeControls = modal.querySelectorAll('[data-pdf-viewer-close]');

  let pdfDoc = null;
  let displayScale = 1;
  let pageObserver = null;
  let lastTrigger = null;
  let closeTimer = null;
  const renderTasks = new Map();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function playViewerEnter() {
    modal.classList.remove('is-open');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        modal.classList.add('is-open');
      });
    });
  }

  function hideViewer(finishClose) {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    modal.classList.remove('is-open');

    if (prefersReducedMotion) {
      finishClose();
      return;
    }

    const dialog = modal.querySelector('.pdf-viewer__dialog');
    let finished = false;

    const complete = () => {
      if (finished) return;
      finished = true;
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      finishClose();
    };

    dialog.addEventListener('transitionend', complete, { once: true });
    closeTimer = window.setTimeout(complete, 700);
  }

  function getPdfViewerErrorMessage() {
    if (typeof pdfjsLib === 'undefined') {
      return 'The PDF viewer library did not load. Connect to the internet and refresh the page, then try again.';
    }

    if (window.location.protocol === 'file:') {
      return 'This viewer cannot open documents when the page is opened directly from a file on your computer. In Cursor, use Live Server (or another local server) and open works.html at an address like http://localhost:5500/works.html.';
    }

    return 'Unable to load this document. Check that the PDF file exists in the documents folder and try again.';
  }

  function showViewerError(message) {
    statusEl.textContent = message;
    statusEl.hidden = false;
    pagesContainer.hidden = true;
  }

  function setLoading(isLoading) {
    statusEl.hidden = !isLoading;
    pagesContainer.hidden = isLoading;
  }

  function getBodyWidth() {
    return scrollContainer.clientWidth - 32;
  }

  async function renderPageCanvas(pageNum, canvas) {
    if (!pdfDoc || canvas.dataset.rendered === 'true') return;

    const existingTask = renderTasks.get(pageNum);
    if (existingTask) {
      existingTask.cancel();
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: displayScale });
    const outputScale = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d');

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const task = page.render({
      canvasContext: context,
      viewport,
      transform,
    });

    renderTasks.set(pageNum, task);

    try {
      await task.promise;
      canvas.dataset.rendered = 'true';
    } catch (error) {
      if (error?.name !== 'RenderingCancelledException') {
        throw error;
      }
    } finally {
      renderTasks.delete(pageNum);
    }
  }

  function buildPageSlots(numPages) {
    pagesContainer.innerHTML = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      const pageEl = document.createElement('div');
      pageEl.className = 'pdf-viewer__page';
      pageEl.dataset.page = String(pageNum);

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-viewer__canvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Page ${pageNum}`);

      pageEl.appendChild(canvas);
      pagesContainer.appendChild(pageEl);
    }
  }

  function setupPageObserver() {
    if (pageObserver) {
      pageObserver.disconnect();
    }

    pageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const pageNum = Number(entry.target.dataset.page);
          const canvas = entry.target.querySelector('canvas');
          if (canvas) {
            renderPageCanvas(pageNum, canvas);
          }
        });
      },
      {
        root: scrollContainer,
        rootMargin: '320px 0px',
        threshold: 0.01,
      }
    );

    pagesContainer.querySelectorAll('.pdf-viewer__page').forEach((pageEl) => {
      pageObserver.observe(pageEl);
    });
  }

  async function openViewer(src, title, trigger) {
    lastTrigger = trigger;
    titleEl.textContent = title;
    modal.hidden = false;
    modal.classList.remove('is-open');
    document.body.classList.add('pdf-viewer-open');
    setLoading(true);
    scrollContainer.scrollTop = 0;
    playViewerEnter();

    if (typeof pdfjsLib === 'undefined' || window.location.protocol === 'file:') {
      showViewerError(getPdfViewerErrorMessage());
      modal.querySelector('.pdf-viewer__close').focus();
      return;
    }

    try {
      pdfDoc = await pdfjsLib.getDocument(src).promise;
      const firstPage = await pdfDoc.getPage(1);
      displayScale = getBodyWidth() / firstPage.getViewport({ scale: 1 }).width;

      buildPageSlots(pdfDoc.numPages);
      setLoading(false);
      setupPageObserver();
      modal.querySelector('.pdf-viewer__close').focus();
    } catch {
      showViewerError(getPdfViewerErrorMessage());
    }
  }

  function closeViewer() {
    if (modal.hidden) return;

    hideViewer(() => {
      renderTasks.forEach((task) => task.cancel());
      renderTasks.clear();

      if (pageObserver) {
        pageObserver.disconnect();
        pageObserver = null;
      }

      pdfDoc = null;
      displayScale = 1;
      pagesContainer.innerHTML = '';
      pagesContainer.hidden = true;
      modal.hidden = true;
      modal.classList.remove('is-open');
      document.body.classList.remove('pdf-viewer-open');
      statusEl.textContent = 'Loading document…';
      scrollContainer.scrollTop = 0;

      if (lastTrigger) {
        lastTrigger.focus();
        lastTrigger = null;
      }
    });
  }

  function getPdfSrc(trigger) {
    return trigger.dataset.pdfSrc || trigger.getAttribute('href');
  }

  function getPdfTitle(trigger) {
    if (trigger.dataset.pdfTitle) {
      return trigger.dataset.pdfTitle;
    }

    const titleEl = trigger.closest('.work-card')?.querySelector('.work-title');
    return titleEl?.textContent.replace(/\s+/g, ' ').trim() || 'Document';
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openViewer(getPdfSrc(trigger), getPdfTitle(trigger), trigger);
    });
  });

  closeControls.forEach((control) => {
    control.addEventListener('click', closeViewer);
  });

  pagesContainer.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  window.addEventListener('keydown', (event) => {
    if (modal.hidden) return;

    if (event.key === 'Escape') {
      closeViewer();
    }
  });
}

setupEntryAnimations();
setupWorksSidebar();
setupBackToTop();
setupPdfViewer();
