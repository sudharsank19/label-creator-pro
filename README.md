<<<<<<< HEAD
# 🏷️ Label Creator Pro

**Complete label design, barcode/QR generation, batch import, and printing solution for iPhone Spare Parts & Service Centers.**

Built with a modern, Apple-inspired UI. Design labels visually with drag-and-drop, populate them from CSV/Excel/JSON, print to thermal/laser/inkjet printers, and track everything in history.

---

## ✨ Features

| Module             | Description                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Label Designer** | Drag-and-drop canvas, 50×25mm default, custom 20–200mm × 10–150mm, live preview, snap-to-grid, mm rulers, zoom 50–200%, undo/redo, duplicate/delete, keyboard shortcuts, alignment guides, rotation   |
| **Auto Layout**    | Smart default layout auto-generates all 12 fields from live data; custom layout takes over when you place manual elements                                                                             |
| **Field Palette**  | Per-field "+" drops draggable bound elements; live data entry; multiple instances of the same field allowed                                                                                           |
| **Elements**       | Text, Code128 Barcode, QR, Rectangle, Circle, Line, Image, Company Logo, Date, Time, and 12 dynamic fields                                                                                            |
| **Dynamic Fields** | Model, Product, Quality, Color, Part Number, Warranty, Description, Category, Supplier, Batch Number, Price, Stock — every placed element stays linked; value changes update all linked elements live |
| **Property Panel** | Full element editing: x/y/width/height/rotation, font family/size/weight, letter-spacing/line-height, text/bg/border colors, radius, padding/margin, align, opacity, lock, visibility                 |
| **Layers Panel**   | Layer list with visibility toggle and bring forward/send backward z-order                                                                                                                             |
| **Templates**      | Save the complete layout (elements, positions, fonts, colors, grid settings, bindings, z-order) — appears instantly with live thumbnail + metadata; click to reload exact design                      |
| **Batch Import**   | CSV, Excel (XLSX/XLS), JSON — field auto-mapping, row preview, bulk save & bulk print                                                                                                                 |
| **Print Preview**  | Exact-mm preview, copies, thermal/laser/inkjet modes, calibration offsets                                                                                                                             |
| **Print History**  | Searchable log with reprint stats (total/today)                                                                                                                                                       |
| **Export**         | PNG, JPEG, PDF, SVG, plus CSV/JSON data export                                                                                                                                                        |
| **Users & Roles**  | Admin / Staff with JWT authentication and role-based access                                                                                                                                           |
| **Settings**       | Company profile, label defaults, printer config, theme                                                                                                                                                |

---

## 🧱 Tech Stack

**Frontend**

- React 18 + Vite 5
- Tailwind CSS 3
- React Router 6, React Hook Form, React Context, Lucide Icons

**Backend**

- Node.js + Express
- Prisma ORM + SQLite
- JWT (`jsonwebtoken`) + bcrypt password hashing
- `bwip-js` (Code128 rendering), `qrcode` (QR generation)

**Frontend libraries**

- `bwip-js`, `qrcode`, `xlsx`, `papaparse`, `html2canvas`, `html-to-image`, `jsPDF`

**Deployment**

- Frontend → Vercel
- Backend → Render

---

## 📁 Folder Structure

```
barcode/
├── backend/                  # Express + Prisma + SQLite API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (6 models)
│   │   └── seed.js           # Seeds admin, settings, categories, template
│   ├── scripts/
│   │   ├── verify.js         # DB seed verification
│   │   ├── test-api.js       # Full API integration test suite (27 checks)
│   │   └── cleanup-test-data.js
│   ├── src/
│   │   ├── app.js            # Express app wiring
│   │   ├── server.js         # Entry point
│   │   ├── lib/              # prisma, jwt, errors, validate
│   │   ├── middleware/       # auth (JWT), role guard, error handler
│   │   └── routes/           # auth, users, labels, templates, prints,
│   │                         # settings, categories, import, render
│   ├── .env / .env.example
│   └── package.json
│
├── frontend/                 # React + Vite + Tailwind SPA
│   ├── src/
│   │   ├── api/client.js     # Fetch wrapper with JWT handling
│   │   ├── components/       # Layout + UI kit (Button, Input, Modal, …)
│   │   ├── context/          # Auth, Theme, Toast, Data
│   │   ├── designer/         # elementUtils, elementRenderer
│   │   ├── pages/            # Login, Dashboard, Designer, Templates,
│   │   │                     # BatchImport, PrintPreview, PrintHistory,
│   │   │                     # Settings, Users
│   │   └── utils/            # constants, format, exportUtils
│   ├── index.html
│   ├── vite.config.js        # Dev proxy → localhost:5000
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js ≥ 18** (tested on v22)
- **npm ≥ 9**

### 1. Backend

```bash
cd backend
npm install        # generates Prisma client, pushes schema, seeds DB automatically
npm run dev        # starts API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # starts SPA on http://localhost:5173
# (npm start also works — identical behavior)
```

Open **http://localhost:5173** and log in with:

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| `admin`  | `admin123` | Admin |

> **Backend auto-seeds** the admin user, default settings, categories, and a sample template whenever the `User` table is empty.

---

## 🔐 Authentication

- JWT bearer tokens returned by `POST /api/auth/login`
- Passwords hashed with **bcrypt** (cost factor 10) — never stored in plaintext
- Roles: **`admin`** (full access incl. user management) and **`staff`** (all label features)
- Token expiry: 1 day (configurable via `JWT_SECRET`/env)

---

## 📚 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide (Vercel + Render)](docs/DEPLOYMENT.md)
- [REST API Reference](docs/API.md)
- [Label Designer Guide](docs/DESIGNER_GUIDE.md)

---

## 🧪 Testing

Run the backend API integration suite (requires backend running on port 5000):

```bash
cd backend
node scripts/test-api.js
```

This exercises auth (login, bad password, role guard), settings (get/export), categories, templates, labels (CRUD), print logging/stats, batch import, users CRUD, and barcode/QR rendering — **27/27 checks**.

Verify the seed state with:

```bash
cd backend
node scripts/verify.js
```

---

## 🌍 Environment Variables

See `backend/.env.example`:

| Variable       | Default         | Purpose                                     |
| -------------- | --------------- | ------------------------------------------- |
| `DATABASE_URL` | `file:./dev.db` | SQLite file path (relative to `prisma/`)    |
| `JWT_SECRET`   | dev secret      | Signs JWT tokens — **change in production** |
| `PORT`         | `5000`          | API listen port                             |

---

## ⚠️ Notes

- The DB file `backend/prisma/dev.db` and `node_modules/` are git-ignored.
- The `postinstall` hook in the backend runs `prisma generate && prisma db push && node prisma/seed.js` automatically — so `npm install` is all you need.
- Switching to PostgreSQL/MySQL for scale only requires updating `DATABASE_URL` and `schema.prisma` provider (Prisma models are portable).

---

MIT © Label Creator Pro
=======
# label-creator-pro
>>>>>>> f000745cdc85da9e0f03de762d7fe4c79a094c32
