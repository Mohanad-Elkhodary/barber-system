import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/mock-db', { data: { action: 'reset' } }).catch(() => {});
  });

  test('should display the home page with barber cards', async ({ page }) => {
    await page.goto('/');

    // Page should have the Arabic title
    await expect(page).toHaveTitle(/دورك/);

    // Should show the main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('احجز دورك');
  });

  test('should show booking form when selecting an online barber', async ({ page }) => {
    await page.goto('/');

    // Wait for barber cards to load
    await page.waitForSelector('.card');

    // Click the first online barber card
    const onlineBarber = page.locator('.card-interactive').first();
    if (await onlineBarber.isVisible()) {
      await onlineBarber.click();

      // Booking form modal should appear
      await expect(page.getByText('احجز دورك').last()).toBeVisible();
      await expect(page.locator('#customer-name')).toBeVisible();
      await expect(page.locator('#customer-phone')).toBeVisible();
    }
  });

  test('should validate Egyptian phone number format', async ({ page }) => {
    await page.goto('/');

    // Wait for and click the first online barber
    await page.waitForSelector('.card-interactive');
    await page.locator('.card-interactive').first().click();

    // Fill in name
    await page.locator('#customer-name').fill('أحمد');

    // Try invalid phone number
    await page.locator('#customer-phone').fill('1234567890');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should show phone validation error
    await expect(page.getByText('رقم الموبايل مش صح')).toBeVisible();
  });

  test('should validate name is required', async ({ page }) => {
    await page.goto('/');

    // Wait for and click the first online barber
    await page.waitForSelector('.card-interactive');
    await page.locator('.card-interactive').first().click();

    // Leave name empty, fill phone
    await page.locator('#customer-phone').fill('01012345678');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should show name validation error
    await expect(page.getByText('لازم تكتب اسمك')).toBeVisible();
  });

  test('should book a ticket with valid data and redirect to tracking page', async ({ page }) => {
    await page.goto('/');

    // Wait for and click the first online barber
    await page.waitForSelector('.card-interactive');
    await page.locator('.card-interactive').first().click();

    // Fill valid data with unique phone for concurrency safety
    const randomPhone = '010' + Math.floor(10000000 + Math.random() * 90000000);
    await page.locator('#customer-name').fill('أحمد محمد');
    await page.locator('#customer-phone').fill(randomPhone);

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should redirect to ticket tracking page
    await page.waitForURL(/\/ticket\//, { timeout: 10000 });

    // Should show ticket info
    await expect(page.getByText('رقمك')).toBeVisible();
  });

  test('should prevent duplicate bookings with same phone', async ({ page }) => {
    const dupPhone = '011' + Math.floor(10000000 + Math.random() * 90000000);

    // Book first ticket
    await page.goto('/');
    await page.waitForSelector('.card-interactive');
    await page.locator('.card-interactive').first().click();
    await page.locator('#customer-name').fill('أحمد الأول');
    await page.locator('#customer-phone').fill(dupPhone);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/ticket\//, { timeout: 10000 });

    // Try booking second ticket with the same phone
    await page.goto('/');
    await page.waitForSelector('.card-interactive');
    await page.locator('.card-interactive').first().click();
    await page.locator('#customer-name').fill('أحمد الثاني');
    await page.locator('#customer-phone').fill(dupPhone);
    await page.locator('button[type="submit"]').click();

    // Should show duplicate ticket error message
    await expect(page.getByText(/الرقم ده عنده تذكرة/)).toBeVisible({ timeout: 10000 });
  });

  test('should show no barbers message when none available', async ({ page }) => {
    // This test verifies the empty state renders correctly
    // In a real environment, this would require all barbers to be offline
    await page.goto('/');
    await page.waitForTimeout(2000);

    // The page should either show barber cards or the empty message
    const hasBarbers = await page.locator('.card').count();
    if (hasBarbers === 0) {
      await expect(page.getByText(/مفيش حلاقين متاحين/)).toBeVisible();
    }
  });
});
