# Cloudflare Worker - Lovebite Events

Este Worker actúa como proxy seguro entre el sitio estático y la API de Eventbrite.

## Deploy

### 1. Instalar Wrangler (si no lo tenés)
```bash
npm install -g wrangler
```

### 2. Login en Cloudflare
```bash
wrangler login
```

### 3. Crear el secret del token
```bash
wrangler secret put EVENTBRITE_PRIVATE_TOKEN
# Cuando te pregunte, pegá: OJW54ORKFZRTJCKZNV42
```

### 4. Deploy del Worker
```bash
wrangler deploy
```

### 5. URL del Worker
Después del deploy, te dará una URL como:
```
https://lovebite-events.tu-subdominio.workers.dev
```

Copiá esa URL y actualizala en el `index.html` en esta línea:
```javascript
const WORKER_URL = 'https://lovebite-events.tu-subdominio.workers.dev'
```

## Estructura de Respuesta

El Worker devuelve:
```json
{
  "events": [
    {
      "id": "123456789",
      "name": "Speed Dating Event",
      "description": "Description text...",
      "url": "https://www.eventbrite.com/e/...",
      "start": "2024-03-15T19:00:00",
      "end": "2024-03-15T22:00:00",
      "image": "https://img.evbuc.com/...",
      "venue": {
        "name": "Venue Name",
        "address": "123 Main St, Sydney"
      },
      "is_free": false,
      "ticket_availability": { ... }
    }
  ]
}
```
