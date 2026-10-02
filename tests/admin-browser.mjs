import { chromium } from "playwright";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const cwd = mkdtempSync(join(tmpdir(), "srilucky-owner-"));
const env = {
  ...process.env,
  PORT: "3100",
  SITE_URL: "http://localhost:3100",
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
};
assert.equal(
  spawnSync(process.execPath, [resolve("server/create-admin.mjs")], {
    cwd,
    env,
  }).status,
  0,
);
const server = spawn(process.execPath, [resolve("server/index.mjs")], {
  cwd,
  env,
  stdio: "ignore",
});
let browser;
try {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch("http://localhost:3100/api/public");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  await fetch("http://localhost:3100/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Owner UI Visitor",
      phone: "9876543210",
      service: "Vision Testing",
      date: "2099-10-03",
      time: "11:00",
      message: "UI test",
    }),
  });
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
  });
  await page.goto("http://localhost:3100/admin");
  await page.locator("[name=email]").fill(env.ADMIN_EMAIL);
  await page.locator("[name=password]").fill(env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "SIGN IN", exact: true }).click();
  await page.getByRole("heading", { name: "In focus." }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Eyewear", exact: true }).count(),
    0,
  );
  mkdirSync("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/admin.png" });
  await page.getByRole("button", { name: "Appointments", exact: true }).click();
  for (const value of ["Confirmed", "Completed", "Cancelled"]) {
    await page
      .getByRole("combobox", { name: "Status for Owner UI Visitor" })
      .selectOption(value);
    await page.waitForTimeout(150);
    assert.equal(
      await page
        .getByRole("combobox", { name: "Status for Owner UI Visitor" })
        .inputValue(),
      value,
    );
  }
  await page
    .getByRole("button", { name: "Store settings", exact: true })
    .click();
  await page.locator("[name=phone]").fill("+919876543210");
  await page.locator("[name=whatsapp]").fill("+919876543210");
  await page.locator("[name=address]").fill("Test address, not a real store");
  await page.locator("[name=hours]").fill("10 am to 6 pm");
  await page.locator("[name=maps_url]").fill("https://maps.app.goo.gl/example");
  await page.getByRole("button", { name: "SAVE SETTINGS" }).click();
  await page.getByText("Store settings saved.").waitFor();
  await page.goto("http://localhost:3100");
  await page
    .context()
    .route("https://wa.me/**", (r) =>
      r.fulfill({ status: 200, body: "Link verified" }),
    );
  await page
    .locator("#focus")
    .getByRole("button", { name: "WHATSAPP US", exact: true })
    .scrollIntoViewIfNeeded();
  const popupPromise = page.waitForEvent("popup");
  await page
    .locator("#focus")
    .getByRole("button", { name: "WHATSAPP US", exact: true })
    .click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert.ok(popup.url().includes("wa.me/919876543210"));
  assert.ok(
    decodeURIComponent(popup.url()).includes(
      "I would like to book an eye test.",
    ),
  );
  await popup.close();
  await page.goto("http://localhost:3100/admin");
  await page.getByRole("button", { name: "SIGN OUT", exact: true }).click();
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  console.log(
    "Owner checks passed: login, status updates, central settings, generated WhatsApp message and logout.",
  );
} finally {
  await browser?.close();
  server.kill();
  await new Promise((r) => server.once("exit", r));
  rmSync(cwd, { recursive: true, force: true });
}
