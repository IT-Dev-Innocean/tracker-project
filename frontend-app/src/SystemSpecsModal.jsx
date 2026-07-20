import React, { useState } from 'react';
import { useCloseAnimation } from './Utils';

export default function SystemSpecsModal({ setIsSpecsOpen, language }) {
  const [isClosing, close] = useCloseAnimation(() => setIsSpecsOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-neutral-950 z-[100] overflow-y-auto transition-opacity duration-200 ${
        isClosing ? 'mac-exit opacity-0' : 'mac-animate opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-screen">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-6 mb-12 border-b border-neutral-200 dark:border-neutral-800 pb-8 shrink-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">
              {tMsg('System Limits & Specs', 'Batas & Spesifikasi Sistem')}
            </h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              {tMsg('Platform Capabilities and Quotas', 'Kemampuan dan Kuota Platform')}
            </p>
          </div>
          <button
            onClick={close}
            className="bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-black dark:text-white px-6 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <span>✖</span> {tMsg('Close Document', 'Tutup Dokumen')}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 flex-1 items-start">
          {/* Kiri: Tabel Spesifikasi Utama */}
          <div className="flex-1 w-full min-w-0 flex flex-col">
            <div className="mb-8 p-5 sm:p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex gap-4 items-start shrink-0">
              <div className="text-2xl sm:text-3xl mt-0.5">⚠️</div>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                  {tMsg('Infrastructure Notice (Free Tier)', 'Pemberitahuan Infrastruktur (Tier Gratis)')}
                </h3>
                <p className="text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-medium leading-relaxed">
                  {tMsg(
                    "This workspace is currently hosted on Free Tier infrastructure (Vercel, Render, Neon DB). You may experience a 15-50 second 'cold start' delay when launching the app if no one has accessed it in the last 15 minutes. Please be patient while the server wakes up.",
                    "Ruang kerja ini saat ini di-hosting pada infrastruktur Tier Gratis (Vercel, Render, Neon DB). Anda mungkin mengalami penundaan 'cold start' 15-50 detik saat membuka aplikasi jika tidak ada yang mengaksesnya dalam 15 menit terakhir. Harap bersabar sementara server dihidupkan kembali."
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                    <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 w-1/3">
                      {tMsg('Capability', 'Kemampuan')}
                    </th>
                    <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white w-1/4">
                      {tMsg('Limit / Spec', 'Batas / Spek')}
                    </th>
                    <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {tMsg('Description', 'Deskripsi')}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-medium divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Projects / Workspaces', 'Proyek / Ruang Kerja')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Unlimited', 'Tak Terbatas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'No restriction on the number of isolated project boards you can create.',
                        'Tidak ada batasan jumlah papan proyek terisolasi yang dapat Anda buat.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Private Workspaces', 'Ruang Kerja Pribadi')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Zero-Trust', 'Zero-Trust')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Create personal projects locked exclusively to you. Team chat, mentions, and invitations are hard-disabled at the backend API level.',
                        'Buat proyek pribadi yang terkunci khusus untuk Anda. Obrolan tim, sebutan, dan undangan dinonaktifkan secara permanen di tingkat API backend.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('AI Auto-Fallback Architecture', 'Arsitektur Auto-Fallback AI')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Gemini ➔ GPT-OSS', 'Gemini ➔ GPT-OSS')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Automatically routes AI requests to GPT-OSS 120B (via Groq) if Google Gemini reaches API limits or experiences downtime.',
                        'Otomatis merutekan permintaan AI ke GPT-OSS 120B (via Groq) jika Google Gemini mencapai batas API atau mengalami gangguan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Database Bloat Protection (AI)', 'Pencegahan Pembengkakan DB (AI)')}
                    </td>
                    <td className="p-4 sm:p-6 text-red-600 dark:text-red-400 font-black">
                      {tMsg('Max 3000 Chars', 'Maks 3000 Karakter')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'AI responses are strictly truncated at 3000 characters before database insertion to prevent storage bloat.',
                        'Respons AI secara ketat dipotong pada 3000 karakter sebelum dimasukkan ke database untuk mencegah pembengkakan penyimpanan.'
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Chat Navigation Memory', 'Memori Navigasi Obrolan')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Client-side', 'Sisi Klien')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Mention jumps and dismissed notifications are tracked in local memory to maintain UI responsiveness without database strain.',
                        'Lompatan sebutan dan notifikasi yang ditutup dilacak di memori lokal untuk menjaga responsivitas UI tanpa membebani database.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Direct G-Meet Integration', 'Integrasi G-Meet Langsung')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('Auto-URL', 'URL Otomatis')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Generates secure, project-specific Google Meet URLs instantly without requiring complex Google Cloud OAuth setups.',
                        'Menghasilkan URL Google Meet yang aman dan spesifik untuk proyek secara instan tanpa memerlukan pengaturan Google Cloud OAuth yang rumit.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Tasks per Project', 'Tugas per Proyek')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Unlimited', 'Tak Terbatas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Create as many tasks or requests as needed within a project.',
                        'Buat tugas atau permintaan sebanyak yang dibutuhkan dalam sebuah proyek.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Global Master View', 'Tampilan Utama Global')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Enabled', 'Aktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Manage and monitor tasks across all accessible projects simultaneously.',
                        'Kelola dan pantau tugas di semua proyek yang dapat diakses secara bersamaan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Team Members (Invites)', 'Anggota Tim (Undangan)')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Unlimited', 'Tak Terbatas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Invite unlimited colleagues to collaborate on your projects.',
                        'Undang rekan kerja tanpa batas untuk berkolaborasi di proyek Anda.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Custom Columns (Status)', 'Kolom Kustom (Status)')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('Max 50', 'Maks 50')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Limit per workspace. Statuses are synced globally, but column arrangement is saved locally for personalized workflow.',
                        'Batas per ruang kerja. Status disinkronkan secara global, tetapi urutan kolom disimpan lokal untuk alur kerja yang dipersonalisasi.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Custom Categories', 'Kategori Kustom')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('Max 50', 'Maks 50')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Limit per workspace. Categories are synced globally, but display order is saved locally for personalized workflow.',
                        'Batas per ruang kerja. Kategori disinkronkan secara global, tetapi urutan tampilan disimpan lokal untuk alur kerja yang dipersonalisasi.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Ticketing System', 'Sistem Tiket')}
                    </td>
                    <td className="p-4 sm:p-6 text-yellow-600 dark:text-yellow-400 font-black">
                      {tMsg('Auto-ID Tracking', 'Pelacakan ID Otomatis')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Support and feedback tickets receive sequential IDs and are isolated from normal project tasks. Managed centrally by Admins.',
                        'Tiket dukungan dan masukan menerima ID berurutan dan diisolasi dari tugas proyek biasa. Dikelola secara terpusat oleh Admin.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Workspace Chat & DMs', 'Ruang Kerja Obrolan & DM')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Real-time', 'Waktu Nyata')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Unified chat interface supporting project channels, task threads, and private 1-on-1 direct messages.',
                        'Antarmuka obrolan terpadu yang mendukung saluran proyek, utas tugas, dan pesan pribadi 1-on-1.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Chat History Pagination', 'Paginasi Riwayat Obrolan')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('On-Demand', 'Sesuai Permintaan')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Loads the 50 most recent messages instantly. Older conversations can be loaded on demand to ensure fast performance.',
                        'Memuat 50 pesan terbaru secara instan. Percakapan lama dapat dimuat sesuai permintaan untuk memastikan kinerja cepat.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Sub-tasks per Task', 'Sub-tugas per Tugas')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Unlimited', 'Tak Terbatas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Break down your main tasks into an unlimited number of checklists.',
                        'Pecah tugas utama Anda menjadi daftar periksa (checklist) tanpa batas.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Smart Kanban Archive', 'Arsip Kanban Cerdas')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('Auto-Collapse', 'Sembunyi Otomatis')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Terminal columns (Done/Rejected) auto-hide tasks beyond the 5 most recent to keep UI clean.',
                        'Kolom terminal (Selesai/Ditolak) menyembunyikan tugas lebih dari 5 yang terbaru secara otomatis agar UI tetap bersih.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Google Calendar Export', 'Ekspor Google Calendar')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Smart Link', 'Tautan Cerdas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        '1-click export securely pre-fills task data into Google Calendar without requiring Google Cloud OAuth verification.',
                        'Ekspor 1-klik secara aman mengisi data tugas ke Google Calendar tanpa memerlukan verifikasi Google Cloud OAuth.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Project Ownership Transfer', 'Pemindahan Kepemilikan Proyek')}
                    </td>
                    <td className="p-4 sm:p-6 text-purple-600 dark:text-purple-400 font-black">
                      {tMsg('Enabled', 'Aktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Owners can organically hand over projects to active team members. Admins can forcefully rescue and transfer abandoned projects.',
                        'Pemilik dapat menyerahkan proyek secara organik kepada anggota tim yang aktif. Admin dapat secara paksa menyelamatkan dan memindahkan proyek yang ditinggalkan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Data Retention (Completed)', 'Penyimpanan Data (Selesai)')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('180 Days', '180 Hari')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        "Tasks marked as 'Done' or 'Rejected' are auto-purged after 6 months to maintain speed.",
                        "Tugas yang ditandai 'Selesai' atau 'Ditolak' dibersihkan secara otomatis setelah 6 bulan demi kecepatan."
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Data Retention (Inactive Projects)', 'Penyimpanan Data (Proyek Tidak Aktif)')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('180 Days TTL', 'TTL 180 Hari')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Zombie projects with zero activity for 6 months trigger a 7-day auto-purge countdown to preserve storage limits and app performance.',
                        'Proyek terbengkalai tanpa aktivitas selama 6 bulan memicu hitungan mundur 7 hari sebelum dibersihkan otomatis demi menghemat kuota penyimpanan dan menjaga performa aplikasi.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Data Retention (Chat History)', 'Penyimpanan Data (Riwayat Obrolan)')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('365 Days', '365 Hari')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'All chat messages (in tasks and project chat) are auto-purged after 1 year to maintain database hygiene.',
                        'Semua pesan obrolan dihapus otomatis setelah 1 tahun untuk menjaga kebersihan database.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Real-time Notifications', 'Notifikasi Waktu Nyata')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Enabled', 'Aktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Instant in-app alerts, desktop native notifications, and email dispatches for mentions and assignments.',
                        'Peringatan dalam aplikasi instan, notifikasi desktop bawaan, dan email untuk penyebutan dan penugasan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Resource Allocation', 'Alokasi Sumber Daya')}
                    </td>
                    <td className="p-4 sm:p-6 text-purple-600 dark:text-purple-400 font-black">
                      {tMsg('Timeline D&D', 'Lini Masa D&D')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Vertically drag and drop tasks between assignees in Timeline view to redistribute workload.',
                        'Seret dan lepas tugas secara vertikal antar pekerja di tampilan Lini Masa untuk mendistribusikan beban kerja.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Smart View Transitions', 'Transisi Tampilan Cerdas')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Context-Aware', 'Sadar Konteks')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Auto-switches group layouts (e.g., Status to Project) seamlessly when changing views.',
                        'Mengalihkan tata letak grup (mis. Status ke Proyek) secara otomatis saat mengubah tampilan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Supported Views', 'Tampilan Tersedia')}
                    </td>
                    <td className="p-4 sm:p-6 text-black dark:text-white font-black">{tMsg('5 Modes', '5 Mode')}</td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Kanban Board, Table List, Gantt Timeline, Calendar, and Advanced Analytics.',
                        'Papan Kanban, Daftar Tabel, Lini Masa Gantt, Kalender, dan Analitik Lanjut.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Proactive AI Onboarding', 'Onboarding AI Proaktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Context-Aware', 'Sadar Konteks')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Full-screen AI assistant that parses user intent and autonomously builds project structures and checklists.',
                        'Asisten AI layar penuh yang mem-parsing niat pengguna dan secara otonom membangun struktur proyek dan daftar periksa.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Multi-AI Smart Assistant', 'Asisten Pintar Multi-AI')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">GPT-OSS / Gemini</td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Intelligent chat assistant powered by GPT-OSS 120B (via Groq) or Google Gemini 2.5 Flash.',
                        'Asisten obrolan cerdas yang ditenagai oleh GPT-OSS 120B (via Groq) atau Google Gemini 2.5 Flash.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('MoM Extraction', 'Ekstraksi MoM')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Enabled', 'Aktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Automatically extract actionable tasks from raw meeting notes and bulk-create them.',
                        'Otomatis mengekstrak tugas yang bisa ditindaklanjuti dari catatan rapat dan membuatnya secara massal.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Live Meeting Notepad', 'Buku Catatan Rapat Langsung')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Interactive', 'Interaktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'AI analyzes live notes, auto-captures timestamps, maps first-person pronouns, and generates non-intrusive suggestion pills.',
                        'AI menganalisis catatan langsung, merekam waktu otomatis, memetakan kata ganti, dan menghasilkan tombol saran yang tidak mengganggu.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Quick To-Do Cart', 'Keranjang To-Do Cepat')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Bulk API Execution', 'Eksekusi API Massal')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Allows users to queue multiple tasks in a local state cart and bulk-create them sequentially to prevent database connection bottlenecks.',
                        'Memungkinkan pengguna mengantrekan banyak tugas di keranjang state lokal dan membuatnya secara massal untuk mencegah hambatan koneksi database.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('AI Task Drafting', 'Draf Tugas AI')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('1-Click Generate', '1-Klik Draf')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'The AI can automatically expand your rough notes into structured, professional task briefs and descriptions inside the task form.',
                        'AI dapat secara otomatis mengembangkan catatan kasar Anda menjadi ringkasan dan deskripsi tugas yang terstruktur di dalam formulir tugas.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Executive AI Summaries', 'Ringkasan Eksekutif AI')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('On-Demand', 'Sesuai Permintaan')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Generates natural language insights combining raw dashboard data and rule-based system alerts.',
                        'Menghasilkan wawasan bahasa alami yang menggabungkan data dasbor dengan peringatan sistem.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Search Engine Architecture', 'Arsitektur Mesin Pencari')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Multi-Word Unordered', 'Pencocokan Acak Multi-Kata')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Splits queries into independent keyword tokens to match results across multiple fields regardless of word order, styled with multi-keyword highlights.',
                        'Memecah kueri menjadi token kata kunci independen untuk mencocokkan hasil di berbagai bidang tanpa mempedulikan urutan kata, dilengkapi sorotan (highlight) multi-kata.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Unread Activity Filter', 'Filter Aktivitas Belum Dibaca')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Smart Toggle', 'Tombol Cerdas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Instantly filters the dashboard to show only tasks with unread comments or mentions waiting for your reply.',
                        'Secara instan menyaring dasbor untuk hanya menampilkan tugas dengan komentar atau sebutan yang belum dibaca yang menunggu balasan Anda.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('CSV Data Export', 'Ekspor Data CSV')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('Full Access', 'Akses Penuh')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Export specific project boards or generate a global report of all your assigned tasks.',
                        'Ekspor papan proyek tertentu atau buat laporan global dari semua tugas yang diberikan kepada Anda.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Timeline Export (PDF/PNG)', 'Ekspor Lini Masa (PDF/PNG)')}
                    </td>
                    <td className="p-4 sm:p-6 text-blue-600 dark:text-blue-400 font-black">
                      {tMsg('High-Res', 'Resolusi Tinggi')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Export the entire Gantt Timeline schedule as a high-resolution PDF or PNG file, fully adapted to your active theme.',
                        'Ekspor seluruh jadwal Lini Masa Gantt sebagai berkas PDF atau PNG resolusi tinggi, yang beradaptasi penuh dengan tema aktif Anda.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Time Off & Leaves', 'Cuti & Libur')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('Smart Sync', 'Sinkronisasi Cerdas')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Register personal vacations or mass leaves to automatically adjust timeline schedules.',
                        'Daftarkan liburan pribadi atau cuti bersama untuk menyesuaikan jadwal lini masa secara otomatis.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Access Control (RBAC)', 'Kontrol Akses (RBAC)')}
                    </td>
                    <td className="p-4 sm:p-6 text-purple-600 dark:text-purple-400 font-black">
                      {tMsg('3 Tiers', '3 Tingkat')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Super Admin, Project Owner, and Member roles for granular governance and security.',
                        'Peran Super Admin, Pemilik Proyek, dan Anggota untuk tata kelola dan keamanan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Workload Analytics Model', 'Model Analitik Beban Kerja')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('ETC (Hours) Based', 'Berbasis ETC (Jam)')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Team capacity and project health are calculated using Estimated Time Consumption (ETC) instead of simple task counts for true accuracy.',
                        'Kapasitas tim dan kesehatan proyek dihitung menggunakan Estimasi Waktu Pengerjaan (ETC) alih-alih sekadar jumlah tugas untuk akurasi nyata.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Auto Nudge Scheduler', 'Penjadwal Nudge Otomatis')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('Daily at 08:00', 'Harian jam 08:00')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'A stateless background job runs daily to automatically nudge assignees of overdue or approaching tasks without bloating the database.',
                        'Proses latar belakang berjalan setiap hari untuk mengingatkan pekerja secara otomatis tentang tugas yang mendekati tenggat waktu tanpa membuat database membengkak.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('AI Role & Context Parsing', 'Penguraian Peran & Konteks AI')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Enabled', 'Aktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'AI detects linguistic cues to separate "Requesters" from "Assignees" and extracts scheduling formats.',
                        'AI mendeteksi isyarat linguistik untuk memisahkan "Peminta" dari "Pekerja" dan mengekstrak format penjadwalan.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Recurring Task Engine', 'Mesin Tugas Berulang')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('Automated Spawning', 'Penciptaan Otomatis')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Stateless recreation of Daily/Weekly/Monthly tasks upon completion without using background cron jobs.',
                        'Pembuatan ulang tugas Harian/Mingguan/Bulanan tanpa status saat selesai tanpa menggunakan cron job latar belakang.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Hybrid Queue Engine', 'Mesin Antrean Hibrida')}
                    </td>
                    <td className="p-4 sm:p-6 text-amber-600 dark:text-amber-400 font-black">
                      {tMsg('Dual Context', 'Konteks Ganda')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Server-side calculation of both project-specific and overall global queue positions dynamically injected into task responses.',
                        'Perhitungan sisi server untuk posisi antrean proyek-spesifik dan global total yang disuntikkan secara dinamis ke dalam respons tugas.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('Public Guest Preview', 'Pratinjau Tamu Publik')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Zero-Leak DLP', 'DLP Tanpa-Bocor')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Unauthenticated deep links strip sensitive fields (masked on backend) and apply CSS blur filters, acting as a secure lead-generation funnel.',
                        'Tautan dalam (deep link) tanpa autentikasi menghapus kolom sensitif (disamarkan di backend) dan menerapkan filter buram CSS, bertindak sebagai sarana promosi platform yang aman.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('URL Deep Linking', 'Deep Linking URL')}
                    </td>
                    <td className="p-4 sm:p-6 text-emerald-600 dark:text-emerald-400 font-black">
                      {tMsg('Enabled', 'Aktif')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Supports shareable URLs (e.g., ?task=1-slug) to route state in the SPA instantly with built-in auth gates and permission checks.',
                        'Mendukung URL yang dapat dibagikan (mis. ?task=1-slug) untuk merutekan status SPA secara instan dengan gerbang otentikasi bawaan dan pemeriksaan izin.'
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-bold">
                      {tMsg('AI Code & Flowchart Rendering', 'Perenderan Kode & Bagan Alir AI')}
                    </td>
                    <td className="p-4 sm:p-6 text-indigo-600 dark:text-indigo-400 font-black">
                      {tMsg('Terminal UI', 'UI Terminal')}
                    </td>
                    <td className="p-4 sm:p-6 text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {tMsg(
                        'Generates ASCII flowcharts and code in a collapsible Terminal styled block with auto-dedent and 1-click copy.',
                        'Menghasilkan bagan alir ASCII dan kode dalam blok bergaya Terminal yang dapat dilipat dengan auto-dedent dan salin 1-klik.'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Kanan: Kartu Arsitektur & Keamanan */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-6">
            <div className="bg-white dark:bg-black p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
              <h3 className="text-xl font-black uppercase tracking-wider mb-6 text-black dark:text-white flex items-center gap-3">
                <span className="text-2xl">🏗️</span> {tMsg('Architecture', 'Arsitektur')}
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    Frontend Stack
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800/50 shadow-sm">
                      React 18
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 rounded-md border border-sky-200 dark:border-sky-800/50 shadow-sm">
                      Tailwind CSS
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md border border-yellow-200 dark:border-yellow-800/50 shadow-sm">
                      Vite
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Backend & API</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                      FastAPI (Python)
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                      SQLAlchemy
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 rounded-md border border-teal-200 dark:border-teal-800/50 shadow-sm">
                      Alembic
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Database</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                      PostgreSQL (Neon)
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    Cloud Infrastructure
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white shadow-sm">
                      Vercel
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-md border border-purple-200 dark:border-purple-800/50 shadow-sm">
                      Render
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">AI Engine</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-md border border-orange-200 dark:border-orange-800/50 shadow-sm">
                      Gemini 2.5 Flash
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800/50 shadow-sm">
                      GPT-OSS 120B
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-black p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
              <h3 className="text-xl font-black uppercase tracking-wider mb-6 text-black dark:text-white flex items-center gap-3">
                <span className="text-2xl">🔒</span> {tMsg('Security', 'Keamanan')}
              </h3>
              <ul className="space-y-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('JWT Stateless Authentication', 'Otentikasi Stateless JWT')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Ensures your login session is securely verified without storing sensitive session data on the server.',
                        'Memastikan sesi login Anda diverifikasi dengan aman tanpa menyimpan data sesi sensitif di server.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Bcrypt One-Way Password Hashing', 'Hashing Sandi Satu Arah Bcrypt')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Your password is mathematically scrambled. Even database administrators cannot see your actual password.',
                        'Kata sandi Anda diacak secara matematis. Bahkan administrator database tidak dapat melihat kata sandi asli Anda.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Google Workspace SSO (OAuth 2.0)', 'SSO Google Workspace (OAuth 2.0)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Securely log in using your corporate Google account without creating a new password.',
                        'Masuk dengan aman menggunakan akun Google perusahaan Anda tanpa membuat kata sandi baru.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Role-Based Access Control (RBAC)', 'Kontrol Akses Berbasis Peran (RBAC)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Strict permission levels ensure users only see and edit what they are authorized to access.',
                        'Tingkat izin yang ketat memastikan pengguna hanya melihat dan mengedit apa yang diizinkan untuk mereka akses.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg(
                        'OWASP Top 10 Compliant (Zero-Trust Architecture)',
                        'Mematuhi Standar OWASP Top 10 (Arsitektur Zero-Trust)'
                      )}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Built defending against the top 10 most critical web application security risks globally.',
                        'Dibangun untuk bertahan dari 10 risiko keamanan aplikasi web paling kritis secara global.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg(
                        '12 Automated Penetration Tests Passed (XSS, DoS, IDOR, BOLA)',
                        '12 Uji Penetrasi Otomatis Lulus (XSS, DoS, IDOR, BOLA)'
                      )}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Via CI/CD pipelines, every code update is automatically re-tested against 12 simulated hacking attacks before going live.',
                        'Melalui pipeline CI/CD, setiap pembaruan kode secara otomatis divalidasi ulang dengan 12 simulasi serangan sebelum diizinkan tayang.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg(
                        'Rate-Limiting (Anti Brute-Force & Email Bombing)',
                        'Pembatasan Laju (Anti Brute-Force & Bom Email)'
                      )}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Automatically blocks malicious bots from guessing your password or spamming your inbox.',
                        'Secara otomatis memblokir bot jahat agar tidak menebak kata sandi Anda atau mengirim spam ke kotak masuk Anda.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✅</span>{' '}
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg(
                        'Strict Payload Limits (Database Bloat Protection)',
                        'Batas Ukuran Muatan Ketat (Cegah Pembengkakan Database)'
                      )}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Prevents attackers from uploading massive hidden files to crash the system or fill up storage.',
                        'Mencegah penyerang mengunggah file tersembunyi berukuran besar untuk membuat sistem mogok atau memenuhi penyimpanan.'
                      )}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-black p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
              <h3 className="text-xl font-black uppercase tracking-wider mb-6 text-black dark:text-white flex items-center gap-3">
                <span className="text-2xl">🛡️</span> {tMsg('12 Penetration Tests', '12 Uji Penetrasi')}
              </h3>
              <ul className="space-y-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">1.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('CORS Misconfiguration (CSWSH)', 'Kesalahan Konfigurasi CORS (CSWSH)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Ensures the API rejects requests from unauthorized external domains.',
                        'Memastikan API menolak permintaan dari domain eksternal yang tidak sah.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">2.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Anti-XSS (Cross-Site Scripting)', 'Anti-XSS (Cross-Site Scripting)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Blocks malicious HTML/JS script injections in user inputs.',
                        'Memblokir injeksi skrip HTML/JS berbahaya pada input pengguna.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">3.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Brute-Force Protection', 'Perlindungan Brute-Force')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Locks accounts after 5 failed login attempts to prevent password guessing.',
                        'Mengunci akun setelah 5 percobaan login gagal untuk mencegah penebakan sandi.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">4.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Email Bombing Protection', 'Perlindungan Bom Email')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Enforces strict cooldowns on password resets to prevent SMTP spam.',
                        'Menerapkan waktu tunggu yang ketat pada pengaturan ulang kata sandi untuk mencegah spam SMTP.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">5.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('IDOR Prevention', 'Pencegahan IDOR')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Secures project settings so only verified owners can modify them.',
                        'Mengamankan pengaturan proyek sehingga hanya pemilik terverifikasi yang dapat mengubahnya.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">6.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Information Disclosure', 'Kebocoran Informasi')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Hides sensitive user emails from non-admin accounts.',
                        'Menyembunyikan email pengguna yang sensitif dari akun non-admin.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">7.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('DoS via Long Input', 'DoS via Input Panjang')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Rejects abnormally long comments to prevent database crashes.',
                        'Menolak komentar yang tidak wajar panjangnya untuk mencegah kerusakan database.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">8.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Privilege Escalation (BFLA)', 'Eskalasi Hak Akses (BFLA)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Blocks regular users from accessing hidden super-admin endpoints.',
                        'Memblokir pengguna biasa untuk mengakses endpoint super-admin yang tersembunyi.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">9.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('BOLA (Broken Object Level Auth)', 'BOLA (Otorisasi Objek Rusak)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Ensures users cannot delete tasks belonging to other workspaces.',
                        'Memastikan pengguna tidak dapat menghapus tugas milik ruang kerja lain.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">10.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('AI Quota Exhaustion', 'Kelelahan Kuota AI')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Rate-limits AI text generation to prevent API billing spikes.',
                        'Membatasi laju pembuatan teks AI untuk mencegah lonjakan tagihan API.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">11.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Database Bloat (Avatar)', 'Pembengkakan Database (Avatar)')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Strictly limits Base64 profile picture uploads to 2MB.',
                        'Secara ketat membatasi unggahan gambar profil Base64 maksimal 2MB.'
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5">12.</span>
                  <div>
                    <span className="font-bold text-black dark:text-white">
                      {tMsg('Task Payload DoS', 'DoS Payload Tugas')}
                    </span>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      {tMsg(
                        'Caps task description sizes to prevent massive memory consumption.',
                        'Membatasi ukuran deskripsi tugas untuk mencegah konsumsi memori besar-besaran.'
                      )}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-neutral-200 dark:border-neutral-800 flex justify-center pb-10">
          <button
            onClick={close}
            className="px-12 py-5 rounded-full font-bold text-white bg-black hover:opacity-80 dark:bg-white dark:text-black border border-black dark:border-white shadow-2xl transition-all uppercase tracking-widest text-sm hover:-translate-y-1"
          >
            {tMsg('Return to Workspace', 'Kembali ke Ruang Kerja')}
          </button>
        </div>
      </div>
    </div>
  );
}
