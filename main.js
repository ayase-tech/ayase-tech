/* ============================================
   ayase-tech.com — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
    loadNews();
    initScrollHeader();
    initMobileMenu();
    initScrollAnimations();
    // initNewsFilters() is called after loading news
    setActiveNav();
    initCookieConsent();
    initDarkMode();
});

/* ---------- Component Loader ---------- */
async function loadComponents() {
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');

    // Determine base path based on page depth
    const depth = getPathDepth();
    const prefix = depth > 0 ? '../'.repeat(depth) : '';

    if (headerEl) {
        try {
            const res = await fetch(prefix + 'components/header.html');
            const html = await res.text();
            headerEl.innerHTML = fixPaths(html, prefix);
            initMobileMenu();
            setActiveNav();
            initDarkMode(); // Re-init after header loads
        } catch (e) {
            console.warn('Header component not loaded:', e);
        }
    }

    if (footerEl) {
        try {
            const res = await fetch(prefix + 'components/footer.html');
            const html = await res.text();
            footerEl.innerHTML = fixPaths(html, prefix);
        } catch (e) {
            console.warn('Footer component not loaded:', e);
        }
    }
}

function getPathDepth() {
    const path = window.location.pathname;
    // Count how many subdirectories deep we are from the root
    const segments = path.split('/').filter(s => s && !s.includes('.'));
    // If served from root, depth = 0
    // If in /service/file.html, depth = 1
    const pagePath = document.querySelector('meta[name="page-depth"]');
    if (pagePath) {
        return parseInt(pagePath.getAttribute('content'), 10);
    }
    return 0;
}

function fixPaths(html, prefix) {
    // Replace href="/ and src="/ paths with prefix
    return html.replace(/href="(?!https?:\/\/|#|mailto:)([^"]+)"/g, (match, p1) => {
        if (p1.startsWith('/') || p1.startsWith('http')) return match;
        return `href="${prefix}${p1}"`;
    }).replace(/src="(?!https?:\/\/)([^"]+)"/g, (match, p1) => {
        if (p1.startsWith('/') || p1.startsWith('http') || p1.startsWith('data:')) return match;
        return `src="${prefix}${p1}"`;
    });
}

/* ---------- Scroll Header Shadow ---------- */
function initScrollHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const onScroll = () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ---------- Mobile Menu ---------- */
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-links');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            nav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

/* ---------- News Label Filters ---------- */
function initNewsFilters() {
    const buttons = document.querySelectorAll('.news-filter-btn');
    const items = document.querySelectorAll('.news-item');
    if (!buttons.length || !items.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Update active button
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter items
            items.forEach(item => {
                if (filter === 'all' || item.dataset.label === filter) {
                    item.style.display = '';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(8px)';
                    requestAnimationFrame(() => {
                        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    });
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

/* ---------- Active Navigation ---------- */
function setActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links > a, .nav-dropdown > a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Resolve href relative to current page
        const resolved = new URL(href, window.location.href).pathname;

        if (currentPath === resolved || currentPath.endsWith(href)) {
            link.classList.add('active');
        }
    });
}

/* ---------- Dynamic News Loader ---------- */
async function loadNews() {
    const containerAll = document.getElementById('news-container-all');
    const containerTop = document.getElementById('news-container-top');

    if (!containerAll && !containerTop) return;

    const depth = getPathDepth();
    const prefix = depth > 0 ? '../'.repeat(depth) : '';

    try {
        // Fetch from the Node.js API instead of data/news.json
        const res = await fetch(prefix + 'api/news');
        if (!res.ok) throw new Error('Failed to load news data from API');
        const newsData = await res.json();

        const renderNews = (items) => {
            return items.map(item => `
                <div class="news-item" data-label="${item.label}">
                    <span class="news-date">${item.date}</span>
                    <span class="label label--${item.label}">${item.labelName}</span>
                    <span class="news-title"><a href="${item.url}">${item.title}</a></span>
                </div>
            `).join('');
        };

        if (containerAll) {
            containerAll.innerHTML = renderNews(newsData);
            initNewsFilters(); // Initialize filters after rendering items
        }

        if (containerTop) {
            // Show only latest 3 news on top page
            containerTop.innerHTML = renderNews(newsData.slice(0, 3));
        }
    } catch (e) {
        console.warn('News could not be loaded:', e);
    }
}

/* ---------- Cookie Consent ---------- */
const GA_ID = 'G-776SH91MXM';

function initCookieConsent() {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'accepted') {
        loadGoogleAnalytics();
    } else if (consent !== 'rejected') {
        // Show banner only if not yet decided
        showCookieConsentBanner();
    }
}

function loadGoogleAnalytics() {
    // Prevent double-loading
    if (document.querySelector('script[src*="googletagmanager"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA_ID);
}

function showCookieConsentBanner() {
    const depth = getPathDepth();
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    const privacyUrl = prefix + 'About/legal/PrivacyPolicy.html';

    const banner = document.createElement('div');
    banner.className = 'cookie-consent';
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
        <div class="cookie-consent__inner">
            <div class="cookie-consent__text">
                <p>当サイトでは、サービス向上のためにGoogle Analyticsを使用し、Cookieによるアクセス情報を収集しています。詳しくは<a href="${privacyUrl}">プライバシーポリシー</a>をご覧ください。</p>
            </div>
            <div class="cookie-consent__buttons">
                <button class="cookie-consent__btn cookie-consent__btn--accept" id="cookie-accept-btn">同意する</button>
                <button class="cookie-consent__btn cookie-consent__btn--reject" id="cookie-reject-btn">拒否する</button>
            </div>
        </div>
    `;

    document.body.appendChild(banner);

    // Trigger animation after insertion
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            banner.classList.add('visible');
        });
    });

    banner.querySelector('#cookie-accept-btn').addEventListener('click', () => {
        localStorage.setItem('cookie_consent', 'accepted');
        loadGoogleAnalytics();
        hideBanner(banner);
    });

    banner.querySelector('#cookie-reject-btn').addEventListener('click', () => {
        localStorage.setItem('cookie_consent', 'rejected');
        hideBanner(banner);
    });
}

function hideBanner(banner) {
    banner.classList.remove('visible');
    banner.addEventListener('transitionend', () => {
        banner.remove();
    }, { once: true });
}

/* ---------- Dark Mode Toggle ---------- */
function initDarkMode() {
    // Apply saved theme or detect OS preference
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Update toggle icon
    updateThemeIcon();

    // Bind toggle button
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        // Remove old listeners by cloning
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);

        newToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon();
        });
    }
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    if (!icon) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    icon.textContent = isDark ? '☀️' : '🌙';
    updateLogoImages(isDark);
}

function updateLogoImages(isDark) {
    document.querySelectorAll('.logo-img').forEach(img => {
        const src = isDark ? img.dataset.logoDark : img.dataset.logoLight;
        if (src) img.src = src;
    });
}
