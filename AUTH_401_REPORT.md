# AUTH 401 Report

Branch: `refactor/stage-4-components` (frontend) + current backend

## 1) Repro & Collection (last observed 401s)

From browser console screenshots and local repro:

- GET `/api/users?role=nurse` → 401 (Unauthorized)
- GET `/api/notifications/unread-count` → 401
- GET `/api/prescriptions/visit/:visitId` → 401
- GET `/api/doctor-notes/patient/:patientId` → 401/403 (varied during fixes)

Request headers (redacted):

- `Authorization: Bearer <JWT>` present in most calls; some calls were made during cold state with no `authToken` set.
- In dev, some calls contained the fallback `test-token` (before guard was added).

Responses:

- `{"message":"Authentication required"}` or `{"message":"Invalid token"}` from middleware.

## 2) Client Header Audit

Source of truth: `frontend/src/services/api.js` (custom fetch wrapper).

- Always attaches `Authorization: Bearer <localStorage.authToken>`.
- Previously auto-set `Bearer test-token` in dev if no token. This is now behind `VITE_USE_DEV_TOKEN=true` and optional `VITE_DEV_ROLE` (adds `X-Dev-Role`).
- No other fetch/axios clients found; most pages use this wrapper.

Changes made (diff summary):

- Guard dev token behind env; add optional `X-Dev-Role` only when dev token in use.

## 3) Token Inspection

Findings:

- Frontend stores `authToken` from our login flow (API-issued JWT). Some sessions used a Supabase access token instead.
- Backend expected app-issued JWT signed by `JWT_SECRET`. Supabase tokens are signed by Supabase secret. If a Supabase token is sent, verification failed.

Fix:

- Backend auth now attempts verification with app JWT secret; if it fails and `SUPABASE_JWT_SECRET` is provided, it verifies with that secret. It then resolves the user by `decoded.userId || decoded.sub`.

## 4) Route Policy Matrix (selected)

| Method | Path                                 | Authorization roles         | Auth middleware |
| -----: | ------------------------------------ | --------------------------- | --------------- |
|    GET | /api/users                           | varies (in user.routes)     | authenticate    |
|    GET | /api/notifications/unread-count      | authenticated user          | authenticate    |
|    GET | /api/prescriptions/visit/:visitId    | doctor, nurse, receptionist | authenticate    |
|    GET | /api/doctor-notes/patient/:patientId | doctor, nurse, receptionist | authenticate    |
|   POST | /api/doctor-notes                    | doctor                      | authenticate    |

Fixes:

- `/api/doctor-notes/*` and `/api/prescriptions/*` are now wrapped with `authenticate` in `backend/src/app.js`.
- `authorize([...])` usage corrected to `authorize('role1','role2')` so role checks work.

## 5) Server Verification / Config

- JWT verify now supports:
  - `JWT_SECRET` (app-issued tokens)
  - `SUPABASE_JWT_SECRET` (Supabase tokens)
- Dev token bypass only when `NODE_ENV!=production` and `USE_DEV_TOKEN=true`.
- No change to RLS or roles; only wiring/config.

## 6) Proposed & Implemented Minimal Fixes

- Frontend
  - Centralized fetch wrapper updated to guard dev token and avoid accidental `X-Dev-Role` in normal runs.
- Backend
  - Added `authenticate` to prescriptions and doctor-notes routes.
  - Corrected `authorize` calls to rest args.
  - Auth middleware verifies app or Supabase JWT; maps `decoded.sub` to `users.id`.
  - Dev bypass behind `USE_DEV_TOKEN=true` only.

## Manual QA

1. Login as doctor → hit: users list, notifications, patients list, prescriptions/visit, doctor-notes (GET/POST). Expect 200 for permitted, 403 for forbidden.
2. Login as nurse → hit: users list (if allowed), notifications, patients list, prescriptions/visit, doctor-notes (GET). Expect 200 for permitted, 403 for forbidden actions.
3. Logout → all endpoints return 401. Confirm Authorization header is present in logged-in flows and no `X-Dev-Role` unless `VITE_USE_DEV_TOKEN=true`.
