import React from 'react';
import { useCloseAnimation } from './Utils';

export default function TermsOfServiceModal({ setIsTermsOpen, language }) {
  const [isClosing, close] = useCloseAnimation(() => setIsTermsOpen(false));
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
              {tMsg('Terms of Service', 'Syarat dan Ketentuan')}
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
                'This Master Service Agreement ("Agreement") constitutes a legally binding contract between you (whether personally or on behalf of an entity) and INNOCEAN Tracker concerning your access to and use of the INNOCEAN Tracker enterprise workload management platform. By authenticating via Google SSO, clicking "I Agree," or otherwise accessing the system, you expressly acknowledge that you have read, understood, and agree to be bound by all of these enterprise terms.',
                'Perjanjian Layanan Utama ("Perjanjian") ini merupakan kontrak yang mengikat secara hukum antara Anda (baik secara pribadi atau atas nama entitas) dan INNOCEAN Tracker mengenai akses dan penggunaan Anda terhadap platform manajemen beban kerja perusahaan INNOCEAN Tracker. Dengan masuk melalui Google SSO, mengeklik "Saya Setuju," atau mengakses sistem, Anda secara tegas menyatakan bahwa Anda telah membaca, memahami, dan setuju untuk terikat oleh seluruh ketentuan perusahaan ini.'
              )}
            </p>

            {/* Section 1 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                1. {tMsg('Definitions & Interpretations', 'Definisi & Interpretasi')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'For the purposes of this Agreement: "Platform" refers to the INNOCEAN Tracker software, website, and related APIs. "User", "You", and "Your" refer to the individual accessing the Platform. "Content" refers to any data, text, or materials uploaded by the User. "AI Assistant" refers to the integrated third-party large language models utilized within the Platform.',
                  'Untuk tujuan Perjanjian ini: "Platform" merujuk pada perangkat lunak, situs web, dan API terkait INNOCEAN Tracker. "Pengguna", "Anda", dan "Milik Anda" merujuk pada individu yang mengakses Platform. "Konten" merujuk pada data, teks, atau materi apa pun yang diunggah oleh Pengguna. "Asisten AI" merujuk pada model bahasa besar pihak ketiga yang terintegrasi di dalam Platform.'
                )}
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                2. {tMsg('License Grant & Restrictions', 'Pemberian Lisensi & Batasan')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'Subject to your compliance with this Agreement, INNOCEAN Tracker grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the Platform strictly for internal business purposes. You are strictly prohibited from:',
                  'Dengan tunduk pada kepatuhan Anda terhadap Perjanjian ini, INNOCEAN Tracker memberi Anda lisensi terbatas, non-eksklusif, tidak dapat dialihkan, dan dapat dibatalkan untuk mengakses dan menggunakan Platform secara ketat untuk tujuan bisnis internal. Anda dilarang keras untuk:'
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  {tMsg(
                    'Reverse engineering, decompiling, disassembling, or otherwise attempting to derive the source code of the Platform.',
                    'Melakukan rekayasa balik, mendekompilasi, membongkar, atau mencoba mendapatkan kode sumber dari Platform.'
                  )}
                </li>
                <li>
                  {tMsg(
                    'Using the Platform to build a competitive product or service.',
                    'Menggunakan Platform untuk membangun produk atau layanan yang bersaing.'
                  )}
                </li>
                <li>
                  {tMsg(
                    'Circumventing any security features or access controls implemented within the Zero-Trust Architecture.',
                    'Mengakali fitur keamanan atau kontrol akses yang diterapkan dalam Arsitektur Zero-Trust.'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                3. {tMsg('Authorized Access & Account Security', 'Akses Sah & Keamanan Akun')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'Access is strictly provisioned for INNOCEAN employees and verified partners through Single Sign-On (SSO) authentication. You are solely responsible for safeguarding your credentials. Any unauthorized access attempts, privilege escalation, or lateral movement within the network will be heavily logged and may result in immediate account termination, network ban, and potential legal action.',
                  'Akses disediakan secara ketat untuk karyawan dan mitra terverifikasi INNOCEAN melalui otentikasi Single Sign-On (SSO). Anda sepenuhnya bertanggung jawab untuk menjaga kredensial Anda. Setiap upaya akses tidak sah, eskalasi hak istimewa, atau pergerakan lateral dalam jaringan akan dicatat secara ketat dan dapat mengakibatkan penghentian akun, larangan jaringan, dan tindakan hukum potensial.'
                )}
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                4. {tMsg('Acceptable Use & API Limits', 'Penggunaan yang Dapat Diterima & Batasan API')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'To maintain optimal performance across the enterprise, users must adhere to the acceptable use policy. You are strictly prohibited from deploying malicious payloads, executing automated scraping bots, or attempting Denial of Service (DoS) attacks. Furthermore, abusing the Smart Assistant AI endpoints—which may cause API billing exhaustion or rate-limit lockouts—is strictly forbidden and will result in permanent suspension.',
                  'Untuk mempertahankan kinerja optimal di seluruh perusahaan, pengguna harus mematuhi kebijakan penggunaan yang dapat diterima. Anda dilarang keras menyebarkan muatan berbahaya, mengeksekusi bot scraping otomatis, atau mencoba serangan Denial of Service (DoS). Selanjutnya, menyalahgunakan titik akhir Asisten AI—yang dapat menyebabkan kelelahan tagihan API atau penguncian batas laju—sangat dilarang dan akan mengakibatkan penangguhan permanen.'
                )}
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                5. {tMsg('Shareable Links & Guest Previews', 'Tautan Publik & Pratinjau Tamu')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'The Platform allows the generation of shareable Deep Links for external guests. While the system automatically obscures sensitive task descriptions and checklists to prevent Data Loss (DLP), you remain strictly and solely responsible for any external link distribution. You must not share task URLs containing highly confidential corporate titles on public forums or unauthorized channels.',
                  'Platform ini memungkinkan pembuatan Tautan Dalam (Deep Links) yang dapat dibagikan untuk tamu eksternal. Meskipun sistem secara otomatis menyamarkan deskripsi tugas dan daftar periksa yang sensitif untuk mencegah Kehilangan Data (DLP), Anda tetap bertanggung jawab secara ketat dan penuh atas distribusi tautan eksternal. Anda tidak boleh membagikan URL tugas yang berisi judul rahasia perusahaan di forum publik atau saluran yang tidak sah.'
                )}
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                6. {tMsg('AI Assistant & Liability Disclaimer', 'Asisten AI & Pengecualian Tanggung Jawab')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'The Platform integrates advanced Large Language Models (including Google Gemini and GPT-OSS 120B) to automate workflows. AI-generated content—including but not limited to task drafts, meeting summaries, and code snippets—is provided strictly on an "AS IS" and "AS AVAILABLE" basis. You acknowledge that AI may occasionally produce inaccurate, biased, or incomplete information ("Hallucinations"). You must independently verify all AI outputs before utilizing them in production workflows. INNOCEAN Tracker assumes zero liability for business damages resulting from reliance on AI-generated content.',
                  'Platform ini mengintegrasikan Model Bahasa Besar tingkat lanjut (termasuk Google Gemini dan GPT-OSS 120B) untuk mengotomatiskan alur kerja. Konten yang dihasilkan AI disediakan secara ketat "SEBAGAIMANA ADANYA" dan "SEBAGAIMANA TERSEDIA". Anda mengakui bahwa AI sesekali dapat menghasilkan informasi yang tidak akurat, bias, atau tidak lengkap ("Halusinasi"). Anda harus memverifikasi secara independen semua keluaran AI sebelum menggunakannya. INNOCEAN Tracker tidak memikul tanggung jawab apa pun atas kerugian bisnis yang diakibatkan oleh ketergantungan pada konten AI.'
                )}
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                7. {tMsg('Service Level Agreement (SLA) & Free Tier', 'SLA & Infrastruktur Tier Gratis')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'INNOCEAN Tracker is currently deployed utilizing Free Tier cloud infrastructure (including Vercel, Render, and Neon DB). Consequently, we explicitly do not provide a guaranteed 99.9% or 99.99% uptime Service Level Agreement (SLA). The Platform is subject to scheduled maintenance, unscheduled crashes, and third-party provider outages.',
                  'INNOCEAN Tracker saat ini disebarkan menggunakan infrastruktur cloud Tier Gratis. Akibatnya, kami secara eksplisit tidak memberikan Jaminan Tingkat Layanan (SLA) waktu aktif (uptime) 99,9% atau 99,99%. Platform ini tunduk pada pemeliharaan terjadwal, kerusakan tidak terjadwal, dan pemadaman penyedia pihak ketiga.'
                )}
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl mt-4">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-bold mb-1">
                  {tMsg('Cold Start Phenomenon', 'Fenomena Cold Start')}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  {tMsg(
                    'You acknowledge and accept that the backend computing instances will automatically "sleep" after 15 minutes of network inactivity. Waking the server may result in a 15 to 50-second delay (known as a Cold Start) during initial authentication or data retrieval.',
                    'Anda mengetahui dan menerima bahwa instans komputasi backend akan otomatis "tidur" setelah 15 menit tanpa aktivitas jaringan. Membangunkan server dapat mengakibatkan penundaan 15 hingga 50 detik (dikenal sebagai Cold Start) selama otentikasi awal.'
                  )}
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                8. {tMsg('Intellectual Property Rights', 'Hak Kekayaan Intelektual')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'All project data, task configurations, meeting notes, flowcharts, and chat logs generated or uploaded within this Platform remain the sole and exclusive Intellectual Property (IP) of INNOCEAN. You do not acquire any ownership rights by using the Platform. Furthermore, the source code, design, and architecture of INNOCEAN Tracker are protected by copyright and trade secret laws.',
                  'Semua data proyek, konfigurasi tugas, catatan rapat, bagan alir, dan log obrolan yang dihasilkan atau diunggah di dalam Platform ini tetap menjadi Hak Kekayaan Intelektual (HAKI) tunggal dan eksklusif milik INNOCEAN. Anda tidak memperoleh hak kepemilikan apa pun dengan menggunakan Platform ini. Selain itu, kode sumber, desain, dan arsitektur INNOCEAN Tracker dilindungi oleh undang-undang hak cipta dan rahasia dagang.'
                )}
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                9. {tMsg('System Administration & Interventions', 'Administrasi Sistem & Intervensi')}
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-base text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  {tMsg(
                    'System Administrators reserve the absolute right to audit, freeze, suspend, or permanently delete user accounts found violating these terms without prior notice.',
                    'Administrator Sistem berhak penuh untuk mengaudit, membekukan, menangguhkan, atau menghapus permanen akun pengguna yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.'
                  )}
                </li>
                <li>
                  {tMsg(
                    'Administrators may forcefully transfer ownership of "Orphaned" projects belonging to departed or offboarded employees to other active users to maintain business continuity.',
                    'Administrator dapat secara paksa memindahkan kepemilikan proyek "Yatim" milik karyawan yang keluar kepada pengguna aktif lainnya untuk menjaga kelangsungan bisnis.'
                  )}
                </li>
              </ul>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                10. {tMsg('Indemnification', 'Ganti Rugi')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'You agree to defend, indemnify, and hold harmless INNOCEAN, its affiliates, developers, and licensors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys’ fees) arising out of or relating to your violation of these Terms of Service or your unauthorized use of the Platform.',
                  'Anda setuju untuk membela, mengganti rugi, dan membebaskan INNOCEAN, afiliasinya, pengembang, dan pemberi lisensinya dari dan terhadap klaim, kewajiban, kerugian, kerusakan, putusan, penghargaan, kerugian, biaya, pengeluaran, atau biaya apa pun (termasuk biaya pengacara yang wajar) yang timbul dari atau terkait dengan pelanggaran Anda terhadap Ketentuan Layanan ini atau penggunaan Platform Anda yang tidak sah.'
                )}
              </p>
            </div>

            {/* Section 11 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                11. {tMsg('Limitation of Liability', 'Batasan Tanggung Jawab')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4 uppercase">
                {tMsg(
                  'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL INNOCEAN TRACKER, ITS DEVELOPERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, THAT RESULT FROM THE USE OF, OR INABILITY TO USE, THIS PLATFORM.',
                  'SEJAUH DIIZINKAN OLEH HUKUM YANG BERLAKU, DALAM KEADAAN APA PUN INNOCEAN TRACKER, PENGEMBANGNYA, ATAU AFILIASINYA TIDAK AKAN BERTANGGUNG JAWAB ATAS KERUGIAN TIDAK LANGSUNG, HUKUMAN, INSIDENTAL, KHUSUS, KONSEKUENSIAL, ATAU KERUGIAN CONTOH, TERMASUK NAMUN TIDAK TERBATAS PADA KERUGIAN ATAS HILANGNYA KEUNTUNGAN, NIAT BAIK, PENGGUNAAN, DATA, ATAU KERUGIAN TAK BERWUJUD LAINNYA, YANG DIHASILKAN DARI PENGGUNAAN, ATAU KETIDAKMAMPUAN MENGGUNAKAN, PLATFORM INI.'
                )}
              </p>
            </div>

            {/* Section 12 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                12. {tMsg('Modifications to the Service & Terms', 'Modifikasi Layanan & Ketentuan')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'We reserve the right to modify, suspend, or discontinue, temporarily or permanently, the Platform or any service to which it connects, with or without notice and without liability to you. Furthermore, we may revise these Terms from time to time. The most current version will always be presented within the application interface.',
                  'Kami berhak untuk mengubah, menangguhkan, atau menghentikan, untuk sementara atau secara permanen, Platform atau layanan apa pun yang terhubung dengannya, dengan atau tanpa pemberitahuan dan tanpa kewajiban kepada Anda. Selanjutnya, kami dapat merevisi Ketentuan ini dari waktu ke waktu. Versi terbaru akan selalu disajikan di dalam antarmuka aplikasi.'
                )}
              </p>
            </div>

            {/* Section 13 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                13. {tMsg('Governing Law & Jurisdiction', 'Hukum yang Mengatur & Yurisdiksi')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in Jakarta, Indonesia.',
                  'Ketentuan ini akan diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan ketentuan konflik hukumnya. Setiap tindakan hukum atau proses yang timbul berdasarkan Ketentuan ini akan diajukan secara eksklusif di pengadilan yang berlokasi di Jakarta, Indonesia.'
                )}
              </p>
            </div>

            {/* Section 14 */}
            <div className="mb-10">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4">
                14. {tMsg('Entire Agreement & Severability', 'Keseluruhan Perjanjian & Keterpisahan')}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-4">
                {tMsg(
                  'This Agreement constitutes the entire agreement between you and INNOCEAN Tracker regarding the use of the Platform. If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced to the fullest extent under law.',
                  'Perjanjian ini merupakan keseluruhan perjanjian antara Anda dan INNOCEAN Tracker mengenai penggunaan Platform. Jika ada ketentuan dalam Ketentuan ini yang dianggap tidak sah atau tidak dapat dilaksanakan, ketentuan tersebut akan dihapus dan ketentuan yang tersisa akan dilaksanakan sejauh mungkin berdasarkan hukum.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Acknowledgement */}
        <div className="mt-16 pt-10 border-t border-neutral-200 dark:border-neutral-800 flex flex-col items-center pb-10">
          <p className="text-xs text-neutral-500 font-medium mb-6 text-center max-w-lg">
            {tMsg(
              'By proceeding, you legally agree to adhere to the terms and conditions outlined above.',
              'Dengan melanjutkan, Anda secara hukum setuju untuk mematuhi syarat dan ketentuan yang diuraikan di atas.'
            )}
          </p>
          <button
            onClick={close}
            className="px-12 py-4 rounded-full font-bold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-black dark:border-white shadow-xl transition-all uppercase tracking-widest text-sm hover:-translate-y-1"
          >
            {tMsg('I Agree & Return', 'Saya Setuju & Kembali')}
          </button>
        </div>
      </div>
    </div>
  );
}
