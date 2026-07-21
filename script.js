// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    checkCloaking();
});

// ===== PLATFORM DETECTION =====
const platform = {
    isIOS: false,
    isAndroid: false,
    isFB: false,
    isIG: false,
    isWebView: false,
    userAgent: ''
};

function detectPlatform() {
    platform.userAgent = navigator.userAgent || navigator.vendor || window.opera;
    platform.isIOS = /iPad|iPhone|iPod/.test(platform.userAgent) && !window.MSStream;
    platform.isAndroid = /Android/.test(platform.userAgent);
    platform.isFB = /FBAN|FBAV|FBIOS/i.test(platform.userAgent);
    platform.isIG = /Instagram/i.test(platform.userAgent);
    platform.isWebView = platform.isFB || platform.isIG;
    
    console.log('[Platform Detected]', platform);
}

// ===== CLOAKING =====
function checkCloaking() {
    if (typeof CONFIG === 'undefined') {
        applyConfig();
        initAgeGate();
        return;
    }
    
    if (!CONFIG.CLOAKING_ENABLED) {
        applyConfig();
        initAgeGate();
        return;
    }
    
    detectPlatform();
    
    const ua = platform.userAgent.toLowerCase();
    const isBot = CONFIG.BOT_USER_AGENTS.some(bot => 
        ua.includes(bot.toLowerCase())
    );
    
    // Если это бот FB/IG модерации — редиректим на безопасную страницу
    if (isBot) {
        console.log('[Cloaking] Bot detected, redirecting to safe page');
        window.location.href = CONFIG.SAFE_URL;
        return;
    }
    
    applyConfig();
    initAgeGate();
}

// ===== APPLY CONFIG =====
function applyConfig() {
    if (typeof CONFIG === 'undefined') return;
    
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.textContent = val;
    };
    
    set('ageRequired', CONFIG.AGE_REQUIRED);
    set('modelName', CONFIG.MODEL_NAME);
    set('modelAge', CONFIG.MODEL_AGE);
    set('fansCount', CONFIG.FANS_COUNT);
    set('postsCount', CONFIG.POSTS_COUNT);
    set('likesCount', CONFIG.LIKES_COUNT);
    set('videoDuration', CONFIG.VIDEO_DURATION);
    
    // FB Pixel (optional)
    if (CONFIG.FB_PIXEL_ID) {
        const script = document.createElement('script');
        script.innerHTML = `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
            n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${CONFIG.FB_PIXEL_ID}');
            fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
    }
}

// ===== AGE GATE =====
function initAgeGate() {
    const modal = document.getElementById('ageModal');
    const main = document.getElementById('mainContent');
    const underage = document.getElementById('underageBlock');
    const yesBtn = document.getElementById('ageYes');
    const noBtn = document.getElementById('ageNo');
    
    // Check if already verified in this session
    try {
        if (sessionStorage.getItem('age_verified') === '1') {
            modal.style.display = 'none';
            main.style.display = 'block';
            initCTA();
            return;
        }
    } catch(e) {}
    
    yesBtn.addEventListener('click', () => {
        try { sessionStorage.setItem('age_verified', '1'); } catch(e) {}
        modal.style.display = 'none';
        main.style.display = 'block';
        initCTA();
        trackEvent('age_verified');
    });
    
    noBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        underage.style.display = 'flex';
    });
}

// ===== CTA & REDIRECT LOGIC =====
function initCTA() {
    const cta = document.getElementById('ctaButton');
    if (!cta) return;
    
    const offerUrl = (typeof CONFIG !== 'undefined' && CONFIG.OFFER_URL) 
        ? CONFIG.OFFER_URL 
        : '#';
    
    // Update href as primary method
    cta.href = offerUrl;
    
    // Multi-method redirect for FB/IG in-app browser
    const doRedirect = (e) => {
        if (e) e.preventDefault();
        trackEvent('cta_click');
        
        // Запускаем цепочку методов увода
        attemptRedirect(offerUrl, 0);
    };
    
    // Bind both touch and click for mobile + desktop
    let touched = false;
    cta.addEventListener('touchstart', (e) => {
        touched = true;
        doRedirect(e);
    }, { passive: false });
    
    cta.addEventListener('click', (e) => {
        if (touched) { touched = false; return; }
        doRedirect(e);
    });
    
    // Retry button
    const retryBtn = document.getElementById('retryButton');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            document.getElementById('fallbackInstruction').style.display = 'none';
            attemptRedirect(offerUrl, 0);
        });
    }
}

// ===== MULTI-METHOD REDIRECT =====
let redirectAttempt = 0;
const MAX_ATTEMPTS = 5;

function attemptRedirect(url, attempt) {
    redirectAttempt = attempt;
    
    if (attempt >= MAX_ATTEMPTS) {
        // Все методы не сработали — показываем инструкцию
        showFallbackInstruction(url);
        return;
    }
    
    console.log(`[Redirect] Attempt ${attempt + 1}/${MAX_ATTEMPTS}`);
    
    switch(attempt) {
        case 0:
            // Метод 1: window.open с noopener
            method1_WindowOpen(url);
            break;
        case 1:
            // Метод 2: Промежуточная страница redirect.html
            method2_IntermediateRedirect(url);
            break;
        case 2:
            // Метод 3: x-web-search:// для iOS (работает из Instagram)
            method3_XWebSearch(url);
            break;
        case 3:
            // Метод 4: Server-side PDF trick для Android
            method4_PDFTrick(url);
            break;
        case 4:
            // Метод 5: window.location.href (последний шанс)
            method5_DirectLocation(url);
            break;
    }
}

// Метод 1: window.open
function method1_WindowOpen(url) {
    console.log('[Method 1] window.open');
    
    const newWin = window.open(url, '_blank', 'noopener,noreferrer');
    
    setTimeout(() => {
        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
            console.log('[Method 1] Failed, trying next method');
            attemptRedirect(url, redirectAttempt + 1);
        } else {
            console.log('[Method 1] Success');
        }
    }, 500);
}

// Метод 2: Промежуточная страница
function method2_IntermediateRedirect(url) {
    console.log('[Method 2] Intermediate redirect');
    
    const redirectUrl = `redirect.html?${encodeURIComponent(url)}`;
    
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 100);
}

// Метод 3: x-web-search:// для iOS
function method3_XWebSearch(url) {
    console.log('[Method 3] x-web-search:// scheme');
    
    if (platform.isIOS && platform.isIG) {
        // Для iOS Instagram используем x-web-search://
        const safariLink = `x-web-search://?${url}`;
        
        setTimeout(() => {
            window.location.href = safariLink;
            
            // Проверяем через 1.5с, если не ушло — следующий метод
            setTimeout(() => {
                attemptRedirect(url, redirectAttempt + 1);
            }, 1500);
        }, 100);
    } else {
        // Не iOS IG — сразу следующий метод
        attemptRedirect(url, redirectAttempt + 1);
    }
}

