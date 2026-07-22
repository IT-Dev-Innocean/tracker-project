import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useCloseAnimation, HighlightText } from './Utils';

// Helper untuk menghasilkan cuplikan pencarian (snippet)
const generateSnippet = (text, query) => {
  if (!text || !query) return '';
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text.substring(0, 80) + '...';

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 40);
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
};

// Helper untuk merender konten dengan Highlight tanpa merusak tag HTML (strong)
const renderContent = (content, query) => {
  let html = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-bold">$1</strong>');
  if (query) {
    const keywords = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (keywords.length > 0) {
      const regex = new RegExp(`(${keywords.join('|')})(?![^<]*>)`, 'gi');
      html = html.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-100 rounded-sm px-1">$1</mark>'
      );
    }
  }
  return { __html: html };
};

// Database Dokumentasi
const getDocData = (tMsg, isSuperAdmin) => {
  const data = [
    {
      id: 'overview',
      group: tMsg('Get Started', 'Mulai'),
      title: tMsg('Overview', 'Ikhtisar'),
      desc: tMsg(
        'Everything you need to know about managing your team workflow, from creating your first task to mastering automated deadlines and advanced analytics.',
        'Segala yang perlu Anda ketahui tentang mengelola alur kerja tim Anda, mulai dari membuat tugas pertama hingga menguasai tenggat waktu otomatis dan analitik lanjutan.'
      ),
      sections: [
        {
          id: 'what-is-tracker',
          title: tMsg('What is INNOCEAN Tracker?', 'Apa itu INNOCEAN Tracker?'),
          content: tMsg(
            "<strong>INNOCEAN Tracker</strong> is an advanced, AI-powered project management and team collaboration platform designed to streamline your daily workflows. It serves as the central hub for your team to plan, track, and execute projects with precision.<br /><br />More than just a to-do list, the app offers a dynamic suite of features including real-time Kanban boards, interactive Gantt timelines, comprehensive workload analytics, and automated recurring tasks. With built-in AI assistants to estimate time, generate reports, and proactively plan your day, INNOCEAN Tracker empowers professionals to eliminate bottlenecks, balance team workloads, and deliver outstanding results on time.",
            "<strong>INNOCEAN Tracker</strong> adalah platform manajemen proyek dan kolaborasi tim canggih berbasis AI yang dirancang untuk menyederhanakan alur kerja harian Anda. Aplikasi ini berfungsi sebagai pusat kendali utama bagi tim Anda untuk merencanakan, melacak, dan mengeksekusi proyek dengan presisi.<br /><br />Lebih dari sekadar daftar tugas, aplikasi ini menawarkan serangkaian fitur dinamis termasuk papan Kanban <em>real-time</em>, lini masa Gantt interaktif, analitik beban kerja komprehensif, dan otomatisasi tugas berulang. Dilengkapi dengan asisten AI bawaan untuk mengestimasi waktu, membuat laporan, dan merencanakan hari Anda secara proaktif, INNOCEAN Tracker memberdayakan para profesional untuk menghilangkan hambatan, menyeimbangkan beban kerja tim, dan memberikan hasil pekerjaan yang luar biasa tepat pada waktunya."
          ),
        },
      ],
      seeAlso: ['workspace', 'tasks'],
    },
    {
      id: 'workspace',
      group: tMsg('Get Started', 'Mulai'),
      title: tMsg('Workspace & Projects', 'Ruang Kerja & Proyek'),
      desc: tMsg(
        'INNOCEAN Tracker is organized into secure, isolated project workspaces. Think of a Project as a folder that contains specific campaigns, tasks, and authorized team members.',
        'INNOCEAN Tracker diatur dalam ruang kerja proyek yang aman dan terisolasi. Pikirkan Proyek sebagai folder yang berisi kampanye spesifik, tugas, dan anggota tim yang berwenang.'
      ),
      sections: [
        {
          id: 'creating-projects',
          title: tMsg('Creating Projects', 'Membuat Proyek'),
          content: tMsg(
            "On the sidebar, click the 'New Project' button. You can choose to create a **Team Workspace** for collaboration or a **Private Workspace** (locked exclusively to you). The system prevents duplicate project names to keep your workspace organized. As the creator, you become the Project Owner.",
            "Di bilah sisi (sidebar), klik tombol 'Proyek Baru'. Anda dapat memilih untuk membuat **Ruang Kerja Tim** untuk kolaborasi atau **Ruang Kerja Pribadi** (terkunci khusus untuk Anda). Sistem mencegah duplikasi nama proyek untuk menjaga ruang kerja teratur. Sebagai pembuat, Anda menjadi Pemilik Proyek."
          ),
        },
        {
          id: 'project-views-favorites',
          title: tMsg('Project Views & Favorites', 'Tampilan Proyek & Favorit'),
          content: tMsg(
            "Use the Sidebar to access all your projects. You can search or sort them by 'Most Active', 'Recent', or 'Alphabetical'. Click the star (⭐) to pin important projects so they always stay visible at the top. The Home Dashboard will also summarize your active tasks, overdue tasks, and provide a Daily AI Briefing.",
            "Gunakan Bilah Sisi (Sidebar) untuk mengakses semua proyek Anda. Anda dapat mencari atau mengurutkannya berdasarkan 'Paling Aktif', 'Terbaru', atau 'Alfabet'. Klik bintang (⭐) untuk menyematkan proyek penting agar selalu terlihat di atas. Dasbor Beranda juga merangkum tugas aktif Anda, tugas yang terlambat, serta memberikan Ringkasan Harian AI."
          ),
        },
        {
          id: 'project-health-alerts',
          title: tMsg('Project Health Alerts', 'Peringatan Kesehatan Proyek'),
          content: tMsg(
            'Project cards proactively display AI alerts if team members are overloaded or facing critical deadlines.',
            'Kartu proyek secara proaktif menampilkan peringatan AI jika anggota tim terlalu terbebani atau menghadapi tenggat waktu kritis.'
          ),
        },
        {
          id: 'accessing-project',
          title: tMsg('Accessing a Project', 'Mengakses Proyek'),
          content: tMsg(
            'Click on any project card on your dashboard to open its workspace. You will only see projects you created or were invited to.',
            'Klik kartu proyek mana saja di dasbor Anda untuk membuka ruang kerjanya. Anda hanya akan melihat proyek yang Anda buat atau di mana Anda diundang.'
          ),
        },
        {
          id: 'inviting-members',
          title: tMsg('Inviting Members', 'Mengundang Anggota'),
          content: tMsg(
            "Once inside a project, click 'Team' ➔ 'Manage Team' from the project header. You can invite colleagues by typing their corporate username or email. Pending invitations will appear as an envelope icon (📩) next to the Manage Team button.",
            "Setelah berada di dalam proyek, klik 'Tim' ➔ 'Kelola Tim' dari header proyek. Anda dapat mengundang rekan kerja dengan mengetikkan nama pengguna atau email perusahaan mereka. Undangan yang masuk akan muncul sebagai ikon amplop (📩) di sebelah tombol Kelola Tim."
          ),
        },
        {
          id: 'master-view',
          title: tMsg('See the Big Picture (Master View)', 'Lihat Gambaran Besar (Tampilan Utama)'),
          content: tMsg(
            "Click the '🌍 See the Big Picture' card on your dashboard to see and manage tasks across all your projects simultaneously. You can even drag and drop task cards across columns to seamlessly transfer them between projects!",
            "Klik kartu '🌍 Lihat Gambaran Besar' di dasbor Anda untuk melihat dan mengelola tugas di semua proyek secara bersamaan. Anda bahkan dapat menyeret dan melepas kartu tugas melintasi kolom untuk memindahkannya antar proyek dengan mulus!"
          ),
        },
      ],
      seeAlso: ['tasks', 'views'],
    },
    {
      id: 'tasks',
      group: tMsg('Get Started', 'Mulai'),
      title: tMsg('Managing Tasks', 'Mengelola Tugas'),
      desc: tMsg(
        'The core unit of work in this platform is a Task. Anyone with access to the project board can create, edit, and manage tasks seamlessly.',
        'Unit kerja inti dalam platform ini adalah Tugas. Siapa pun yang memiliki akses ke papan proyek dapat membuat, mengedit, dan mengelola tugas dengan mulus.'
      ),
      sections: [
        {
          id: 'creating-request',
          title: tMsg('Creating a New Request', 'Membuat Permintaan Baru'),
          content: tMsg(
            "Click the 'New Request' button at the top right. You can now chat naturally with the Smart Assistant (✨) to let AI instantly extract task details, sub-tasks, and assignees into the form, or switch to manual mode to fill it out yourself.",
            "Klik tombol 'Tugas Baru' di kanan atas. Anda kini dapat mengobrol secara natural dengan Asisten Pintar (✨) agar AI langsung mengekstrak detail tugas, sub-tugas, dan pekerja ke dalam formulir, atau beralih ke mode manual untuk mengisinya sendiri."
          ),
        },
        {
          id: 'rich-text',
          title: tMsg('Rich Text Formatting', 'Pemformatan Teks Kaya'),
          content: tMsg(
            'Make your task descriptions easy to read using Markdown syntax. Use the toolbar or type manually: **bold**, *italic*, __underline__, and start a new line with - to create bullet points.',
            'Buat deskripsi tugas Anda mudah dibaca menggunakan sintaks Markdown. Gunakan bilah alat atau ketik secara manual: **tebal**, *miring*, __garis bawah__, dan mulai baris baru dengan tanda - untuk membuat poin-poin.'
          ),
        },
        {
          id: 'auto-generate',
          title: tMsg('Auto Generate Description', 'Buat Deskripsi Otomatis'),
          content: tMsg(
            "Have a rough idea? Type a short brief in the description box, then click the '✨ Auto Generate' button. The AI will instantly expand your notes into a structured, professional task description.",
            "Punya ide kasar? Ketik ringkasan singkat di kotak deskripsi, lalu klik tombol '✨ Buat Otomatis'. AI akan langsung mengembangkan catatan Anda menjadi deskripsi tugas yang terstruktur dan profesional."
          ),
        },
        {
          id: 'custom-categories',
          title: tMsg('Smart Custom Categories', 'Kategori Kustom Cerdas'),
          content: tMsg(
            'You can create new custom categories on the fly when creating or editing tasks. To keep your workspace organized, any custom category that is no longer used by any task will be automatically purged by the system.',
            'Anda dapat membuat kategori kustom baru secara langsung saat membuat atau mengedit tugas. Untuk menjaga ruang kerja tetap rapi, kategori kustom yang tidak lagi digunakan oleh tugas apa pun akan dibersihkan secara otomatis oleh sistem.'
          ),
        },
        {
          id: 'subtasks',
          title: tMsg('Checklists (Sub-tasks)', 'Daftar Periksa (Sub-tugas)'),
          content: tMsg(
            'Break down massive campaigns into smaller steps. You can assign specific members to each item, and seamlessly drag-and-drop the checklist rows to reorder their priority.',
            'Pecah kampanye besar menjadi langkah yang lebih kecil. Anda dapat menugaskan anggota ke setiap item, dan menyeret-serta-melepas (drag-and-drop) baris daftar periksa dengan mudah untuk mengubah urutannya.'
          ),
        },
        {
          id: 'checklist-safeguard',
          title: tMsg('Task Completion Safeguard', 'Pencegahan Penyelesaian Tugas'),
          content: tMsg(
            'The Kanban board has a built-in safeguard. It will automatically prevent you from dragging a task to the "Done" column if there are still unfinished sub-tasks inside it, prompting you to review them first.',
            'Papan Kanban memiliki sistem pencegahan bawaan. Sistem akan otomatis mencegah Anda menyeret tugas ke kolom "Selesai" jika masih ada sub-tugas yang belum diselesaikan, dan meminta Anda untuk meninjaunya terlebih dahulu.'
          ),
        },
        {
          id: 'smart-attachments',
          title: tMsg('Smart Link Attachments', 'Lampiran Tautan Cerdas'),
          content: tMsg(
            'When you paste URLs into the "Supporting Access" field, the system automatically detects links from Google Drive, Figma, and Microsoft OneDrive, instantly transforming them into beautiful, clickable smart cards.',
            'Saat Anda menempelkan URL ke bidang "Akses Pendukung", sistem secara otomatis mendeteksi tautan dari Google Drive, Figma, dan Microsoft OneDrive, dan langsung mengubahnya menjadi kartu pintar yang indah dan dapat diklik.'
          ),
        },
        {
          id: 'editing-deleting',
          title: tMsg('Editing & Deleting Tasks', 'Mengedit & Menghapus Tugas'),
          content: tMsg(
            "Click on any existing task card to open the Detail View, then click the '✏️ Edit' button to modify the details. You can transfer the task to another workspace by changing the 'Project' field. To delete a task, simply drag the task card and drop it into the giant interactive floating trash bin that appears on your screen!",
            "Klik kartu tugas yang ada untuk membuka Tampilan Detail, lalu klik tombol '✏️ Edit' untuk mengubah detail. Anda dapat memindahkan tugas ke ruang kerja lain dengan mengubah bidang 'Proyek'. Untuk menghapus tugas, cukup seret kartu tugas dan jatuhkan ke dalam tong sampah mengambang raksasa interaktif yang muncul di layar Anda!"
          ),
        },
        {
          id: 'permissions',
          title: tMsg('Task Permissions', 'Izin Tugas'),
          content: tMsg(
            'Anyone in the project can create tasks. However, only the Task Creator, Assignee, or Project Owner can edit or delete a task.',
            'Siapa pun dalam proyek dapat membuat tugas. Namun, hanya Pembuat Tugas, Pekerja (Assignee), atau Pemilik Proyek yang dapat mengedit atau menghapus tugas.'
          ),
        },
        {
          id: 'etc-tracking',
          title: tMsg('Estimated Time Consumption (ETC)', 'Estimasi Waktu Pengerjaan (ETC)'),
          content: tMsg(
            'Tasks are measured by their Estimated Time Consumption (ETC) in hours. Click the ✨ button next to the ETC field to let the AI automatically estimate the hours based on the task description. If a task has multiple sub-task assignees, the ETC is distributed evenly among everyone involved.',
            'Tugas diukur berdasarkan Estimasi Waktu Pengerjaan (ETC) dalam jam. Klik tombol ✨ di sebelah bidang ETC untuk membiarkan AI memperkirakan waktu secara otomatis. Jika ada beberapa pekerja sub-tugas, sistem membagikan ETC secara merata kepada semua yang terlibat.'
          ),
        },
        {
          id: 'recurring-tasks',
          title: tMsg('Recurring Tasks', 'Tugas Berulang'),
          content: tMsg(
            'Automate your routine workflows by setting a task to repeat Daily, Weekly, or Monthly. Once a recurring task is moved to "Done", the system will automatically spawn an exact copy for the next period, carrying over all sub-tasks. Newly cloned tasks are visibly highlighted with a glowing "NEW CLONE" badge to help you instantly locate them during your active session.',
            'Otomatiskan alur kerja rutin Anda dengan mengatur tugas untuk berulang Harian, Mingguan, atau Bulanan. Setelah tugas berulang dipindahkan ke "Selesai", sistem akan otomatis membuat salinan persis untuk periode berikutnya, membawa serta semua sub-tugas. Tugas hasil kloningan baru akan disorot secara visual dengan lencana "NEW CLONE" yang menyala untuk membantu Anda langsung menemukannya selama sesi aktif Anda.'
          ),
        },
        {
          id: 'deep-linking',
          title: tMsg('Shareable Links (Deep Linking)', 'Tautan Dapat Dibagikan (Deep Linking)'),
          content: tMsg(
            "Easily share tasks! Click the '🔗' icon to copy a direct link. Unauthenticated guests will see a secure **Public Preview** (where sensitive descriptions and checklists are blurred to prevent data leaks) and will be prompted to log in to join the conversation.",
            "Bagikan tugas dengan mudah! Klik ikon '🔗' untuk menyalin tautan langsung. Tamu yang belum login akan melihat **Pratinjau Publik** yang aman (di mana deskripsi dan daftar periksa disamarkan untuk mencegah kebocoran data) dan akan diminta untuk masuk agar dapat berkolaborasi."
          ),
        },
        {
          id: 'queue-system',
          title: tMsg('Hybrid Queue System', 'Sistem Antrean Hibrida'),
          content: tMsg(
            "Task cards dynamically display an assignee's workload queue. Inside a project, it shows the **Project Queue**. On the Master View or Guest Preview, it reveals the **Overall Queue** across all workspaces, giving context to bottlenecks.",
            'Kartu tugas secara dinamis menampilkan antrean beban kerja pekerja. Di dalam proyek, ia menunjukkan **Antrean Proyek**. Pada Tampilan Utama atau Pratinjau Tamu, ia menampilkan **Antrean Total** di seluruh ruang kerja, memberikan konteks pada status antrean pekerjaan.'
          ),
        },
      ],
      seeAlso: ['workspace', 'collab'],
    },
    {
      id: 'views',
      group: tMsg('Core Features', 'Fitur Inti'),
      title: tMsg('Interface Views', 'Tampilan Antarmuka'),
      desc: tMsg(
        'Analyze your data through five interconnected interfaces. Switching views happens instantly without reloading the page.',
        'Analisis data Anda melalui lima antarmuka yang saling terhubung. Peralihan tampilan terjadi seketika tanpa memuat ulang halaman.'
      ),
      sections: [
        {
          id: 'kanban',
          title: tMsg('Kanban Board', 'Papan Kanban'),
          content: tMsg(
            "The default agile view. Drag and drop task cards across status columns to update their progress instantly. Smart Archive: To keep your workspace clean, terminal columns like 'Done' and 'Rejected' automatically archive older tasks, keeping only the 5 most recent ones visible.",
            "Tampilan agile bawaan. Seret dan lepas kartu tugas melintasi kolom status untuk memperbarui progres secara instan. Arsip Cerdas: Untuk menjaga ruang kerja tetap bersih, kolom terminal seperti 'Selesai' dan 'Ditolak' secara otomatis mengarsipkan tugas yang lebih lama, hanya menampilkan 5 tugas terbaru."
          ),
        },
        {
          id: 'table',
          title: tMsg('Table List & Quick Add', 'Daftar Tabel & Tambah Cepat'),
          content: tMsg(
            'A clean and organized vertical list of task cards. You can use checkboxes on the left to perform Bulk Transfers, or use the input bar at the top to rapidly "Quick Add" new tasks. In this view, task descriptions are shown with a clean 2-line clamp, and the layout adaptively adjusts on mobile screens for seamless task management.',
            'Tampilan daftar kartu tugas vertikal yang rapi dan terorganisir. Anda dapat menggunakan kotak centang di kiri untuk melakukan Transfer Massal, atau menggunakan bilah input di bagian atas untuk melakukan "Tambah Cepat" tugas baru secara praktis. Pada tampilan ini, deskripsi tugas ditampilkan ringkas maksimal 2 baris, dan tata letak menyesuaikan secara adaptif pada layar HP demi kenyamanan pengelolaan tugas.'
          ),
        },
        {
          id: 'timeline',
          title: tMsg('Timeline (Gantt Chart)', 'Lini Masa (Gantt)'),
          content: tMsg(
            "A visual horizontal timeline mapping out project durations. Interactive: Drag the edges to change dates, or drag the center to move the schedule. Resource Management: Group the timeline by 'Assignee' and drag a task vertically into someone else's row to instantly reassign it!",
            "Lini masa horizontal visual yang memetakan durasi proyek. Interaktif: Seret tepi untuk mengubah tanggal, atau seret bagian tengah untuk memindahkan jadwal. Manajemen Sumber Daya: Kelompokkan lini masa berdasarkan 'Pekerja' dan seret tugas secara vertikal ke baris orang lain untuk langsung menugaskannya kembali!"
          ),
        },
        {
          id: 'timeline-export',
          title: tMsg('Exporting the Timeline', 'Mengekspor Lini Masa'),
          content: tMsg(
            "From the Timeline view, click the '💾 Export' button at the top left to generate a high-resolution snapshot of the entire schedule. You can choose to export as a **PDF** document or a **PNG** image. The export engine accurately captures the current theme (Light or Dark Mode) and renders all task details and colors correctly.",
            "Dari tampilan Lini Masa, klik tombol '💾 Ekspor' di kiri atas untuk menghasilkan tangkapan layar resolusi tinggi dari seluruh jadwal. Anda dapat memilih untuk mengekspor sebagai dokumen **PDF** atau gambar **PNG**. Mesin ekspor secara akurat menangkap tema yang sedang aktif (Mode Terang atau Gelap) dan merender semua detail serta warna tugas dengan benar."
          ),
        },
        {
          id: 'calendar',
          title: tMsg('Calendar Views (Month, Week, Schedule)', 'Tampilan Kalender (Bulan, Minggu, Jadwal)'),
          content: tMsg(
            'Interactive calendar with three sub-views: **Month View** (limits to 3 visible tasks per cell), **Week View** (spans 7 days with a limit of 10 tasks before grouping under "+more"), and **Schedule View** (a vertical card layout for tasks and leaves). Features a "Today" button to instantly jump to the current date and auto-scroll to today\'s card, full mobile optimization (compact layout, flex wrapping, and 2-row title clamping), and date formatting mapped to your personal settings preference.',
            'Kalender interaktif dengan tiga sub-tampilan: **Tampilan Bulan** (membatasi 3 tugas terlihat per sel), **Tampilan Minggu** (menampilkan 7 hari dengan batas 10 tugas sebelum dikelompokkan dalam "+more"), dan **Tampilan Jadwal** (tata letak kartu vertikal untuk tugas dan cuti). Memiliki tombol "Today" untuk melompat instan ke tanggal saat ini dan scroll otomatis ke kartu hari ini, optimasi mobile penuh (tata letak ringkas, pembungkusan flex, dan pemotongan judul maks 2 baris), serta format tanggal sesuai preferensi pengaturan pribadi Anda.'
          ),
        },
      ],
      seeAlso: ['analytics', 'filters'],
    },
    {
      id: 'analytics',
      group: tMsg('Core Features', 'Fitur Inti'),
      title: tMsg('Advanced Analytics', 'Analitik Lanjutan'),
      desc: tMsg(
        "The Analytics Dashboard is your command center for data-driven decision making. It provides a comprehensive, real-time overview of your team's performance.",
        'Dasbor Analitik adalah pusat komando Anda untuk pengambilan keputusan berbasis data. Ini memberikan gambaran yang komprehensif tentang kinerja tim Anda secara real-time.'
      ),
      sections: [
        {
          id: 'workload-insight',
          title: tMsg('Team Workload & Bottleneck Detection', 'Beban Kerja Tim & Deteksi Hambatan'),
          content: tMsg(
            'The Team Workload chart displays both Total Load and Active Load for each member. It proactively flags a user as overloaded (⚠️) if their CURRENT active backlog exceeds a standard 40-hour work week, regardless of the selected timeframe. This helps instantly spot bottlenecks.',
            'Grafik Beban Kerja Tim menampilkan Total Beban dan Beban Aktif untuk setiap anggota. Sistem secara proaktif menandai pengguna kewalahan (⚠️) jika antrean aktif MEREKA SAAT INI melebihi standar 40 jam kerja per minggu, terlepas dari rentang waktu yang dipilih. Ini membantu menemukan hambatan dengan cepat.'
          ),
        },
        {
          id: 'ai-summary',
          title: tMsg('Executive AI Summary', 'Ringkasan Eksekutif AI'),
          content: tMsg(
            "Click the 'Generate Insight' button to have Google Gemini or GPT-OSS 120B read your dashboard stats and provide a professional, natural language summary of your project health and bottlenecks.",
            "Klik tombol 'Buat Wawasan' untuk meminta Google Gemini atau GPT-OSS 120B membaca statistik dasbor Anda dan memberikan ringkasan bahasa alami yang profesional."
          ),
        },
        {
          id: 'metrics',
          title: tMsg('Analytics Dashboard Metrics', 'Metrik Dasbor Analitik'),
          content: tMsg(
            "The Analytics dashboard serves as a comprehensive overview of your team's performance, featuring intuitive metrics and dynamic charts designed to provide actionable insights.<br /><br />" +
            "<strong>Project Health</strong>: A smart indicator that evaluates the overall workspace status by balancing completed tasks and ongoing progress against penalties for overdue critical tasks. <em>Logic Method: (Done ETC% + WIP ETC%) - Overdue Penalty</em><br /><br />" +
            "<strong>Total Tasks</strong>: The total number of tasks matching your current filters. <em>Logic Method: Count(Filtered Tasks)</em><br /><br />" +
            "<strong>Active (WIP)</strong>: Tasks that are currently being worked on by the team. <em>Logic Method: Count(Status ∉ [Done, Rejected, Pending])</em><br /><br />" +
            "<strong>Completed</strong>: Tasks that have been successfully finished. <em>Logic Method: Count(Status == Done)</em><br /><br />" +
            "<strong>Overdue</strong>: Active tasks that are critically approaching or past their deadline. <em>Logic Method: Count(Status != Done & Priority == Critical)</em><br /><br />" +
            "<strong>Completion Rate</strong>: Measures the proportion of finished work based on estimated hours (ETC). <em>Logic Method: (Completed ETC / Total ETC) × 100%</em><br /><br />" +
            "<strong>Average Cycle Time</strong>: Reveals exactly how many days it typically takes to finish a task from start to finish. <em>Logic Method: Σ(Done Date - Start Date) / Completed Tasks</em><br /><br />" +
            "<strong>Sub-task Completion</strong>: Tracks checklist progress across all tasks. <em>Logic Method: (Total Done Subtasks / Total Subtasks) × 100%</em><br /><br />" +
            "Beyond the core numbers, the dashboard includes several advanced visual modules:<br /><br />" +
            "<strong>Activity Trend</strong>: A dynamic line chart illustrating the volume of created, active, and completed tasks over time, allowing you to spot work surges easily.<br /><br />" +
            "<strong>On-Time SLA & Top Performers</strong>: Tracks the percentage of tasks delivered before their deadlines and highlights team members who are clearing the most workload.<br /><br />" +
            "<strong>Cycle by Category</strong>: Analyzes which types of work consume the most time, providing a clear breakdown of average completion days by project category.<br /><br />" +
            "<strong>Bottleneck Radar</strong>: Automatically detects and surfaces the top 5 active tasks that have been stalled significantly longer than your average cycle time, so you can intervene immediately.<br /><br />" +
            "<strong>Workload Distribution & Team Workload</strong>: Visualizes your tasks by Status, Category, and Active Priority levels, while the Team Workload chart breaks down the exact hours each member is carrying to help you prevent team burnout proactively.",
            "Dasbor Analitik berfungsi sebagai tinjauan komprehensif atas kinerja tim Anda, menampilkan berbagai metrik intuitif dan grafik dinamis yang dirancang untuk memberikan wawasan mendalam.<br /><br />" +
            "<strong>Kesehatan Proyek (Project Health)</strong>: Indikator cerdas yang mengevaluasi status ruang kerja secara keseluruhan dengan menyeimbangkan tugas yang selesai dan progres yang berjalan terhadap denda untuk tugas kritis yang terlambat. <em>Metode Logika: (Done ETC% + WIP ETC%) - Overdue Penalty</em><br /><br />" +
            "<strong>Total Tugas</strong>: Jumlah seluruh tugas yang sesuai dengan filter Anda saat ini. <em>Metode Logika: Count(Filtered Tasks)</em><br /><br />" +
            "<strong>Aktif (WIP)</strong>: Tugas yang saat ini sedang dikerjakan oleh tim. <em>Metode Logika: Count(Status ∉ [Done, Rejected, Pending])</em><br /><br />" +
            "<strong>Selesai (Completed)</strong>: Tugas yang telah berhasil diselesaikan. <em>Metode Logika: Count(Status == Done)</em><br /><br />" +
            "<strong>Terlambat (Overdue)</strong>: Tugas aktif dengan prioritas kritis yang mendekati atau melewati tenggat waktu. <em>Metode Logika: Count(Status != Done & Priority == Critical)</em><br /><br />" +
            "<strong>Tingkat Penyelesaian (Completion Rate)</strong>: Mengukur proporsi pekerjaan yang telah tuntas berdasarkan estimasi jam (ETC). <em>Metode Logika: (Completed ETC / Total ETC) × 100%</em><br /><br />" +
            "<strong>Rata-rata Waktu Siklus (Avg Cycle Time)</strong>: Menunjukkan secara pasti berapa rata-rata hari yang dibutuhkan untuk menyelesaikan sebuah tugas dari awal hingga akhir. <em>Metode Logika: Σ(Done Date - Start Date) / Completed Tasks</em><br /><br />" +
            "<strong>Penyelesaian Sub-tugas</strong>: Melacak progres daftar periksa di seluruh tugas. <em>Metode Logika: (Total Done Subtasks / Total Subtasks) × 100%</em><br /><br />" +
            "Lebih dari sekadar angka inti, dasbor ini mencakup beberapa modul visual lanjutan:<br /><br />" +
            "<strong>Tren Aktivitas</strong>: Grafik garis dinamis yang menggambarkan volume tugas yang dibuat, aktif, dan selesai seiring waktu, memungkinkan Anda melihat lonjakan pekerjaan dengan mudah.<br /><br />" +
            "<strong>SLA Tepat Waktu & Pekerja Terbaik</strong>: Melacak persentase tugas yang diserahkan sebelum tenggat waktunya dan menyoroti anggota tim yang berhasil menyelesaikan beban kerja terbanyak.<br /><br />" +
            "<strong>Siklus per Kategori</strong>: Menganalisis jenis pekerjaan mana yang paling memakan waktu, memberikan rincian yang jelas mengenai rata-rata hari penyelesaian berdasarkan kategori proyek.<br /><br />" +
            "<strong>Radar Hambatan</strong>: Secara otomatis mendeteksi dan menampilkan 5 tugas aktif teratas yang telah macet jauh lebih lama dari rata-rata waktu siklus Anda, sehingga Anda dapat segera mengambil tindakan.<br /><br />" +
            "<strong>Distribusi Beban Kerja & Beban Kerja Tim</strong>: Memvisualisasikan tugas Anda berdasarkan Status, Kategori, dan tingkat Prioritas Aktif, sementara grafik Beban Kerja Tim merincikan jumlah jam (ETC) yang dipikul oleh setiap anggota untuk membantu Anda mencegah kelelahan berlebih secara proaktif."
          ),
        },
      ],
      seeAlso: ['views', 'assistant'],
    },
    {
      id: 'filters',
      group: tMsg('Core Features', 'Fitur Inti'),
      title: tMsg('Filters & Search', 'Filter & Pencarian'),
      desc: tMsg(
        'Navigate through massive amounts of data effortlessly using the advanced toolbar at the top of the screen.',
        'Arahkan melalui sejumlah besar data dengan mudah menggunakan bilah alat lanjutan di bagian atas layar.'
      ),
      sections: [
        {
          id: 'global-search',
          title: tMsg('Global Search Bar', 'Bilah Pencarian Global'),
          content: tMsg(
            "Located at the top-center of the screen. Powered by a multi-word unordered search engine, you can type keywords in any order (e.g., 'bug login') to instantly find tasks, projects, or assignees globally. It also highlights every matching word separately!",
            "Terletak di tengah atas layar. Ditenagai mesin pencari acak multi-kata, Anda dapat mengetik kata kunci dalam urutan apa pun (misal: 'bug login') untuk langsung menemukan tugas, proyek, atau pekerja secara global. Fitur ini juga menyorot setiap kata yang cocok secara terpisah!"
          ),
        },
        {
          id: 'my-tasks',
          title: tMsg('My Tasks Toggle', 'Tombol Tugas Saya'),
          content: tMsg(
            "Click the '👤 My Tasks' button to instantly eliminate the noise. This hides everything and only shows tasks where you are the Creator, the Assignee, or tagged in a sub-task.",
            "Klik tombol '👤 Tugas Saya' untuk menyembunyikan semuanya dan hanya menampilkan tugas di mana Anda adalah Pembuat, Penerima Tugas, atau ditandai dalam sub-tugas."
          ),
        },
        {
          id: 'delegated-tasks',
          title: tMsg('Monitoring Delegated Tasks', 'Memantau Tugas yang Didelegasikan'),
          content: tMsg(
            "When you create a task and assign it to someone else (using @username), you are recorded as the 'Task Creator'. To monitor these delegated tasks, type your username in the Search bar, then change the filter to 'Group: Assignee'. The board will neatly display columns of other team members, containing the specific tasks you delegated to them!",
            "Saat Anda membuat tugas dan menugaskannya ke orang lain (dengan @username), Anda dicatat sebagai 'Pembuat Tugas'. Untuk memantau tugas yang Anda delegasikan ini, ketik nama pengguna Anda di bilah Pencarian, lalu ubah filter menjadi 'Group: Pekerja'. Papan akan menampilkan kolom anggota tim lain yang berisi tugas-tugas yang Anda delegasikan kepada mereka!"
          ),
        },
        {
          id: 'unread-filter',
          title: tMsg('Unread Activity Filter', 'Filter Aktivitas Belum Dibaca'),
          content: tMsg(
            "Click the '💬 Unread' toggle on the dashboard to instantly cut through the noise. It will only display tasks that contain new comments or mentions waiting for your attention.",
            "Klik tombol '💬 Belum Dibaca' di dasbor untuk langsung menyaring kebisingan. Tombol ini hanya akan menampilkan tugas yang berisi komentar atau sebutan baru yang menunggu perhatian Anda."
          ),
        },
        {
          id: 'has-subtasks',
          title: tMsg('Has Sub-tasks Filter', 'Filter Punya Sub-tugas'),
          content: tMsg(
            "Click the '📋 Has Sub-tasks' toggle to immediately filter the view and show only tasks that contain checklists. Great for managers reviewing complex workflows.",
            "Klik tombol '📋 Punya Sub-tugas' untuk langsung memfilter tampilan dan hanya menampilkan tugas yang berisi daftar periksa. Sangat cocok untuk manajer yang meninjau alur kerja yang kompleks."
          ),
        },
        {
          id: 'hide-completed',
          title: tMsg('Hide Completed Tasks', 'Sembunyikan Tugas Selesai'),
          content: tMsg(
            "Click the '🚫 Completed Hidden' toggle to hide 'Done' and 'Rejected' tasks. This instantly declutters your board so you can focus strictly on active workloads.",
            "Klik tombol '🚫 Selesai Disembunyikan' untuk menyembunyikan tugas 'Selesai' dan 'Ditolak'. Ini langsung membersihkan papan Anda sehingga Anda dapat fokus pada beban kerja yang aktif."
          ),
        },
        {
          id: 'sorting',
          title: tMsg('Sorting & Grouping', 'Menyortir & Mengelompokkan'),
          content: tMsg(
            "Reorganize your views by grouping tasks by 'Category' or 'Assignee'. When sorting by 'Priority' or 'Impact', the engine calculates a combined weight of deadline urgency, impact level, and ETC size to push the most critical work to the very top.",
            "Atur ulang tampilan Anda dengan mengelompokkan tugas berdasarkan 'Kategori' atau 'Pekerja'. Saat menyortir berdasarkan 'Prioritas' atau 'Dampak', mesin menghitung bobot gabungan urgensi tenggat waktu, tingkat dampak, dan ukuran ETC untuk mendorong pekerjaan paling kritis ke atas."
          ),
        },
      ],
      seeAlso: ['views', 'tasks'],
    },
    {
      id: 'deadlines',
      group: tMsg('Time & Deadlines', 'Waktu & Tenggat Waktu'),
      title: tMsg('The Deadline Engine', 'Mesin Tenggat Waktu'),
      desc: tMsg(
        'One of INNOCEAN Tracker’s most powerful features is its ability to act as a virtual project manager that understands human availability.',
        'Salah satu fitur paling kuat adalah kemampuannya untuk bertindak sebagai manajer proyek virtual yang memahami ketersediaan manusia.'
      ),
      sections: [
        {
          id: 'holidays',
          title: tMsg('Indonesian Public Holidays', 'Libur Nasional Indonesia'),
          content: tMsg(
            'The backend system automatically synchronizes with the national holiday database. Weekends and red dates are automatically bypassed when dragging items in the Timeline view, and are highlighted in red on the Calendar view.',
            'Sistem backend secara otomatis melakukan sinkronisasi dengan database hari libur nasional. Akhir pekan dan tanggal merah dilewati secara otomatis.'
          ),
        },
        {
          id: 'pto',
          title: tMsg('Personal Time Off (Vacation)', 'Cuti Pribadi'),
          content: tMsg(
            "Open the Account menu and select 'Time Off' to register your personal vacation days. Any task assigned to you that overlaps with your vacation will visually flag those days as unavailable.",
            "Buka menu Akun dan pilih 'Cuti & Libur' untuk mendaftarkan hari libur pribadi Anda. Setiap tugas yang tumpang tindih dengan liburan Anda akan ditandai sebagai tidak tersedia."
          ),
        },
        {
          id: 'priorities',
          title: tMsg('Dynamic Priorities & Impact', 'Prioritas Dinamis & Dampak'),
          content: tMsg(
            'Time priorities are automatic based on calendar days: tasks due today or tomorrow turn into 🟠 Warning (Urgent), and past-due tasks turn into 🔴 Critical (Overdue). Tasks with 2 or more days left are marked as 🟢 Safe. Separately, you can manually set the Impact level (🔥 High, ⚡ Medium, 🧊 Low) to distinguish between urgent vs important tasks.',
            'Prioritas waktu bersifat otomatis berdasarkan hari kalender: tugas yang jatuh tempo hari ini atau besok menjadi 🟠 Peringatan (Mendesak), dan tugas lewat batas waktu menjadi 🔴 Kritis (Terlambat). Tugas dengan sisa waktu 2 hari atau lebih ditandai sebagai 🟢 Aman. Secara terpisah, Anda dapat mengatur tingkat Dampak manual (🔥 High, ⚡ Medium, 🧊 Low) untuk membedakan tugas mendesak vs penting.'
          ),
        },
        {
          id: 'gcal',
          title: tMsg('Google Calendar Integration', 'Integrasi Google Calendar'),
          content: tMsg(
            "Inside any active task's details, click the '📅 Add to Calendar' button next to the deadline to instantly create a pre-filled Google Calendar event without requiring complex account permissions.",
            "Di dalam detail tugas, klik tombol '📅 Tambah ke Kalender' di sebelah tenggat waktu untuk langsung membuat acara Google Calendar yang telah diisi sebelumnya."
          ),
        },
      ],
      seeAlso: ['views', 'account'],
    },
    {
      id: 'collab',
      group: tMsg('Team & AI', 'Tim & AI'),
      title: tMsg('Team Collaboration', 'Kolaborasi Tim'),
      desc: tMsg(
        'Communication is embedded directly into the workflow. Everything is tracked, reducing the need for external messaging apps.',
        'Komunikasi disematkan langsung ke dalam alur kerja. Semuanya dilacak, mengurangi kebutuhan untuk aplikasi perpesanan eksternal.'
      ),
      sections: [
        {
          id: 'mentions',
          title: tMsg('The Mentions Engine', 'Mesin Mention'),
          content: tMsg(
            'Type @username anywhere to tag a colleague. You can also type "@team" in the project chat to notify everyone in the workspace, or "@all" inside a task comment to notify everyone involved in that specific task!',
            'Ketik @username di mana saja untuk menandai rekan kerja. Anda juga dapat mengetik "@team" di obrolan proyek untuk memberitahu semua orang di ruang kerja, atau "@all" di komentar tugas untuk memberitahu semua yang terlibat di tugas tersebut!'
          ),
        },
        {
          id: 'mention-jumper',
          title: tMsg('Smart Mention Jumper', 'Pelompat Sebutan Cerdas'),
          content: tMsg(
            "Whenever someone tags you in a long project chat or task thread, a floating '@' button appears on your screen. Click it to instantly scroll to and highlight the exact message you were mentioned in!",
            "Kapan pun seseorang menandai Anda dalam obrolan proyek atau utas tugas yang panjang, tombol '@' mengambang akan muncul di layar Anda. Klik tombol tersebut untuk langsung menggulir dan menyorot pesan yang menyebut Anda!"
          ),
        },
        {
          id: 'live-sync',
          title: tMsg('Real-Time Auto-Sync', 'Sinkronisasi Otomatis Waktu Nyata'),
          content: tMsg(
            "You never need to refresh the page! The workspace, task boards, and chats silently synchronize in the background every few seconds to reflect your team's latest changes instantly.",
            'Anda tidak perlu memuat ulang halaman! Ruang kerja, papan tugas, dan obrolan disinkronkan secara diam-diam di latar belakang setiap beberapa detik untuk menampilkan perubahan terbaru tim secara instan.'
          ),
        },
        {
          id: 'chat',
          title: tMsg('Unified Chat & Resizable Panels', 'Obrolan Terpadu & Panel Fleksibel'),
          content: tMsg(
            "Click the '📱 Chat Workspace' button to open a communication hub containing Project Channels, Direct Messages (1-on-1), and a centralized Inbox. You can freely drag the vertical borders to resize the sidebar and task preview panels for maximum comfort.",
            "Klik tombol '📱 Ruang Kerja Obrolan' untuk membuka pusat komunikasi yang berisi Saluran Proyek, DM (1-on-1), dan Kotak Masuk. Anda dapat menyeret garis batas vertikal secara bebas untuk mengubah ukuran bilah sisi dan panel pratinjau tugas demi kenyamanan maksimal."
          ),
        },
        {
          id: 'chat-actions',
          title: tMsg('Chat Reactions & Actions', 'Reaksi & Aksi Obrolan'),
          content: tMsg(
            "Interact with your team's messages by adding emoji reactions (👍, ❤️, 😂, etc.). You can also quickly copy messages or reply directly to specific comments to maintain organized discussion threads.",
            'Berinteraksi dengan pesan tim Anda dengan menambahkan reaksi emoji (👍, ❤️, 😂, dll.). Anda juga dapat menyalin pesan dengan cepat atau membalas langsung komentar tertentu untuk menjaga diskusi tetap teratur.'
          ),
        },
        {
          id: 'chat-search',
          title: tMsg('In-Chat Search & Auto-Scroll', 'Pencarian Obrolan & Gulir Otomatis'),
          content: tMsg(
            'Looking for a past discussion? Use the search icon (🔍) inside any Project Chat or Direct Message. Clicking a search result will instantly auto-scroll and highlight the exact message in the chat history.',
            'Mencari diskusi lama? Gunakan ikon pencarian (🔍) di dalam Obrolan Proyek atau Pesan Pribadi. Mengeklik hasil pencarian akan langsung menggulir otomatis dan menyorot pesan yang tepat dalam riwayat obrolan.'
          ),
        },
        {
          id: 'gmeet',
          title: tMsg('Google Meet Integration', 'Integrasi Google Meet'),
          content: tMsg(
            'Click the "Meet Now" button in the chat header or task comments to instantly generate a secure Google Meet room. The system will automatically invite the team in the chat.',
            'Klik tombol "Meet Now" di header obrolan atau komentar tugas untuk langsung membuat ruang Google Meet yang aman.'
          ),
        },
        {
          id: 'audit',
          title: tMsg('Activity Log (Audit Trail)', 'Log Aktivitas (Jejak Audit)'),
          content: tMsg(
            'Found next to the Comments tab inside a task. The system silently tracks every action. If someone changes the status, edits the details, or checks off a sub-task, it is permanently recorded here.',
            'Sistem secara diam-diam melacak setiap tindakan. Jika seseorang mengubah status, mengedit detail, atau mencentang sub-tugas, itu dicatat secara permanen di sini untuk transparansi lengkap.'
          ),
        },
      ],
      seeAlso: ['assistant', 'tasks'],
    },
    {
      id: 'assistant',
      group: tMsg('Team & AI', 'Tim & AI'),
      title: tMsg('Smart Assistant', 'Asisten Pintar AI'),
      desc: tMsg(
        'Accelerate your workflow by using the Smart Assistant, powered by Google Gemini or GPT-OSS 120B. Click the floating ✨ button to start a conversation.',
        'Percepat alur kerja Anda dengan menggunakan Asisten Pintar yang didukung oleh Google Gemini atau GPT-OSS 120B.'
      ),
      sections: [
        {
          id: 'commands',
          title: tMsg('Conversational Commands', 'Perintah Percakapan'),
          content: tMsg(
            "Type what you want to do in natural language. For example: 'Buatkan task redesign website deadline besok'. The AI will extract the details and prepare the task instantly.",
            "Ketik apa yang ingin Anda lakukan dalam bahasa alami. Misalnya: 'Buatkan task redesign website deadline besok'. AI akan mengekstrak detail dan menyiapkan tugas secara instan."
          ),
        },
        {
          id: 'daily-briefing',
          title: tMsg('Daily AI Briefing', 'Ringkasan Harian AI'),
          content: tMsg(
            "Available on the Home Dashboard, this smart widget provides a real-time executive summary of your day. It constantly monitors your active workload, dynamically reading your top queue priorities and any unread direct messages or project comments. The briefing automatically updates itself whenever your workload changes, ensuring you always know exactly what to tackle next.",
            "Tersedia di Dasbor Beranda, widget pintar ini memberikan ringkasan eksekutif secara real-time tentang hari Anda. Ia terus memantau beban kerja aktif Anda, membaca prioritas antrean teratas Anda secara dinamis, serta pesan pribadi atau komentar proyek yang belum dibaca. Ringkasan ini akan memperbarui dirinya sendiri secara otomatis setiap kali beban kerja Anda berubah, memastikan Anda selalu tahu persis apa yang harus dikerjakan selanjutnya."
          ),
        },
        {
          id: 'form-integration',
          title: tMsg('New Request Form Integration', 'Integrasi Formulir Tugas Baru'),
          content: tMsg(
            'When creating a new request, the Smart Assistant greets you first. Tell it what you want to achieve, and it will structure your prompt into a complete form. It intelligently detects if a mentioned name is an Assignee (Worker) or a Requester, and can even automatically set the task as Recurring.',
            'Saat membuat permintaan baru, Asisten Pintar akan menyapa Anda terlebih dahulu. Ceritakan apa yang ingin Anda capai, dan ia akan menyusun perintah Anda menjadi formulir lengkap. Ia secara cerdas mendeteksi apakah nama yang disebut adalah Pekerja atau Peminta, dan bahkan dapat mengatur tugas menjadi Berulang (Recurring) secara otomatis.'
          ),
        },
        {
          id: 'proactive-onboarding',
          title: tMsg('Proactive AI Onboarding', 'Onboarding AI Proaktif'),
          content: tMsg(
            'After completing the welcome tour, or anytime you click the INNOCEAN Tracker logo at the top left of your screen, a full-screen Proactive AI will greet you. It helps you instantly build your first "To-do List" project and break down your broad goals into actionable tasks.',
            'Setelah menyelesaikan tur selamat datang, atau kapan pun Anda mengeklik logo INNOCEAN Tracker di kiri atas layar, AI Proaktif layar penuh akan menyapa Anda. Ini membantu Anda langsung membangun proyek "To-do List" pertama Anda dan memecah tujuan besar menjadi tugas-tugas.'
          ),
        },
        {
          id: 'proactive-planner',
          title: tMsg('Interactive AI Task Planner', 'Perencana Tugas AI Interaktif'),
          content: tMsg(
            'Access the "🚀 AI Task Planner" directly from the Smart Assistant menu. The AI intelligently reads your broad goals and automatically breaks them down into multiple actionable tasks complete with details, subtasks, deadlines, and ETCs. You can review the generated tasks in an interactive cart, adjust their target projects, and dispatch them all at once.',
            'Akses "🚀 Perencana Tugas AI" langsung dari menu Asisten Pintar. AI secara cerdas membaca tujuan besar Anda dan secara otomatis memecahnya menjadi beberapa tugas yang dapat ditindaklanjuti lengkap dengan detail, sub-tugas, tenggat waktu, dan ETC. Anda dapat meninjau tugas yang dihasilkan dalam keranjang interaktif, menyesuaikan proyek tujuan, dan mengirimkannya sekaligus.'
          ),
        },
        {
          id: 'ai-intent-detection',
          title: tMsg('Smart Intent Detection', 'Deteksi Intensi Cerdas'),
          content: tMsg(
            'When creating tasks via AI (especially for To-do Lists), the Smart Assistant now strictly follows your explicit intent. It will only set a deadline if you explicitly mention one. Furthermore, if you ask the AI to "remind" you, it will automatically toggle the Auto Nudge feature ON for those tasks.',
            'Saat membuat tugas melalui AI (terutama untuk To-do List), Asisten Pintar kini mematuhi intensi eksplisit Anda. Ia hanya akan menetapkan tenggat waktu jika Anda menyebutkannya secara spesifik. Selain itu, jika Anda meminta AI untuk "mengingatkan" Anda, ia akan otomatis mengaktifkan fitur Nudge Otomatis untuk tugas tersebut.'
          ),
        },
        {
          id: 'context-chat',
          title: tMsg('Context-Aware Task Chat', 'Obrolan Tugas Kontekstual'),
          content: tMsg(
            'Inside a Task Detail, click the ✨ button next to the comment box, or simply type "@AI" in your message! The AI will read the task brief and past comments to give you highly contextual answers.',
            'Di dalam Detail Tugas, klik tombol ✨ di sebelah kotak komentar, atau cukup ketik "@AI" di pesan Anda! AI akan membaca ringkasan tugas dan komentar sebelumnya untuk memberi Anda jawaban kontekstual.'
          ),
        },
        {
          id: 'mom',
          title: tMsg('Block-Based Live Notepad & MoM', 'Catatan Rapat Editor Blok & MoM'),
          content: tMsg(
            'Use the Smart Assistant as a **block-based editor** during meetings. You can create headings, bullet points, and checkable to-dos on the fly (type `/todo`, `/bullet`, `/h1`, `/h2`, `/p`). Type **@** to mention team members (suggestions are securely restricted to connected workspace members and support full keyboard Arrow Up/Down/Enter navigation). When processed, the AI generates a beautifully formatted MoM report and extracts action items with aligned deadlines, allowing you to bulk-create them into a project board in one click.',
            'Gunakan Asisten Pintar sebagai **editor berbasis blok** selama rapat. Anda dapat membuat judul, poin-poin, dan daftar tugas secara instan (ketik `/todo`, `/bullet`, `/h1`, `/h2`, `/p`). Ketik **@** untuk menyebut anggota tim (saran dibatasi dengan aman hanya untuk anggota workspace yang terhubung dan mendukung navigasi penuh tombol Panah Atas/Bawah/Enter pada keyboard). Saat diproses, AI menghasilkan laporan MoM yang terformat rapi serta mengekstrak butir tindakan dengan tenggat waktu terpadu, memungkinkan Anda membuat tugas tersebut secara massal ke papan proyek dalam sekali klik.'
          ),
        },
        {
          id: 'quick-todo',
          title: tMsg('Task Cart & Quick To-Do', 'Keranjang Tugas & To-Do Cepat'),
          content: tMsg(
            'Need to quickly jot down multiple tasks? Use the "⚡ Quick To-Do" option in the Smart Assistant. Tasks are placed in a visual Task Cart with Kanban-style previews, showing exact deadlines, ETCs, and Auto-Invite badges before you bulk-save them to a project in one click!',
            'Perlu mencatat banyak tugas dengan cepat? Gunakan opsi "⚡ To-Do Cepat" di Asisten Pintar. Tugas ditempatkan di Keranjang Tugas visual dengan pratinjau bergaya Kanban, menampilkan tenggat waktu, ETC, dan lencana Auto-Invite sebelum Anda menyimpannya ke proyek secara massal dalam satu klik!'
          ),
        },
        {
          id: 'code',
          title: tMsg('Code & Flowchart Generation', 'Pembuatan Kode & Bagan Alir'),
          content: tMsg(
            'Ask the AI to conceptualize an architecture, workflow, or write code. It will render a beautiful, collapsible code block with a quick copy button.',
            'Minta AI untuk membuat konsep arsitektur, alur kerja, atau menulis kode. Ini akan merender blok kode yang rapi dengan tombol salin cepat.'
          ),
        },
        {
          id: 'smart-nudge',
          title: tMsg('Smart Nudge & Auto Nudge', 'Pantauan Cerdas & Nudge Otomatis'),
          content: tMsg(
            'Use the "🔔 Smart Nudge" button in a task to let the AI draft and send a contextual follow-up message to the assignees. You can also enable "🤖 Auto: ON" to let the system automatically send reminders 7, 3, 2, and 1 days before the deadline!',
            'Gunakan tombol "🔔 Pantauan Cerdas" di sebuah tugas untuk membiarkan AI menyusun dan mengirim pesan tindak lanjut kontekstual kepada pekerja. Anda juga dapat mengaktifkan "🤖 Auto: AKTIF" agar sistem otomatis mengirim pengingat 7, 3, 2, dan 1 hari sebelum tenggat waktu!'
          ),
        },
        {
          id: 'ai-fallback',
          title: tMsg('AI Auto-Fallback System', 'Sistem Cadangan AI Otomatis'),
          content: tMsg(
            'The Smart Assistant is powered by a dual-engine architecture. If the primary AI (Google Gemini) is busy or reaches its API limit, the system instantly and silently routes your request to a secondary AI (GPT-OSS 120B) so your workflow is never interrupted.',
            'Asisten Pintar didukung oleh arsitektur mesin ganda. Jika AI utama (Google Gemini) sibuk atau mencapai batas API-nya, sistem akan secara instan merutekan permintaan Anda ke AI cadangan (GPT-OSS 120B) sehingga alur kerja Anda tidak pernah terputus.'
          ),
        },
      ],
      seeAlso: ['collab', 'tasks'],
    },
    {
      id: 'account',
      group: tMsg('Your Account', 'Akun Anda'),
      title: tMsg('Account & Preferences', 'Akun & Preferensi'),
      desc: tMsg(
        'Manage your personal preferences, extract your data, configure productivity tools, and control notifications.',
        'Kelola preferensi pribadi Anda, ekstrak data Anda, konfigurasikan alat produktivitas, dan kontrol notifikasi.'
      ),
      sections: [
        {
          id: 'profile',
          title: tMsg('Profile Setup', 'Pengaturan Profil'),
          content: tMsg(
            "Click your name/avatar at the bottom of the sidebar to open the Account menu, then select 'Settings' to upload a picture, change your password, or update your email.",
            "Klik nama/avatar Anda di bagian bawah bilah sisi (sidebar) untuk membuka menu Akun, lalu pilih 'Pengaturan' untuk mengunggah gambar, mengubah kata sandi, atau memperbarui email Anda."
          ),
        },
        {
          id: 'appearance',
          title: tMsg('Appearance & UI Themes', 'Tampilan & Tema UI'),
          content: tMsg(
            "Personalize your workspace from the 'Appearance' tab in Settings. Choose from curated UI themes (like Cupertino, Hacker Terminal, or Sunset Glass), apply texture overlays, or upload your own custom backgrounds for the application and chat area.",
            "Personalisasi ruang kerja Anda dari tab 'Tampilan' di Pengaturan. Pilih dari tema UI yang tersedia (seperti Cupertino, Hacker Terminal, atau Sunset Glass), terapkan tekstur, atau unggah latar belakang kustom Anda sendiri untuk aplikasi dan area obrolan."
          ),
        },
        {
          id: 'tools',
          title: tMsg('Productivity Tools', 'Alat Produktivitas'),
          content: tMsg(
            'In the Preferences tab, you can enable a Live Clock in your header and activate a floating Pomodoro Timer at the bottom right of your screen to help you focus during intensive work sessions.',
            'Di tab Preferensi, Anda dapat mengaktifkan Jam Langsung di header Anda dan mengaktifkan Pomodoro Timer di kanan bawah layar untuk membantu Anda fokus selama sesi kerja.'
          ),
        },
        {
          id: 'notifications',
          title: tMsg('Smart Notifications', 'Notifikasi Cerdas'),
          content: tMsg(
            'Control how you receive alerts. You can enable native Desktop Notifications, toggle Notification Sounds, and activate "Privacy Mode" to safely hide sensitive task names from pop-ups while screen sharing.',
            'Kontrol cara Anda menerima peringatan. Anda dapat mengaktifkan Notifikasi Desktop, beralih Suara, dan mengaktifkan "Mode Privasi" untuk menyembunyikan nama tugas yang sensitif dari pop-up dengan aman saat berbagi layar (screen sharing).'
          ),
        },
        {
          id: 'export',
          title: tMsg('CSV Export', 'Ekspor CSV'),
          content: tMsg(
            "You can export your tasks to Excel. Use the 'Export CSV' button inside the File menu (⚡) to export the current project, or click 'Get All My Data' from the same menu to download every single task assigned to you across all projects.",
            "Anda dapat mengekspor tugas ke Excel. Gunakan tombol 'Ekspor CSV' di dalam menu Berkas (⚡ File) untuk mengekspor proyek saat ini, atau klik 'Dapatkan Semua Data' dari menu yang sama untuk mengunduh setiap tugas yang ditugaskan kepada Anda di semua proyek."
          ),
        },
      ],
      seeAlso: ['deadlines', 'support'],
    },
    {
      id: 'support',
      group: tMsg('Your Account', 'Akun Anda'),
      title: tMsg('Support & Tickets', 'Dukungan & Tiket'),
      desc: tMsg(
        'If you encounter an issue or have a brilliant idea to improve INNOCEAN Tracker, you can submit a ticket directly to the system administrators.',
        'Jika Anda menemui masalah atau memiliki ide brilian, Anda dapat mengirimkan tiket langsung ke administrator sistem.'
      ),
      sections: [
        {
          id: 'submit',
          title: tMsg('Submitting a Ticket', 'Mengirim Tiket'),
          content: tMsg(
            "Open the Account menu and select 'Submit Idea' (for feature requests) or 'Contact Support' (for bugs/IT help).",
            "Buka menu Akun dan pilih 'Kirim Ide' (untuk fitur) atau 'Hubungi Dukungan' (untuk bug/bantuan TI)."
          ),
        },
        {
          id: 'tracking',
          title: tMsg('Tracking via "My Tickets"', 'Melacak via "Tiket Saya"'),
          content: tMsg(
            "Every submission generates a unique tracking ID (e.g., TKT-0001). You can monitor the status of your submissions from the 'My Tickets' panel in the Account menu.",
            "Setiap pengiriman menghasilkan ID pelacakan unik. Anda dapat memantau status kiriman Anda dari panel 'Tiket Saya'."
          ),
        },
      ],
      seeAlso: ['account', 'security'],
    },
    {
      id: 'security',
      group: tMsg('System & Security', 'Sistem & Keamanan'),
      title: tMsg('Security & Compliance', 'Keamanan & Kepatuhan'),
      desc: tMsg(
        'INNOCEAN Tracker is built on a Zero-Trust Architecture, rigorously tested to ensure your corporate data remains completely secure and isolated.',
        'Tracker dibangun pada Arsitektur Zero-Trust, diuji dengan ketat untuk memastikan data perusahaan Anda tetap aman dan terisolasi sepenuhnya.'
      ),
      sections: [
        {
          id: 'owasp',
          title: tMsg('OWASP Top 10 Protected', 'Terlindungi OWASP Top 10'),
          content: tMsg(
            'The platform includes deep protections against XSS, CSWSH, Database Bloat, Brute-Force, and IDOR/BOLA attacks.',
            'Platform ini mencakup perlindungan mendalam terhadap serangan XSS, CSWSH, Pembengkakan Database, Brute-Force, dan IDOR/BOLA.'
          ),
        },
        {
          id: 'specs',
          title: tMsg('System Specs & Details', 'Spesifikasi Sistem'),
          content: tMsg(
            "For a complete breakdown of the 12 Automated Penetration Tests passed and infrastructure limits, please open the 'System Specs' menu from the application footer.",
            "Untuk rincian lengkap dari 12 Uji Penetrasi Otomatis yang terlewati dan batas infrastruktur, silakan buka menu 'Spesifikasi Sistem' dari footer aplikasi."
          ),
        },
      ],
      seeAlso: ['account'],
    },
  ];

  if (isSuperAdmin) {
    data.push({
      id: 'admin',
      group: tMsg('System & Security', 'Sistem & Keamanan'),
      title: tMsg('System Administration', 'Administrasi Sistem'),
      desc: tMsg(
        "As a 'Super Admin' (👑), you have access to additional capabilities to maintain corporate compliance.",
        "Sebagai 'Super Admin' (👑), Anda memiliki akses ke kemampuan tambahan untuk menjaga kepatuhan perusahaan."
      ),
      sections: [
        {
          id: 'user-mgmt',
          title: tMsg('User Management', 'Manajemen Pengguna'),
          content: tMsg(
            "Open the 'Admin Panel' from the Account menu. From here, you can Freeze users, promote others to Super Admin, or schedule an offboarded employee's account for permanent deletion (90-day countdown).",
            "Buka 'Panel Admin' dari menu Akun. Dari sini, Anda dapat Membekukan pengguna, mempromosikan orang lain menjadi Super Admin, atau menjadwalkan penghapusan permanen (hitungan mundur 90 hari)."
          ),
        },
        {
          id: 'mass-leaves',
          title: tMsg('Mass Leaves & Custom Holidays', 'Cuti Massal & Liburan Khusus'),
          content: tMsg(
            "When adding a new Leave from the 'Time Off' menu, Admins have the option to set it as a 'Mass Leave / Public Holiday'. This will automatically apply the holiday to all users in the company.",
            "Saat menambahkan Cuti baru dari menu 'Cuti', Admin memiliki opsi untuk menetapkannya sebagai 'Cuti Massal / Hari Libur Umum'. Ini akan secara otomatis menerapkan hari libur ke semua pengguna di perusahaan."
          ),
        },
        {
          id: 'orphans',
          title: tMsg('Orphaned & Zombie Projects', 'Proyek Terbengkalai'),
          content: tMsg(
            'Admins can force-transfer any project to a new active user to rescue abandoned projects without deleting them. Furthermore, projects with zero activity for 180 days will display a 7-day countdown before being automatically purged.',
            'Admin dapat memaksa transfer proyek apa pun ke pengguna aktif baru untuk menyelamatkan proyek yang ditinggalkan tanpa menghapusnya. Proyek tanpa aktivitas selama 180 hari akan dihapus secara otomatis.'
          ),
        },
      ],
      seeAlso: ['security', 'account'],
    });
  }
  return data;
};

