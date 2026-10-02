import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
test("removed shop architecture, retained business data and secure appointment workflows", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "srilucky-rebuild-"));
  const env = {
    ...process.env,
    PORT: "3099",
    SITE_URL: "http://localhost:3099",
    ADMIN_EMAIL: "test@example.test",
    ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  };
  const setup = spawnSync(
    process.execPath,
    [resolve("server/create-admin.mjs")],
    { cwd, env },
  );
  assert.equal(setup.status, 0, setup.stderr.toString());
  const db = new DatabaseSync(join(cwd, "data/srilucky.db"));
  assert.deepEqual(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      )
      .all()
      .map((x) => x.name),
    ["admins", "appointments", "sessions", "store_settings"],
  );
  db.close();
  const server = spawn(process.execPath, [resolve("server/index.mjs")], {
    cwd,
    env,
    stdio: "ignore",
  });
  let cookie = "";
  async function request(path, method = "GET", body, headers = {}) {
    return fetch("http://localhost:3099/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  try {
    for (let i = 0; i < 50; i++) {
      try {
        await request("/public");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    const pub = await (await request("/public")).json();
    assert.deepEqual(Object.keys(pub).sort(), [
      "services",
      "settings",
      "times",
    ]);
    assert.equal(pub.services.length, 5);
    assert.equal(pub.services[0], "Eye Examination");
    assert.equal((await request("/admin")).status, 401);
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: env.ADMIN_EMAIL,
          password: "incorrect",
        })
      ).status,
      401,
    );
    const login = await request("/auth/login", "POST", {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    });
    assert.equal(login.status, 200);
    assert.match(login.headers.get("set-cookie"), /HttpOnly/);
    cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await request("/admin/products", "POST", {})).status, 404);
    assert.equal((await request("/enquiries", "POST", {})).status, 404);
    const appointment = {
      customer_name: "Integration Visitor",
      phone: "+919876543210",
      service: "Eye Examination",
      date: "2099-10-03",
      time: "11:00",
      message: "A test visit.",
    };
    for (const invalid of [
      { ...appointment, phone: "bad" },
      { ...appointment, date: "2099-02-30" },
      { ...appointment, date: "2000-01-01" },
      { ...appointment, service: "Frame Selection" },
      { ...appointment, time: "25:00" },
      { ...appointment, customer_name: "x" },
    ])
      assert.equal(
        (await request("/appointments", "POST", invalid)).status,
        400,
      );
    const created = await request("/appointments", "POST", appointment);
    assert.equal(created.status, 201);
    const saved = await created.json();
    assert.equal(saved.status, "Pending");
    for (const status of ["Confirmed", "Completed", "Cancelled"])
      assert.equal(
        (await request("/admin/appointments/" + saved.id, "PATCH", { status }))
          .status,
        200,
      );
    assert.equal(
      (
        await request("/admin/appointments/" + saved.id, "PATCH", {
          status: "Invalid",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/admin/appointments/9999", "PATCH", {
          status: "Confirmed",
        })
      ).status,
      404,
    );
    const dashboard = await (await request("/admin")).json();
    assert.deepEqual(Object.keys(dashboard).sort(), [
      "appointments",
      "settings",
    ]);
    assert.equal(
      dashboard.appointments[0].customer_name,
      "Integration Visitor",
    );
    assert.equal(dashboard.appointments[0].status, "Cancelled");
    const settings = {
      business_name: "Sri Lucky Eye Wear & Clinic",
      phone: "+919876543210",
      whatsapp: "+919876543210",
      address: "Test address only",
      hours: "10 am – 6 pm",
      maps_url: "https://maps.app.goo.gl/example",
      instagram: "https://instagram.com/example",
      facebook: "",
      store_image: "",
    };
    assert.equal(
      (await request("/admin/settings", "PATCH", settings)).status,
      200,
    );
    assert.equal(
      (await (await request("/public")).json()).settings.whatsapp,
      settings.whatsapp,
    );
    assert.equal(
      (
        await request("/admin/settings", "PATCH", {
          ...settings,
          maps_url: "javascript:alert(1)",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/admin/settings", "PATCH", settings, {
          Origin: "https://other.example",
        })
      ).status,
      403,
    );
    assert.equal((await fetch("http://localhost:3099/robots.txt")).status, 200);
    assert.ok(
      (
        await (await fetch("http://localhost:3099/sitemap.xml")).text()
      ).includes("<urlset"),
    );
    assert.equal((await request("/auth/logout", "POST")).status, 200);
    assert.equal((await request("/admin")).status, 401);
  } finally {
    server.kill();
    await new Promise((r) => server.once("exit", r));
    rmSync(cwd, { recursive: true, force: true });
  }
});
test("one-time rebuild migration keeps appointments and settings", () => {
  const cwd = mkdtempSync(join(tmpdir(), "srilucky-migrate-"));
  const setup = spawnSync(
    process.execPath,
    [resolve("server/create-admin.mjs")],
    {
      cwd,
      env: {
        ...process.env,
        ADMIN_EMAIL: "test@example.test",
        ADMIN_PASSWORD: randomBytes(24).toString("hex"),
      },
    },
  );
  assert.equal(setup.status, 0);
  const db = new DatabaseSync(join(cwd, "data/srilucky.db"));
  db.exec(
    "PRAGMA user_version=0; CREATE TABLE products(id INTEGER); CREATE TABLE product_images(id INTEGER); CREATE TABLE product_categories(id INTEGER); INSERT INTO appointments(customer_name,phone,service,date,time) VALUES('Preserved','9876543210','Eye Test','2099-10-03','10:00'); UPDATE store_settings SET address='Preserved address' WHERE id=1;",
  );
  db.close();
  assert.equal(
    spawnSync(process.execPath, [resolve("server/db.mjs")], { cwd }).status,
    0,
  );
  const updated = new DatabaseSync(join(cwd, "data/srilucky.db"));
  assert.equal(
    updated.prepare("SELECT customer_name FROM appointments").get()
      .customer_name,
    "Preserved",
  );
  assert.equal(
    updated.prepare("SELECT address FROM store_settings").get().address,
    "Preserved address",
  );
  assert.equal(
    updated
      .prepare("SELECT name FROM sqlite_master WHERE name='products'")
      .get(),
    undefined,
  );
  updated.close();
  rmSync(cwd, { recursive: true, force: true });
});
