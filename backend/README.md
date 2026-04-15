# FINANCIA backend

Backend inicial en NestJS para la aplicación FINANCIA.

## Estado actual

- estructura base del backend en `src/modules`
- configuración centralizada con variables de entorno
- prefijo global de API configurable (`API_PREFIX`)
- endpoint inicial `GET /api` para comprobar estado

## Módulos base creados

- auth
- users
- payers
- incomes
- expenses
- recurring-payments
- documents
- contracts
- tax
- alerts
- simulations
- ocr
- llm
- rules

## Variables de entorno

Se incluyen `/.env` y `/.env.example` con valores de desarrollo local.

Antes de desplegar o compartir el backend, cambia al menos:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DB_PASSWORD`

## Comandos

```bash
npm install
npm run start:dev
npm run lint
npm run build
npm run test
npm run test:e2e
```
