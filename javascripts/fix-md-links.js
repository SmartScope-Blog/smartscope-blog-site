document.addEventListener('DOMContentLoaded', () => {
  try {
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
    });
  } catch (e) {
    console.warn('fix-md-links failed', e);
  }
});

