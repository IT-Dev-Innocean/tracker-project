import { Icon } from '../icons/Icon';
import React, { useState } from 'react';

export default function LandingFAQ({ tMsg = (en) => en }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: tMsg('How do I log in?', 'Bagaimana cara masuk?'),
      a: tMsg(
        'Use Google, or sign in with your work email (@innocean.co.id or @innocean.com) and password. New teammates can sign up with the same work email.',
        'Masuk lewat Google, atau pakai email kantor (@innocean.co.id atau @innocean.com) dan kata sandi. Rekan baru bisa daftar dengan email kantor yang sama.'
      ),
    },
    {
      q: tMsg('Who can create tasks?', 'Siapa yang bisa membuat tugas?'),
      a: tMsg(
        'Managers, project owners, and admins can create and edit tasks. Staff can view assigned work and follow progress. What you see in the menu depends on your role.',
        'Manager, project owner, dan admin yang bisa membuat dan mengubah tugas. Staff bisa melihat pekerjaan yang ditugaskan dan mengikuti progres. Menu yang muncul mengikuti peran kamu.'
      ),
    },
    {
      q: tMsg('Is there an AI assistant?', 'Ada Smart Assistant-nya?'),
      a: tMsg(
        'Yes. Tracker is powered by Smart Assistant. After you log in, you can ask it to summarize a discussion, suggest next steps, or help with a task — in everyday language.',
        'Ada. Tracker dibantu Smart Assistant. Setelah masuk, kamu bisa minta ringkasan diskusi, saran langkah berikutnya, atau bantuan soal tugas — dengan bahasa biasa.'
      ),
    },
    {
      q: tMsg('Can I use this on my phone?', 'Bisa dipakai di HP?'),
      a: tMsg(
        'Yes. Tracker works in a mobile browser. For day-to-day work, a laptop or desktop is more comfortable — especially for project boards.',
        'Bisa. Tracker berfungsi di browser HP. Untuk kerja harian, laptop atau desktop lebih nyaman — terutama untuk papan proyek.'
      ),
    },
    {
      q: tMsg('Need help from IT?', 'Butuh bantuan IT?'),
      a: tMsg(
        'Log in first, then contact support from your profile menu. Guest support from this landing page is not available yet.',
        'Masuk dulu, lalu hubungi support dari menu profil. Bantuan untuk pengunjung di halaman ini belum tersedia.'
      ),
    },
  ];

  return (
    <section
      id="faq-section"
      className="py-24 md:py-32 bg-white dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800 relative z-10"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-12 text-center leading-[1.15]">
          {tMsg('Questions teammates usually ask', 'Yang biasanya ditanyakan rekan kerja')}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={faq.q}
              className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0e1116] transition-all duration-300 ${
                activeFaq === idx
                  ? 'shadow-lg ring-2 ring-slate-900/10 dark:ring-white/10'
                  : 'hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between font-bold text-left text-slate-800 dark:text-white focus:outline-none"
              >
                <span className="text-base sm:text-lg pr-4">{faq.q}</span>
                <span
                  className={`transform transition-transform duration-300 text-slate-400 shrink-0 ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                >
                  <Icon name="chevron-down" className="w-5 h-5" />
                </span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-5">
                  <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
