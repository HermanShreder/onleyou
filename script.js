// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    initAgeGate();
    detectPlatform();
});

// ===== PLATFORM DETECTION =====
let platform = {
    isIOS: false,
    isAndroid: false,
    isFB: false,
    isIG: false,
    isWebView: false
};

function detectPlatform() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    
    platform.isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    platform.isAndroid = /Android/.test(ua);
    platform.isFB = /FBAN|FBAV|FBIOS/i.test(ua);
    platform.isIG = /Instagram/i.test(ua);
    platform.isWebView = platform.isFB || platform.isIG;
    
    console.log('[Platform]', platform);
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
const MAX_ATTEMPTS = 4;

function attemptRedirect(url, attempt) {
    redirectAttempt = attempt;
    
    if (attempt >= MAX_ATTEMPTS) {
        // Все методы не сработали — показываем инструкцию
        showFallbackInstruction();
        return;
    }
    
    console.log(`[Redirect] Attempt ${attempt + 1}/${MAX_ATTEMPTS}`);
    
    switch(attempt) {
        case 0:
            // Метод 1: window.open с noopener (работает в большинстве WebView)
            method1_WindowOpen(url);
            break;
        case 1:
            // Метод 2: Промежуточная страница redirect.html
            method2_IntermediateRedirect(url);
            break;
        case 2:
            // Метод 3: Custom URL scheme (iOS: Chrome/Safari, Android: Intent)
            method3_CustomScheme(url);
            break;
        case 3:
            // Метод 4: window.location.href (последний шанс)
            method4_DirectLocation(url);
            break;
    }
}

// Метод 1: window.open
function method1_WindowOpen(url) {
    console.log('[Method 1] window.open');
    
    const newWin = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Проверяем что окно открылось
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
    
    // Создаём URL для промежуточной страницы
    const redirectUrl = `redirect.html?${encodeURIComponent(url)}`;
    
    // Небольшая задержка чтобы WebView успел обработать
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 100);
}

// Метод 3: Custom URL schemes
function method3_CustomScheme(url) {
    console.log('[Method 3] Custom URL scheme');
    
    const parsedUrl = new URL(url);
    const host = parsedUrl.host;
    const path = parsedUrl.pathname + parsedUrl.search;
    
    let customUrl = null;
    
    if (platform.isIOS) {
        // iOS: пробуем открыть в Chrome или Safari
        // googlechrome://navigate?url=...
        customUrl = `googlechrome://navigate?url=${encodeURIComponent(url)}`;
        
        // Fallback: используем window.location.href с custom scheme
        setTimeout(() => {
            window.location.href = customUrl;
            
            // Если не сработало через 1.5с — пробуем следующий метод
            setTimeout(() => {
                attemptRedirect(url, redirectAttempt + 1);
            }, 1500);
        }, 100);
        
    } else if (platform.isAndroid) {
        // Android: используем intent:// scheme
        // intent://host/path#Intent;scheme=https;package=com.android.chrome;end
        customUrl = `intent://${host}${path}#Intent;scheme=${parsedUrl.protocol.replace(':', '')};package=com.android.chrome;end`;
        
        setTimeout(() => {
            window.location.href = customUrl;
            
            // Если не сработало — пробуем следующий метод
            setTimeout(() => {
                attemptRedirect(url, redirectAttempt + 1);
            }, 1500);
        }, 100);
        
    } else {
        // Desktop или неизвестная платформа — сразу к следующему методу
        attemptRedirect(url, redirectAttempt + 1);
    }
}

// Метод 4: Прямой window.location.href
function method4_DirectLocation(url) {
    console.log('[Method 4] Direct window.location.href');
    
    // На iOS FB WebView это часто открывает Safari автоматически
    // На Android может остаться внутри WebView, но это последний шанс
    
    // Используем window.top.location если мы внутри iframe
    if (window.top && window.top !== window.self) {
        try {
            window.top.location.href = url;
            return;
        } catch(err) {
            console.log('[Method 4] window.top failed, using window.location');
        }
    }
    
    window.location.href = url;
}

// ===== FALLBACK INSTRUCTION =====
function showFallbackInstruction() {
    console.log('[Fallback] Showing instruction');
    
    const fallback = document.getElementById('fallbackInstruction');
    if (fallback) {
        fallback.style.display = 'flex';
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