// Метод 4: Server-side PDF trick для Android Instagram
function method4_PDFTrick(url) {
    console.log('[Method 4] Server-side PDF trick');
    
    if (platform.isAndroid && platform.isIG) {
        // Для Android Instagram используем server-side trick
        // Серверный скрипт возвращает Content-type: application/pdf
        // Это заставляет WebView открыть ссылку во внешнем браузере
        setTimeout(() => {
            window.location.href = `socialredirect.php?redirect=${encodeURIComponent(url)}`;
            
            // Проверяем через 2с
            setTimeout(() => {
                attemptRedirect(url, redirectAttempt + 1);
            }, 2000);
        }, 100);
    } else {
        // Не Android IG — сразу следующий метод
        attemptRedirect(url, redirectAttempt + 1);
    }
}

// Метод 5: Прямой window.location.href
function method5_DirectLocation(url) {
    console.log('[Method 5] Direct window.location.href');
    
    if (window.top && window.top !== window.self) {
        try {
            window.top.location.href = url;
            return;
        } catch(err) {
            console.log('[Method 5] window.top failed, using window.location');
        }
    }
    
    window.location.href = url;
}

// ===== FALLBACK INSTRUCTION =====
function showFallbackInstruction(url) {
    console.log('[Fallback] Showing instruction');
    
    const fallback = document.getElementById('fallbackInstruction');
    if (fallback) {
        fallback.style.display = 'flex';
        
        // Добавляем ручную ссылку
        const content = fallback.querySelector('.fallback-content');
        if (content && !content.querySelector('.manual-link')) {
            const manualLink = document.createElement('a');
            manualLink.href = url;
            manualLink.target = '_blank';
            manualLink.rel = 'noopener external';
            manualLink.className = 'manual-link';
            manualLink.textContent = 'Open Link Manually →';
            content.appendChild(manualLink);
        }
    }
    
    trackEvent('redirect_fallback');
}

// ===== TRACKING =====
function trackEvent(eventName) {
    try {
        if (typeof fbq !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.FB_PIXEL_ID) {
            fbq('trackCustom', eventName);
        }
    } catch(e) {}
    console.log('[Track]', eventName);
}
