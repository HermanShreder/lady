from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import re
import time
from collections import defaultdict
from pathlib import Path

app = FastAPI()

# 1. Загружаем HTML файлы в память при старте сервера для максимальной скорости
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

with open(PUBLIC_DIR / "safe_page.html", "r", encoding="utf-8") as f:
    SAFE_PAGE_HTML = f.read()

with open(PUBLIC_DIR / "money_page.html", "r", encoding="utf-8") as f:
    MONEY_PAGE_HTML = f.read()

# 2. Паттерны ботов (расширенный список для FB, Inst, Tg и прочих краулеров)
BOT_PATTERNS = [
    r"facebookexternalhit",
    r"Facebot",
    r"meta-externalagent",
    r"LinkedInBot",
    r"Twitterbot",
    r"TelegramBot",
    r"WhatsApp",
    r"Viber",
    r"Discordbot"
]

# 3. Rate Limiter
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # секунд
RATE_LIMIT_MAX = 30     # макс запросов

def is_bot(user_agent: str) -> bool:
    if not user_agent:
        return False
    for pattern in BOT_PATTERNS:
        if re.search(pattern, user_agent, re.IGNORECASE):
            return True
    return False

def check_rate_limit(ip: str) -> bool:
    now = time.time()
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        return False
    rate_limit_store[ip].append(now)
    return True

@app.middleware("http")
async def bot_protection_middleware(request: Request, call_next):
    ip = request.client.host
    
    # Проверка на флуд
    if not check_rate_limit(ip):
        return JSONResponse(status_code=429, content={"error": "Too Many Requests"})
    
    return await call_next(request)

# 4. Главный роут — КЛОАКА
@app.get("/")
async def root(request: Request):
    ua = request.headers.get("user-agent", "")
    
    if is_bot(ua):
        # Если это бот ФБ (модератор/краулер) -> Отдаем белую Safe Page
        return HTMLResponse(content=SAFE_PAGE_HTML)
    
    # Если это реальный человек -> Отдаем Money Page (с Auditzy)
    return HTMLResponse(content=MONEY_PAGE_HTML)

# Отдаем статику (картинки, если они у тебя появятся в папке public)
app.mount("/public", StaticFiles(directory="public"), name="public")
