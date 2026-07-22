import React, { useState } from 'react';
import { useCloseAnimation } from './Utils';

export default function ChangelogModal({ setIsChangelogOpen, language }) {
  const [isClosing, close] = useCloseAnimation(() => setIsChangelogOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const [visibleCount, setVisibleCount] = useState(2);

  const changelogs = [
    {
      version: 'v1.17.0',
      date: 'Latest Update',
      type: 'major',
      title: tMsg(
        'Interactive MoM Notepad & Bulk Task Creation',
        'Notepad MoM Interaktif & Pembuatan Tugas Massal'
      ),
      changes: [
        tMsg(
          'Interactive Block Editor: Overhauled the Live Meeting Notepad with a modern block editor, allowing seamless creation of headings, paragraphs, bullet points, and checkable to-do items.',
          'Editor Blok Interaktif: Merombak Notepad Rapat Langsung dengan editor blok modern, memungkinkan pembuatan judul, paragraf, poin-poin, dan daftar tugas yang dapat dicentang dengan mulus.'
        ),
        tMsg(
          'Secure & Connected Mentions: Anchored user suggestions directly beneath the active text cursor, restricted suggestion directory to verified workspace members to prevent data leaks, and added full keyboard arrow-key navigation.',
          'Penyebutan Aman & Terkoneksi: Menempatkan saran pengguna tepat di bawah kursor teks aktif, membatasi daftar saran hanya kepada anggota workspace terverifikasi untuk mencegah kebocoran data, dan menambahkan navigasi tombol panah keyboard penuh.'
        ),
        tMsg(
          'Reliable Task Extraction & Sync: Split MoM generation and task extraction into independent steps with robust JSON parsing, ensuring MoM renders correctly even if task parsing fails, and aligned task deadlines perfectly with the MoM output.',
          'Ekstraksi & Sinkronisasi Tugas Akurat: Memisahkan pembuatan MoM dan ekstraksi tugas menjadi langkah independen dengan parsing JSON yang tangguh, memastikan MoM ter-render dengan benar meskipun parsing tugas gagal, dan menyelaraskan tenggat waktu tugas secara sempurna dengan output MoM.'
        ),
        tMsg(
          'Dynamic Wrap Text & Custom Clear Confirmation: Fixed horizontal clipping issues when text wrapping is disabled by expanding textareas dynamically, and replaced browser-default confirmation popups with a modern, integrated clear notepad modal.',
          'Bungkus Teks Dinamis & Konfirmasi Kustom: Memperbaiki masalah pemotongan horizontal saat pembungkusan teks dinonaktifkan dengan memperluas textarea secara dinamis, dan mengganti konfirmasi default browser dengan modal konfirmasi hapus notepad yang modern dan terintegrasi.'
        ),
      ],
    },
    {
      version: 'v1.16.0',
      date: 'Previous Release',
      type: 'major',
      title: tMsg(
        'Conversational AI Guards & Smart View Refinements',
        'Pelindung Percakapan AI & Penyempurnaan Tampilan Cerdas'
      ),
      changes: [
        tMsg(
          'Conversational AI Guardrails: Strengthened the Smart Assistant and AI reply systems to stay strictly focused on task tracker features, politely rejecting off-topic prompts (e.g. food recipes).',
          'Batasan Percakapan AI: Memperkuat Asisten Pintar dan sistem balasan AI agar tetap fokus pada fitur pelacak tugas, menolak dengan sopan perintah di luar topik (misalnya resep makanan).'
        ),
        tMsg(
          'Optimized Inbox UI: Streamlined inbox notification cards inside the Chat Workspace by stripping rich-text markdown/HTML tags and packing title, date, and project elements into a clean single-row layout.',
          'Optimasi UI Kotak Masuk: Merapikan kartu notifikasi kotak masuk di dalam Ruang Kerja Obrolan dengan menghapus tag markdown/HTML kaya teks serta mengemas judul, tanggal, dan proyek ke dalam tata letak satu baris yang bersih.'
        ),
        tMsg(
          'Responsive Mobile Footer: Overhauled the application footer to dynamically adjust on mobile screens using a multi-row layout with reduced padding, while removing redundant external links to optimize vertical space.',
          'Footer Seluler Responsif: Merombak bagian kaki (footer) aplikasi agar menyesuaikan secara dinamis pada layar seluler menggunakan tata letak beberapa baris dengan padding yang dikurangi, serta menghapus tautan eksternal mubazir untuk mengoptimalkan ruang vertikal.'
        ),
        tMsg(
          'Countdown & Overdue Sync: Unified overdue and deadline countdown logic across the list and sidebar views, corrected midnight comparison issues to prevent false-positive overdue tasks, and removed redundant badges.',
          'Sinkronisasi Hitung Mundur & Keterlambatan: Menyatukan logika hitung mundur tenggat waktu dan keterlambatan antara tampilan daftar dan bilah sisi, memperbaiki masalah perbandingan tengah malam untuk mencegah kesalahan tugas terlambat, serta menghapus badge ganda.'
        ),
        tMsg(
          'Auto-Nudge Safeguards: Configured startup nudge logic to prevent premature midnight alerts during server restarts/cold-starts, implementing a smart failsafe check that executes only after 8:00 AM.',
          'Keamanan Nudge Otomatis: Mengonfigurasi logika nudge saat startup untuk mencegah peringatan tengah malam yang prematur selama restart/cold-start server, menerapkan pemeriksaan failsafe cerdas yang hanya berjalan setelah pukul 08:00.'
        ),
        tMsg(
          'Modern List View Design: Introduced a brand-new list view layout that departs from rigid, traditional tables, opting for a clean, card-based stream that feels fluid and modern.',
          'Desain List View Modern: Memperkenalkan tata letak tampilan daftar baru yang meninggalkan tabel tradisional yang kaku, memilih aliran berbasis kartu yang bersih, terasa fleksibel, dan modern.'
        ),
      ],
    },
    {
      version: 'v1.15.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg(
        'Dashboard Redesign & Backend Refactor (Alembic)',
        'Desain Ulang Dasbor & Refaktor Backend (Alembic)'
      ),
      changes: [
        tMsg(
          'Frontend Redesign: Replaced the monolithic grid dashboard with a split-pane layout featuring a collapsible Sidebar for quick project access and a Home Dashboard highlighting "My Tasks", "Overdue Tasks", and a "Daily AI Briefing".',
          'Desain Ulang Frontend: Mengganti dasbor grid monolitik dengan tata letak split-pane yang menampilkan Bilah Sisi (Sidebar) yang dapat diciutkan untuk akses proyek cepat dan Dasbor Beranda yang menyoroti "Tugas Saya", "Tugas Terlambat", serta "Ringkasan AI Harian".'
        ),
        tMsg(
          'Database Migrations: Configured and initialized Alembic for robust database schema migrations, moving away from raw dynamic SQL DDL execution blocks to support zero-trust database access.',
          'Migrasi Database: Mengonfigurasi dan menginisialisasi Alembic untuk migrasi skema database yang kuat, meninggalkan eksekusi SQL DDL mentah yang dinamis untuk mendukung akses database zero-trust.'
        ),
        tMsg(
          'Data Integrity: Converted date/time columns from String/TEXT to proper DateTime types for robust PostgreSQL TIMESTAMP support.',
          'Integritas Data: Mengonversi kolom tanggal/waktu dari String/TEXT menjadi tipe DateTime yang tepat untuk dukungan TIMESTAMP PostgreSQL yang kuat.'
        ),
        tMsg(
          'Security & Linting: Unified dynamic database columns inside the Request model and fixed multiple Pyrefly linting issues and frontend date formatting.',
          'Keamanan & Linting: Menyatukan kolom database dinamis di dalam model Request dan memperbaiki beberapa masalah linting Pyrefly serta format tanggal frontend.'
        ),
      ],
    },
    {
      version: 'v1.14.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg(
        'AI Intent Detection & Auto-Nudge Upgrades',
        'Deteksi Intensi AI & Peningkatan Nudge Otomatis'
      ),
      changes: [
        tMsg(
          'Smart Deadline Detection: The AI now selectively extracts deadlines only when explicitly mentioned. Tasks in To-Do lists will seamlessly remain without deadlines unless requested.',
          'Deteksi Tenggat Waktu Cerdas: AI kini secara selektif mengekstrak tenggat waktu hanya saat disebutkan secara eksplisit. Tugas di To-Do list akan mulus tetap tanpa tenggat waktu kecuali diminta.'
        ),
        tMsg(
          'Conversational Auto-Nudge: Asking the AI to "remind" you will now automatically toggle the Auto Nudge feature ON for drafted tasks, complete with visual badges in the Task Cart.',
          'Nudge Otomatis Percakapan: Meminta AI untuk "mengingatkan" Anda kini akan otomatis mengaktifkan fitur Nudge Otomatis untuk draf tugas, lengkap dengan badge visual di Keranjang Tugas.'
        ),
        tMsg(
          'Recurring Task Highlights: Freshly cloned recurring tasks now stand out with a glowing border and a pulsing "NEW CLONE" badge in both Kanban and List views, persisting throughout your active session.',
          'Sorotan Tugas Berulang: Tugas berulang yang baru saja dikloning kini tampil menonjol dengan bingkai menyala dan lencana "NEW CLONE" yang berkedip pada tampilan Kanban dan List, bertahan selama sesi aktif Anda.'
        ),
      ],
    },
    {
      version: 'v1.13.0',
      date: 'Previous Release',
      type: 'major',
      title: tMsg(
        'AI Stability & Robust Recurring Tasks',
        'Stabilitas AI & Tugas Berulang Tingkat Lanjut'
      ),
      changes: [
        tMsg(
          'AI Network Optimization: Resolved CORS and networking issues to ensure a smooth, uninterrupted experience when generating tasks via the Smart Assistant.',
          'Optimasi Jaringan AI: Menyelesaikan masalah CORS dan jaringan untuk memastikan pengalaman yang lancar dan tanpa gangguan saat menghasilkan tugas melalui Asisten Pintar.'
        ),
        tMsg(
          'Robust Clone Tracking: When a recurring task is completed, its new cycle clone is now explicitly tracked by the backend and instantly highlighted in your pending list without requiring a refresh.',
          'Pelacakan Kloning Akurat: Saat tugas berulang diselesaikan, kloning siklus barunya kini dilacak secara eksplisit oleh backend dan langsung disorot di daftar antrean Anda tanpa perlu menyegarkan halaman.'
        ),
        tMsg(
          'Subtask Modal Safeguard: Moving a task to "Done" while subtasks are unfinished now properly triggers the confirmation modal and successfully spawns recurring clones if forced to complete.',
          'Keamanan Modal Subtugas: Memindahkan tugas ke "Selesai" saat subtugas belum rampung kini memicu modal konfirmasi dengan benar dan berhasil melahirkan kloning berulang jika dipaksa selesai.'
        ),
      ],
    },
    {
      version: 'v1.12.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg(
        'Interactive AI Planner & Smart Assistant Upgrades',
        'Perencana AI Interaktif & Peningkatan Asisten Pintar'
      ),
      changes: [
        tMsg(
          'In-Drawer AI Task Planner: The Proactive AI Planner has been seamlessly integrated into the Smart Assistant drawer as a dedicated mini-app, moving away from the full-screen modal for a smoother workflow.',
          'Perencana Tugas AI dalam Laci: Perencana AI Proaktif telah diintegrasikan dengan mulus ke dalam laci Asisten Pintar sebagai aplikasi mini khusus, meninggalkan modal layar penuh untuk alur kerja yang lebih lancar.'
        ),
        tMsg(
          'Interactive Draft Cart: AI-generated tasks are now presented in an interactive cart. You can individually select tasks, adjust their target projects, and view auto-assigned deadlines and impact levels before dispatching.',
          'Keranjang Draf Interaktif: Tugas yang dihasilkan AI kini disajikan dalam keranjang interaktif. Anda dapat memilih tugas secara individual, menyesuaikan proyek tujuan mereka, dan melihat tenggat waktu serta tingkat dampak yang ditetapkan otomatis sebelum dikirim.'
        ),
        tMsg(
          'Smart Reset & Discard Protection: Added a universal "Reset ↻" button across all Smart Assistant modes. Accidentally closing the drawer or hitting reset will now trigger a secure confirmation modal if you have unsaved drafts.',
          'Reset Cerdas & Perlindungan Buang: Menambahkan tombol "Ulang ↻" universal di semua mode Asisten Pintar. Menutup laci secara tidak sengaja atau menekan reset kini akan memicu modal konfirmasi aman jika Anda memiliki draf yang belum disimpan.'
        ),
        tMsg(
          'Auto-scroll & UI Refinements: The Smart Assistant now automatically scrolls to the newest generated tasks, features step-by-step drafting animations, and supports sending prompts directly via the Enter key.',
          'Gulir Otomatis & Penyempurnaan UI: Asisten Pintar kini otomatis menggulir ke tugas terbaru yang dihasilkan, menampilkan animasi penyusunan bertahap, dan mendukung pengiriman perintah langsung melalui tombol Enter.'
        ),
      ],
    },
    {
      version: 'v1.11.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Timeline Export to PDF/PNG', 'Ekspor Lini Masa ke PDF/PNG'),
      changes: [
        tMsg(
          'You can now export the entire Timeline view as a high-resolution PDF or PNG file.',
          'Anda kini dapat mengekspor seluruh tampilan Lini Masa sebagai berkas PDF atau PNG resolusi tinggi.'
        ),
        tMsg(
          'The export engine accurately captures the current theme (Light or Dark Mode) and renders all task details and colors correctly.',
          'Mesin ekspor secara akurat menangkap tema yang sedang aktif (Mode Terang atau Gelap) dan merender semua detail serta warna tugas dengan benar.'
        ),
      ],
    },
    {
      version: 'v1.10.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Public Task Preview & Hybrid Queue', 'Pratinjau Tugas Publik & Antrean Hibrida'),
      changes: [
        tMsg(
          'Secure Guest Preview: Shareable task links now display a read-only, blurred preview of sensitive data for unauthenticated guests, stimulating them to login while preventing data leaks.',
          'Pratinjau Tamu Aman: Tautan tugas yang dibagikan kini menampilkan pratinjau buram (read-only) untuk data sensitif bagi tamu yang belum login, memancing mereka untuk masuk tanpa membocorkan data.'
        ),
        tMsg(
          'Hybrid Queue System: Task cards now dynamically display their exact queue position (e.g., "Queue #1 of 5"). It intelligently switches between "Project Queue" and "Overall Queue" depending on your active view.',
          'Sistem Antrean Hibrida: Kartu tugas kini menampilkan posisi antrean pastinya secara dinamis. Sistem cerdas ini beralih antara "Antrean Proyek" dan "Antrean Total" tergantung pada tampilan aktif Anda.'
        ),
        tMsg(
          'Smart Assistant Upgrades: The AI now supports multi-project routing via "#project", strictly differentiates between Assignees ("@user") and Requesters, and intelligently extracts Deadlines and ETCs from your natural language prompts.',
          'Peningkatan Asisten Pintar: AI kini mendukung perutean multi-proyek via "#proyek", membedakan secara tegas antara Pekerja ("@user") dan Peminta, serta secara cerdas mengekstrak Tenggat Waktu dan ETC dari perintah bahasa alami Anda.'
        ),
        tMsg(
          'Redesigned Task Cart: Drafted tasks are now displayed as rich Kanban-style cards inside the cart. Featuring sequential slide-up animations, detailed workload metrics, and clear "Auto-Invite" indicators before submission.',
          'Desain Ulang Keranjang Tugas: Draf tugas kini ditampilkan sebagai kartu bergaya Kanban di dalam keranjang. Menampilkan animasi slide-up berurutan, metrik beban kerja mendetail, dan indikator "Auto-Invite" yang jelas sebelum pengiriman.'
        ),
      ],
    },
    {
      version: 'v1.9.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Smart Nudge & Automated Follow-ups', 'Pantauan Cerdas & Tindak Lanjut Otomatis'),
      changes: [
        tMsg(
          'Private Workspaces: You can now choose to create a Private Project that is securely locked to you only, disabling team chat and invitations.',
          'Ruang Kerja Pribadi: Anda kini dapat memilih untuk membuat Proyek Pribadi yang terkunci aman hanya untuk Anda, menonaktifkan obrolan tim dan undangan.'
        ),
        tMsg(
          'Introduced Smart Nudge: Let the AI instantly draft context-aware follow-up messages for task assignees with a single click.',
          'Memperkenalkan Pantauan Cerdas: Biarkan AI langsung membuat pesan tindak lanjut yang peka konteks untuk pekerja tugas dengan satu klik.'
        ),
        tMsg(
          'Added Auto Nudge: A stateless background scheduler that runs daily at 08:00 AM to automatically remind assignees of approaching or overdue deadlines.',
          'Menambahkan Nudge Otomatis: Penjadwal latar belakang stateless yang berjalan setiap hari pukul 08:00 untuk secara otomatis mengingatkan pekerja tentang tenggat waktu yang mendekati atau yang sudah lewat.'
        ),
        tMsg(
          'Added Task-Level Auto Nudge Control: Easily toggle automated reminders on or off for specific tasks directly from the task view.',
          'Menambahkan Kontrol Nudge Otomatis Tingkat Tugas: Aktifkan atau nonaktifkan pengingat otomatis dengan mudah untuk tugas tertentu langsung dari tampilan tugas.'
        ),
        tMsg(
          'Introduced Recurring Tasks: Set tasks to repeat Daily, Weekly, or Monthly. The system will automatically spawn the next cycle when the current task is marked as Done.',
          'Memperkenalkan Tugas Berulang: Atur tugas untuk berulang Harian, Mingguan, atau Bulanan. Sistem akan otomatis membuat siklus berikutnya saat tugas saat ini ditandai Selesai.'
        ),
        tMsg(
          'Upgraded AI Context Parsing: The Smart Assistant now intelligently differentiates between Task Assignees and Requesters based on conversational context.',
          'Peningkatan Parsing Konteks AI: Asisten Pintar kini secara cerdas membedakan antara Pekerja Tugas dan Peminta berdasarkan konteks percakapan.'
        ),
        tMsg(
          'UI & UX Refinements: Reorganized the task form and detail layouts for better readability, and added a quick reset feature when cancelling drafts.',
          'Penyempurnaan UI & UX: Menata ulang tata letak formulir dan detail tugas agar lebih mudah dibaca, serta menambahkan fitur reset cepat saat membatalkan draf.'
        ),
        tMsg(
          'Advanced Workload Distribution: Task ETC is now automatically divided and distributed evenly among the main assignee and all sub-task assignees for hyper-accurate capacity tracking.',
          'Distribusi Beban Kerja Lanjutan: ETC tugas kini otomatis dibagi dan didistribusikan secara merata antara pekerja utama dan semua pekerja sub-tugas untuk pelacakan kapasitas yang sangat akurat.'
        ),
        tMsg(
          'Analytics Upgrade: The Team Workload chart now strictly compares active tasks against a standard 40-hour weekly capacity, instantly highlighting overwhelmed members.',
          'Peningkatan Analitik: Grafik Beban Kerja Tim kini secara ketat membandingkan tugas aktif dengan batas kapasitas 40 jam mingguan, menyoroti anggota yang kewalahan secara instan.'
        ),
        tMsg(
          'Resizable Chat Workspace: You can now freely drag and resize both the sidebar and the task preview panels in the Chat Workspace for optimal viewing.',
          'Ruang Kerja Obrolan Fleksibel: Anda kini dapat menarik dan mengubah ukuran bilah sisi serta panel pratinjau tugas di Ruang Kerja Obrolan secara bebas untuk tampilan optimal.'
        ),
        tMsg(
          'Live Meeting Notepad: The Smart Assistant now doubles as a real-time notepad during meetings, automatically tracking dates and times for deadline mapping.',
          'Buku Catatan Rapat Langsung: Asisten Pintar kini berfungsi ganda sebagai buku catatan real-time selama rapat, melacak tanggal dan waktu secara otomatis untuk pemetaan tenggat waktu.'
        ),
        tMsg(
          'Interactive AI Suggestions: Instead of cluttering the chat, the AI generates smart follow-up question pills above the chat box to help you capture every detail.',
          'Saran AI Interaktif: Daripada memenuhi obrolan, AI menghasilkan tombol saran pertanyaan lanjutan di atas kotak obrolan untuk membantu Anda menangkap setiap detail.'
        ),
        tMsg(
          'Self-Assign Recognition: The AI now understands first-person pronouns (I, me, saya) during meetings and assigns those tasks directly to you.',
          'Pengenalan Penugasan Diri: AI kini memahami kata ganti orang pertama (I, me, saya) selama rapat dan langsung menugaskan pekerjaan tersebut kepada Anda.'
        ),
        tMsg(
          'Quick To-Do List: Rapidly draft and bulk-save multiple tasks using an interactive, cart-like UI inside the Smart Assistant.',
          'To-Do List Cepat: Susun dan simpan banyak tugas secara massal dengan cepat menggunakan UI interaktif bergaya keranjang di dalam Asisten Pintar.'
        ),
        tMsg(
          'Upgraded Search Engine: All search bars now support multi-word unordered matching, allowing you to find tasks, projects, and chats using keywords in any order, just like Google.',
          'Peningkatan Mesin Pencari: Semua bilah pencarian kini mendukung pencocokan acak multi-kata, memungkinkan Anda menemukan tugas, proyek, dan obrolan menggunakan kata kunci acak layaknya Google.'
        ),
        tMsg(
          'Internal Deep Linking: Generate and share direct links to specific tasks or projects. Clicking the link instantly teleports the user to the exact view.',
          'Deep Linking Internal: Buat dan bagikan tautan langsung ke tugas atau proyek tertentu. Mengeklik tautan secara instan menteleportasi pengguna ke tampilan yang tepat.'
        ),
      ],
    },
    {
      version: 'v1.8.0',
      date: 'Previous Release',
      type: 'major',
      title: tMsg('ETC Workload Analytics & Privacy Enhancements', 'Analitik Beban Kerja ETC & Peningkatan Privasi'),
      changes: [
        tMsg(
          'Introduced Estimated Time Consumption (ETC): Tasks are now measured by hours instead of simple counts, radically improving workload accuracy.',
          'Memperkenalkan Estimasi Waktu Pengerjaan (ETC): Tugas kini diukur dalam jam, bukan sekadar jumlah, meningkatkan akurasi beban kerja secara drastis.'
        ),
        tMsg(
          'Overhauled the Analytics Dashboard to use ETC for Project Health Score, Completion Rates, and Top Performers (Velocity).',
          'Merombak Dasbor Analitik untuk menggunakan perhitungan ETC pada Skor Kesehatan Proyek, Tingkat Penyelesaian, dan Performa Terbaik.'
        ),
        tMsg(
          'Smart Assistant AI now automatically estimates task ETC based on complexity if left blank.',
          'Asisten Pintar AI kini secara otomatis memperkirakan ETC tugas berdasarkan kompleksitas jika dibiarkan kosong.'
        ),
        tMsg(
          'Enhanced Data Privacy: Unconnected users are now completely hidden from partial searches in Direct Messages and Team Invites.',
          'Peningkatan Privasi Data: Pengguna yang belum terhubung kini sepenuhnya disembunyikan dari pencarian parsial di Pesan Langsung dan Undangan Tim.'
        ),
      ],
    },
    {
      version: 'v1.7.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Proactive AI & UX Refinements', 'AI Proaktif & Peningkatan UX'),
      changes: [
        tMsg(
          'Introduced Proactive AI: A full-screen AI assistant that automatically builds your first "To-do List" project after the welcome tour.',
          'Memperkenalkan AI Proaktif: Asisten AI layar penuh yang otomatis membuat proyek "To-do List" pertama Anda setelah tur selamat datang.'
        ),
        tMsg(
          'Renamed "Global Export" to "Get All My Data" for better clarity.',
          'Mengubah nama "Ekspor Global" menjadi "Dapatkan Semua Data" agar lebih jelas.'
        ),
        tMsg(
          'Renamed "Global Workload" to "See the Big Picture" to better reflect its master-view capabilities.',
          'Mengubah nama "Beban Kerja Global" menjadi "Lihat Gambaran Besar" untuk mencerminkan kemampuannya sebagai tampilan utama.'
        ),
        tMsg(
          'Significantly improved chat performance and text selection by isolating the Live Clock component rendering.',
          'Meningkatkan performa obrolan dan seleksi teks secara signifikan dengan mengisolasi rendering komponen Jam Langsung.'
        ),
        tMsg(
          'Smart Assistant now proactively offers to guide you through the documentation after completing an automated task generation.',
          'Asisten Pintar kini secara proaktif menawarkan panduan dokumentasi setelah selesai membuat tugas otomatis.'
        ),
        tMsg(
          'Integrated Smart Assistant into the "New Request" button. You can now chat naturally to let AI instantly extract task details, sub-tasks, and assignees into the form.',
          'Asisten Pintar kini terintegrasi pada tombol "Tugas Baru". Anda dapat mengetik secara natural agar AI langsung mengekstrak detail tugas, sub-tugas, dan pekerja ke dalam formulir.'
        ),
        tMsg(
          'Introduced Task Impact levels (High, Medium, Low) and Smart Deadline Countdowns across all views.',
          'Memperkenalkan tingkat Dampak Tugas (Tinggi, Sedang, Rendah) dan Hitung Mundur Tenggat Waktu Cerdas di semua tampilan.'
        ),
        tMsg(
          'Enabled Cross-Project Task Transfers: Move tasks via Edit mode, Bulk Transfer in Table List, or Drag-and-Drop in Global Kanban.',
          'Mengaktifkan Transfer Tugas Lintas Proyek: Pindahkan tugas via mode Edit, Transfer Massal di Daftar Tabel, atau Seret-dan-Lepas di Kanban Global.'
        ),
        tMsg(
          'Clicking the INNOCEAN Tracker logo now instantly launches the full-screen Proactive AI Planner.',
          'Mengeklik logo INNOCEAN Tracker kini secara instan meluncurkan Perencana AI Proaktif layar penuh.'
        ),
      ],
    },
    {
      version: 'v1.6.0',
      date: 'Previous Release',
      type: 'major',
      title: tMsg('Unified Workspace Chat & Direct Messaging', 'Ruang Kerja Obrolan Terpadu & Pesan Pribadi'),
      changes: [
        tMsg(
          'Introduced Direct Messages (DM) for private 1-on-1 team communication.',
          'Memperkenalkan Pesan Pribadi (DM) untuk komunikasi tim 1-on-1 secara privat.'
        ),
        tMsg(
          'Migrated Team Chat into a full-screen Chat Workspace with a dedicated Inbox for recent activities.',
          'Memigrasikan Obrolan Tim ke dalam Ruang Kerja Obrolan layar penuh dengan Kotak Masuk khusus untuk aktivitas terbaru.'
        ),
        tMsg(
          'Added Auto-Preview functionality inside the Chat Workspace to instantly view and edit tasks side-by-side.',
          'Menambahkan fungsi Pratinjau Otomatis di dalam Ruang Kerja Obrolan untuk melihat dan mengedit tugas berdampingan.'
        ),
        tMsg(
          'Added Real-Time Auto-Sync: The workspace, task boards, and chats silently synchronize in the background.',
          'Menambahkan Sinkronisasi Otomatis: Ruang kerja, papan tugas, dan obrolan disinkronkan secara diam-diam di latar belakang.'
        ),
        tMsg(
          'Introduced In-Chat Search & Auto-Scroll: Search past discussions and instantly jump to the exact message.',
          'Memperkenalkan Pencarian Obrolan: Cari diskusi lama dan langsung melompat ke pesan yang tepat dalam riwayat.'
        ),
      ],
    },
    {
      version: 'v1.5.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Smart ASCII Flowcharts & Advanced Filters', 'Bagan Alir ASCII Pintar & Filter Lanjutan'),
      changes: [
        tMsg(
          'Upgraded AI Agent to generate conceptual program architectures and ASCII-art flowcharts.',
          'Meningkatkan Agen AI untuk menghasilkan arsitektur program konseptual dan bagan alir ASCII.'
        ),
        tMsg(
          'Introduced Terminal styled, collapsible code blocks for better readability.',
          'Memperkenalkan blok kode bergaya Terminal yang dapat dilipat untuk keterbacaan yang lebih baik.'
        ),
        tMsg(
          'Added Unread Activity Filter: Instantly cut through the noise to show tasks with new comments or mentions.',
          'Menambahkan Filter Aktivitas Belum Dibaca: Langsung menyaring tugas dengan komentar atau sebutan baru.'
        ),
        tMsg(
          'Added Smart Mention Jumper: A floating button that teleports you to the exact message you were mentioned in.',
          'Menambahkan Pelompat Sebutan Cerdas: Tombol mengambang yang menteleportasi Anda ke pesan yang menyebut Anda.'
        ),
        tMsg(
          'Meeting Notes (MoM) Extraction: AI can now convert raw meeting notes into bulk actionable tasks.',
          'Ekstraksi Catatan Rapat (MoM): AI kini dapat mengubah catatan rapat menjadi tugas massal yang dapat ditindaklanjuti.'
        ),
      ],
    },
    {
      version: 'v1.4.0',
      date: 'Previous Release',
      type: 'major',
      title: tMsg('UI Enhancements & Micro-Interactions', 'Peningkatan UI & Interaksi Mikro'),
      changes: [
        tMsg(
          'Restructured Task Details into a highly compact 3-column layout.',
          'Menata ulang Detail Tugas menjadi tata letak 3 kolom yang sangat padat.'
        ),
        tMsg(
          'Google Meet & Calendar actions now open in dedicated in-app popup windows.',
          'Aksi Google Meet & Kalender kini terbuka di jendela popup in-app khusus.'
        ),
        tMsg(
          'Added Interactive Floating Trash Bin: Delete tasks by simply dragging and dropping them into the bin.',
          'Menambahkan Tong Sampah Mengambang: Hapus tugas dengan menyeret dan menjatuhkannya ke tempat sampah.'
        ),
        tMsg(
          'Task Completion Safeguard: Prevents moving a task to "Done" if it still contains unfinished checklists.',
          'Pencegahan Penyelesaian Tugas: Mencegah tugas dipindah ke "Selesai" jika masih ada daftar periksa yang belum selesai.'
        ),
        tMsg(
          'Rapid Task Entry: Use the empty row at the bottom of the Table List to quickly add new tasks.',
          'Entri Tugas Cepat: Gunakan baris kosong di bawah Daftar Tabel untuk menambahkan tugas baru dengan cepat.'
        ),
      ],
    },
    {
      version: 'v1.3.0',
      date: 'Security Release',
      type: 'major',
      title: tMsg('Enterprise Security & Support Tickets', 'Keamanan Perusahaan & Tiket Dukungan'),
      changes: [
        tMsg(
          'Implemented Zero-Trust Architecture passing 12 automated penetration tests.',
          'Menerapkan Arsitektur Zero-Trust yang lulus 12 uji penetrasi otomatis.'
        ),
        tMsg(
          'Protected against OWASP Top 10 vulnerabilities (XSS, CSWSH, DoS, IDOR, BOLA).',
          'Melindungi dari kerentanan OWASP Top 10 (XSS, CSWSH, DoS, IDOR, BOLA).'
        ),
        tMsg(
          'Introduced Ticketing System: Submit Ideas or IT Support requests directly to the Admin queue.',
          'Memperkenalkan Sistem Tiket: Kirim Ide atau permintaan Dukungan IT langsung ke antrean Admin.'
        ),
        tMsg(
          'Added "My Tickets" Panel: Track the status of your submitted feedback and support requests.',
          'Menambahkan Panel "Tiket Saya": Lacak status masukan dan permintaan dukungan yang Anda kirimkan.'
        ),
      ],
    },
    {
      version: 'v1.2.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Team Leave Management & Global Search', 'Manajemen Cuti Tim & Pencarian Global'),
      changes: [
        tMsg(
          'Added Time Off & Leaves: Register personal vacations or mass leaves to automatically adjust timeline schedules.',
          'Menambahkan Cuti & Libur: Daftarkan liburan pribadi atau cuti bersama untuk menyesuaikan jadwal lini masa.'
        ),
        tMsg(
          'Introduced Admin Panel: Super Admins can manage users, freeze accounts, and rescue orphaned projects.',
          'Memperkenalkan Panel Admin: Super Admin dapat mengelola pengguna, membekukan akun, dan menyelamatkan proyek.'
        ),
        tMsg(
          'Added Global Search Bar: Instantly search and teleport to tasks, projects, or assignees globally.',
          'Menambahkan Pencarian Global: Cari dan teleportasi ke tugas, proyek, atau pekerja secara global.'
        ),
        tMsg(
          'Smart Link Attachments: URLs from Google Drive, Figma, and OneDrive automatically transform into visual cards.',
          'Lampiran Tautan Cerdas: URL dari Google Drive, Figma, dan OneDrive otomatis berubah menjadi kartu visual.'
        ),
      ],
    },
    {
      version: 'v1.1.0',
      date: 'Previous Release',
      type: 'feature',
      title: tMsg('Smart Notifications & UI Customization', 'Notifikasi Cerdas & Kustomisasi UI'),
      changes: [
        tMsg(
          'Introduced Smart Notifications: Instant in-app alerts, desktop native notifications, and email dispatches.',
          'Memperkenalkan Notifikasi Cerdas: Peringatan dalam aplikasi instan, notifikasi desktop, dan pengiriman email.'
        ),
        tMsg(
          'Added UI Customization: Personalize your workspace with Dark Mode, custom themes, and texture overlays.',
          'Menambahkan Kustomisasi UI: Personalisasi ruang kerja Anda dengan Mode Gelap, tema kustom, dan tekstur.'
        ),
        tMsg(
          'Added CSV Export: Export specific project boards or generate a global report of all assigned tasks.',
          'Menambahkan Ekspor CSV: Ekspor papan proyek tertentu atau buat laporan global dari semua tugas yang ditugaskan.'
        ),
        tMsg(
          'Sub-task Reordering: Drag and drop checklist items to reorganize their priority easily.',
          'Penyusunan Ulang Sub-tugas: Seret dan lepas item daftar periksa untuk mengatur ulang prioritasnya dengan mudah.'
        ),
      ],
    },
    {
      version: 'v1.0.0',
      date: 'Initial Launch',
      type: 'release',
      title: tMsg('INNOCEAN Tracker MVP', 'INNOCEAN Tracker MVP'),
      changes: [
        tMsg(
          'Launched core Kanban, Timeline (Gantt), and Calendar views.',
          'Meluncurkan inti Papan Kanban, Lini Masa (Gantt), dan tampilan Kalender.'
        ),
      ],
    },
  ];

  const visibleLogs = changelogs.slice(0, visibleCount);

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-neutral-950 z-100 overflow-y-auto transition-opacity duration-200 ${
        isClosing ? 'mac-exit opacity-0' : 'mac-animate opacity-100'
      }`}
    >
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-screen">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-6 mb-12 border-b border-neutral-200 dark:border-neutral-800 pb-8 shrink-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase mb-2">
              Changelog
            </h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              {tMsg('Product Updates & Release Notes', 'Pembaruan Produk & Catatan Rilis')}
            </p>
          </div>
          <button
            onClick={close}
            className="bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-black dark:text-white px-6 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <span>✖</span> {tMsg('Close', 'Tutup')}
          </button>
        </div>

        <div className="flex-1 text-black dark:text-white relative">
          <div className="absolute left-4 md:left-27.5 top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
          <div className="space-y-16 pb-12 relative z-10">
            {visibleLogs.map((log, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-6 md:gap-12 relative mac-animate">
                <div className="hidden md:flex flex-col items-end w-20 shrink-0 pt-1">
                  <span className="text-sm font-black text-black dark:text-white">{log.version}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1 text-right">
                    {log.date}
                  </span>
                </div>
                <div
                  className={`absolute left-4 md:left-27.5 w-3 h-3 rounded-full -translate-x-1.25 mt-2 ring-4 ring-white dark:ring-neutral-950 ${
                    log.type === 'major'
                      ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                      : log.type === 'feature'
                      ? 'bg-emerald-500'
                      : 'bg-blue-500'
                  }`}
                ></div>
                <div className="flex-1 pl-10 md:pl-0">
                  <div className="md:hidden flex items-center gap-3 mb-2">
                    <span className="text-xs font-black text-black dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                      {log.version}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{log.date}</span>
                  </div>
                  <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      {log.type === 'major' && <span className="text-2xl">🚀</span>}
                      {log.type === 'feature' && <span className="text-2xl">✨</span>}
                      {log.type === 'release' && <span className="text-2xl">🎉</span>}
                      <h3 className="text-xl md:text-2xl font-black uppercase text-black dark:text-white">
                        {log.title}
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {log.changes.map((change, cIdx) => (
                        <li
                          key={cIdx}
                          className="flex gap-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed"
                        >
                          <span className="text-indigo-500 mt-1 shrink-0">✦</span>
                          <span dangerouslySetInnerHTML={{ __html: change }}></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {visibleCount < changelogs.length && (
              <div className="flex justify-center mt-12 relative z-20">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 2)}
                  className="px-6 py-3 rounded-full font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 shadow-sm text-xs uppercase"
                >
                  {tMsg('Load older updates', 'Muat pembaruan lama')}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={close}
            className="px-12 py-4 rounded-full font-bold text-white bg-black hover:opacity-80 shadow-lg text-sm"
          >
            {tMsg('Return to App', 'Kembali ke Aplikasi')}
          </button>
        </div>
      </div>
    </div>
  );
}
