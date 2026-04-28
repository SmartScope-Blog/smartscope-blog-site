// MkDocs Site Enhanced JavaScript
// このファイルは高度な設定ガイドの実装例として作成されています

// ヘルパー: 本番ではconsole.logを抑制
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const log = isDev ? console.log.bind(console) : () => {};

// ヘルパー: 言語判定
const isEnglish = () => location.pathname.startsWith('/en/') || document.documentElement.lang === 'en';

document.addEventListener('DOMContentLoaded', function() {
    log('🚀 高度なJavaScript機能が読み込まれました');
    
    // 1. 外部リンクのトラッキング（アナリティクス連携用）
    trackExternalLinks();
    
    // 2. コードブロックの機能強化
    enhanceCodeBlocks();
    
    // 3. 検索機能の拡張
    enhanceSearch();
    
    // 4. パフォーマンス監視
    monitorPerformance();
    
    // 5. ユーザーエクスペリエンス向上
    improveUX();
    
    // 6. スムーズスクロール
    enableSmoothScroll();
    
    // 7. キーボードショートカット
    setupKeyboardShortcuts();

    // 8. 画像のCLS/LCP安定化
    stabilizeImages();

    // 9. 見出しリンクコピー
    addHeadingLinkCopy();

    // 10. コードブロック折り返しトグル
    addCodeWrapToggle();

    // 11. ナビ: 📰最近公開 / 🔥よく読まれている をコンパクト表示
    markCompactNavSections();

    // 12. Hub V2 article click tracking
    trackHubClicks();

    // 14. Grid cards: make entire card clickable
    makeGridCardsClickable();

    // 13. Hub popular articles tab switching
    initHubPopTabs();
});

// Grid cards: make entire card clickable via its first link
function makeGridCardsClickable() {
    document.querySelectorAll('.grid.cards > ul > li').forEach(function(card) {
        var link = card.querySelector('a');
        if (!link) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            // Don't hijack if user clicked an actual link inside the card
            if (e.target.closest('a')) return;
            link.click();
        });
    });
}

// Hub popular articles tab switching
function initHubPopTabs() {
    document.querySelectorAll('.hub-pop-tabs').forEach(function(container) {
        var labels = container.querySelectorAll('.hub-pop-tabs__label');
        var panels = container.querySelectorAll('.hub-pop-tabs__panel');
        labels.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var target = btn.getAttribute('data-tab');
                labels.forEach(function(b) { b.classList.remove('hub-pop-tabs__label--active'); });
                btn.classList.add('hub-pop-tabs__label--active');
                panels.forEach(function(p) {
                    p.style.display = p.getAttribute('data-panel') === target ? '' : 'none';
                });
            });
        });
    });
}

// Hub V2 article click tracking
function trackHubClicks() {
    var hub = document.querySelector('.hub-v2');
    if (!hub) return;
    hub.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            if (typeof gtag === 'function') {
                var isHeroCta = !!this.closest('.home-hero');
                gtag('event', 'hub_article_click', {
                    link_url: this.href,
                    link_text: (this.textContent || '').trim().substring(0, 100),
                    hub_page: location.pathname,
                    link_area: isHeroCta ? 'hero_cta' : 'hub_body'
                });
            }
        });
    });
}

// 外部リンクトラッキング
function trackExternalLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="smartscope.blog"])');
    
    externalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const url = this.href;
            const text = this.textContent;
            
            // アナリティクスにイベント送信（GA4対応）
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'external_link',
                    event_label: url,
                    transport_type: 'beacon'
                });
            }
            
            log(`📊 外部リンククリック: ${text} -> ${url}`);
        });
        
        // 外部リンクマーカー追加
        if (!link.querySelector('.external-link-icon')) {
            const icon = document.createElement('span');
            icon.className = 'external-link-icon';
            icon.innerHTML = ' ↗';
            icon.style.fontSize = '0.8em';
            icon.style.opacity = '0.6';
            link.appendChild(icon);
        }
    });
    
    log(`🔗 ${externalLinks.length}個の外部リンクにトラッキングを設定`);
}

