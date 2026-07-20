import { test, expect } from '@playwright/test';

test.describe('Task Management Feature', () => {
  test('Harus berhasil melewati tour, membuat proyek, dan membuat tugas baru', async ({ page }) => {
    // 1. Buka aplikasi dan Login
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /Sign In|Masuk/i }).click();

    await page.locator('input[type="text"]').fill('batman'); // Sesuaikan dengan username Anda
    await page.locator('input[type="password"]').fill('Admin123'); // Sesuaikan dengan password Anda
    await page.getByRole('button', { name: /^Login$/i, exact: true }).click();

    // 2. Pastikan Login berhasil (Mencegah robot nyangkut jika username/password salah)
    // Timeout agak panjang (30 detik) untuk mengantisipasi Cold Start server
    await expect(page.getByText(/Login successful/i)).toBeVisible({ timeout: 30000 });

    // 3. Tunggu dan Lewati Welcome Tour (Muncul setelah jeda 1.5 detik setelah login)
    // Menggunakan Regex (/.../i) agar mendukung bahasa Inggris maupun Indonesia
    const skipTourBtn = page.getByRole('button', { name: /Skip Tour|Lewati/i });
    await expect(skipTourBtn).toBeVisible({ timeout: 15000 });
    await skipTourBtn.click();

    // 4. Buat Proyek Baru
    await page.getByRole('button', { name: /New Project|Proyek Baru/i }).click();
    await page.getByPlaceholder(/E\.g\. Website Redesign/i).fill('Proyek Rahasia Wayne Enterprise');
    await page.getByRole('button', { name: /Create Project|Buat Proyek/i }).click();

    // Tunggu notifikasi sukses pembuatan proyek
    await expect(page.getByText(/Project created successfully/i)).toBeVisible({ timeout: 10000 });

    // 5. Buka proyek yang baru saja dibuat
    await page.getByText('Proyek Rahasia Wayne Enterprise').first().click();

    // 6. Buat Tugas Baru di dalam proyek tersebut
    await page.getByRole('button', { name: /New Request|Tugas Baru/i }).click();
    await page.getByPlaceholder(/Enter task name|Masukkan judul/i).fill('Rakit Batmobile Baru 🦇');
    await page.getByPlaceholder(/Requester name|Nama peminta/i).fill('Bruce Wayne');

    await page.getByRole('button', { name: /Create Task|Buat Tugas/i }).click();

    // 7. Verifikasi bahwa sistem berhasil menyimpan tugas
    await expect(page.getByText(/New task added successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
