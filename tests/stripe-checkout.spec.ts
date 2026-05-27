import { expect, test, type APIRequestContext, type Frame, type Page } from "@playwright/test";

const apiBaseUrl = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3000";

test("customer can pay for a dev mug with Stripe test card", async ({ page, request }) => {
  await expectReady(request);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  await page.getByRole("button", { name: "Add" }).first().click();
  await expect(page.getByText("Cart is empty")).toBeHidden();

  await page.getByLabel("Email").fill("stripe-smoke@example.com");
  await page.getByLabel("Name").fill("Stripe Smoke");
  await page.getByLabel("Phone").fill("4155552671");
  await page.getByLabel("Address").fill("123 Test St");
  await page.getByLabel("City").fill("Bellevue");
  await page.getByLabel("State").fill("WA");
  await page.getByLabel("Postal").fill("98004");
  await page.getByLabel("Country").fill("US");

  await page.getByRole("button", { name: "Place Order" }).click();

  const orderNumber = await page.locator(".order-confirmation strong").innerText();
  await expect(page.getByRole("button", { name: /Pay / })).toBeEnabled();

  await fillStripePaymentElement(page);
  await page.getByRole("button", { name: /Pay / }).click();

  await expect.poll(async () => getOrderPaymentStatus(request, orderNumber), {
    timeout: 30_000
  }).toBe("PAID");
});

async function expectReady(request: APIRequestContext) {
  const response = await request.get(`${apiBaseUrl}/ready`);
  expect(response.ok()).toBeTruthy();
}

async function getOrderPaymentStatus(
  request: APIRequestContext,
  orderNumber: string
) {
  const response = await request.get(`${apiBaseUrl}/orders/${encodeURIComponent(orderNumber)}`);

  if (!response.ok()) {
    return "UNKNOWN";
  }

  const order = (await response.json()) as { paymentStatus?: string };

  return order.paymentStatus ?? "UNKNOWN";
}

async function fillStripePaymentElement(page: Page) {
  const stripeFrame = await findStripePaymentFrame(page);

  await stripeFrame.getByRole("textbox", { name: /card number/i }).fill("4242424242424242");
  await stripeFrame.getByRole("textbox", { name: /expiration date/i }).fill("1230");
  await stripeFrame.getByRole("textbox", { name: /security code/i }).fill("123");

  const country = stripeFrame.getByRole("combobox", { name: /country/i });

  if (await country.count()) {
    await country.selectOption("US");
  }

  const postalCode = stripeFrame.getByRole("textbox", { name: /ZIP|postal/i });

  if (await postalCode.count()) {
    await postalCode.fill("98004");
  }

  const mobileNumber = stripeFrame.getByRole("textbox", { name: /mobile number/i });

  if (await mobileNumber.count()) {
    await mobileNumber.fill("2015550123");
  }
}

async function findStripePaymentFrame(page: Page): Promise<Frame> {
  await page.locator('iframe[src*="stripe.com"]').first().waitFor();

  for (let attempt = 0; attempt < 40; attempt += 1) {
    for (const frame of page.frames()) {
      if (await frame.getByRole("textbox", { name: /card number/i }).count()) {
        return frame;
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error("Could not find Stripe card input frame");
}
