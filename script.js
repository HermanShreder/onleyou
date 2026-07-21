// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    detectPlatform();
    initAgeGate();
});

// ===== PLATFORM DETECTION =====
const platform = {
    isIOS: false,
    isAndroid: false,
    isFB: false,
    isIG: false,
    isWebView: false,
    isSafari: false,
    isChrome: false,
    userAgent: ''
};

function detectPlatform() {
    platform.userAgent = navigator.userAgent || navigator.vendor || window.opera;
    platform.isIOS = /iPad|iPhone|iPod/.test(platform.userAgent) && !window.MSStream;
    platform.isAndroid = /Android/.test(platform.userAgent);
    platform.isFB = /FBAN|FBAV|FBIOS/i.test(platform.userAgent);
    platform.isIG = /Instagram/i.test(platform.userAgent);
    platform.isWebView = platform.isFB || platform.isIG;
    platform.isSafari = /Safari/.test(platform.userAgent) && !/Chrome/.test(platform.userAgent);
    platform.isChrome = /Chrome/.test(platform.userAgent) && !/Edge/.test(platform.userAgent);
    
    console.log('[Platform]', platform);
}

// ===== CONFIG =====
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
}

// ===== AGE GATE =====
function initAgeGate() {
    const modal = document.getElementById('ageModal');
    const main = document.getElementById('mainContent');
    const underage = document.getElementById('underageBlock');
    const yesBtn = document.getElementById('ageYes');
    const noBtn = document.getElementById('ageNo');
    
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
    });
    
    noBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        underage.style.display = 'flex';
    });
}

// ===== CTA BUTTON =====
function initCTA() {
    const cta = document.getElementById('ctaButton');
    const fallback = document.getElementById('fallbackButtons');
    
    if (!cta) return;
    
    const offerUrl = (typeof CONFIG !== 'undefined' && CONFIG.OFFER_URL) 
        ? CONFIG.OFFER_URL 
        : '#';
    
    // Обновляем manual link
    const manualLink = document.getElementById('manualLink');
    if (manualLink) {
        manualLink.href = offerUrl;
        manualLink.textContent = `Copy link: ${offerUrl}`;
        manualLink.addEventListener('click', (e) => {
            e.preventDefault();
            copyToClipboard(offerUrl);
            alert('Link copied! Paste it in your browser.');
        });
    }
    
    // Обработчик главной кнопки
    cta.addEventListener('click', (e) => {
        e.preventDefault();
        attemptEscape(offerUrl);
    });
    
    // Обработчики fallback кнопок
    const openSafari = document.getElementById('openSafari');
    const openChrome = document.getElementById('openChrome');
    const openAndroidChrome = document.getElementById('openAndroidChrome');
    
    if (openSafari) {
        openSafari.addEventListener('click', () => {
            openInSafari(offerUrl);
        });
    }
    
    if (openChrome) {
        openChrome.addEventListener('click', () => {
            openInChrome(offerUrl);
        });
    }
    
    if (openAndroidChrome) {
        openAndroidChrome.addEventListener('click', () => {
            openInAndroidBrowser(offerUrl);
        });
    }
}

// ===== ESCAPE ATTEMPT =====
function attemptEscape(url) {
    console.log('[Escape] Attempting to break out of WebView');
    
    // Показываем fallback кнопки
    const fallback = document.getElementById('fallbackButtons');
    
    // Определяем какие кнопки показать
    if (platform.isIOS && platform.isIG) {
        // iOS Instagram - показываем Chrome и Safari
        document.getElementById('openChrome').style.display = 'block';
        document.getElementById('openSafari').style.display = 'block';
    } else if (platform.isIOS && platform.isFB) {
        // iOS Facebook - показываем Safari
        document.getElementById('openSafari').style.display = 'block';
    } else if (platform.isAndroid) {
        // Android - показываем кнопку "Open in Browser"
        document.getElementById('openAndroidChrome').style.display = 'block';
    }
    
    // Пытаемся автоматический редирект
    if (platform.isIOS && platform.isIG) {
        // Instagram iOS - пробуем Chrome scheme
        setTimeout(() => {
            window.location.href = `googlechromes://${url.replace(/^https?:\/\//, '')}`;
        }, 100);
        
        // Через 1.5с показываем fallback если не сработало
        setTimeout(() => {
            if (fallback) fallback.style.display = 'block';
        }, 1500);
        
    } else if (platform.isIOS) {
        // Другие iOS WebView - пробуем Safari
        setTimeout(() => {
            openInSafari(url);
        }, 100);
        
        setTimeout(() => {
            if (fallback) fallback.style.display = 'block';
        }, 1500);
        
    } else if (platform.isAndroid) {
        // Android - пробуем Intent
        setTimeout(() => {
            openInAndroidBrowser(url);
        }, 100);
        
        setTimeout(() => {
            if (fallback) fallback.style.display = 'block';
        }, 2000);
        
    } else {
        // Desktop или неизвестная платформа
        window.open(url, '_blank');
    }
}

// ===== iOS Safari =====
function openInSafari(url) {
    console.log('[Safari] Opening in Safari');
    
    // Создаём скрытую ссылку
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Пробуем открыть
    try {
        link.click();
    } catch(e) {
        console.log('[Safari] Failed to open automatically');
    }
    
    document.body.removeChild(link);
}

// ===== iOS Chrome =====
function openInChrome(url) {
    console.log('[Chrome iOS] Opening in Chrome');
    
    const cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Пробуем googlechromes:// scheme
    window.location.href = `googlechromes://${cleanUrl}`;
    
    // Fallback через 1.5с
    setTimeout(() => {
        // Если не сработало - пробуем googlechrome://
        window.location.href = `googlechrome://${cleanUrl}`;
    }, 1500);
}

// ===== Android Browser =====
function openInAndroidBrowser(url) {
    console.log('[Android] Opening in browser');
    
    if (platform.isIG) {
        // Instagram Android - используем Intent
        const parsedUrl = new URL(url);
        const intentUrl = `intent://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}#Intent;scheme=${parsedUrl.protocol.replace(':', '')};package=com.android.chrome;end`;
        
        window.location.href = intentUrl;
    } else {
        // Другие Android WebView
        window.location.href = url;
    }
}

// ===== Copy to Clipboard =====
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}
