import { test, expect } from "@playwright/test";

async function registerUser(page, prefix, id) {
  await page.click("#navSignIn");
  await page.click("#showRegister");
  await page.fill("#regUsername", `${prefix}_${id}`);
  await page.fill("#regEmail", `${prefix}_${id}@example.com`);
  await page.fill("#regPassword", "password123");
  await page.click("#registerBtn");
  await expect(page.locator("#authModal")).toBeHidden();
  await expect(page.locator("#navSignOut")).toBeVisible();
}

test("register, submit caption, vote, and see your vote", async ({ page }) => {
  const id = Date.now();

  await page.goto("/");
  await expect(page.locator("#wakeOverlay")).toBeHidden({ timeout: 60000 });
  await expect(page.locator(".template-card .status-badge.open").first()).toBeVisible({ timeout: 15000 });

  // Alice registers and submits a caption
  await page.locator(".template-card .status-badge.open").first().click();
  await registerUser(page, "alice", id);
  await expect(page.locator("#captionText")).toBeVisible();

  const caption = `E2E caption ${id}`;
  await page.fill("#captionText", caption);

  const submitResponse = page.waitForResponse(
    (res) => res.url().includes("/captions") && res.request().method() === "POST",
  );
  await page.click("#submitCaptionBtn");
  expect((await submitResponse).status()).toBe(201);
  await expect(page.locator(".caption-text", { hasText: caption })).toBeVisible();

  // Back to gallery to sign out
  await page.click("#backBtn");
  await page.click("#navSignOut");

  // Bob registers and votes for Alice's caption
  await page.locator(".template-card .status-badge.open").first().click();
  await registerUser(page, "bob", id);

  const voteBtn = page.locator(".caption-card", { hasText: caption }).locator(".voteBtn");
  await expect(voteBtn).toBeVisible({ timeout: 15000 });
  await voteBtn.click();
  await expect(
    page.locator(".caption-card", { hasText: caption }).locator(".vote-badge"),
  ).toContainText("Your vote");
});

test("shows gallery error state with retry on API failure", async ({ page }) => {
  await page.route("**/api/images", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "fail" }) }),
  );

  await page.goto("/");
  await expect(page.locator("#wakeOverlay")).toBeHidden({ timeout: 60000 });
  await expect(page.locator(".gallery-error")).toContainText("Couldn't load contests");
  await expect(page.locator("#retryGallery")).toBeVisible();
});
