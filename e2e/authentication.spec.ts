import { expect, test } from "./fixtures";

test("public signup redirects to the single login page", async ({ page }) => {
  await page.goto("/sign-up");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign up|create account|register/i })).toHaveCount(0);
});
