import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Set CHROMIUM_PATH only when using a browser already installed outside Playwright.
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const origin = process.env.PREVIEW_URL || "http://127.0.0.1:4200";
await mkdir(".local/screenshots", { recursive: true });

try {
  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Every empire starts with a block." })
    .waitFor();
  await page.locator(".city-art").evaluate(async (element) => {
    const src =
      getComputedStyle(element).backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
    if (!src) throw new Error("City artwork missing");
    const image = new Image();
    image.src = src;
    await image.decode();
  });
  await page.screenshot({
    path: ".local/screenshots/desktop.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );

  await page.getByRole("button", { name: "Ash Row: RIVAL CREW" }).click();
  await expect(page.locator(".district-card h4")).toHaveText("Ash Row");
  await page.getByRole("button", { name: "Scout a job" }).click();
  await expect(
    page.getByRole("heading", { name: "Put the city to work." }),
  ).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "City map", exact: true })
    .click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator(".map-controls")).toContainText("110%");
  await page.getByRole("button", { name: "Reset map zoom" }).click();
  await expect(page.locator(".map-controls")).toContainText("100%");

  await page.clock.install();
  await page.getByRole("button", { name: "Your fronts", exact: false }).click();
  const speakeasy = page
    .locator(".front-card")
    .filter({ has: page.getByRole("heading", { name: "The Velvet Room" }) });
  await speakeasy.getByRole("button", { name: "Establish front" }).click();
  assert.match(await page.locator(".resource").first().innerText(), /2,050/);
  assert.equal(
    await speakeasy
      .getByRole("button", { name: "Construction underway…" })
      .isDisabled(),
    true,
  );
  await page.clock.fastForward(26_000);
  await expect(speakeasy).toContainText("LEVEL 1");

  const laundry = page
    .locator(".front-card")
    .filter({ has: page.getByRole("heading", { name: "Bellini & Sons" }) });
  await laundry.getByRole("button", { name: "Establish front" }).click();
  await page.clock.fastForward(21_000);
  await page.getByRole("button", { name: "Launder $400", exact: true }).click();
  await page.clock.fastForward(21_000);
  await expect(page.locator(".resource").first()).toContainText("2,040");
  await expect(page.locator(".operation-row")).toHaveCount(0);

  // Reopen to exercise save parsing and offline timestamp reconciliation.
  await page.reload();
  await page.getByRole("button", { name: "Rackets & jobs" }).click();
  await page
    .locator(".job-card")
    .first()
    .getByRole("button", { name: "Send the crew" })
    .click();
  await page.clock.fastForward(25_000);
  await page.getByRole("button", { name: "Street reports" }).click();
  await page
    .getByRole("heading", { name: "Business taken care of." })
    .waitFor();
  assert.match(await page.locator(".report-summary").innerText(), /1/);

  await page.getByRole("button", { name: "Read the game guide" }).click();
  for (const title of [
    "Think in signals",
    "Let time do the work",
    "Give the server authority",
  ]) {
    await page.getByRole("tab", { name: title, exact: false }).click();
  }
  assert.match(
    await page.getByRole("tabpanel").innerText(),
    /production server/,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog").isVisible(), false);

  // Every navigation item must render an actual view, at desktop and mobile sizes.
  const nav = [
    "Overview",
    "City map",
    "Your fronts",
    "The crew",
    "Rackets & jobs",
    "The Families",
    "Street reports",
  ];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 940 });
    for (const name of nav) {
      if (width <= 580)
        await page.getByRole("button", { name: "Toggle navigation" }).click();
      await page
        .locator(".sidebar")
        .getByRole("button", { name, exact: false })
        .click();
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      );
      if (!fits) {
        console.log(
          await page.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .map((e) => ({
                tag: e.tagName,
                cls: String(e.className),
                right: e.getBoundingClientRect().right,
                width: e.getBoundingClientRect().width,
              }))
              .filter((e) => e.right > innerWidth + 1 && e.width > 0)
              .slice(0, 20),
          ),
        );
        await page.screenshot({
          path: ".local/screenshots/overflow.png",
          fullPage: true,
        });
      }
      assert.equal(fits, true, `${name} overflows at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.screenshot({
    path: ".local/screenshots/mobile.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Start a new round", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await page
    .getByRole("button", { name: "Start a new round", exact: true })
    .click();
  await page.getByRole("button", { name: "Yes, start a new round" }).click();
  assert.match(await page.locator(".resource").first().innerText(), /2,450/);
  // Seed damage before application startup, after the old page's pagehide save.
  await page.addInitScript(() =>
    localStorage.setItem("omerta.game.v1", "{invalid-json"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "saved game was unreadable",
  );
  await expect(page.locator(".resource").first()).toContainText("2,450");
  assert.equal(errors.length, 0, `Browser errors: ${errors.join("; ")}`);
  console.log(
    "PASS: build, laundering, job, reload, guide, reset, all seven views at five widths, no browser errors.",
  );
  console.log("Screenshots: .local/screenshots/desktop.png and mobile.png");
} finally {
  await context.close();
  await browser.close();
}
