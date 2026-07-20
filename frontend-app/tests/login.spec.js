import { test, expect } from '@playwright/test';

test.describe('Autentikasi (Login) Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Robot akan membuka halaman utama aplikasi Anda (asumsi berjalan di localhost:5173)
    await page.goto('http://localhost:5173');
  });

  test('Harus berhasil login dengan kredensial yang valid', async ({ page }) => {
    // 1. Robot mencari dan mengklik tombol "Sign In" di halaman Landing Page
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Robot mengetik username dan password
    await page.locator('input[type="text"]').fill('batman'); // Ganti dengan username asli
    await page.locator('input[type="password"]').fill('Admin123'); // Ganti dengan password asli

    // 3. Robot mengeklik tombol Authenticate
    await page.getByRole('button', { name: /^Login$/i, exact: true }).click();

    // 4. Robot memverifikasi apakah notifikasi sukses muncul dan masuk ke Dashboard
    await expect(page.getByText('Login successful!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Global Workload')).toBeVisible({ timeout: 10000 });
  });

  test('Harus menampilkan pesan error jika kata sandi salah', async ({ page }) => {
    // 1. Robot masuk ke mode Login
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Robot dengan sengaja memasukkan username & password yang salah
    // Menggunakan user fiktif agar tidak memicu sistem kunci (Lockout 15 Menit) pada akun utama
    await page.locator('input[type="text"]').fill('user_fiktif');
    await page.locator('input[type="password"]').fill('salah_password_123');

    // 3. Klik tombol masuk
    await page.getByRole('button', { name: /^Login$/i, exact: true }).click();

    // 4. Verifikasi dengan Regex (/.../i) agar lebih toleran terhadap perbedaan tanda baca
    await expect(page.getByText(/Invalid username or password/i)).toBeVisible({ timeout: 10000 });
  });
});
