# F-Corp-OS Integration Instructions

## Goal

Prepare F-Corp-OS for final project demonstration.

The current working branch is:

integration/hr-report-ready

Never modify, merge into, or push directly to `dev`.

The main focus is completing the HR module and its integration
with PM, Developer, Admin, authentication, permissions, and database.

## Architecture

Frontend:
- React
- TypeScript
- Vite
- Redux Toolkit
- Ant Design
- Axios

Backend:
- NestJS
- TypeORM
- MySQL
- JWT authentication

API prefix:
- /api/v1

## Existing roles

- ADMIN
- HR
- PM
- DEVELOPER

## Critical project rules

1. Preserve existing Admin, PM and Developer functionality.

2. Prefer fixing the existing architecture instead of rewriting modules.

3. Do not replace real backend data with mock data.

4. Remove or replace mock/static HR data when a real API already exists.

5. Server-side authorization must remain enforced.

6. Do not solve permission problems by adding
   @SkipCheckPermission() everywhere.

7. Do not make development-only endpoints public.

8. Do not use TypeORM `synchronize: true`
   as the final database solution.

9. Database setup must eventually be reproducible from a fresh clone.

10. Do not modify unrelated functionality unless required for integration.

## Important HR flows

Trace and preserve these end-to-end flows:

Developer skills
-> HR Talent Management

PM allocation/release
-> Bench / talent visibility

PM performance review
-> HR Review

HR final review
-> Review COMPLETED
-> automatic F-Token reward
-> Wallet transaction history

## Known areas requiring investigation

- HR Dashboard contains static/mock data.
- BenchForecast contains mock data.
- HR permissions may not be fully seeded.
- Several HR Review/Wallet endpoints bypass permissions.
- Review seed endpoint may be publicly accessible.
- PM release review and HR ReviewRecord may be disconnected.
- Database initial migration may not bootstrap a clean DB.
- Refresh token handling may behave differently outside /admin.

These are hypotheses.
Verify them in the code before changing anything.

## Work style

Before editing:
1. inspect relevant files,
2. trace frontend -> API -> controller -> service -> DB,
3. identify dependencies,
4. explain the intended change briefly.

Make small, focused changes.

Do not perform broad refactors unless necessary.

## Validation

After backend modifications:

cd backend
npm run build
npm test -- --runInBand

After frontend modifications:

cd frontend
npm run build

Run lint when useful.

Fix errors caused by your changes.

## Git

Work only on:

integration/hr-report-ready

Before a major change:

git status

Do not:
- force push
- reset dev
- merge to dev
- delete branches

Use logical commits.