import { test, expect } from "@playwright/test";
import { base } from "../../site.config.mjs";

test("musical CV is discoverable without replacing external profile links", async ({ page }) => {
  await page.goto("./");
  const contextualLink = page.getByRole("link", { name: "Read my musical CV", exact: true });
  await expect(contextualLink).toHaveAttribute("href", `${base}musical-cv/`);
  await contextualLink.click();
  await expect(page.locator("h1")).toHaveText("Musical Curriculum Vitae");
  for (const route of ["./", "essays/", "resources/", "musical-cv/"]) {
    await page.goto(route);
    const navLink = page.locator("header").getByRole("link", { name: "Musical CV", exact: true });
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveAttribute("href", `${base}musical-cv/`);
    await expect(page.locator(`footer a[href="${base}musical-cv/"]`)).toBeVisible();
    await expect(page.locator('footer a[href="https://jakedoescode.com/"]')).toBeVisible();
    await expect(page.locator('footer a[href="https://github.com/gankoji/theMechanicsOfSinging"]')).toBeVisible();
  }
});

test("CV sections resolve and the TOC works from the keyboard", async ({ page }, testInfo) => {
  await page.goto("musical-cv/");
  if (testInfo.project.name === "mobile-320") {
    const summary = page.locator("summary").filter({ hasText: "In this CV" });
    await summary.focus();
    if (!await summary.evaluate((node) => node.parentElement!.hasAttribute("open"))) {
      await page.keyboard.press("Enter");
    }
    await page.keyboard.press("Tab");
  } else {
    await expect(page.getByText("In this CV", { exact: true }).filter({ visible: true })).toBeVisible();
  }
  const links = page.locator('nav[aria-label="CV sections"]:visible a');
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^#.+/);
    await expect(page.locator(`[id="${decodeURIComponent(href!.slice(1))}"]`)).toHaveCount(1);
  }
  const first = links.first();
  if (testInfo.project.name === "desktop") await first.focus();
  await expect(first).toBeFocused();
  const href = await first.getAttribute("href");
  await page.keyboard.press("Enter");
  expect(new URL(page.url()).hash).toBe(href);
  await expect(page.locator(`[id="${decodeURIComponent(href!.slice(1))}"]`)).toBeVisible();
});

test("CV preserves public content and every table row on screen and in print", async ({ page }, testInfo) => {
  await page.goto("musical-cv/");
  for (const text of ["Jacob (Jake) Bailey", "Top Spin", "Northwest Sound", "Assistant Music Director"]) {
    await expect(page.locator("main")).toContainText(text);
  }
  await expect(page.locator("main").getByText("Last updated: 2026-09-13", { exact: true })).toBeVisible();
  // Check categories of private information without embedding private source values.
  await expect(page.locator("main")).not.toContainText(/\b(?:mailing address|street address|phone|membership number|member(?:ship)?\s*#)\b/i);
  await expect(page.locator('main a[href^="tel:"], main address')).toHaveCount(0);
  const tables = page.locator(".prose table");
  await expect(tables).toHaveCount(4);
  const rowCounts = [2, 8, 9, 6];
  for (let index = 0; index < rowCounts.length; index++) {
    await expect(tables.nth(index).locator("tbody tr")).toHaveCount(rowCounts[index]);
  }
  const wrappers = page.locator(".prose .table-scroll");
  await expect(wrappers).toHaveCount(4);
  for (const wrapper of await wrappers.all()) {
    await expect(wrapper).toHaveAttribute("role", "region");
    await expect(wrapper).toHaveAttribute("tabindex", "0");
    await expect(wrapper).toHaveAccessibleName(/.+/);
  }
  if (testInfo.project.name === "mobile-320") {
    let scrolled = false;
    for (const wrapper of await wrappers.all()) {
      if (await wrapper.evaluate((node) => node.scrollWidth > node.clientWidth)) {
        await wrapper.focus();
        await page.keyboard.press("ArrowRight");
        await expect.poll(() => wrapper.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
        scrolled = true;
      }
    }
    expect(scrolled).toBe(true);
  }
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const wrapper of await wrappers.all()) {
    expect(await wrapper.evaluate((node) => getComputedStyle(node).overflowX)).toBe("visible");
  }
  for (let index = 0; index < rowCounts.length; index++) {
    const table = tables.nth(index);
    await expect(table.locator("tbody tr")).toHaveCount(rowCounts[index]);
    const box = await table.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth + 1));
    for (const cell of await table.locator("th, td").all()) {
      await expect(cell).toBeVisible();
      expect(await cell.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
  }
});
