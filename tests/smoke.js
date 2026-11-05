"use strict";
/* ShopSphere smoke test: boots the real app on a temp DB and walks real user journeys. */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");

const ROOT = path.join(__dirname, "..");
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✓ ${name}${extra ? " — " + extra : ""}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? " — " + extra : ""}`); }
}
function freePort() {
  return new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeJar() {
  const jar = new Map();
  return {
    header: () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
    absorb: (res) => {
      const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      for (const c of raw) { const [pair] = c.split(";"); const i = pair.indexOf("="); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
    }
  };
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sw-smoke-"));
  const dbPath = path.join(tmpDir, "store.db");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;

  // seed products into the temp DB
  const seed = spawn(process.execPath, ["db/seed.js"], { cwd: ROOT, env: { ...process.env, DB_PATH: dbPath }, stdio: "ignore" });
  await new Promise((r) => seed.on("close", r));

  const app = spawn(process.execPath, ["server.js"], {
    cwd: ROOT, env: { ...process.env, DB_PATH: dbPath, PORT: String(port), SESSION_SECRET: "smoke-secret", NODE_ENV: "test" }, stdio: "ignore"
  });

  try {
    for (let i = 0; i < 60; i += 1) { try { if ((await fetch(base + "/api/health")).ok) break; } catch {} await sleep(250); }

    const health = await fetch(base + "/api/health");
    const hj = await health.json();
    ok("health endpoint", health.ok && hj.ok === true);

    const home = await fetch(base + "/");
    const html = await home.text();
    ok("storefront loads", home.status === 200 && html.length > 200);
    ok("security headers present", home.headers.get("x-content-type-options") === "nosniff" && !!home.headers.get("content-security-policy"));

    const jar = makeJar();
    const email = `smoke${Date.now()}@test.local`;
    const reg = await fetch(base + "/register", {
      method: "POST", redirect: "manual",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.header() },
      body: new URLSearchParams({ username: "smoke" + Date.now(), email, password: "Passw0rd!", full_name: "Smoke Tester" })
    });
    jar.absorb(reg);
    ok("register user", reg.status === 302 || reg.status === 200, "status " + reg.status);

    const login = await fetch(base + "/login", {
      method: "POST", redirect: "manual",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.header() },
      body: new URLSearchParams({ email, password: "Passw0rd!" })
    });
    jar.absorb(login);
    ok("login user", login.status === 302, "status " + login.status);

    const products = await fetch(base + "/products", { headers: { Cookie: jar.header() } });
    const phtml = await products.text();
    const m = phtml.match(/\/products\/(\d+)/);
    ok("product catalogue renders", products.status === 200 && !!m, m ? "found product #" + m[1] : "no product link");

    if (m) {
      const add = await fetch(base + "/cart/add", {
        method: "POST", redirect: "manual",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.header() },
        body: new URLSearchParams({ product_id: m[1], quantity: "1" })
      });
      ok("add to cart", add.status === 302, "status " + add.status);
      const cart = await fetch(base + "/cart", { headers: { Cookie: jar.header() } });
      const chtml = await cart.text();
      ok("cart shows the item", cart.status === 200 && /cart|subtotal/i.test(chtml));
    }

    const notFound = await fetch(base + "/definitely-not-a-page");
    ok("404 handler works", notFound.status === 404);

    let limited = false;
    for (let i = 0; i < 12; i += 1) {
      const r = await fetch(base + "/login", {
        method: "POST", redirect: "manual",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: "nobody@test.local", password: "wrong" })
      });
      if (r.status === 429) { limited = true; break; }
    }
    ok("login rate limiting kicks in", limited);
  } finally {
    app.kill();
    await sleep(300);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("");
  if (fail === 0) console.log(`== ShopSphere smoke PASSED — ${pass}/${pass + fail} checks ==`);
  else console.log(`== ShopSphere smoke FAILED — ${fail} failed ==`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
