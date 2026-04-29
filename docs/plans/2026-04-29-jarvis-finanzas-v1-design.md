# Jarvis Personal - Diseno Tecnico V1 (Finanzas Primero)

Fecha: 2026-04-29  
Ubicacion: `/Users/danilo/Desktop/Soluciones Web 2025/asistente`

## 1) Objetivo de la V1
Construir un asistente tipo mayordomo en Telegram, desplegado 24/7 en Railway, con foco exclusivo en finanzas personales mediante comandos estructurados.

## 2) Alcance funcional validado
- Registro de movimientos:
  - `/gasto <monto> <categoria> <cuenta> <nota_opcional>`
  - `/ingreso <monto> <categoria> <cuenta> <nota_opcional>`
- Consultas:
  - `/saldo` (total + desglose por cuenta)
  - `/hoy`
  - `/semana`
  - `/mes` (mes calendario actual)
- Ayuda:
  - `/help` con sintaxis y ejemplos.

## 3) Reglas de negocio V1
- Modo estricto (catálogos cerrados):
  - Cuentas: `efectivo`, `banco`, `tarjeta_credito`
  - Categorias gasto: `comida`, `transporte`, `hogar`, `salud`, `educacion`, `entretenimiento`, `servicios`, `otros`
  - Categorias ingreso: `salario`, `freelance`, `ventas`, `otros`
- Moneda fija: `GTQ (Q)`.
- Monto valido: entero o decimal con hasta 2 posiciones (`45`, `43.44`).
- No se permiten montos negativos ni mas de 2 decimales.
- Fecha/hora del movimiento: timestamp actual del sistema (no fecha manual en V1).
- Seguridad: solo un usuario autorizado por `telegram_user_id`.
- Fuera de alcance V1: transferencias entre cuentas, NLP libre, multiusuario abierto.

## 4) Arquitectura tecnica
Stack:
- Backend: NestJS
- ORM: Prisma
- DB: PostgreSQL (Railway)
- Canal: Telegram Bot API (webhook)
- Infra: Railway (deploy + runtime 24/7)

Modulos NestJS:
- `telegram`: recepcion de mensajes y parsing de comandos.
- `auth`: validacion de usuario autorizado.
- `finanzas`: validaciones, creacion de movimientos.
- `reportes`: resumenes `/saldo`, `/hoy`, `/semana`, `/mes`.
- `common`: DTOs, utilidades, errores estandarizados.

Flujo:
1. Telegram envia update al webhook.
2. `auth` valida `telegram_user_id`.
3. `telegram` parsea comando.
4. `finanzas` o `reportes` ejecuta logica.
5. Respuesta corta y clara al chat.

## 5) Modelo de datos (PostgreSQL + Prisma)

### Tabla `allowed_users`
- `id` (uuid, pk)
- `telegram_user_id` (bigint/string, unique)
- `name` (string, nullable)
- `active` (boolean, default true)
- `created_at` (timestamp)

### Tabla `movements`
- `id` (uuid, pk)
- `telegram_user_id` (bigint/string, index)
- `type` (`expense` | `income`)
- `amount` (`numeric(12,2)`)
- `category` (string)
- `account` (string)
- `note` (string, nullable)
- `created_at` (timestamp, index)

Indices recomendados:
- `movements(telegram_user_id)`
- `movements(created_at)`
- `movements(telegram_user_id, created_at)`

## 6) Contrato de comandos V1

### Registro
- Gasto:
  - `/gasto 45 comida efectivo almuerzo`
- Ingreso:
  - `/ingreso 1500 salario banco pago_quincena`

### Consulta
- `/saldo`
- `/hoy`
- `/semana`
- `/mes`

### Ayuda
- `/help`

## 7) Manejo de errores (UX mayordomo)
Respuestas claras y accionables:
- Monto invalido: `Monto no valido. Usa 45 o 43.44`.
- Categoria invalida: `Categoria no permitida. Usa /help para ver opciones`.
- Cuenta invalida: `Cuenta no valida. Opciones: efectivo, banco, tarjeta_credito`.
- Sintaxis incompleta: mostrar formato exacto + ejemplo.
- No autorizado: `Acceso restringido`.

## 8) Variables de entorno
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=...`
- `TELEGRAM_BOT_TOKEN=...`
- `TELEGRAM_ALLOWED_USER_ID=...`
- `TZ=America/Guatemala`

## 9) Observabilidad minima
- Endpoint `GET /health`
- Logging estructurado por comando
- Captura de errores por request
- Mensajes de validacion consistentes

## 10) Roadmap evolutivo
- V1.1: exportacion CSV/Excel + `/categorias` + `/cuentas`
- V1.2: recordatorios automaticos y alertas por presupuesto
- V1.3: NLP controlado ademas de comandos estrictos
- V2: monitoreo tecnico de proyectos (health checks y alertas)
- V3: capa proactiva avanzada de asistente personal

## 11) Criterios de aceptacion V1
- Registra gasto e ingreso con validacion estricta.
- Responde `/saldo`, `/hoy`, `/semana`, `/mes` correctamente.
- Solo procesa comandos del usuario autorizado.
- Corre de forma estable 24/7 en Railway.
- `/help` evita ambiguedad de uso.

