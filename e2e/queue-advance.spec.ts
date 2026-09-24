import { test, expect } from '@playwright/test';

// These tests require valid barber credentials in environment
const BARBER_EMAIL = process.env.TEST_BARBER_EMAIL || 'barber@test.com';
const BARBER_PASSWORD = process.env.TEST_BARBER_PASSWORD || 'password123';

test.describe('Queue Advance Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset mock db state
    await page.request.post('/api/mock-db', { data: { action: 'reset' } }).catch(() => {});

    // Login as barber
    await page.goto('/login');
    await page.locator('#login-email').fill(BARBER_EMAIL);
    await page.locator('#login-password').fill(BARBER_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display the barber dashboard after login', async ({ page }) => {
    // Should show dashboard heading
    await expect(page.getByText('لوحة التحكم')).toBeVisible();

    // Should show queue section
    await expect(page.getByText('الطابور')).toBeVisible();

    // Should show stats section
    await expect(page.getByText('إحصائيات اليوم')).toBeVisible();
  });

  test('should toggle barber online/offline status', async ({ page }) => {
    // Find the toggle button
    const toggleBtn = page.locator('#toggle-status-btn');
    await expect(toggleBtn).toBeVisible();

    // Get initial text
    const initialText = (await toggleBtn.textContent())?.trim();

    // Click toggle
    await toggleBtn.click();

    // Text should have changed
    if (initialText?.includes('وقّف')) {
      await expect(toggleBtn).toContainText('ابدأ الشغل', { timeout: 10000 });
    } else {
      await expect(toggleBtn).toContainText('وقّف الشغل', { timeout: 10000 });
    }
  });

  test('should advance queue — serve next ticket', async ({ page }) => {
    // Check if there's anyone in the queue
    const queueCount = page.locator('.queue-item');
    const count = await queueCount.count();

    if (count > 0) {
      // Click "التالي" (next) button
      const nextBtn = page.getByText('التالي');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);

        // Should now show someone being served
        await expect(page.getByText('بيتخدم دلوقتي')).toBeVisible();
      }
    }
  });

  test('should mark current ticket as done', async ({ page }) => {
    // Check if someone is being served
    const doneBtn = page.getByRole('button', { name: 'تم' });

    if (await doneBtn.isVisible()) {
      await doneBtn.click();
      await page.waitForTimeout(1000);

      // After marking done, the serving section should update
      // Either show next person or "مفيش حد بيتخدم"
      const noOneServing = page.getByText('مفيش حد بيتخدم');
      const nextPerson = page.locator('.queue-item-number');

      const hasNoOne = await noOneServing.isVisible().catch(() => false);
      const hasNext = (await nextPerson.count()) > 0;

      expect(hasNoOne || hasNext).toBeTruthy();
    }
  });

  test('should mark current ticket as no-show', async ({ page }) => {
    // First, advance the queue if possible
    const nextBtn = page.getByText('التالي');
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }

    // Now mark as no-show
    const noShowBtn = page.getByRole('button', { name: 'لم يحضر' });
    if (await noShowBtn.isVisible()) {
      await noShowBtn.click();
      await page.waitForTimeout(1000);

      // Should update stats
      await expect(page.getByText('إحصائيات اليوم')).toBeVisible();
    }
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Click logout
    await page.getByText('تسجيل خروج').click();

    // Should redirect to login page
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'دخول الحلاق' })).toBeVisible();
  });
});

test.describe('Display Screen', () => {
  test('should show the display page with barber info', async ({ page }) => {
    await page.goto('/display');

    // Should show the app name
    await expect(page.getByText('دورك')).toBeVisible();

    // Should either show barber displays or empty state
    const hasBarbers = await page.locator('.display-card').count();
    if (hasBarbers > 0) {
      await expect(page.getByText('بيتخدم دلوقتي').first()).toBeVisible();
    } else {
      await expect(page.getByText('مفيش حلاقين متاحين')).toBeVisible();
    }
  });

  test('should show clock on display page', async ({ page }) => {
    await page.goto('/display');

    // Wait for time display — it should be present as the clock
    await page.waitForTimeout(1500);

    // The time should be visible (format: HH:MM AM/PM in Arabic)
    const timeElement = page.locator('[style*="direction: ltr"]');
    await expect(timeElement).toBeVisible();
  });
});