// コードブロック機能強化
function enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code');
    let enhancedCount = 0;
    
    codeBlocks.forEach(block => {
        const pre = block.parentElement;
        
        // 言語表示の追加
        const className = block.className;
        const language = className.replace('language-', '').replace('hljs', '').trim();
        
        if (language && language !== 'text') {
            // 言語ラベルの追加
            if (!pre.querySelector('.code-language')) {
                const langLabel = document.createElement('div');
                langLabel.className = 'code-language';
                langLabel.textContent = language.toUpperCase();
                langLabel.style.cssText = `
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    padding: 0.2rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.7rem;
                    font-weight: bold;
                `;
                pre.style.position = 'relative';
                pre.appendChild(langLabel);
            }
            
            enhancedCount++;
        }
    });
    
    log(`💻 ${enhancedCount}個のコードブロックを強化`);
}

// 検索機能拡張
function enhanceSearch() {
    const searchInput = document.querySelector('[data-md-component="search-query"]');
    
    if (searchInput) {
        // 検索履歴の保存
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length > 2) {
                // ローカルストレージに検索履歴保存
                let searchHistory = JSON.parse(localStorage.getItem('mkdocs_search_history') || '[]');
                
                if (!searchHistory.includes(query)) {
                    searchHistory.unshift(query);
                    searchHistory = searchHistory.slice(0, 10); // 最新10件まで
                    localStorage.setItem('mkdocs_search_history', JSON.stringify(searchHistory));
                }
                
                // アナリティクスイベント
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'search', {
                        search_term: query
                    });
                }
            }
        });
        
        log('🔍 検索機能を拡張しました');
    }
}

// パフォーマンス監視
function monitorPerformance() {
    // ページロード時間の測定
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        log(`⚡ ページロード時間: ${Math.round(loadTime)}ms`);
        
        // Core Web Vitals監視
        if ('web-vital' in window) {
            // LCP (Largest Contentful Paint)
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    log(`📊 LCP: ${Math.round(entry.startTime)}ms`);
                }
            }).observe({entryTypes: ['largest-contentful-paint']});
        }
    });
    
    // メモリ使用量監視（開発時のみ）
    if (performance.memory) {
        log(`💾 メモリ使用量: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`);
    }
}

// ユーザーエクスペリエンス向上
function improveUX() {
    // スクロール位置の復元
    const scrollPosition = sessionStorage.getItem('mkdocs_scroll_position');
    if (scrollPosition) {
        window.scrollTo(0, parseInt(scrollPosition));
        sessionStorage.removeItem('mkdocs_scroll_position');
    }
    
    // ページ離脱時にスクロール位置を保存
    window.addEventListener('beforeunload', function() {
        sessionStorage.setItem('mkdocs_scroll_position', window.pageYOffset.toString());
    });
    
    // 読了時間の推定表示
    addReadingTime();
    
    // 目次の改善
    enhanceTableOfContents();
    
    // プログレスバーの追加
    addProgressBar();
    
    log('✨ UX改善機能を適用しました');
}

// 読了時間の推定
function addReadingTime() {
    const content = document.querySelector('.md-content__inner');
    if (!content) return;
    
    // 言語判定
    const en = isEnglish();
    const text = content.textContent || '';
    const wordCount = en
        ? text.trim().split(/\s+/).filter(Boolean).length
        : text.replace(/\s+/g, '').length;
    const readingTimeMinutes = Math.max(
        1,
        Math.ceil(wordCount / (en ? 200 : 600))
    );
    
    // ページタイトルの下に読了時間を表示
    const title = document.querySelector('.md-content h1');
    if (title && !title.nextElementSibling?.classList.contains('reading-time')) {
        const readingTimeEl = document.createElement('div');
        readingTimeEl.className = 'reading-time';
        const label = en
            ? `📖 Reading time: ~${readingTimeMinutes} min (${wordCount.toLocaleString()} words)`
            : `📖 読了時間: 約${readingTimeMinutes}分 (${wordCount.toLocaleString()}文字)`;
        readingTimeEl.innerHTML = label;
        readingTimeEl.style.cssText = `
            color: var(--md-default-fg-color--light);
            font-size: 0.8rem;
            margin: 0.5rem 0 1rem 0;
            padding: 0.5rem;
            background: var(--md-code-bg-color);
            border-radius: 0.25rem;
            border-left: 4px solid var(--md-accent-fg-color);
        `;
        title.insertAdjacentElement('afterend', readingTimeEl);
    }
}

