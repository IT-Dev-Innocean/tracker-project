import { test, expect } from '@playwright/test';

test.describe('Team Collaboration & Communication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /Sign In|Masuk/i }).click();

    await page.locator('input[type="text"]').fill('batman');
    await page.locator('input[type="password"]').fill('Admin123');
    await page.getByRole('button', { name: /^Login$/i, exact: true }).click();
    await expect(page.getByText(/Login successful/i)).toBeVisible({ timeout: 30000 });

    const skipTourBtn = page.getByRole('button', { name: /Skip Tour|Lewati/i });
    await skipTourBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await skipTourBtn.isVisible()) {
      await skipTourBtn.click();
    }
  });

  test('Autocompletion Mention dan Obrolan Tim', async ({ page }) => {
    // 1. Masuk ke proyek pertama
    await page.locator('.tour-project-card').first().click();

    // 2. Buka laci (drawer) Team Chat
    await page.getByRole('button', { name: /Team Chat|Obrolan Tim/i }).click();

    // 3. Menguji Mention Dropdown
    const chatInput = page.getByPlaceholder(/Message the team/i);
    await chatInput.fill('Halo @adm');

    // Verifikasi bahwa dropdown nama muncul
    const mentionDropdown = page.locator('text=@admin');
    await expect(mentionDropdown).toBeVisible({ timeout: 5000 });

    // Pilih user dari dropdown
    await mentionDropdown.click();

    // Pastikan teks di dalam input berubah menjadi tag penuh
    await expect(chatInput).toHaveValue(/Halo @admin/i);

    // Kirim pesan
    await chatInput.press('Enter');

    // 4. Verifikasi pesan terkirim
    await expect(page.getByText(/Halo @admin/i)).toBeVisible({ timeout: 5000 });

    // 5. Tutup chat drawer
    await page.locator('button').filter({ hasText: '✖' }).first().click();
  });
});
