// モバイルボトムナビゲーション
document.addEventListener('DOMContentLoaded', function() {
    // モバイル判定
    if (window.innerWidth > 768) return;
    
    // ボトムナビゲーション作成
    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav';
    bottomNav.innerHTML = `
        <a href="/" class="mobile-nav-item ${location.pathname === '/' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>ホーム</span>
        </a>
        <a href="/AI/" class="mobile-nav-item ${location.pathname.includes('/AI/') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.928 11.607c-.202-.488-.635-.605-.928-.633V8c0-1.103-.897-2-2-2h-6V4.61c.305-.274.5-.668.5-1.11C13.5 2.672 12.828 2 12 2s-1.5.672-1.5 1.5c0 .442.195.836.5 1.11V6H5c-1.103 0-2 .897-2 2v2.997l-.082.006A1 1 0 0 0 1.99 12v2a1 1 0 0 0 1 1H3v5c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5a1 1 0 0 0 1-1v-1.938a1.006 1.006 0 0 0-.072-.455M5 20V8h14l.001 3.996L19 12v2l.001.005.001 5.995H5z"/>
                <ellipse cx="8.5" cy="12" rx="1.5" ry="2"/>
                <ellipse cx="15.5" cy="12" rx="1.5" ry="2"/>
                <path d="M8 16h8v2H8z"/>
            </svg>
            <span>AI開発</span>
        </a>
        <a href="/MkDocs/" class="mobile-nav-item ${location.pathname.includes('/MkDocs/') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span>サイト構築</span>
        </a>
        <a href="/Tips/" class="mobile-nav-item ${location.pathname.includes('/Tips/') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
            </svg>
            <span>ツール</span>
        </a>
        <button class="mobile-nav-item" onclick="document.getElementById('__drawer').click()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
            <span>メニュー</span>
        </button>
    `;
    
    document.body.appendChild(bottomNav);
});