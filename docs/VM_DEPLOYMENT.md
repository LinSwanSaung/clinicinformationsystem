# ThriveCare VM Deployment

This setup is for a single GCP VM running:

- Express backend
- PostgreSQL
- Caddy reverse proxy
- Local upload storage mounted as a Docker volume

The Vercel frontend should stay separate and call the VM API through `VITE_API_URL`.

## Current Migration Status

Done:

- Backend has a Dockerfile.
- VM Docker Compose scaffold exists in `deploy/vm`.
- Uploaded documents, clinic logos, and payment QR codes can use VM-local storage through `/uploads`.

Still to migrate:

- The database query layer still uses `@supabase/supabase-js` in many models and repositories.
- `DATABASE_URL` and PostgreSQL are scaffolded, but the backend is not fully switched to direct PostgreSQL yet.

## VM Setup

Install Docker and Compose on the VM:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in after adding your user to the `docker` group.

Clone the repo:

```bash
git clone https://github.com/LinSwanSaung/clinicinformationsystem.git
cd clinicinformationsystem
```

Create the VM env file:

```bash
cp deploy/vm/.env.example deploy/vm/.env
nano deploy/vm/.env
```

Set at least:

- `POSTGRES_PASSWORD`
- `API_HOST`
- `JWT_SECRET`
- `CLIENT_URL`
- `PUBLIC_API_URL`

Start the stack:

```bash
cd deploy/vm
docker compose up -d --build
```

Check the API:

```bash
curl https://your-api-domain.com/health
```

If you do not have a domain yet, use `sslip.io`, which maps the hostname to your VM IP:

```bash
curl https://34.21.133.28.sslip.io/health
```

## Vercel Frontend

Set this environment variable in Vercel:

```bash
VITE_API_URL=https://your-api-domain.com/api
```

Without a purchased domain, use:

```bash
VITE_API_URL=https://34.21.133.28.sslip.io/api
```

Then redeploy the frontend.

## Database Cutover Plan

1. Add a PostgreSQL client using `pg`.
2. Replace `backend/src/config/database.js` with a pool exported from `DATABASE_URL`.
3. Convert `BaseModel` CRUD helpers first.
4. Convert custom repositories and complex nested Supabase selects.
5. Export hosted Supabase data with `pg_dump`.
6. Restore into VM PostgreSQL.
7. Remove `SUPABASE_*` env vars and `@supabase/supabase-js`.
