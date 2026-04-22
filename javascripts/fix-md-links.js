document.addEventListener('DOMContentLoaded', () => {
  try {
    const knownRootSections = new Set([
      '404',
      'about',
      'AI-Daily-News',
      'Gadgets',
      'Infrastructure',
      'MkDocs',
      'SEO',
      'Tips',
      'Tools',
      'ai-development',
      'blog',
      'complete-guides',
      'complete-site-tree',
      'contact',
      'dashboards',
      'dev',
      'en',
      'generative-ai',
      'index.html',
      'infra',
      'interactive-sitemap',
      'investments',
      'mkdocs',
      'pillars',
      'privacy-policy',
      'recent-updates',
      'redirects',
      'search-tips',
      'site-structure',
      'start',
      'tags',
      'zh'
    ]);
    const pathParts = window.location.pathname
      .replace(/index\.html?$/, '')
      .split('/')
      .filter(Boolean);
    const needsProjectPrefix =
      window.location.hostname.endsWith('.github.io') &&
      pathParts.length > 0 &&
      !knownRootSections.has(pathParts[0]);
    const projectPrefix = needsProjectPrefix ? `/${pathParts[0]}` : '';

    const anchors = Array.from(document.querySelectorAll('a[href]'));
    anchors.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      // skip absolute externals and fragments/mailto/tel
      if (/^https?:\/\//i.test(href) || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      // Only rewrite same-site .md links (keep query/fragment)
      // Patterns: foo.md, ./foo.md, ../bar/foo.md, foo.md#frag
      const mdMatch = href.match(/^(.*)\.md(\#[^?]*)?$/);
      if (mdMatch) {
        const base = mdMatch[1];
        const frag = mdMatch[2] || '';
        a.setAttribute('href', `${base}/${frag}`);
      }

      const nextHref = a.getAttribute('href');
      if (
        projectPrefix &&
        nextHref &&
        nextHref.startsWith('/') &&
        !nextHref.startsWith('//') &&
        nextHref !== projectPrefix &&
        !nextHref.startsWith(`${projectPrefix}/`)
      ) {
        a.setAttribute('href', `${projectPrefix}${nextHref}`);
      }
    });
  } catch (e) {
    console.warn('fix-md-links failed', e);
  }
});