// 目次の改善
function enhanceTableOfContents() {
    const toc = document.querySelector('.md-nav--secondary');
    if (!toc) return;
    
    // 現在の見出しをハイライト
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            const tocLink = toc.querySelector(`a[href="#${id}"]`);
            
            if (tocLink) {
                if (entry.isIntersecting) {
                    tocLink.style.color = 'var(--md-accent-fg-color)';
                    tocLink.style.fontWeight = 'bold';
                } else {
                    tocLink.style.color = '';
                    tocLink.style.fontWeight = '';
                }
            }
        });
    }, {
        rootMargin: '-20% 0px -35% 0px'
    });
    
    // 全ての見出しを監視
    document.querySelectorAll('h2[id], h3[id], h4[id]').forEach(heading => {
        observer.observe(heading);
    });
}

// スムーズスクロール
function enableSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // ヘッダーの高さ分オフセット
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    log('🔄 スムーズスクロールを有効化');
}

// キーボードショートカット
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K で検索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('[data-md-component="search-query"]');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Ctrl/Cmd + / でショートカット一覧表示
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showShortcutHelp();
        }
        
        // ESCで検索を閉じる
        if (e.key === 'Escape') {
            const searchReset = document.querySelector('[data-md-component="search-reset"]');
            if (searchReset) {
                searchReset.click();
            }
        }
    });
    
    log('⌨️ キーボードショートカットを設定');
}

// ショートカット一覧の表示
function showShortcutHelp() {
    const existingHelp = document.getElementById('shortcut-help');
    if (existingHelp) {
        existingHelp.remove();
        return;
    }
    
    const en = isEnglish();
    const helpModal = document.createElement('div');
    helpModal.id = 'shortcut-help';
    helpModal.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--md-default-bg-color);
            border: 2px solid var(--md-primary-fg-color);
            border-radius: 8px;
            padding: 2rem;
            z-index: 1000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
            <h3 style="margin-top: 0;">⌨️ ${en ? 'Keyboard Shortcuts' : 'キーボードショートカット'}</h3>
            <table style="width: 100%; margin: 1rem 0;">
                <tr><td><kbd>Ctrl</kbd> + <kbd>K</kbd></td><td>${en ? 'Open search' : '検索を開く'}</td></tr>
                <tr><td><kbd>Ctrl</kbd> + <kbd>/</kbd></td><td>${en ? 'Show this list' : 'この一覧を表示'}</td></tr>
                <tr><td><kbd>ESC</kbd></td><td>${en ? 'Close search' : '検索を閉じる'}</td></tr>
            </table>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: var(--md-primary-fg-color);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
            ">${en ? 'Close' : '閉じる'}</button>
        </div>
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        " onclick="document.getElementById('shortcut-help').remove()"></div>
    `;
    
    document.body.appendChild(helpModal);
}

// 読み込み進行状況バー
function addProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.id = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: var(--md-accent-fg-color);
        transition: width 0.2s ease;
        z-index: 1000;
    `;
    document.body.appendChild(progressBar);
    
    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        progressBar.style.width = progress + '%';
    }
    
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();
    
    log('📊 読み込み進行状況バーを追加');
}

