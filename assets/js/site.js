(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const papers = [...document.querySelectorAll('.publication')];
  const yearGroups = document.querySelectorAll('.year-group');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#paper-search');
  const count = document.querySelector('#results-count');
  const empty = document.querySelector('#empty-state');
  let activeFilter = 'all';
  let visiblePapers = [];
  const searchIndex = new Map(papers.map((paper) => [paper, `${paper.dataset.year} ${paper.textContent}`.toLowerCase()]));

  const updatePapers = () => {
    const query = search?.value.trim().toLowerCase() || '';
    visiblePapers = papers.filter((paper) => {
      const matchesFilter = activeFilter === 'all' || paper.dataset.topic === activeFilter;
      const matches = matchesFilter && searchIndex.get(paper).includes(query);
      paper.hidden = !matches;
      return matches;
    });
    filters.forEach((button) => {
      const active = button.dataset.filter === activeFilter;
      button.setAttribute('aria-pressed', String(active));
    });
    yearGroups.forEach((group) => {
      group.hidden = !group.querySelector('.publication:not([hidden])');
    });
    if (count) count.textContent = `${visiblePapers.length} ${visiblePapers.length === 1 ? 'paper' : 'papers'}`;
    if (empty) empty.hidden = visiblePapers.length !== 0;
  };
  const selectAll = () => { activeFilter = 'all'; if (search) search.value = ''; updatePapers(); };
  if (papers.length) {
    document.querySelector('.publication-tools').hidden = false;
    filters.forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; updatePapers(); }));
    search?.addEventListener('input', updatePapers);
    document.querySelector('#clear-search')?.addEventListener('click', selectAll);
    updatePapers();
    // Deep links always reveal a publication, even if its filter is currently hidden.
    const revealHash = () => {
      if (!window.location.hash.startsWith('#paper-')) return;
      const paper = document.getElementById(window.location.hash.slice(1));
      if (paper?.classList.contains('publication') && paper.hidden) selectAll();
      if (paper) requestAnimationFrame(() => paper.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' }));
    };
    window.addEventListener('hashchange', revealHash);
    revealHash();
  }

  const newsToggle = document.querySelector('#news-toggle');
  const extraNews = [...document.querySelectorAll('.news-extra')];
  if (newsToggle && extraNews.length) {
    newsToggle.hidden = false;
    extraNews.forEach((item) => { item.hidden = true; });
    newsToggle.addEventListener('click', () => {
      const expanded = newsToggle.getAttribute('aria-expanded') !== 'true';
      newsToggle.setAttribute('aria-expanded', String(expanded));
      extraNews.forEach((item) => { item.hidden = !expanded; });
      newsToggle.textContent = expanded ? 'Less news' : 'More news';
    });
  }

  const dialog = document.querySelector('#citation-dialog');
  const citationText = document.querySelector('#citation-text');
  const copyStatus = document.querySelector('#copy-status');
  const copyButton = document.querySelector('#copy-citation');
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-citation]').forEach((link) => link.addEventListener('click', (event) => {
      const template = document.getElementById(link.dataset.citation);
      if (!template) return;
      event.preventDefault();
      citationText.textContent = template.content.textContent.trim();
      copyStatus.textContent = '';
      dialog.showModal();
    }));
    document.querySelector('#close-citation')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    copyButton?.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(citationText.textContent);
        copyStatus.textContent = 'Copied to clipboard.';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(citationText);
        const selection = window.getSelection();
        selection.removeAllRanges(); selection.addRange(range);
        copyStatus.textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
      }
    });
  }

  const figureDialog = document.querySelector('#figure-dialog');
  const fullFigure = document.querySelector('#full-figure');
  const figureViewport = document.querySelector('#figure-viewport');
  const zoomButton = document.querySelector('#figure-zoom');
  if (figureDialog && typeof figureDialog.showModal === 'function') {
    document.querySelectorAll('[data-figure]').forEach((link) => link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.querySelector('#figure-title').textContent = link.dataset.title;
      document.querySelector('#figure-caption').textContent = link.dataset.caption;
      fullFigure.src = link.href;
      fullFigure.alt = link.querySelector('img').alt;
      document.querySelector('#figure-paper').href = link.dataset.paper;
      figureViewport.classList.remove('is-zoomed');
      figureViewport.scrollTop = 0;
      figureViewport.scrollLeft = 0;
      zoomButton.setAttribute('aria-pressed', 'false');
      zoomButton.textContent = 'Original size';
      figureDialog.showModal();
    }));
    document.querySelector('#close-figure').addEventListener('click', () => figureDialog.close());
    figureDialog.addEventListener('click', (event) => {
      const bounds = figureDialog.getBoundingClientRect();
      if (event.target === figureDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) figureDialog.close();
    });
    zoomButton.addEventListener('click', () => {
      const zoomed = figureViewport.classList.toggle('is-zoomed');
      zoomButton.setAttribute('aria-pressed', String(zoomed));
      zoomButton.textContent = zoomed ? 'Fit to window' : 'Original size';
    });
  }

  const sections = [...document.querySelectorAll('.section-nav a[href*="#"]')]
    .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter((entry) => entry.section);
  if (sections.length) {
    let currentLink;
    const syncNavigation = () => {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const marker = Math.min(120, window.innerHeight * 0.16);
      let current = sections[0];
      for (const entry of sections) {
        if (atBottom || entry.section.getBoundingClientRect().top <= marker) current = entry;
      }
      if (current.link === currentLink) return;
      currentLink?.removeAttribute('aria-current');
      current.link.setAttribute('aria-current', 'location');
      currentLink = current.link;
    };
    window.addEventListener('scroll', syncNavigation, { passive: true });
    window.addEventListener('resize', syncNavigation);
    if ('ResizeObserver' in window) new ResizeObserver(syncNavigation).observe(document.querySelector('main'));
    syncNavigation();
  }
})();
