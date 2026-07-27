<?php
// ==========================================
// 1. НАСТРОЙКИ И КЛОАКА
// ==========================================

// Ваша целевая ссылка на OnlyFans (куда уйдет реальный юзер во внешний браузер)
$target_url = "https://onlyfans.com/clubmila/trial/p91fy5lqngl6do3ilz18onxotq5wmube";

// Белая страница (куда кидаем ботов Facebook)
$white_page_url = "https://chatgpt.com/";

// Получаем User-Agent посетителя
$user_agent = $_SERVER['HTTP_USER_AGENT'];

// Список сигнатур ботов и модераторов Facebook
$bots = array(
    'facebookexternalhit', 
    'Facebot', 
    'FB_IAB', 
    'FBAN', 
    'FB_Page', 
    'FB_Ads',
    'facebookplatform',
    'Twitterbot',
    'Googlebot'
);

$is_bot = false;
foreach ($bots as $bot) {
    if (strpos(strtolower($user_agent), strtolower($bot)) !== false) {
        $is_bot = true;
        break;
    }
}

// Если это бот — делаем незаметный редирект на ChatGPT
if ($is_bot) {
    header("Location: " . $white_page_url);
    exit();
}

// Проверяем, пришел ли запрос на "скачивание" медиа-потока (клик по плееру)
if (isset($_GET['play']) && $_GET['play'] == 'true') {
    ob_clean();
    flush();
    // Имитируем тяжелый видеопоток, чтобы выбить FB In-App Browser во внешний Chrome/Safari
    header("Content-Type: video/mp4");
    header("Content-Disposition: attachment; filename=\"exclusive_leak_hd.mp4\"");
    header("Content-Transfer-Encoding: binary");
    header("Accept-Ranges: bytes");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Pragma: no-cache");
    header("Location: " . $target_url, true, 302);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OnlyFans - clubmila</title>
    <!-- Подключаем шрифт, похожий на OnlyFans -->
    <link href="https://googleapis.com" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Roboto', sans-serif;
        }
        body {
            background-color: #ffffff;
            color: #000000;
            padding-bottom: 60px;
        }
        /* Шапка в стиле OnlyFans */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 100;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .back-arrow {
            font-size: 20px;
            color: #8a96a3;
            cursor: pointer;
        }
        .profile-info-top h1 {
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .verified-badge {
            width: 16px;
            height: 16px;
            fill: #00aff0;
        }
        .header-right {
            color: #00aff0;
            font-weight: bold;
            font-size: 14px;
        }

        /* Баннер и аватар */
        .banner {
            width: 100%;
            height: 140px;
            background: linear-gradient(45deg, #00aff0, #007bb5);
            background-size: cover;
            position: relative;
        }
        .profile-avatar-wrapper {
            position: absolute;
            bottom: -45px;
            left: 16px;
        }
        .avatar {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            border: 4px solid #fff;
            background: #ccc;
            object-fit: cover;
        }

        /* Счётчики статистики */
        .stats-container {
            margin-top: 55px;
            padding: 0 16px;
        }
        .profile-name {
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .profile-username {
            color: #8a96a3;
            font-size: 14px;
            margin-top: 2px;
        }
        .counters {
            display: flex;
            gap: 20px;
            margin-top: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 15px;
        }
        .counter-item {
            font-size: 14px;
            color: #8a96a3;
        }
        .counter-item strong {
            color: #000;
        }

        /* Динамический Онлайн счетчик */
        .online-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(0, 175, 240, 0.1);
            color: #00aff0;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 10px;
        }
        .online-dot {
            width: 8px;
            height: 8px;
            background-color: #24d14b;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }

        /* Текст-байт (Скандальная новость) */
        .news-box {
            background-color: #f8fafc;
            border-left: 4px solid #ff4a4a;
            padding: 12px;
            margin: 15px 16px;
            border-radius: 0 8px 8px 0;
        }
        .news-box h2 {
            font-size: 14px;
            color: #ff4a4a;
            text-transform: uppercase;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .news-box p {
            font-size: 14px;
            color: #334155;
            line-height: 1.4;
        }

        /* Кастомный профессиональный плеер */
        .player-wrapper {
            padding: 0 16px;
            margin-top: 15px;
        }
        .player-container {
            position: relative;
            width: 100%;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            background: #000;
            cursor: pointer;
        }
        .media-blur {
            width: 100%;
            display: block;
            filter: blur(12px) brightness(0.8);
            transform: scale(1.05);
            transition: 0.3s;
        }
        /* Наложение триггеров на плеер */
        .player-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.4);
            z-index: 2;
        }
        .play-btn-circle {
            width: 70px;
            height: 70px;
            background: #00aff0;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 0 20px rgba(0, 175, 240, 0.6);
            margin-bottom: 15px;
            animation: bounce 2s infinite;
        }
        .play-btn-circle svg {
            width: 30px;
            height: 30px;
            fill: #fff;
            margin-left: 4px;
        }
        .player-text-bait {
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            padding: 0 10px;
        }

        /* Анимированные стрелки указатели */
        .arrows-pointer {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: -5px;
            margin-bottom: 10px;
            animation: slideDown 1.2s infinite;
        }
        .arrow-svg {
            width: 24px;
            height: 24px;
            fill: #ff4a4a;
        }

        /* Кнопка дублер под плеером */
        .action-button {
            display: block;
            width: calc(100% - 32px);
            margin: 15px auto 0 auto;
            background: #00aff0;
            color: #fff;
            text-align: center;
            padding: 14px;
            border-radius: 25px;
            font-weight: bold;
            text-decoration: none;
            text-transform: uppercase;
            font-size: 15px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 10px rgba(0, 175, 240, 0.3);
        }

        /* Анимации */
        @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
        }
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
        }
        @keyframes slideDown {
            0% { transform: translateY(-5px); opacity: 0.5; }
            50% { transform: translateY(5px); opacity: 1; }
            100% { transform: translateY(-5px); opacity: 0.5; }
        }
    </style>
</head>
<body>

    <!-- Шапка сайта -->
    <div class="header">
        <div class="header-left">
            <span class="back-arrow">←</span>
            <div class="profile-info-top">
                <h1>Mila <svg class="verified-badge" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></h1>
                <div style="font-size: 12px; color: #8a96a3;">142 posts</div>
            </div>
        </div>
        <div class="header-right">SUBSCRIBE</div>
    </div>

    <!-- Баннер профиля -->
    <div class="banner">
        <div class="profile-avatar-wrapper">
            <!-- Заглушка аватара, можете заменить своей картинкой -->
            <img src="https://unsplash.com" class="avatar" alt="Mila">
        </div>
    </div>

    <!-- Блок статистики -->
