/* eslint-disable no-console */
const API = "http://localhost:5000/api";

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 200);
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  const results = [];
  const log = (name, status, extra = "", expectError = false) => {
    const pass = expectError ? status >= 400 : status >= 200 && status < 400;
    results.push({ name, status, pass });
    console.log(
      `${pass ? "✅" : "❌"} ${name} → ${status} ${extra ? `(${extra})` : ""}${expectError ? " [expected error]" : ""}`,
    );
  };

  // Health
  const health = await req("GET", "/health");
  log("GET /health", health.status);

  // Login
  const login = await req("POST", "/auth/login", {
    username: "admin",
    password: "admin123",
  });
  log("POST /auth/login", login.status);
  const token = login.data?.data?.token;

  if (!token) {
    console.log("❌ No token — aborting");
    process.exit(1);
  }

  // Auth me
  const me = await req("GET", "/auth/me", null, token);
  log("GET /auth/me", me.status, me.data?.data?.username);

  // Wrong password
  const bad = await req("POST", "/auth/login", {
    username: "admin",
    password: "wrong",
  });
  log("POST /auth/login (bad pw, expect 401)", bad.status, "", true);

  // Settings
  const settings = await req("GET", "/settings", null, token);
  log(
    "GET /settings",
    settings.status,
    `${Object.keys(settings.data?.data || {}).length} keys`,
  );

  // Settings export
  const exportRes = await req("GET", "/settings/export", null, token);
  log("GET /settings/export", exportRes.status);
  const expData = exportRes.data?.data;
  if (expData) {
    console.log(
      `   export contains: labels=${expData.labels.length} templates=${expData.templates.length} users=${expData.users.length}`,
    );
  }

  // Categories
  const cats = await req("GET", "/categories", null, token);
  log("GET /categories", cats.status, `${cats.data?.data?.length} cats`);

  // Templates
  const templates = await req("GET", "/templates", null, token);
  log(
    "GET /templates",
    templates.status,
    `${templates.data?.data?.length} templates`,
  );

  const defTpl = await req("GET", "/templates/default", null, token);
  log("GET /templates/default", defTpl.status);
  const defaultTemplate = defTpl.data?.data;
  const templateId = defaultTemplate?.id;

  if (templateId) {
    const tplEls = JSON.parse(defaultTemplate.elements || "[]");
    console.log(
      `   default template elements: ${tplEls.map((e) => e.type).join(", ")}`,
    );
  }

  // Create label
  const newLabel = await req(
    "POST",
    "/labels",
    {
      name: "Test Label",
      width: 50,
      height: 25,
      background: "#ffffff",
      elements: [
        {
          id: "el-1",
          type: "text",
          x: 5,
          y: 5,
          width: 20,
          height: 5,
          text: "{{model}}",
          fontSize: 8,
        },
        {
          id: "el-2",
          type: "barcode",
          x: 5,
          y: 15,
          width: 40,
          height: 8,
          value: "{{partNumber}}",
          bcid: "code128",
        },
      ],
      data: { model: "iPhone 13", partNumber: "IP13-SCR" },
    },
    token,
  );
  log("POST /labels", newLabel.status);
  const labelId = newLabel.data?.data?.id;

  // List labels
  const labels = await req("GET", "/labels", null, token);
  log("GET /labels", labels.status, `${labels.data?.data?.length} labels`);

  // Recent
  const recent = await req("GET", "/labels/recent", null, token);
  log("GET /labels/recent", recent.status);

  if (labelId) {
    const one = await req("GET", `/labels/${labelId}`, null, token);
    log("GET /labels/:id", one.status);
  }

  // Update label
  if (labelId) {
    const upd = await req(
      "PUT",
      `/labels/${labelId}`,
      { name: "Test Label Updated", width: 60, height: 30 },
      token,
    );
    log("PUT /labels/:id", upd.status);
  }

  // Print log
  const printLog = await req(
    "POST",
    "/prints/log",
    {
      labelId: labelId || null,
      labelName: "Test Label",
      copies: 2,
      printerType: "thermal",
      status: "completed",
      format: "pdf",
      count: 2,
    },
    token,
  );
  log("POST /prints/log", printLog.status);

  // Prints list
  const prints = await req("GET", "/prints", null, token);
  log("GET /prints", prints.status, `${prints.data?.data?.length} records`);

  // Prints stats
  const stats = await req("GET", "/prints/stats", null, token);
  log("GET /prints/stats", stats.status);
  console.log(
    `   stats: totalPrints=${stats.data?.data?.totalPrints} today=${stats.data?.data?.todayPrints}`,
  );

  // Import labels
  const imp = await req(
    "POST",
    "/import/labels",
    {
      rows: [
        { model: "iPhone 14", partNumber: "IP14-BAT", name: "BAT IP14" },
        { model: "iPhone 15", partNumber: "IP15-LCD", name: "LCD IP15" },
      ],
      map: { model: "model", partNumber: "partNumber", name: "name" },
      width: 50,
      height: 25,
      elements: [],
    },
    token,
  );
  log("POST /import/labels", imp.status, `created=${imp.data?.data?.count}`);

  // Render barcode
  const bc = await fetch(
    `${API}/render/barcode?value=IP13-SCR&bcid=code128&heightmm=10&scale=2&includetext=true`,
  );
  log(
    "GET /render/barcode",
    bc.status,
    `${bc.headers.get("content-type")} (${(await bc.arrayBuffer()).byteLength} bytes)`,
  );

  // Render QR
  const qr = await fetch(
    `${API}/render/qr?value=IP13-SCR&errorLevel=M&size=200`,
  );
  log(
    "GET /render/qr",
    qr.status,
    `${qr.headers.get("content-type")} (${(await qr.arrayBuffer()).byteLength} bytes)`,
  );

  // Users (admin)
  const users = await req("GET", "/users", null, token);
  log("GET /users", users.status, `${users.data?.data?.length} users`);

  // Create user
  const newUser = await req(
    "POST",
    "/users",
    {
      username: "staff1",
      password: "staff123",
      fullName: "Staff One",
      role: "staff",
      email: "staff1@test.com",
    },
    token,
  );
  log("POST /users", newUser.status);
  const userId = newUser.data?.data?.id;

  // Update user
  if (userId) {
    const updUser = await req(
      "PUT",
      `/users/${userId}`,
      { role: "staff", isActive: true },
      token,
    );
    log("PUT /users/:id", updUser.status);
  }

  // Staff login
  const staffLogin = await req("POST", "/auth/login", {
    username: "staff1",
    password: "staff123",
  });
  log("POST /auth/login (staff)", staffLogin.status);
  const staffToken = staffLogin.data?.data?.token;

  if (staffToken) {
    // Staff should NOT access /users (403)
    const staffUsers = await req("GET", "/users", null, staffToken);
    log("GET /users as staff (expect 403)", staffUsers.status, "", true);
  }

  // Delete test user (cleanup)
  if (userId) {
    const delUser = await req("DELETE", `/users/${userId}`, null, token);
    log("DELETE /users/:id", delUser.status);
  }

  // Delete test label (cleanup)
  if (labelId) {
    const delLabel = await req("DELETE", `/labels/${labelId}`, null, token);
    log("DELETE /labels/:id", delLabel.status);
  }

  const failed = results.filter((r) => !r.pass);
  console.log("\n=== SUMMARY ===");
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log(
      "Failed:",
      failed.map((f) => `${f.name} (${f.status})`).join(", "),
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
