// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    initAgeGate();
});

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
    
    // Multi-method redirect for FB/IG in-app browser compatibility
    const doRedirect = (e) => {
        e.preventDefault();
        trackEvent('cta_click');
        
        // Method 1: window.open with noopener (works in most WebView)
        const newWin = window.open(offerUrl, '_blank', 'noopener,noreferrer');
        
        // Method 2: fallback if popup blocked
        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
            // Try top-level navigation (breaks out of iframe-like WebView)
            if (window.top && window.top !== window.self) {
                try {
                    window.top.location.href = offerUrl;
                    return;
                } catch(err) {}
            }
            // Final fallback: current window
            window.location.href = offerUrl;
        }
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
