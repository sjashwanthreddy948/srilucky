import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch();
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto("http://localhost:5173");
    const end = await page
      .locator("#home")
      .evaluate((el) => el.offsetHeight - innerHeight);
    const states = [];
    for (const fraction of [0, 0.4, 0.65, 1]) {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        end * fraction,
      );
      await page.waitForTimeout(550);
      const state = await page
        .locator(".frame-render")
        .evaluate((el) => ({
          width: el.getBoundingClientRect().width,
          opacity: Number(el.style.opacity),
          detail: Number(el.style.getPropertyValue("--frame-detail")),
        }));
      assert.equal(state.opacity, 1);
      states.push(state);
    }
    assert.ok(states[1].width > states[0].width * 1.5);
    assert.equal(states[0].detail, 0);
    assert.equal(states[3].detail, 1);
    const sides = [];
    for (const y of [end - 1, end + 1]) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(550);
      sides.push(
        await page
          .locator(".frame-render")
          .evaluate((el) => el.getBoundingClientRect().toJSON()),
      );
    }
    assert.ok(Math.abs(sides[0].width - sides[1].width) < 3);
    assert.ok(Math.abs(sides[0].x - sides[1].x) < 3);
    await page.screenshot({ path: `test-results/crisp-frame-${width}.png` });
    await page.close();
  }
  console.log(
    "Extraction checks passed: opaque original frame, forward enlargement, detail enhancement and continuous hero exit on mobile and desktop.",
  );
} finally {
  await browser.close();
}