// 見出しリンクコピー機能
function addHeadingLinkCopy() {
    const headings = document.querySelectorAll('.md-content h2[id], .md-content h3[id]');
    const en = isEnglish();
    
    headings.forEach(heading => {
        if (heading.querySelector('.heading-link-copy')) return;
        
        const btn = document.createElement('span');
        btn.className = 'heading-link-copy';
        btn.innerHTML = '🔗';
        btn.title = en ? 'Copy link to this section' : 'このセクションのリンクをコピー';
        btn.style.cssText = `
            cursor: pointer;
            opacity: 0;
            margin-left: 0.3em;
            font-size: 0.75em;
            transition: opacity 0.2s;
            user-select: none;
        `;
        
        heading.style.position = 'relative';
        heading.appendChild(btn);
        
        heading.addEventListener('mouseenter', () => btn.style.opacity = '0.6');
        heading.addEventListener('mouseleave', () => btn.style.opacity = '0');
        
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = `${location.origin}${location.pathname}#${heading.id}`;
            try {
                await navigator.clipboard.writeText(url);
                btn.innerHTML = '✅';
                setTimeout(() => { btn.innerHTML = '🔗'; }, 1500);
            } catch {
                // fallback
                const tmp = document.createElement('textarea');
                tmp.value = url;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
                btn.innerHTML = '✅';
                setTimeout(() => { btn.innerHTML = '🔗'; }, 1500);
            }
        });
    });
    
    log(`🔗 ${headings.length}個の見出しにリンクコピーを追加`);
}

// コードブロック折り返しトグル
function addCodeWrapToggle() {
    const pres = document.querySelectorAll('pre:has(> code)');
    const en = isEnglish();
    
    pres.forEach(pre => {
        if (pre.querySelector('.wrap-toggle')) return;
        
        const toggle = document.createElement('button');
        toggle.className = 'wrap-toggle';
        toggle.innerHTML = '↩';
        toggle.title = en ? 'Toggle word wrap' : '折り返し切替';
        toggle.style.cssText = `
            position: absolute;
            top: 0.5rem;
            right: 3.5rem;
            background: rgba(0,0,0,0.4);
            color: white;
            border: none;
            width: 1.6rem;
            height: 1.6rem;
            border-radius: 0.25rem;
            font-size: 0.8rem;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        `;
        
        pre.style.position = 'relative';
        pre.appendChild(toggle);
        
        pre.addEventListener('mouseenter', () => toggle.style.opacity = '1');
        pre.addEventListener('mouseleave', () => toggle.style.opacity = '0');
        
        let wrapped = false;
        toggle.addEventListener('click', () => {
            wrapped = !wrapped;
            const code = pre.querySelector('code');
            if (wrapped) {
                pre.style.whiteSpace = 'pre-wrap';
                pre.style.wordBreak = 'break-all';
                if (code) { code.style.whiteSpace = 'pre-wrap'; code.style.wordBreak = 'break-all'; }
                toggle.style.background = 'var(--md-accent-fg-color)';
            } else {
                pre.style.whiteSpace = '';
                pre.style.wordBreak = '';
                if (code) { code.style.whiteSpace = ''; code.style.wordBreak = ''; }
                toggle.style.background = 'rgba(0,0,0,0.4)';
            }
        });
    });
    
    log(`↩ ${pres.length}個のコードブロックに折り返しトグルを追加`);
}

// デバッグ情報（開発時のみ）
if (isDev) {
    log('🔧 開発モード: 追加のデバッグ情報を表示');
    
    // Material for MkDocs バージョン情報
    const generator = document.querySelector('meta[name="generator"]');
    if (generator) {
        log(`📦 ${generator.content}`);
    }
}

// 画像の寸法と遅延読み込みを自動付与（ヒーロー内は遅延なし）
function stabilizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
        const isHero = img.closest('.home-hero');
        if (!isHero) {
            img.loading = img.loading || 'lazy';
        }
        if (!img.getAttribute('width') && img.naturalWidth) {
            img.setAttribute('width', img.naturalWidth);
        }
        if (!img.getAttribute('height') && img.naturalHeight) {
            img.setAttribute('height', img.naturalHeight);
        }
    });
}

// ナビサイドバーの特定セクションをコンパクト表示にする
function markCompactNavSections() {
    const markers = ['よく読まれている記事', '最近公開された記事'];
    document.querySelectorAll('.md-nav__item--nested').forEach(item => {
        const label = item.querySelector(':scope > .md-nav__link, :scope > label.md-nav__link');
        if (!label) return;
        const text = label.textContent || '';
        if (markers.some(m => text.includes(m))) {
            item.classList.add('md-nav__item--compact');
        }
    });
}
