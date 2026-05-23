document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  const loaderEl = document.getElementById('globalLoader');
  const loaderDelayMs = 220;
  let loaderTimer = null;

  const showLoader = () => {
    if (!loaderEl) return;
    loaderEl.classList.add('is-visible');
    loaderEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('page-loading');
  };

  const scheduleLoader = () => {
    if (!loaderEl || loaderTimer) return;
    loaderTimer = window.setTimeout(() => {
      loaderTimer = null;
      showLoader();
    }, loaderDelayMs);
  };

  const hideLoader = () => {
    if (loaderTimer) {
      window.clearTimeout(loaderTimer);
      loaderTimer = null;
    }
    if (!loaderEl) return;
    loaderEl.classList.remove('is-visible');
    loaderEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('page-loading');
  };

  hideLoader();
  window.addEventListener('pageshow', hideLoader);

  if (themeToggleBtn) {
    const setTheme = (theme) => {
      const dark = theme === 'dark';
      document.body.classList.toggle('theme-dark', dark);
      document.body.classList.toggle('theme-light', !dark);
      themeToggleBtn.textContent = dark ? '\u{1F319}' : '\u2600\uFE0F';
      localStorage.setItem('theme', theme);
    };

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
      setTheme(nextTheme);
    });
  }

  const shouldShowLoaderForLink = (link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (link.hasAttribute('download')) return false;
    if (link.target && link.target !== '_self') return false;
    const targetUrl = new URL(href, window.location.href);
    return targetUrl.origin === window.location.origin;
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || !shouldShowLoaderForLink(link)) return;
    scheduleLoader();
  }, true);

  document.addEventListener('submit', (event) => {
    if (event.target instanceof HTMLFormElement) {
      scheduleLoader();
    }
  }, true);
});
