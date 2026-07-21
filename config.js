// ===== НАСТРОЙКИ ПРЕЛЕНДА =====
const CONFIG = {
    OFFER_URL: "https://qwen.ai/home",  // ← КУДА ВЕДЁМ
    SAFE_URL: "https://yourdomain.com/safe-page",      // ← Для модерации FB (обычный блог)
    MODEL_NAME: "Sophia_Blue",
    MODEL_AGE: 23,
    MODEL_VERIFIED: true,
    FANS_COUNT: "124.5K",
    POSTS_COUNT: "847",
    LIKES_COUNT: "2.3M",
    VIDEO_DURATION: "12:47",
    AGE_REQUIRED: 18,
    FB_PIXEL_ID: null,
    
    // Cloaking settings
    CLOAKING_ENABLED: true,  // Включить клоакинг
    
    // Bot detection patterns
    BOT_USER_AGENTS: [
        'facebookexternalhit',
        'Facebot',
        'Twitterbot',
        'WhatsApp',
        'LinkedInBot',
        'Googlebot',
        'bingbot',
        'YandexBot'
    ]
};
