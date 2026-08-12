# Label Creator Pro — REST API Reference

Base URL (local): `http://localhost:5000/api`
Production: set your backend URL and point the frontend proxy/API base accordingly.

## Authentication

All endpoints except `POST /auth/login` and `GET /health` require a **Bearer token**:

```
Authorization: Bearer <JWT>
```

The token is returned by `POST /api/auth/login` (field `data.token`). Default lifetime is **1 day**.

### Error format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "path": "body.width", "message": "Invalid input" }]
  }
}
```

Common codes: `VALIDATION_ERROR` (422), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `UNIQUE_CONSTRAINT` (400), `INTERNAL_ERROR` (500).

---

## Auth

### `POST /api/auth/login`

Authenticate and receive a JWT.

```json
{ "username": "admin", "password": "admin123" }
```

**200**

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "…",
      "username": "admin",
      "role": "admin",
      "fullName": "Administrator"
    }
  }
}
```

**401** — invalid credentials.

### `GET /api/auth/me`

Returns the current authenticated user.

### `PUT /api/auth/password`

Change the current user's password.

```json
{ "currentPassword": "admin123", "newPassword": "newpass123" }
```

---

## Users (Admin only)

### `GET /api/users`

List all users. Fields `password` are never returned.

### `POST /api/users`

```json
{
  "username": "staff1",
  "password": "staff123",
  "fullName": "Staff One",
  "role": "staff",
  "email": "staff1@example.com",
  "phone": "+1 555…",
  "isActive": true
}
```

`role` ∈ `admin | staff`.

### `PUT /api/users/:id`

Partially update: `fullName`, `role`, `email`, `phone`, `isActive`, `password` (optional reset). Paswwords re-hashed with bcrypt.

### `DELETE /api/users/:id`

Deactivate-by-delete (hard delete in DB). Cannot delete yourself.

---

## Labels

### `GET /api/labels`

List labels (newest first). Returns `{ success, data: [...], count }`.

### `POST /api/labels`

```json
{
  "name": "iPhone 13 Screen",
  "width": 50,
  "height": 25,
  "background": "#ffffff",
  "elements": [],
  "data": { "model": "iPhone 13", "partNumber": "IP13-SCR" },
  "settings": { "gridSize": 1, "snapToGrid": true, "showRulers": true }
}
```

`elements`, `data`, and `settings` are stored as JSON strings. `width` 20–200mm, `height` 10–150mm. `settings` persists canvas preferences (grid, snap, rulers, auto-layout toggle, zoom).

### `GET /api/labels/:id`

Fetch one label (parsed `elements`/`data` JSON included).

### `PUT /api/labels/:id`

Update any subset of label fields.

### `DELETE /api/labels/:id`

Delete a label (also removes its `RecentLabel` rows via cascade).

### `GET /api/labels/recent`

Recently opened labels for the current user.

### `POST /api/labels/:id/recent`

Mark a label as recently opened by the current user.

---

## Templates

### `GET /api/templates`

List templates.

### `POST /api/templates`

```json
{
  "name": "Standard 50x25",
  "description": "Default",
  "width": 50,
  "height": 25,
  "background": "#ffffff",
  "elements": [],
  "data": { "model": "iPhone 13", "partNumber": "IP13-SCR" },
  "settings": {
    "gridSize": 1,
    "snapToGrid": true,
    "showRulers": true,
    "autoLayout": true
  },
  "isDefault": false
}
```

`elements`, `data`, and `settings` are stored as JSON strings. Templates persist the **complete layout** — element properties, positions, fonts, colors, bindings, z-order, plus canvas settings — so clicking a template reloads the exact design.

### `GET /api/templates/:id`

Fetch one template (parsed `elements`/`data`/`settings` JSON included).

### `GET /api/templates/default`

Get the default template (falls back to first template). Used by the Designer when creating a new label.

### `POST /api/templates/:id/duplicate`

Duplicates a template as `"<name> (Copy)"`, preserving `elements`, `data`, and `settings`.

### `PUT /api/templates/:id`

