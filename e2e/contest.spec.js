import { test, expect } from "@playwright/test";

test("register, submit caption, vote, and see your vote", async ({ page }) => {
  const id = Date.now();

  await page.goto("/");
  await expect(page.locator("#wakeOverlay")).toBeHidden({ timeout: 60000 });

  // Alice registers and submits a caption
  await page.click("#showRegister");
  await page.fill("#regUsername", `alice_${id}`);
  await page.fill("#regEmail", `alice_${id}@example.com`);
  await page.fill("#regPassword", "password123");
  await page.click("#registerBtn");
  await expect(page.locator("#loggedInPanel")).toBeVisible();

  await page.locator(".template-card .status-badge.open").first().click();
  const caption = `E2E caption ${id}`;
  await page.fill("#captionText", caption);

  const submitResponse = page.waitForResponse(
    (res) => res.url().includes("/captions") && res.request().method() === "POST",
  );
  await page.click("#submitCaptionBtn");
  expect((await submitResponse).status()).toBe(201);
  await expect(page.locator(".caption-text", { hasText: caption })).toBeVisible();

  // Back to gallery to reach logout (auth panel hidden on detail view)
  await page.click("#backBtn");
  await page.click("#logoutBtn");

  // Bob registers and votes for Alice's caption
  await page.click("#showRegister");
  await page.fill("#regUsername", `bob_${id}`);
  await page.fill("#regEmail", `bob_${id}@example.com`);
  await page.fill("#regPassword", "password123");
  await page.click("#registerBtn");

  await page.locator(".template-card .status-badge.open").first().click();
  await page.locator(".caption-card", { hasText: caption }).locator(".voteBtn").click();
  await expect(
    page.locator(".caption-card", { hasText: caption }).locator(".vote-badge"),
  ).toContainText("Your vote");
});
