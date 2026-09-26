import { expect, test } from "./fixtures";

test("navigation fits narrow mobile and desktop viewports", async ({
  page,
  createSales,
}) => {
  await createSales({
    administrator: true,
    email: "responsive@example.com",
    first_name: "Responsive",
    last_name: "Admin",
    password: "password",
  });

  await page.goto("/");
  await page.getByLabel("Email").fill("responsive@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.setViewportSize({ width: 320, height: 812 });
  await expect(page.getByRole("navigation", { name: "CRM navigation" })).toHaveJSProperty(
    "scrollWidth",
    320,
  );

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 768);
});