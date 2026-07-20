import { test, expect } from '@playwright/test';

test.describe('Task Lifecycle & Collaboration', () => {
  test('Harus bisa menambahkan komentar, mengubah status, dan menghapus tugas', async ({ page }) => {
    // 1. Buka aplikasi dan Login
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /Sign In|Masuk/i }).click();

    await page.locator('input[type="text"]').fill('batman'); // Gunakan akun yang sama
    await page.locator('input[type="password"]').fill('Admin123');
    await page.getByRole('button', { name: /^Login$/i, exact: true }).click();

    await expect(page.getByText(/Login successful/i)).toBeVisible({ timeout: 30000 });

    // 2. Lewati Welcome Tour
    const skipTourBtn = page.getByRole('button', { name: /Skip Tour|Lewati/i });
    await expect(skipTourBtn).toBeVisible({ timeout: 15000 });
    await skipTourBtn.click();

    // 3. Masuk ke Proyek & Buka Tugas yang dibuat di tes sebelumnya
    await page.getByText('Proyek Rahasia Wayne Enterprise').first().click();
    await page.getByText('Rakit Batmobile Baru 🦇').first().click();

    // 4. Uji Penambahan Komentar
    const commentInput = page.getByPlaceholder(/Write a comment|Tulis komentar/i);
    await commentInput.fill('Bahan titanium sudah dipesan dari supplier! 🚀');
    await commentInput.press('Enter'); // Tekan Enter untuk mengirim

    // Verifikasi komentar muncul di layar
    await expect(page.getByText('Bahan titanium sudah dipesan dari supplier! 🚀')).toBeVisible({ timeout: 10000 });

    // 5. Uji Perubahan Status Tugas
    // Mencari elemen dropdown status berdasarkan title "Change Status"
    await page.locator('select[title="Change Status"]').selectOption('In Progress');

    // Verifikasi toast notifikasi sukses muncul
    await expect(page.getByText(/Task marked as In Progress/i)).toBeVisible({ timeout: 10000 });

    // 6. Uji Penghapusan Tugas (Cleanup Data)
    await page.getByRole('button', { name: /Delete Task|Hapus Tugas/i }).click();
    // Klik tombol konfirmasi hapus (yang berwarna merah di popup)
    // Menggunakan filter teks agar tidak salah mengklik tombol "Delete" pada komentar
    await page
      .locator('button')
      .filter({ hasText: /^Delete$|^Hapus$/i })
      .click();

    // Verifikasi tugas berhasil dihapus
    await expect(page.getByText(/Task deleted successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