Update template. Setting `isDefault: true` clears the default flag on all others.

### `DELETE /api/templates/:id`

Delete a template (reassigns default if it was the default).

---

## Print History

### `POST /api/prints/log`

Log a print job.

```json
{
  "labelId": "…optional…",
  "labelName": "iPhone 13 Screen ×2",
  "copies": 2,
  "printerType": "thermal",
  "status": "completed",
  "format": "pdf",
  "count": 2,
  "details": "optional JSON string"
}
```

### `GET /api/prints`

List print records. Supports `?search=` and `?printerType=` filters, newest first.

### `GET /api/prints/stats`

```json
{
  "success": true,
  "data": {
    "totalPrints": 42,
    "todayPrints": 5,
    "recent": [
      {
        "id": "…",
        "labelName": "…",
        "copies": 1,
        "printerType": "thermal",
        "createdAt": "…"
      }
    ]
  }
}
```

---

## Settings

### `GET /api/settings`

Returns settings as a flat object e.g. `{ defaultWidth: "50", defaultHeight: "25", companyName: "…", theme: "light", … }`.

### `PUT /api/settings`

```json
{
  "companyName": "iTech Service Center",
  "defaultWidth": "50",
  "defaultHeight": "25",
  "defaultPrinter": "thermal",
  "theme": "light"
}
```

Merges provided keys. Returns the full updated settings object.

### `GET /api/settings/export`

Full data export (JSON) for backup/migration:

```json
{
  "success": true,
  "data": {
    "settings": { … },
    "users": [{ …no passwords… }],
    "labels": [ … ],
    "templates": [ … ],
    "categories": [ … ],
    "printHistory": [ … ]
  }
}
```

---

## Categories

### `GET /api/categories`

List categories.

### `POST /api/categories`

```json
{ "name": "Camera", "color": "#ff9f0a" }
```

### `PUT /api/categories/:id`

Update name/color.

### `DELETE /api/categories/:id`

Delete a category.

---

## Import

### `POST /api/import/labels`

Bulk-create labels from rows using a field map.

```json
{
  "rows": [
    { "model": "iPhone 14", "partNumber": "IP14-BAT", "name": "BAT IP14" }
  ],
  "map": { "model": "model", "partNumber": "partNumber", "name": "name" },
  "nameColumn": "name",
  "width": 50,
  "height": 25,
  "elements": []
}
```

**201**

```json
{ "success": true, "data": { "created": 2, "count": 2 } }
```

Supported field keys: `model, product, quality, color, partNumber, warranty, description, category, supplier, batchNumber, price, stock`.

### `POST /api/import/parse` (multipart)

Upload a file (`form-data`, field name `file`) — `.csv`, `.xlsx`, `.xls`, `.json`.

```json
{ "success": true, "data": { "columns": ["model","partNumber"], "rows": [ … ], "count": 37 } }
```

---

## Render (Barcode / QR)

### `GET /api/render/barcode?value=IP13&bcid=code128&heightmm=10&scale=2&includetext=true`

Returns a **PNG** image (Content-Type `image/png`).

- `bcid` — default `code128` (any [bwip-js symbol](https://github.com/metafloor/bwip-js/wiki) e.g. `code39`, `ean13`)
- `heightmm`, `scale`, `includetext`, `textxalign`, `textyalign`, `barcolor`, `backgroundcolor`

Errors (invalid value/bcid) → `400` with a helpful message.

### `GET /api/render/qr?value=IP13&errorLevel=M&size=300`

Returns a **PNG** QR code (Content-Type `image/png`).

- `errorLevel` — `L | M | Q | H`
- `margin` — quiet zone modules (default 2)
- `dark` / `light` — module/background colors as hex (e.g. `%23000000`)

---

## Health

### `GET /api/health`

```json
{
  "success": true,
  "message": "Label Creator Pro API is running",
  "timestamp": "…"
}
```

---

## Response envelope

Successful responses use `{ success: true, data: … }`. List endpoints also include `count`. Errors always use the `{ success: false, error }` shape.
