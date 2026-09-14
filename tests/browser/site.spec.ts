import { test, expect } from "@playwright/test";
import { base } from "../../site.config.mjs";

const essays = ["aproarte", "just-intonation", "vowel-resonance"];
for (const route of ["", "essays/", "resources/", "musical-cv/", ...essays.map((slug) => `essays/${slug}/`)]) {
  test(`${route || "home"} has no page overflow or clipped headings`, async ({ page }) => {
    await page.goto(route || "./");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const heading of await page.locator("h1, .essay-list h2, .essay-list h3").all()) {
      expect(await heading.evaluate((node) => {
        const style = getComputedStyle(node);
        // Serif glyphs can extend beyond a tight line box without being clipped.
        const heightIsVisible = style.overflowY === "visible" || node.scrollHeight <= node.clientHeight + 1;
        return heightIsVisible && node.scrollWidth <= node.clientWidth + 1 &&
          style.textOverflow !== "ellipsis" && style.webkitLineClamp === "none";
      })).toBe(true);
    }
  });
}

test("legacy bookmark → home → essay → working analyzer", async ({ page }) => {
  await page.goto("learning-the-instrument/index.html");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}$`));
  await page.locator(`a[href="${base}essays/just-intonation/"]`).first().click();
  await expect(page.locator("h1")).toContainText("Just Intonation");
  await page.locator(`a[href="${base}barbershop-analyzer/index.html"]`).first().click();
  await expect(page.getByRole("tab", { name: "Summary", exact: true })).toBeVisible();
});

test("TOC is keyboard operable and resolves to a real section", async ({ page }, testInfo) => {
  await page.goto("essays/just-intonation/");
  if (testInfo.project.name === "mobile-320") {
    const summary = page.locator("summary").filter({ hasText: "In this essay" });
    await summary.focus();
    if (!await summary.evaluate((node) => node.parentElement!.hasAttribute("open"))) {
      await page.keyboard.press("Enter");
    }
    await page.keyboard.press("Tab");
  }
  const first = page.locator('nav[aria-label="Essay sections"]:visible a').first();
  if (testInfo.project.name === "desktop") await first.focus();
  await expect(first).toBeFocused();
  const href = await first.getAttribute("href");
  await page.keyboard.press("Enter");
  expect(new URL(page.url()).hash).toBe(href);
  await expect(page.locator(`[id="${decodeURIComponent(href!.slice(1))}"]`)).toBeVisible();
});

test("math is semantic, tables scroll by keyboard and remain visible in print", async ({ page }, testInfo) => {
  await page.goto("essays/just-intonation/");
  expect(await page.locator(".katex math").count()).toBeGreaterThan(0);
  for (const formula of await page.locator(".katex").all()) await expect(formula.locator("math")).toHaveCount(1);
  const tables = page.locator(".table-scroll");
  expect(await tables.count()).toBeGreaterThan(0);
  if (testInfo.project.name === "mobile-320") {
    let scrolled = false;
    for (const table of await tables.all()) {
      if (await table.evaluate((node) => node.scrollWidth > node.clientWidth)) {
        await table.focus();
        await page.keyboard.press("ArrowRight");
        await expect.poll(() => table.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
        scrolled = true;
        break;
      }
    }
    expect(scrolled).toBe(true);
  }
  await page.emulateMedia({ media: "print" });
  for (const table of await tables.all()) {
    await expect(table.locator("table")).toBeVisible();
    expect(await table.evaluate((node) => getComputedStyle(node).overflowX)).toBe("visible");
  }
});

test("analyzer tabs, numeric controls, note selection and charts work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("barbershop-analyzer/index.html");
  await page.getByRole("tab", { name: "Time Domain", exact: true }).click();
  const panel = page.getByRole("tabpanel");
  await panel.getByLabel("Base Frequency (Hz)").fill("220");
  await expect(panel.getByLabel("Base Frequency (Hz)")).toHaveValue("220");
  await panel.getByLabel("Duration (s)").fill("0.02");
  await expect(panel.locator(".recharts-wrapper > .recharts-surface")).toBeVisible();
  await panel.getByRole("combobox").first().click();
  await page.getByRole("option").filter({ hasText: "Perfect Fifth" }).first().click();
  await expect(panel.locator(".recharts-line-curve").first()).toBeVisible();
  await page.getByRole("tab", { name: "Frequency Domain", exact: true }).click();
  await panel.getByLabel("Root Frequency (Hz)").fill("220");
  await panel.getByLabel("Number of Harmonics").fill("8");
  await expect(panel.getByLabel("Number of Harmonics")).toHaveValue("8");
  await expect(panel.locator(".recharts-wrapper > .recharts-surface")).toBeVisible();
  await page.getByRole("tab", { name: "Comparison", exact: true }).click();
  await expect(panel.locator(".recharts-wrapper > .recharts-surface")).toBeVisible();
  await page.getByRole("tab", { name: "Summary", exact: true }).click();
  await expect(panel).toContainText("Barbershop");
  expect(errors).toEqual([]);
});

test("workshop preserves credit, downloads and return navigation; server never falls back", async ({ page, request }) => {
  await page.goto("thematic-elements/thematic-elements-presentation.html");
  await expect(page.locator("body")).toContainText("Zach Groeblinghoff");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.goto("resources/");
  await page.getByText("Workshop documents & downloads", { exact: true }).click();
  const pdf = page.locator('a[href$=".pdf"]').first();
  await expect(pdf).toBeVisible();
  const response = await request.get((await pdf.getAttribute("href"))!);
  expect(response.status()).toBe(200);
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  expect((await request.get(`${base}not-a-real-page/`)).status()).toBe(404);
  expect((await request.get("/essays/just-intonation/")).status()).toBe(404);
});

test("vowel tables preserve IPA, coaching text, and all columns when printed", async ({ page }) => {
  await page.goto("essays/vowel-resonance/");
  const tables = page.locator(".prose table");
  await expect(tables).toHaveCount(2);
  await expect(tables.first()).toContainText("/ɪ/");
  await expect(tables.last()).toContainText("Coaching direction");
  await page.emulateMedia({ media: "print" });
  for (const table of await tables.all()) {
    const box = await table.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth + 1));
    for (const cell of await table.locator("th, td").all()) {
      await expect(cell).toBeVisible();
      expect(await cell.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
  }
});
