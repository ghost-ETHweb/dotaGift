# DotaGift

DotaGift — Telegram Mini App игра про коллекционные карточки, энергию, XP, трофеи, рефералов и сезонную войну рас.

Бот в Telegram: [@DotaGiftBot](https://t.me/DotaGiftBot)

## Что Делает Бот

- Открывает Telegram Mini App через кнопку в чате.
- Отвечает на базовые команды и кнопки: старт, информация о боте, правила игры.
- Авторизует пользователей через Telegram WebApp init data.
- Сохраняет прогресс игроков в базе данных.
- Обрабатывает карточки, мердж, XP, энергию, трофеи, рефералов, лидерборд и сезонную войну рас.

## Основные Возможности

- Игровое поле с карточками и мобильной механикой тапа/перетаскивания.
- Создание карточек за энергию.
- Объединение одинаковых карточек одной расы и уровня.
- Получение XP за игровые действия.
- Система уровней и наград за прогресс.
- Коллекция трофеев и сезонных карточек.
- Сезонная война рас с выбором расы один раз за сезон.
- Лидерборды игроков, друзей и своей расы.
- Реферальные ссылки и статистика приглашённых пользователей первого уровня.
- Профиль с настройками языка, ника и аватара.
- Backend API для хранения и обработки реальных игровых данных.

## Стек

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js HTTP server
- База данных: PostgreSQL через Neon
- Хостинг: Vercel
- Telegram: Telegram Bot API и Telegram WebApp SDK

## Локальный Запуск

Установить зависимости:

```bash
npm install
```

Запустить frontend:

```bash
npm run dev -- --port 5173
```

Запустить backend локально:

```bash
npm run server:dev
```

Локальные адреса по умолчанию:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

## Переменные Окружения

Обязательные переменные для production:

```env
DATABASE_URL=
TELEGRAM_BOT_TOKEN=
APP_JWT_SECRET=
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
ADMIN_TOKEN=
```

Дополнительные переменные:

```env
TELEGRAM_WEBHOOK_SECRET=
ALLOW_DEV_AUTH=false
DEV_DB_PATH=server/data/dev-db.json
```

`TELEGRAM_WEBHOOK_SECRET` нужен для проверки Telegram webhook-запросов, если секрет настроен при регистрации webhook.

## Telegram Webhook

После деплоя нужно зарегистрировать webhook в Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://your-vercel-app.vercel.app/api/telegram/webhook\",\"allowed_updates\":[\"message\",\"callback_query\"]}"
```

Если используется `TELEGRAM_WEBHOOK_SECRET`, нужно передать его при регистрации webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://your-vercel-app.vercel.app/api/telegram/webhook\",\"allowed_updates\":[\"message\",\"callback_query\"],\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

## Полезные Команды

```bash
npm run build
npm run db:migrate
npm run server:dev
```

## Статус MVP

Проект уже сложнее простого Telegram-бота с готовыми ответами. В нём есть Mini App, авторизация через Telegram, постоянное хранение данных, игровая логика на backend, реферальная система, лидерборды, сезонная механика рас и production-деплой.

Что ещё нужно усилить перед полноценным production:

- Админ-панель для управления игроками, сезонами и статистикой.
- Расширенная аналитика по удержанию, энергии, XP и мерджам.
- Логи ошибок и мониторинг production-состояния.
- Полноценные юридические документы для будущих призов, предиктов и партнёрских механик.
- Античит, rate limiting и защита от накруток.
- Партнёрские буст-карты и ивентовые сезонные механики.