export default function DocumentationModal({ setIsDocsOpen, isSuperAdmin, language }) {
  const [isClosing, close] = useCloseAnimation(() => setIsDocsOpen(false));
  const tMsgStr = (en, id) => (language === 'id' ? id : en);
  const tMsg = (en, id) => tMsgStr(en, id); // Teks murni untuk data

  const docData = useMemo(() => getDocData(tMsg, isSuperAdmin), [language, isSuperAdmin]);
  const [activePageId, setActivePageId] = useState('overview');
  const [activeSecId, setActiveSecId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightQuery, setHighlightQuery] = useState('');
  const [feedbackState, setFeedbackState] = useState({}); // { 'overview': 'yes' }
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const activePage = docData.find((p) => p.id === activePageId) || docData[0];

  const handleFeedbackSubmit = (isHelpful) => {
    setFeedbackState({ ...feedbackState, [activePageId]: isHelpful ? 'yes' : 'no' });
    // Mengirim hasil ke tiket Admin secara diam-diam (silent background request)
    axios
      .post('/api/feedback', {
        text: `[DOCS FEEDBACK] Page: "${activePage.title}" | Helpful: ${isHelpful ? 'Yes' : 'No'}`,
      })
      .catch(() => { }); // Kita biarkan catch kosong agar tidak mengganggu UI user jika gagal
  };

  const scrollToSection = (secId) => {
    const el = document.getElementById(`sec-${secId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveSecId(secId);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      setSearchResults([]);
      return;
    }

    const lowerQ = query.toLowerCase();
    const keywords = lowerQ.split(/\s+/).filter(Boolean);
    const results = [];

    docData.forEach((page) => {
      page.sections.forEach((sec) => {
        const combinedText = [page.title, page.desc, sec.title, sec.content].join(' ').toLowerCase();
        if (keywords.every((kw) => combinedText.includes(kw))) {
          results.push({
            pageId: page.id,
            pageTitle: page.title,
            secId: sec.id,
            secTitle: sec.title,
            snippet: generateSnippet(sec.content, keywords[0]),
          });
        }
      });
    });
    setSearchResults(results.slice(0, 8));
  };

  const handleContentScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollTop;

    let current = activePage.sections[0]?.id;
    for (let sec of activePage.sections) {
      const el = document.getElementById(`sec-${sec.id}`);
      if (el) {
        if (el.offsetTop <= scrollPosition + 400) {
          current = sec.id;
        }
      }
    }
    setActiveSecId(current);
  };
  // Group pages for left navigation
  const groupedNav = useMemo(() => {
    return docData.reduce((acc, page) => {
      if (!acc[page.group]) acc[page.group] = [];
      acc[page.group].push(page);
      return acc;
    }, {});
  }, [docData]);

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-[#0e1116] z-100 flex flex-col overflow-hidden transition-opacity duration-200 ${isClosing ? 'mac-exit opacity-0' : 'mac-animate opacity-100'
        }`}
    >
      {/* Global Top Navbar */}
      <header className="py-3 px-4 md:px-6 md:h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1116] flex flex-col md:flex-row md:items-center justify-between shrink-0 z-40 relative gap-3 md:gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600">📖</span>{' '}
              <span className="sm:inline">{tMsg('Help Center', 'Pusat Bantuan')}</span>
            </h2>
          </div>
          <button
            onClick={close}
            className="md:hidden w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 font-bold"
          >
            ✖
          </button>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-center w-full md:max-w-lg mx-auto relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={tMsgStr('Search documentation...', 'Cari dokumentasi...')}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none transition-colors"
          />
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSearchQuery('');
                    setHighlightQuery(searchQuery);
                    setActivePageId(res.pageId);
                    setTimeout(() => scrollToSection(res.secId), 100);
                  }}
                  className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    <HighlightText text={res.pageTitle} query={searchQuery} />{' '}
                    <span className="text-slate-400 font-normal mx-1">/</span>{' '}
                    <HighlightText text={res.secTitle} query={searchQuery} />
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                    <HighlightText text={res.snippet} query={searchQuery} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={close}
          className="hidden md:flex w-8 h-8 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 font-bold"
        >
          ✖
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          ></div>
          <div className="relative w-4/5 max-w-sm bg-white dark:bg-[#111318] h-full shadow-2xl flex flex-col mac-slide-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                {tMsg('Navigation', 'Navigasi')}
              </span>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-full text-slate-900 dark:text-white font-bold"
              >
                ✖
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {Object.entries(groupedNav).map(([groupName, pages]) => (
                <div key={`mob-${groupName}`} className="mb-6">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-2">
                    {groupName}
                  </h4>
                  <nav className="space-y-1">
                    {pages.map((p) => (
                      <button
                        key={`mob-${p.id}`}
                        onClick={() => {
                          setActivePageId(p.id);
                          setHighlightQuery('');
                          setIsMobileNavOpen(false);
                          document.getElementById('doc-content-area')?.scrollTo(0, 0);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activePageId === p.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111318]/50 overflow-y-auto hidden md:block py-6 custom-scrollbar shrink-0">
          {Object.entries(groupedNav).map(([groupName, pages]) => (
            <div key={groupName} className="mb-6">
              <h4 className="px-6 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                {groupName}
              </h4>
              <nav className="space-y-0.5 px-3">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePageId(p.id);
                      setHighlightQuery('');
                      document.getElementById('doc-content-area')?.scrollTo(0, 0);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activePageId === p.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    {p.title}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Middle Content */}
        <div
          id="doc-content-area"
          className="flex-1 overflow-y-auto px-4 py-8 md:px-12 md:py-14 bg-white dark:bg-[#0e1116] scroll-smooth custom-scrollbar"
          onScroll={handleContentScroll}
        >
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">
              <span>Help Center</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span>{activePage.group}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-indigo-500">{activePage.title}</span>
            </div>

            {/* Page Header */}
            <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="text-3xl md:text-4xl">{activePage.icon}</span>{' '}
              <HighlightText text={activePage.title} query={highlightQuery} />
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10 md:mb-12 pb-10 md:pb-12 border-b border-slate-200 dark:border-slate-800">
              <HighlightText text={activePage.desc} query={highlightQuery} />
            </p>

            {/* Page Content Sections */}
            <div className="space-y-16">
              {activePage.sections.map((sec) => (
                <div key={sec.id} id={`sec-${sec.id}`} className="scroll-mt-24 group">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <HighlightText text={sec.title} query={highlightQuery} />
                    <a
                      href={`#sec-${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(`${window.location.origin}/#${sec.id}`);
                        alert(tMsg('Link copied to clipboard!', 'Tautan disalin ke papan klip!'));
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 transition-all text-xl cursor-pointer"
                      title={tMsg('Copy link to section', 'Salin tautan ke bagian ini')}
                    >
                      #
                    </a>
                  </h3>
                  <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed text-base font-medium">
                    <div dangerouslySetInnerHTML={renderContent(sec.content, highlightQuery)}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Footer */}
            <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
              {feedbackState[activePageId] ? (
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  ✅ {tMsg('Thanks for your feedback!', 'Terima kasih atas masukan Anda!')}
                </p>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {tMsg('Was this page helpful?', 'Apakah halaman ini membantu?')}
                  </span>
                  <button
                    onClick={() => handleFeedbackSubmit(true)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {tMsg('Yes', 'Ya')}
                  </button>
                  <button
                    onClick={() => handleFeedbackSubmit(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {tMsg('No', 'Tidak')}
                  </button>
                </div>
              )}
            </div>

            {/* Related Pages (See Also) */}
            {activePage.seeAlso && activePage.seeAlso.length > 0 && (
              <div className="mt-12">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                  {tMsg('See Also', 'Lihat Juga')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePage.seeAlso.map((id) => {
                    const relatedPage = docData.find((p) => p.id === id);
                    if (!relatedPage) return null;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          setActivePageId(id);
                          setHighlightQuery('');
                          document.getElementById('doc-content-area')?.scrollTo(0, 0);
                        }}
                        className="p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <span>{relatedPage.icon}</span> {relatedPage.title}
                        </h5>
                        <p className="text-xs text-slate-500 line-clamp-2">{relatedPage.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Padding bottom agar pengguna bisa scroll mentok bawah dengan lega */}
          <div className="h-64"></div>
        </div>

        {/* Right Sidebar (On this page TOC) */}
        <div className="w-56 hidden xl:block border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1116] shrink-0 py-10 px-6">
          <div className="sticky top-10">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              {tMsg('On this page', 'Di halaman ini')}
            </h4>
            <nav className="space-y-3">
              {activePage.sections.map((sec) => (
                <a
                  key={`toc-${sec.id}`}
                  href={`#sec-${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(sec.id);
                  }}
                  className={`block text-xs font-medium transition-colors border-l-2 pl-3 ${activeSecId === sec.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
