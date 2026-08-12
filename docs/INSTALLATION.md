# Installation Guide

This guide walks through installing **Label Creator Pro** on a local machine (Windows, macOS, or Linux).

## Prerequisites

- **Node.js ≥ 18** — download from https://nodejs.org (tested on v22)
- **npm** (bundled with Node.js)

Verify:

```bash
node --version   # v18+
npm --version    # 9+
```

> No separate database installation is needed — the app uses **SQLite** (file-based).

---

## Step 1 — Download / clone the project

```bash
git clone <your-repo-url> barcode
cd barcode
```

Or simply copy the `backend/` and `frontend/` folders into your workspace.

---

## Step 2 — Backend setup

```bash
cd backend
npm install
```

The `postinstall` hook automatically runs:

1. `prisma generate` — generates the Prisma Client
2. `prisma db push` — creates the SQLite file `prisma/dev.db` and all tables
3. `node prisma/seed.js` — seeds:
   - Admin account: **admin / admin123**
   - 12 default settings (company, label size, printer, theme…)
   - 7 service-center categories
   - 1 sample label template (with text + Code128 elements)

If you prefer to run those steps manually:

```bash
cd backend
npm run db:setup          # generate + push + seed
```

### Environment configuration

Create `backend/.env` if it does not exist (a copy is already included in the project):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="label-creator-pro-super-secret-key-change-me-in-production"
PORT=5000
```

> ⚠️ **Change `JWT_SECRET`** to a long random string before any real deployment.

---

## Step 3 — Frontend setup

```bash
cd frontend
npm install
```

No configuration required for local development — the Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000` automatically (see `frontend/vite.config.js`).

---

## Step 4 — Run the application

### Terminal 1 — Backend API

```bash
cd backend
npm run dev        # nodemon — auto-restarts on file changes
```

Expected:

```
🚀 Label Creator Pro API running on http://localhost:5000
   Health check: http://localhost:5000/api/health
```

### Terminal 2 — Frontend SPA

```bash
cd frontend
npm run dev        # Vite dev server
```

Open **http://localhost:5173** in your browser.

---

## Logging in

| Username | Password   | Role                                              |
| -------- | ---------- | ------------------------------------------------- |
| `admin`  | `admin123` | Admin — full access including **User Management** |

> The seed script only creates the admin when the `User` table is empty, so it is safe to re-run.

---

## Verifying the installation

### 1. Health check

Open `http://localhost:5000/api/health` — you should see `{"success":true,...}`.

### 2. Seed verification script

```bash
cd backend
node scripts/verify.js
```

Expected output:

```
✅ Admin user (admin) present
✅ Default template present (Standard Part Label…)
✅ 12 settings present
✅ 7 categories present
```

### 3. API integration tests

With the backend running:

```bash
cd backend
node scripts/test-api.js
```

This runs **27 automated checks** covering auth, role guards, labels, templates, print logging, import, users, and barcode/QR rendering. All should pass.

> The test creates and cleans up its own test records, so your seeded DB stays pristine.

---

## Troubleshooting

| Symptom                                            | Fix                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `PrismaClientInitializationError` on first install | Delete `backend/prisma/dev.db`, then run `npm run db:setup`                                                         |
| Port 5000 already in use                           | Change `PORT` in `backend/.env` and update the proxy target in `frontend/vite.config.js`                            |
| Port 5173 already in use                           | Vite will prompt for an alternative port automatically                                                              |
| Frontend can't reach API                           | Ensure the backend is running; check `vite.config.js` proxy targets `http://localhost:5000`                         |
| Barcode not rendering in browser                   | Use the API endpoint `/api/render/barcode?...` directly to confirm; bwip-js requires a value matching the symbology |
| Changed `JWT_SECRET` after login                   | Tokens signed with the old secret are invalidated — just log in again                                               |

---

## Production build (optional local preview)

```bash
cd frontend
npm run build          # outputs optimized static site to dist/
npm run preview        # serves the build locally
```

For real hosting, see the [Deployment Guide](DEPLOYMENT.md).
