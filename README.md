# F-Corp-OS local setup

## Prerequisites

- Node.js and npm
- MySQL-compatible server (the local validation environment uses XAMPP MariaDB 10.4)
- An empty, dedicated database for this application

Never point migration or reset commands at a shared or production database.
TypeORM schema synchronization remains disabled; schema changes are applied only
through migrations.

## Backend bootstrap

Install the locked dependencies:

```powershell
cd backend
npm ci
```

Create `backend/.env` from `backend/.env.example` and configure at least:

```dotenv
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=f_corp_os_codex_test
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_TYPE=mysql
TYPEORM_MIGRATIONS_RUN=false

PORT=8080
JWT_SECRET_KEY=<local-secret>
JWT_EXPIRATION_TIME=15m
JWT_REFRESH_SECRET_KEY=<different-local-secret>
JWT_REFRESH_EXPIRATION_TIME=7d

INIT_DATABASE=true
INIT_PASSWORD=<optional-demo-user-password>
```

Keep `.env` local. It is ignored by Git. An empty `DATABASE_PASSWORD` is valid
for a local XAMPP installation configured without a password.

Create the dedicated database with the configured MySQL account. The exact SQL
used during validation was:

```sql
CREATE DATABASE `f_corp_os_codex_test`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Apply every pending migration:

```powershell
npm run migration:run
npm run migration:show
```

Start the backend to initialize the permission catalog and core role mappings:

```powershell
npm run start
```

Initialization is idempotent while `INIT_DATABASE=true`: missing permissions and
roles are added, and role assignments are reconciled without duplicates. If
`INIT_PASSWORD` is empty, the `ADMIN`, `HR`, `PM`, and `DEVELOPER` roles are still
initialized but demo users are not created. When it is non-empty, the following
missing local demo accounts are created without exposing their password through
the API:

- `admin@gmail.com`
- `hr@gmail.com`
- `pm@gmail.com`
- `developer@gmail.com`

After initialization, `INIT_DATABASE` may be set to `false`; leaving it enabled
is safe and rechecks the deterministic role/permission state at startup.

Build the backend with:

```powershell
npm run build
```

## Frontend bootstrap

In a second terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The default frontend environment points to `http://localhost:8080/api/v1`.
Build the production bundle with:

```powershell
npm run build
```

## Verified clean-database sequence

The integration validation used this sequence against the dedicated
`f_corp_os_codex_test` database:

1. Drop and recreate only `f_corp_os_codex_test`.
2. Run `npm run migration:run` from `backend`.
3. Run the Nest initialization path with `INIT_DATABASE=true`.
4. Run initialization a second time and verify permission, role, and demo-user
   counts remain unchanged.
5. Run `npm run migration:show` and confirm all migrations are applied.

The baseline migration refuses to run over an ambiguous partial application
schema. Use a fresh dedicated database or repair the legacy baseline first.
