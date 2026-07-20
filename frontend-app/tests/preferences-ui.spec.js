import { test, expect } from '@playwright/test';

test.describe('UI Preferences & Filters', () => {
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

  test('Mengubah Mode Gelap/Terang dan Filter My Tasks', async ({ page }) => {
    // 1. Buka Menu Settings via Account Menu
    await page.locator('.tour-account-menu button').first().click();
    await page.getByRole('button', { name: /Settings|Pengaturan/i }).click();

    // 2. Pindah ke tab Preferences
    await page.getByRole('button', { name: /Preferences|Preferensi/i }).click();

    // 3. Ubah Mode Sistem ke "Light" (Terang)
    await page.getByRole('button', { name: '☀️ Light' }).click();

    // Verifikasi tag "dark" dihapus dari tag HTML (latar menjadi terang)
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Kembalikan ke mode Gelap (Dark)
    await page.getByRole('button', { name: '🌙 Dark' }).click();
    await expect(html).toHaveClass(/dark/);

    // 4. Tutup Pengaturan
    await page
      .locator('button')
      .filter({ hasText: /Kembali|Back/i })
      .first()
      .click();

    // 5. Menguji fungsi Filter di Global Board
    await page.locator('.tour-global-board').click();
    await page.getByRole('button', { name: /My Tasks|Tugas Saya/i }).click();

    // Pastikan tombol filter tersebut dalam status 'Aktif' (berubah gaya ke indigo)
    await expect(page.getByRole('button', { name: /My Tasks|Tugas Saya/i })).toHaveClass(/text-indigo/);
  });
});
