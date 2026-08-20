# CLAUDE.md — Node.js Backend Project

> This file is the authoritative reference for AI assistants (Claude, Copilot, etc.) and new engineers working on this codebase.
> It describes project structure, conventions, patterns, and API documentation strategy.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Architecture & Conventions](#architecture--conventions)
5. [Environment & Configuration](#environment--configuration)
6. [API Documentation (OpenAPI/Swagger)](#api-documentation-openapiswagger)
7. [Code Patterns](#code-patterns)
8. [Error Handling](#error-handling)
9. [Authentication](#authentication)
10. [Database](#database)
11. [Testing](#testing)
12. [Running the Project](#running-the-project)
13. [Common Tasks](#common-tasks)

---

## Project Overview

<!-- TODO: Replace with your actual project description -->
**Name:** `your-project-name`
**Purpose:** REST API backend serving [describe your app].
**Primary consumers:** Frontend SPA, mobile clients, third-party integrations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ (LTS) |
| Framework | Express 5 |
| Language | TypeScript 5 |
| ORM | Mongoose |
| Auth | JWT + refresh tokens |
| Validation | Zod |
| API Docs | OpenAPI 3.1 via `zod-openapi` + Swagger UI |
| Testing | Vitest + Supertest |
| Linter | ESLint + Prettier |
| Process manager | PM2 (production) |

---

## Directory Structure

```
project-root/
├── src/
│   ├── app.ts                  # Express app factory (no listen() here)
│   ├── server.ts               # Entry point — binds port, starts app
│   │
│   ├── config/
│   │   ├── index.ts            # Centralised env config (uses Zod for validation)
│   │   └── database.ts         # DB client initialisation
│   │
│   ├── modules/                # Feature modules (vertical slices)
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts   # Zod schemas (request + response)
│   │   │   └── auth.test.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.router.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts   # All DB queries live here
│   │   │   ├── users.schema.ts
│   │   │   └── users.test.ts
│   │   │
│   │   └── [feature]/           # Add new modules following the same pattern
│   │
│   ├── middleware/
│   │   ├── authenticate.ts      # JWT verification middleware
│   │   ├── validate.ts          # Generic Zod request validator
│   │   ├── errorHandler.ts      # Global error handler
│   │   └── rateLimiter.ts
│   │
│   ├── lib/
│   │   ├── logger.ts            # Pino logger instance
│   │   ├── httpError.ts         # Typed HTTP error class
│   │   └── asyncHandler.ts      # Wraps async route handlers
│   │
│   ├── types/
│   │   ├── express.d.ts         # Augments Express Request/Response
│   │   └── common.ts            # Shared TypeScript types
│   │
│   └── openapi/
│       ├── registry.ts          # Central OpenAPI registry
│       ├── generator.ts         # Generates and writes openapi.json
│       └── swagger.ts           # Serves Swagger UI in development
│
├── prisma/                      # (if using Prisma)
│   └── schema.prisma
│
├── tests/
│   └── helpers/
│       └── testApp.ts           # Shared Supertest app instance
│
├── docs/
│   └── openapi.json             # Auto-generated — DO NOT edit manually
│
├── .env.example
├── .env                         # Never committed
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── CLAUDE.md                    # ← You are here
```

### Rule: One module = one folder

Each business domain lives in `src/modules/<name>/`. Never reach into another module's internals — communicate through exported service functions only.

---

## Architecture & Conventions

### Request Lifecycle

```
Request
  → Router          (route definition + middleware stack)
  → validate()      (Zod schema check — rejects early with 422)
  → authenticate()  (JWT check where required)
  → Controller      (thin: parse req, call service, send res)
  → Service         (business logic, no HTTP knowledge)
  → Repository      (DB queries only, no business logic)
  → Response
```

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `users.service.ts` |
| Classes | `PascalCase` | `UserService` |
| Functions/vars | `camelCase` | `getUserById` |
| Constants | `SCREAMING_SNAKE` | `MAX_RETRY_COUNT` |
| DB tables | `snake_case` | `user_sessions` |
| Env vars | `SCREAMING_SNAKE` | `DATABASE_URL` |
| Routes | `kebab-case`, plural nouns | `/api/v1/user-profiles` |
| HTTP methods | REST semantics (below) |  |

### REST Semantics

| Action | Method | Path |
|---|---|---|
| List | GET | `/resources` |
| Create | POST | `/resources` |
| Read one | GET | `/resources/:id` |
| Replace | PUT | `/resources/:id` |
| Partial update | PATCH | `/resources/:id` |
| Delete | DELETE | `/resources/:id` |

### Response Envelope

All responses use a consistent shape:

```jsonc
// Success
{
  "success": true,
  "data": { /* payload */ },
  "meta": { "page": 1, "total": 42 }   // present only on paginated lists
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",         // machine-readable
    "message": "Email is required.",    // human-readable
    "details": [ /* optional */ ]
  }
}
```

---

## Environment & Configuration

All environment variables are validated at startup via Zod inside `src/config/index.ts`. The app **will not start** if required vars are missing.

```typescript
// src/config/index.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
```

Copy `.env.example` to `.env` and fill in values. Never import `process.env` directly anywhere else — always use `config` from this file.

---

## API Documentation (OpenAPI/Swagger)

### Strategy

We use **OpenAPI 3.1** as the single source of truth for the API contract. Schemas are defined once in Zod (for runtime validation) and reused to generate the OpenAPI spec. This means:

- Zero schema drift between validation and docs
- The `docs/openapi.json` file can be fed directly to an LLM, Postman, or any frontend code-generation tool

### Tooling

```bash
npm install zod @asteasolutions/zod-to-openapi swagger-ui-express
```

### Defining a Route with Docs

```typescript
// src/modules/users/users.schema.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const UserParamsSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
}).openapi('User');

export const CreateUserSchema = z.object({
  email: z.string().email().openapi({ example: 'alice@example.com' }),
  name: z.string().min(2).openapi({ example: 'Alice' }),
  password: z.string().min(8),
});
```

```typescript
// src/openapi/registry.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
export const registry = new OpenAPIRegistry();
```

```typescript
// src/modules/users/users.router.ts
import { registry } from '../../openapi/registry';
import { UserParamsSchema, UserResponseSchema, CreateUserSchema } from './users.schema';

// Register the route for OpenAPI
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  tags: ['Users'],
  summary: 'Get a user by ID',
  request: { params: UserParamsSchema },
  responses: {
    200: {
      description: 'User found',
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    404: { description: 'User not found' },
  },
});

// Actual Express route
router.get('/:id', validate({ params: UserParamsSchema }), authenticate, usersController.getById);
```

### Generating the Spec

```typescript
// src/openapi/generator.ts
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import fs from 'node:fs';
import path from 'node:path';

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const spec = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Your API',
      version: '1.0.0',
      description: 'Auto-generated from Zod schemas. Feed this file to LLMs or Postman.',
    },
    servers: [{ url: '/api/v1' }],
  });

  const outputPath = path.resolve('docs/openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI spec written to ${outputPath}`);
  return spec;
}
```

Run generation:
```bash
npx ts-node src/openapi/generator.ts
# or add to package.json scripts:
# "docs:generate": "ts-node src/openapi/generator.ts"
```

### Serving Swagger UI (dev only)

```typescript
// src/openapi/swagger.ts
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { generateOpenAPISpec } from './generator';

export function setupSwagger(app: Express) {
  if (process.env.NODE_ENV === 'production') return;
  const spec = generateOpenAPISpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  console.log('📖 Swagger UI available at http://localhost:3000/api-docs');
}
```

### Sharing docs with an LLM (e.g. for frontend generation)

The generated `docs/openapi.json` is LLM-ready. When connecting a frontend AI agent:

```
Attach docs/openapi.json and say:
"Here is our backend API spec in OpenAPI 3.1 format.
Use it to generate [React Query hooks / fetch client / type-safe SDK]
for the endpoints listed. Base URL is /api/v1."
```

You can also serve it as a raw JSON endpoint:
```typescript
app.get('/api-docs.json', (req, res) => res.json(generateOpenAPISpec()));
```

---

## Code Patterns

### Controller (thin)

```typescript
// src/modules/users/users.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import * as usersService from './users.service';

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
});
```

### Service (business logic)

```typescript
// src/modules/users/users.service.ts
import { HttpError } from '../../lib/httpError';
import * as usersRepository from './users.repository';
import type { CreateUserInput } from './users.schema';

export async function getUserById(id: string) {
  const user = await usersRepository.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await usersRepository.findByEmail(input.email);
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN', 'This email is already registered.');
  const hashedPassword = await hashPassword(input.password);
  return usersRepository.create({ ...input, password: hashedPassword });
}
```

### Repository (DB only)

```typescript
// src/modules/users/users.repository.ts
import { prisma } from '../../config/database';

export const findById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const create = (data: { email: string; name: string; password: string }) =>
  prisma.user.create({ data });
```

### Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { HttpError } from '../lib/httpError';

interface Schemas {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new HttpError(422, 'VALIDATION_ERROR', 'Validation failed.', err.errors);
      }
      next(err);
    }
  };
}
```

### Async Handler

```typescript
// src/lib/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### HttpError

```typescript
// src/lib/httpError.ts
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
```

---

## Error Handling

One global handler in `src/middleware/errorHandler.ts` catches everything:

```typescript
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';
import { logger } from '../lib/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  });
}
```

Register it **last** in `app.ts`:
```typescript
app.use(errorHandler);
```

**Rule:** Never call `res.status(500)` inside a controller or service. Always throw an `HttpError` or let unexpected errors bubble to this handler.

---

## Authentication

- **Access token:** Short-lived JWT (15 min), sent in `Authorization: Bearer <token>` header.
- **Refresh token:** Long-lived (7 days), stored in `httpOnly` cookie.
- Never store tokens in `localStorage` on the frontend.

The `authenticate` middleware verifies the access token and attaches `req.user`:

```typescript
// src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: { id: string; email: string; role: string };
  }
}
```

---

## Database

- All queries go through the Repository layer. Never import `prisma` directly in controllers or services.
- Use transactions for multi-step writes:

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({ where: { id: itemId }, data: { stock: { decrement: 1 } } });
  return order;
});
```

- Run migrations before deploying: `npx prisma migrate deploy`

---

## Testing

- Unit tests: service and repository functions in isolation (mock DB).
- Integration tests: full HTTP round-trips using Supertest against a test DB.

```typescript
// tests/helpers/testApp.ts
import { createApp } from '../../src/app';
export const app = createApp();
```

```typescript
// src/modules/users/users.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../tests/helpers/testApp';

describe('GET /api/v1/users/:id', () => {
  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/v1/users/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });
});
```

Run tests:
```bash
npm test           # run all
npm run test:watch # watch mode
npm run test:cov   # with coverage
```

---

## Running the Project

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run DB migrations
npx prisma migrate dev

# Start development server (with hot reload)
npm run dev

# Generate OpenAPI spec
npm run docs:generate

# Build for production
npm run build

# Start production server
npm start
```

### package.json scripts (reference)

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc --project tsconfig.build.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src",
    "docs:generate": "tsx src/openapi/generator.ts"
  }
}
```

---

## Common Tasks

### Add a new feature module

1. Create `src/modules/<name>/` with: `router`, `controller`, `service`, `repository`, `schema`, `test` files.
2. Register Zod schemas in `schema.ts` with `.openapi()` metadata.
3. Register routes in the OpenAPI `registry` inside the router file.
4. Mount the router in `app.ts`: `app.use('/api/v1/<name>', nameRouter)`.
5. Run `npm run docs:generate` to update `docs/openapi.json`.

### Update API documentation

Schemas and OpenAPI registrations live together in each module. After any schema change:
```bash
npm run docs:generate
```
Commit the updated `docs/openapi.json`. This is the file you share with LLMs or Postman.

### Share the API with a frontend LLM

Attach `docs/openapi.json` to your prompt. Example prompt:
```
Here is our REST API in OpenAPI 3.1 format (attached).
Generate fully-typed React Query v5 hooks for all User and Auth endpoints.
Use axios as the HTTP client. Base URL: /api/v1.
```

---

*Last updated: auto — keep this file in sync with the codebase.*