import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const settle = () => page.waitForTimeout(500);
const center = async (id) => {
  await page.evaluate((id) => {
    const s = document.getElementById(id);
    scrollTo({
      top: s.offsetTop + (s.offsetHeight - innerHeight) / 2,
      behavior: "instant",
    });
  }, id);
  await settle();
};
try {
  await page.goto("http://localhost:5173");
  await page.waitForLoadState("networkidle");
  assert.equal(await page.locator("[data-scene]").count(), 9);
  assert.equal(await page.locator("canvas").count(), 0);
  assert.equal(
    await page.locator(".product-card,.product-grid,.tabs,.match-grid").count(),
    0,
  );
  assert.equal(
    await page.locator(".hero-portrait > image").last().getAttribute("href"),
    "/hero-portrait.webp",
  );
  assert.equal(
    await page.locator(".original-rims image").getAttribute("href"),
    "/hero-portrait.webp",
  );
  const frame = await page.locator(".frame-render").elementHandle();
  const openingEnd = await page
    .locator("#home")
    .evaluate((el) => el.offsetHeight - innerHeight);
  const sequence = [];
  for (const fraction of [0, 0.35, 0.7, 1]) {
    await page.evaluate(
      (y) => scrollTo({ top: y, behavior: "instant" }),
      openingEnd * fraction,
    );
    await settle();
    sequence.push(
      await page.locator(".hero-portrait").evaluate((el) => ({
        transform: el.style.transform,
        opacity: Number(el.style.opacity),
      })),
    );
    assert.equal(
      await page
        .locator(".frame-render")
        .evaluate((el) => Number(el.style.opacity)),
      1,
      "The glasses must never fade away during extraction",
    );
    await page.screenshot({ path: `test-results/hero-${fraction}.png` });
  }
  assert.notEqual(sequence[0].transform, sequence[1].transform);
  assert.equal(sequence[0].opacity, 1);
  assert.ok(sequence[2].opacity > 0 && sequence[2].opacity < 1);
  assert.equal(sequence[3].opacity, 0);
  assert.equal(
    await page.locator(".frame-journey").getAttribute("data-material"),
    "1",
  );
  assert.equal(
    await page
      .locator(".original-rims")
      .evaluate((el) => getComputedStyle(el).opacity),
    "0",
  );
  assert.equal(
    await page
      .locator(".detail-rims")
      .evaluate((el) => getComputedStyle(el).opacity),
    "1",
  );
  assert.ok(
    (await page
      .locator(".lens-reflection")
      .evaluate((el) => Number(getComputedStyle(el).opacity))) > 0.3,
  );
  let previous = "";
  for (const id of [
    "story",
    "vision",
    "care",
    "clarity",
    "about",
    "store",
    "visit",
    "focus",
  ]) {
    await center(id);
    assert.equal(
      await page
        .locator(".frame-render")
        .evaluate((el, original) => el === original, frame),
      true,
    );
    const transform = await page
      .locator(".frame-render")
      .evaluate((el) => el.style.transform);
    assert.notEqual(transform, previous);
    previous = transform;
    if (["care", "visit", "focus"].includes(id))
      await page.screenshot({ path: `test-results/${id}.png` });
  }
  assert.equal(await page.locator(".actual-store-image").count(), 0);
  // Verify the visible inline form saves a real appointment request.
  await center("visit");
  const form = page.locator(".inline-booking");
  await form.locator("[name=customer_name]").fill("Browser Rebuild Test");
  await form.locator("[name=phone]").fill("9876543210");
  await form.locator("[name=date]").fill("2099-10-03");
  await form.locator("[name=time]").selectOption("11:00");
  await form
    .getByRole("button", { name: "BOOK EYE TEST", exact: true })
    .click();
  await form.getByRole("heading", { name: "You’re on our list." }).waitFor();
  await center("focus");
  await page
    .getByRole("button", { name: "BOOK AN EYE TEST", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Book your visit" });
  await dialog.waitFor();
  assert.equal(await dialog.locator("form").count(), 1);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  for (const width of [360, 375, 390, 412, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await settle();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${width}`,
    );
    // The calibrated glasses anchor stays within the hero's visible crop.
    const anchor = await page.locator(".hero-portrait").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + (r.width * 1080) / 1586,
        y: r.top + (r.height * 302) / 992,
      };
    });
    assert.ok(anchor.x > 0 && anchor.x < width, `Glasses cropped at ${width}`);
    assert.ok(anchor.y > 90 && anchor.y < 422, `Glasses obscured at ${width}`);
    if (width === 390)
      await page.screenshot({ path: "test-results/mobile.png" });
    for (const id of ["care", "store", "visit", "focus"]) {
      await center(id);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Section overflow ${id} at ${width}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog", { name: "Navigation" })
    .getByRole("button", { name: "Clinic", exact: true })
    .click();
  await settle();
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.locator(".care-services summary").first().click();
  assert.equal(await page.locator(".care-services details[open]").count(), 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await center("vision");
  const still = await page
    .locator(".frame-render")
    .evaluate((el) => el.style.transform);
  await center("focus");
  assert.equal(
    await page.locator(".frame-render").evaluate((el) => el.style.transform),
    still,
  );
  assert.equal(
    await page.locator(".frame-render").evaluate((el) => el.style.opacity),
    "1",
  );
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  await page.goto("http://localhost:5173/admin");
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  assert.equal(await page.locator("input[type=password]").count(), 1);
  const unavailable = await browser.newPage();
  await unavailable.route("**/api/public", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Temporary connection problem" }),
    }),
  );
  await unavailable.goto("http://localhost:5173");
  await unavailable.locator(".header-book").click();
  const unavailableDialog = unavailable.getByRole("dialog");
  await unavailableDialog.getByText("Temporary connection problem").waitFor();
  assert.equal(
    await unavailableDialog
      .getByRole("button", { name: "BOOK EYE TEST", exact: true })
      .isDisabled(),
    true,
  );
  await unavailable.close();
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: portrait zoom/detachment, one persistent black frame, inline booking, nine widths, modal, menu, services, reduced motion, API error state and owner login.",
  );
} finally {
  await browser.close();
}
