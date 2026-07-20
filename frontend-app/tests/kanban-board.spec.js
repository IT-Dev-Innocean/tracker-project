import { test, expect } from '@playwright/test';

test.describe('Kanban Board & Task Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /Sign In|Masuk/i }).click();

    await page.locator('input[type="text"]').fill('batman'); // Ganti dengan user testing Anda
    await page.locator('input[type="password"]').fill('Admin123');
    await page.getByRole('button', { name: /^Login$/i, exact: true }).click();
    await expect(page.getByText(/Login successful/i)).toBeVisible({ timeout: 30000 });

    // Lewati tour jika muncul
    const skipTourBtn = page.getByRole('button', { name: /Skip Tour|Lewati/i });
    await skipTourBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await skipTourBtn.isVisible()) {
      await skipTourBtn.click();
    }
  });

  test('Harus memunculkan peringatan jika memindah task ke Done tapi sub-task belum selesai', async ({ page }) => {
    // 1. Masuk ke proyek pertama di dashboard
    await page.locator('.tour-project-card').first().click();

    // 2. Buat tugas baru dengan satu Sub-task
    await page.getByRole('button', { name: /New Request|Tugas Baru/i }).click();
    await page.getByPlaceholder(/Enter task name/i).fill('Tugas Validasi Drag Drop');
    await page.getByPlaceholder(/Requester name/i).fill('Tester');

    // Tambah sub-task
    await page.getByPlaceholder(/Add checklist item/i).fill('Sub-tugas belum selesai');
    await page.getByRole('button', { name: /ADD|TAMBAH/i }).click();

    await page.getByRole('button', { name: /Create Task|Buat Tugas/i }).click();
    await expect(page.getByText(/successfully/i)).toBeVisible({ timeout: 10000 });

    // 3. Lakukan Drag & Drop tugas tersebut ke kolom "Done"
    // Playwright akan mensimulasikan klik mouse, tahan, geser, lalu lepas
    const taskCard = page.locator('text=Tugas Validasi Drag Drop').first();
    const doneColumn = page
      .locator('h2')
      .filter({ hasText: /^Done$/i })
      .locator('..'); // Cari kolom Done

    await taskCard.dragTo(doneColumn);

    // 4. Verifikasi munculnya Modal Peringatan (Sub-tugas belum selesai)
    await expect(page.getByText(/Incomplete Sub-tasks|Sub-tugas Belum Selesai/i)).toBeVisible({ timeout: 5000 });

    // 5. Batalkan pemindahan
    await page.getByRole('button', { name: /Cancel|Batal/i }).click();

    // Cleanup: Hapus tugas
    await taskCard.click();
    await page.getByRole('button', { name: /Delete Task|Hapus Tugas/i }).click();
    await page
      .locator('button')
      .filter({ hasText: /^Delete$|^Hapus$/i })
      .click();
  });
});
