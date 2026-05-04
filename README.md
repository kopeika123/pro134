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

## Примеры запросов

### Producer

Отправка события в очередь:

```bash
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "orderId": "order-98765",
      "userId": "user-12345",
      "amount": 1290.5,
      "status": "created"
    }
  }'
```

Пример ответа:

```json
{
  "eventId": "...",
  "status": "sent"
}
```

### Telegram

Отправка уведомления (можно использовать для тестирования сервиса):

```bash
curl -X POST http://localhost:3003/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-12345",
    "text": "Новое событие: заказ создан",
    "payload": {
      "orderId": "order-98765",
      "userName": "Иван Иванов",
      "amount": 1290.5,
      "status": "created"
    }
  }'
```

Пример ответа:

```json
{
  "status": "sent"
}
```

> `consumer` не принимает внешние POST-запросы — он просто слушает очередь RabbitMQ и проверяется через health endpoint.

## Тесты

Запустить unit-тесты:

```bash
npm run test
```

## Дополнительно

- `npm run lint` — запуск линтинга для всех пакетов
- `npm run build:all` — сборка всех пакетов
