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
- Backend database calls now go directly to PostgreSQL through `pg`.
- The VM stack no longer runs PostgREST or uses hosted Supabase env vars.

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

If you do not have a domain yet, use the raw VM IP over HTTP:

```bash
curl http://34.21.133.28/health
```

Load demo users:

```bash
cd deploy/vm
docker compose exec -T postgres psql -U thrivecare -d thrivecare < seed-demo-users.sql
```

## Vercel Frontend

Set this environment variable in Vercel:

```bash
VITE_API_URL=https://your-api-domain.com/api
```

Without a purchased domain, keep the frontend on the same Vercel origin and let Vercel proxy `/api` to the VM. The current `vercel.json` forwards:

```text
/api/* -> http://34.21.133.28/api/*
```

In that setup, do not set `VITE_API_URL` in Vercel, or set it to `/api`.

Then redeploy the frontend.

## Database Notes

The backend reads `DATABASE_URL` and connects directly to the `postgres` Docker service.
The old hosted Supabase variables are not needed for the VM deployment.
