# Deployment Guide

Deploy the **backend** to **Render** and the **frontend** to **Vercel**.

---

## Part A — Backend on Render

### 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Label Creator Pro"
git remote add origin https://github.com/<user>/label-creator-pro.git
git push -u origin main
```

### 2. Create a Web Service on Render

1. Go to https://dashboard.render.com → **New +** → **Web Service**
2. Connect your repo
3. Settings:
   - **Name**: `label-creator-pro-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3. Add environment variables

| Key            | Value                                            |
| -------------- | ------------------------------------------------ |
| `DATABASE_URL` | `file:./dev.db`                                  |
| `JWT_SECRET`   | `<long random string from a password generator>` |
| `PORT`         | `5000`                                           |

> ⚠️ **Render's filesystem is ephemeral** — the SQLite `dev.db` is deleted on each deploy/restart. For a persistent free-tier DB, use **Render's free Postgres** (or SQLite-backed options like Turso/LiteFS) and update `DATABASE_URL` + `schema.prisma` provider accordingly. The app is Prisma-portable, so swapping providers only requires `prisma db push` (or `prisma migrate deploy`) on deploy.

### 4. Deploy

Render automatically builds and starts the service. Once the logs show `🚀 Label Creator Pro API running`, verify:

```
https://<your-service>.onrender.com/api/health
```

Runtime script note: `backend/package.json` `start` runs `node src/server.js`.

---

## Part B — Frontend on Vercel

### 1. Configure the API base URL

The frontend `src/api/client.js` uses a relative base (`/api`). In production you must point it at your Render URL.

Set an env var in `frontend/.env.production`:

```env
VITE_API_BASE=https://<your-service>.onrender.com
```

And update `frontend/src/api/client.js`:

```js
const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "") + "/api";
```

> This keeps local dev unchanged (empty `VITE_API_BASE` → `/api` → Vite proxy).

### 2. Push to GitHub and import to Vercel

1. Go to https://vercel.com/new
2. Import the repo
3. **Root Directory**: `frontend`
4. Framework preset: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist` (auto-detected)
7. Add env var `VITE_API_BASE` = your Render URL
8. **Deploy**

### 3. CORS

The backend already enables CORS for all origins (`cors({ origin: true })`) so requests from your Vercel domain are accepted.

---

## Part C — Database migrations (production schema updates)

The seed uses `prisma db push` for simplicity in local dev. For production:

```bash
cd backend
npx prisma migrate dev --name init   # creates SQL migration files
```

After changing `schema.prisma`:

```bash
npx prisma migrate deploy            # applies pending migrations in production
```

Update the Render build command to run `npm install && npx prisma migrate deploy && npm run db:seed`.

---

## Part D — Post-deploy checks

| Check                 | How                                                        |
| --------------------- | ---------------------------------------------------------- |
| API healthy           | `GET /api/health` → `200`                                  |
| Login works           | `POST /api/auth/login` with `admin/admin123`               |
| Barcode renders       | `GET /api/render/barcode?value=TEST123&bcid=code128` → PNG |
| QR renders            | `GET /api/render/qr?value=TEST123&errorLevel=M` → PNG      |
| Frontend loads        | Visit Vercel URL → login page appears                      |
| Auth works end-to-end | Log in, open Dashboard, Designer, print preview            |

---

## Security checklist

- [ ] `JWT_SECRET` is a long random value (≥ 32 chars) and not committed
- [ ] Default `admin/admin123` password **changed** after first login (Settings → change password, or update via API)
- [ ] `DATABASE_URL` uses a persistent database for production
- [ ] HTTPS enabled (default on Render/Vercel)
- [ ] Only Admins can access `/api/users` (enforced server-side)
