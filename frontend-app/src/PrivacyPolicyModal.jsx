import React from 'react';
import { useCloseAnimation } from './Utils';

export default function PrivacyPolicyModal({ setIsPrivacyOpen, language }) {
  const [isClosing, close] = useCloseAnimation(() => setIsPrivacyOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-neutral-950 z-[100] overflow-y-auto transition-opacity duration-200 ${
        isClosing ? 'mac-exit opacity-0' : 'mac-animate opacity-100'
      }`}
    >
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-screen">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-6 mb-12 border-b border-neutral-200 dark:border-neutral-800 pb-8 shrink-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase mb-2">
              {tMsg('Privacy Policy', 'Kebijakan Privasi')}
            </h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              {tMsg('Effective Date: June 1, 2026', 'Tanggal Efektif: 1 Juni 2026')}
            </p>
          </div>
          <button
            onClick={close}
            className="bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-black dark:text-white px-6 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <span>✖</span> {tMsg('Close Document', 'Tutup Dokumen')}
          </button>
        </div>

        <div className="flex-1 text-black dark:text-white space-y-10">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-10">
              {tMsg(
                'This Privacy Policy clearly describes how INNOCEAN Tracker ("we", "us", or "our") collects, uses, stores, shares, and protects your personal and corporate data when you utilize our enterprise workload management platform. We are deeply committed to maintaining the highest standards of data privacy, compliance with data protection laws, and enforcing a Zero-Trust security architecture.',
                'Kebijakan Privasi ini secara jelas menjelaskan bagaimana INNOCEAN Tracker ("kami") mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pribadi dan perusahaan Anda saat Anda menggunakan platform manajemen beban kerja kami. Kami sangat berkomitmen untuk menjaga standar tertinggi privasi data, kepatuhan terhadap undang-undang perlindungan data, dan menegakkan arsitektur keamanan Zero-Trust.'
              )}
            </p>

            {/* Section 1 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                1. {tMsg('Information Collection & Scope', 'Cakupan & Pengumpulan Informasi')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'We implement strict data minimization principles. We only collect the information absolutely necessary to provision your corporate identity and facilitate project management capabilities:',
                  'Kami menerapkan prinsip minimalisasi data yang ketat. Kami hanya mengumpulkan informasi yang benar-benar diperlukan untuk menyediakan identitas perusahaan Anda dan memfasilitasi kemampuan manajemen proyek:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  <strong className="text-black dark:text-white">Corporate Identity:</strong>{' '}
                  {tMsg(
                    'Full name, corporate email address, and profile avatar retrieved via Google Single Sign-On (OAuth 2.0).',
                    'Nama lengkap, alamat email perusahaan, dan avatar profil yang diambil melalui Google Single Sign-On (OAuth 2.0).'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">User Generated Content:</strong>{' '}
                  {tMsg(
                    'Task descriptions, sub-task checklists, chat messages, attached URLs, meeting notes, and direct messages you actively type into the system.',
                    'Deskripsi tugas, daftar periksa sub-tugas, pesan obrolan, URL terlampir, catatan rapat, dan pesan langsung yang Anda ketik secara aktif ke dalam sistem.'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">Domain Restriction:</strong>{' '}
                  {tMsg(
                    'Access is strictly whitelisted and limited to authorized @innocean.co.id and @innocean.com domains.',
                    'Akses di-whitelist secara ketat dan terbatas pada domain resmi @innocean.co.id dan @innocean.com.'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">Guest Visitors:</strong>{' '}
                  {tMsg(
                    'For unauthenticated users viewing public shareable links, we collect standard anonymized server logs (IP address, User-Agent) to prevent abuse and DDoS attacks.',
                    'Bagi pengguna tamu yang melihat tautan publik, kami mengumpulkan log server anonim standar (Alamat IP, User-Agent) untuk mencegah penyalahgunaan dan serangan DDoS.'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                2. {tMsg('How We Use Your Information', 'Bagaimana Kami Menggunakan Informasi Anda')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'The collected data is exclusively used for operational and functional purposes to power the Platform. We utilize your data to:',
                  'Data yang dikumpulkan digunakan secara eksklusif untuk tujuan operasional dan fungsional guna menjalankan Platform. Kami menggunakan data Anda untuk:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  {tMsg(
                    'Authenticate your login and map your identity to the correct enterprise workspaces.',
                    'Membuktikan autentikasi login Anda dan memetakan identitas Anda ke ruang kerja perusahaan yang tepat.'
                  )}
                </li>
                <li>
                  {tMsg(
                    'Dispatch critical system notifications (e.g., task assignments, overdue alerts, @mentions) via SMTP email routing.',
                    'Mengirimkan pemberitahuan sistem kritis (misal: penugasan tugas, peringatan keterlambatan, @mention) melalui perutean email SMTP.'
                  )}
                </li>
                <li>
                  {tMsg(
                    'Calculate automated performance analytics and workload balancing metrics using Estimated Time Consumption (ETC).',
                    'Menghitung analitik kinerja otomatis dan metrik penyeimbangan beban kerja menggunakan Estimasi Waktu Pengerjaan (ETC).'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                3. {tMsg('Sharing and Disclosure of Data', 'Berbagi dan Pengungkapan Data')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'We categorically DO NOT sell, rent, or trade your personal or corporate data to any third-party advertisers or data brokers. Your data is only shared under the following strict conditions:',
                  'Kami secara tegas TIDAK menjual, menyewakan, atau menukar data pribadi atau perusahaan Anda kepada pengiklan pihak ketiga atau pialang data mana pun. Data Anda hanya dibagikan dengan kondisi ketat berikut:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  <strong className="text-black dark:text-white">Workspace Visibility:</strong>{' '}
                  {tMsg(
                    'Members within your specific project board can view your username, avatar, and tasks assigned to you.',
                    'Anggota di dalam papan proyek spesifik Anda dapat melihat nama pengguna, avatar, dan tugas yang ditugaskan kepada Anda.'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">Third-Party LLM Processors:</strong>{' '}
                  {tMsg(
                    'Task contexts and prompts are sent to our authorized AI infrastructure partners (Google Gemini API and Groq Inc. for GPT-OSS) strictly for natural language generation. (See Section 5).',
                    'Konteks tugas dan prompt dikirim ke mitra infrastruktur AI resmi kami (Google Gemini API dan Groq Inc. untuk GPT-OSS) secara ketat untuk pembuatan bahasa alami. (Lihat Bagian 5).'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                4. {tMsg('Local Storage & Trackers', 'Penyimpanan Lokal & Pelacak')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'INNOCEAN Tracker rejects invasive tracking cookies. We heavily utilize standard HTML5 Web Storage (Local Storage & Session Storage) locally on your device solely for:',
                  'INNOCEAN Tracker menolak cookie pelacakan yang invasif. Kami banyak menggunakan Web Storage standar HTML5 (Penyimpanan Lokal & Penyimpanan Sesi) secara lokal di perangkat Anda hanya untuk:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  {tMsg(
                    'Your prompts and task contexts are transmitted securely over TLS 1.3 encrypted channels.',
                    'Perintah (prompt) dan konteks tugas Anda dikirimkan secara aman melalui saluran terenkripsi TLS 1.3.'
                  )}
                </li>
                <li>
                  {tMsg(
                    'Saving UI preferences (Dark Mode, layout states, and notification toggles) so they persist across sessions.',
                    'Menyimpan preferensi UI (Mode Gelap, status tata letak, dan tombol notifikasi) agar bertahan di seluruh sesi.'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                5. {tMsg('AI Processing & Enterprise Confidentiality', 'Pemrosesan AI & Kerahasiaan Perusahaan')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'Our Smart Assistant relies on advanced language models (Google Gemini and GPT-OSS 120B) to process conversational queries and extract meeting notes. We guarantee the following enterprise privacy protections:',
                  'Asisten Pintar kami mengandalkan model bahasa lanjutan (Google Gemini dan GPT-OSS 120B) untuk memproses kueri percakapan dan mengekstrak catatan rapat. Kami menjamin perlindungan privasi perusahaan berikut:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  {tMsg(
                    'Your prompts and task contexts are transmitted securely over TLS 1.3 encrypted channels.',
                    'Perintah (prompt) dan konteks tugas Anda dikirimkan secara aman melalui saluran terenkripsi TLS 1.3.'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">Zero Retention for Training:</strong>{' '}
                  {tMsg(
                    'Under the enterprise API agreements with our AI providers, your corporate data is never retained, logged, or utilized to train any foundational AI models. Your prompts are purged from the AI servers instantly after generation.',
                    'Berdasarkan perjanjian API perusahaan dengan penyedia AI kami, data Anda tidak pernah disimpan, dicatat, atau digunakan untuk melatih model AI apa pun. Prompt Anda dibersihkan dari server AI seketika setelah teks dibuat.'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                6. {tMsg('Data Security Measures', 'Langkah Keamanan Data')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'We prioritize the security of your corporate data by enforcing a Zero-Trust Architecture. Passwords are mathematically scrambled utilizing one-way Bcrypt hashing, meaning even our database administrators cannot view your credentials. The Platform has passed 12 automated penetration tests defending against OWASP Top 10 vulnerabilities (including XSS, CSWSH, IDOR, BOLA, and Brute-Force attacks).',
                  'Kami memprioritaskan keamanan data perusahaan Anda dengan menegakkan Arsitektur Zero-Trust. Kata sandi diacak menggunakan hash Bcrypt satu arah, yang berarti administrator database kami pun tidak dapat melihat kredensial Anda. Platform telah lulus 12 uji penetrasi otomatis yang bertahan dari kerentanan OWASP Top 10 (termasuk XSS, CSWSH, IDOR, BOLA, dan Brute-Force).'
                )}
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                7. {tMsg('Data Retention & Automated Purging', 'Penyimpanan Data & Pembersihan Otomatis')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'To mitigate database bloat and adhere to data lifecycle best practices, INNOCEAN Tracker enforces aggressive automated retention policies (Auto-Purging):',
                  'Untuk mengurangi pembengkakan database dan mematuhi praktik terbaik siklus hidup data, INNOCEAN Tracker menerapkan kebijakan penyimpanan otomatis yang agresif:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  <strong className="text-black dark:text-white">Terminal Tasks:</strong>{' '}
                  {tMsg(
                    'Tasks marked as "Done" or "Rejected" are permanently deleted after 6 months (180 days).',
                    'Tugas yang ditandai "Selesai" atau "Ditolak" akan dihapus secara permanen setelah 6 bulan (180 hari).'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">Communication Logs:</strong>{' '}
                  {tMsg(
                    'Workspace chats, comments, and direct messages are purged after 1 year (365 days).',
                    'Obrolan ruang kerja, komentar, dan DM dihapus setelah 1 tahun (365 hari).'
                  )}
                </li>
                <li>
                  <strong className="text-black dark:text-white">Zombie Projects:</strong>{' '}
                  {tMsg(
                    'Workspaces with zero activity for 180 days are flagged and automatically deleted 7 days later.',
                    'Ruang kerja tanpa aktivitas selama 180 hari akan ditandai dan otomatis dihapus 7 hari kemudian.'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                8. {tMsg('International Data Transfers', 'Transfer Data Internasional')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'INNOCEAN Tracker is deployed on modern cloud infrastructure (including Vercel, Render, and Neon PostgreSQL). As such, your data may be transferred to, and maintained on, computers located outside of your state, province, or country where the data protection laws may differ. By submitting your information, you agree to this transfer, storing, and processing.',
                  'INNOCEAN Tracker disebarkan di infrastruktur cloud modern (termasuk Vercel, Render, dan Neon PostgreSQL). Dengan demikian, data Anda dapat ditransfer ke, dan dipelihara di, komputer yang berlokasi di luar negara atau provinsi Anda di mana undang-undang perlindungan data mungkin berbeda. Dengan mengirimkan informasi Anda, Anda menyetujui transfer dan penyimpanan ini.'
                )}
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                9. {tMsg('Your Privacy Rights (GDPR & PDP)', 'Hak Privasi Anda (GDPR & PDP)')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'In strict accordance with global data protection laws (including the Indonesian Personal Data Protection Act / UU PDP and GDPR principles), you possess the fundamental right to access, rectify, or request the erasure ("Right to be Forgotten") of your personal data. You can initiate a full data export (CSV) directly from the Account Menu interface. To permanently execute an account deletion, please submit an offboarding request to your System Administrator.',
                  'Sesuai dengan undang-undang perlindungan data global (termasuk UU Perlindungan Data Pribadi / UU PDP Indonesia), Anda memiliki hak mendasar untuk mengakses, memperbaiki, atau meminta penghapusan ("Hak untuk Dilupakan") data pribadi Anda. Anda dapat memulai ekspor data secara penuh (CSV) langsung dari antarmuka Menu Akun. Untuk menghapus akun secara permanen, silakan kirimkan permintaan ke Administrator Sistem Anda.'
                )}
              </p>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                10. {tMsg('Changes to This Privacy Policy', 'Perubahan pada Kebijakan Privasi Ini')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'We may update our Privacy Policy periodically to reflect technological advancements or legal compliance requirements. The "Effective Date" at the top of this document indicates when the latest changes were made. We will notify you of any significant material changes via a prominent in-app prompt requiring your consent.',
                  'Kami dapat memperbarui Kebijakan Privasi kami secara berkala untuk mencerminkan kemajuan teknologi atau persyaratan kepatuhan hukum. "Tanggal Efektif" di bagian atas dokumen ini menunjukkan kapan perubahan terbaru dilakukan. Kami akan memberi tahu Anda jika ada perubahan material yang signifikan melalui pemberitahuan pop-up di dalam aplikasi yang meminta persetujuan Anda.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Acknowledgement */}
        <div className="mt-16 pt-10 border-t border-neutral-200 dark:border-neutral-800 flex flex-col items-center pb-10">
          <p className="text-xs text-neutral-500 font-medium mb-6 text-center max-w-lg">
            {tMsg(
              'By continuing to use INNOCEAN Tracker, you acknowledge that you have read and understood this Privacy Policy.',
              'Dengan terus menggunakan INNOCEAN Tracker, Anda mengakui bahwa Anda telah membaca dan memahami Kebijakan Privasi ini.'
            )}
          </p>
          <button
            onClick={close}
            className="px-12 py-4 rounded-full font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-black dark:border-white shadow-xl transition-all uppercase tracking-widest text-sm hover:-translate-y-1"
          >
            {tMsg('Acknowledge & Return', 'Paham & Kembali')}
          </button>
        </div>
      </div>
    </div>
  );
}
