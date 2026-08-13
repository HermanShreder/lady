<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Mila Noir | Telegram</title>

  <style>
    /* Чистый и современный визуал в стиле Telegram */
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #000; }
    
    .tg-card { 
      background: #ffffff; 
      max-width: 400px; 
      width: 90%; 
      border-radius: 12px; 
      padding: 40px 24px; 
      text-align: center; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
    }
    
    .tg-avatar { 
      width: 80px; 
      height: 80px; 
      background-color: #3390ec; 
      border-radius: 50%; 
      margin: 0 auto 20px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    
    .tg-title { 
      font-size: 22px; 
      font-weight: 600; 
      margin-bottom: 10px; 
      color: #000;
    }
    
    .tg-desc { 
      font-size: 15px; 
      color: #707579; 
      margin-bottom: 24px; 
      line-height: 1.4; 
    }
    
    .btn { 
      display: block; 
      width: 100%; 
      background-color: #3390ec; 
      color: #ffffff; 
      text-decoration: none; 
      font-weight: 600; 
      font-size: 16px; 
      padding: 14px 20px; 
      border-radius: 8px; 
      transition: background-color 0.2s, transform 0.1s; 
      -webkit-tap-highlight-color: transparent;
    }
    
    .btn:hover { background-color: #2a7bcf; }
    .btn:active { transform: scale(0.98); }
  </style>

  <!-- Meta Pixel Code -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=true;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','2127136807835684');
    fbq('track', 'PageView');
  </script>
  <noscript>
    <img height="1" width="1" style="display:none"
         src="https://www.facebook.com/tr?id=2127136807835684&ev=PageView&noscript=1" />
  </noscript>
  <!-- End Meta Pixel Code -->
</head>
<body>
  
  <div class="tg-card">
    <div class="tg-avatar">
      <!-- Иконка бумажного самолетика Telegram -->
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    
    <h1 class="tg-title">Mila Noir</h1>
    <p class="tg-desc">
      Нажмите кнопку ниже, чтобы продолжить просмотр в официальном Telegram-канале.
    </p>

    <a id="openBtn" class="btn" href="https://t.me/+Wp9sT1rqpWoyNjcy">
      Открыть в Telegram
    </a>
  </div>

  <script>
    // 1. Инициализация visitorId
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'v-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('visitor_id', visitorId);
    }

    const VERSION = '2026-08-01-BRIDGE-FINAL';
    const EXTERNAL_URL = "https://t.me/+Wp9sT1rqpWoyNjcy";

    // 2. Определение окружения
    var ua = navigator.userAgent || '';
    var device = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : (/Android/i.test(ua) ? 'Android' : 'Desktop');
    var isFB = ua.includes("FBAN") || ua.includes("FBAV") || ua.includes("FB_IAB") || ua.includes("FBIOS") || ua.includes("Instagram") || ua.includes("Messenger");

    // 3. Функция трекинга логов
    function trackTG(action, details) {
        var d = new URLSearchParams({
            action: action,
            device: device,
            userAgent: ua,
            details: details || '',
            screen: screen.width + 'x' + screen.height,
            lang: navigator.language || '?',
            visitor: visitorId,
            page: 'bridge',
            version: VERSION,
            browser: isFB ? 'inapp' : 'external'
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track', d);
        } else {
            fetch('/api/track', { method: 'POST', body: d, keepalive: true }).catch(function(){});
        }
    }

    // Логируем открытие страницы
    trackTG('BRIDGE_OPEN');

    // 4. Обработка клика по кнопке
    document.getElementById('openBtn').addEventListener('click', function(e) {
        e.preventDefault();

        // 1. СРАЗУ отправляем лид в пиксель и логируем клик
        if (typeof fbq === 'function') {
            fbq('track', 'Lead');
        }
        trackTG('LEAD_QUEUED');
        trackTG('BRIDGE_CLICK');

        const fullExternalUrl = EXTERNAL_URL;

        // 2. Жесткая задержка ровно 0.6 секунд (600 мс) перед перенаправлением
        setTimeout(function() {
            // ГЛАВНАЯ ЛОГИКА: Разделение на In-App и Внешний браузер
            if (device === 'Android' && isFB) {
                // Пытаемся вытолкнуть пользователя в Chrome через Intent
                const intent = "intent://" + 
                    fullExternalUrl.replace(/^https?:\/\//, "") + 
                    "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + 
                    encodeURIComponent(fullExternalUrl) + ";end";
                
                window.location.href = intent;

                // СТРАХОВКА: Если Meta заблокировал Intent
                setTimeout(function() {
                    if (document.visibilityState === 'visible') {
                        trackTG('INTENT_BLOCKED_FALLBACK');
                        window.location.href = fullExternalUrl; 
                    }
                }, 1500);

            } else {
                // Для iOS, десктопа или обычных браузеров — прямой переход
                window.location.href = fullExternalUrl;
            }
        }, 600); // <-- Задержка 0.6 сек (600 миллисекунд)
    });
  </script>
</body>
</html>
