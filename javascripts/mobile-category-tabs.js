document.addEventListener('DOMContentLoaded', () => {
  try {
    if (window.matchMedia('(max-width: 768px)').matches) {
      // Match PC navigation tabs from mkdocs.yml top-level nav
      const tabs = [
        { t: '🏠 Home', h: '/', p: ['/'] },
        { t: '📰 Blog', h: '/blog/', p: ['/blog/'] },
        { t: '🤖 Generative AI', h: '/generative-ai/', p: ['/generative-ai/'] },
        { t: '📊 Investment Guide', h: '/investments/guide/', p: ['/investments/'] },
        { t: '🖥️ Infrastructure', h: '/Infrastructure/', p: ['/Infrastructure/'] },
        { t: '📘 MkDocs & Site', h: '/MkDocs/', p: ['/MkDocs/', '/Tips/', '/SEO/'] }
      ];
      const path = location.pathname.replace(/index\.html?$/, '');
      const wrap = document.createElement('nav');
      wrap.className = 'mobile-cat-tabs';

      tabs.forEach(item => {
        const a = document.createElement('a');
        a.href = item.h;
        a.className = 'mobile-cat-tab';
        a.textContent = item.t;
        const isActive = item.p.some(prefix =>
          prefix === '/'
            ? path === '/'
            : path.startsWith(prefix)
        );
        if (isActive) {
          a.classList.add('is-active');
        }
        wrap.appendChild(a);
      });

      const target = document.querySelector('.md-content__inner') || document.querySelector('main');
      if (target) {
        target.prepend(wrap);
      }
    }
  } catch (e) {
    console.warn('mobile tabs init failed', e);
  }
});
