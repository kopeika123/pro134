# NestJS Microservices

Реализована микросервисная архитектура на Nest.js с RabbitMQ и Telegram API.

## Сервисы

- `producer` — HTTP API для отправки событий в RabbitMQ
- `consumer` — обработка событий из RabbitMQ и пересылка их в Telegram сервис
- `telegram` — отправка уведомлений через Telegram Bot API

## Подготовка

1. Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

2. Установите зависимости:

```bash
npm install
```

## Запуск

1. Запустите Docker Compose:

```bash
npm run docker:up
```

или

```bash
docker compose up --build
```

2. Откройте Swagger UI:

- Producer: `http://localhost:3001/docs`
- Consumer: `http://localhost:3002/docs`
- Telegram: `http://localhost:3003/docs`

3. Остановить контейнеры:

```bash
npm run docker:down
```

## Локальная разработка

Для запуска всех сервисов параллельно через Turbo:

```bash
npm run dev
```

## Health endpoints

- Producer: `GET http://localhost:3001/events/health`
- Consumer: `GET http://localhost:3002/health`
- Telegram: `GET http://localhost:3003/notifications/health`

## Переменные окружения

Используйте `.env.example` как стартовую точку.

- `RABBITMQ_DEFAULT_USER` — пользователь RabbitMQ (например, `guest`)
- `RABBITMQ_DEFAULT_PASS` — пароль RabbitMQ (например, `guest`)
- `RABBITMQ_URL` — URL подключения к RabbitMQ (например, `amqp://guest:guest@rabbitmq:5672`)
- `TELEGRAM_SERVICE_URL` — URL сервиса Telegram внутри Docker-сети (`http://telegram-service:3003`)
- `TELEGRAM_BOT_TOKEN` — токен бота Telegram
- `TELEGRAM_CHAT_ID` — ID чата для отправки уведомлений

## Тесты

Запустить unit-тесты:

```bash
npm run test
```

## Дополнительно

- `npm run lint` — запуск линтинга для всех пакетов
- `npm run build:all` — сборка всех пакетов
