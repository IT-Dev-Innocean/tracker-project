import React, { useState } from 'react';

export default function LandingFAQ() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'Is INNOCEAN Tracker really free forever?',
      a: 'The software itself has zero per-user licensing fees. It is designed to be deployed on your own cloud infrastructure. While it runs perfectly on free-tier services (like Vercel and Neon DB) for small teams, scaling up to enterprise-level traffic will require paid cloud resources from your hosting provider.',
    },
    {
      q: 'How does the Google SSO integration work?',
      a: 'Employees simply log in using their corporate Google account. The system automatically verifies their domain and provisions their account instantly.',
    },
    {
      q: 'Do I need to pay for the AI features?',
      a: 'To use the Smart Assistant, you need to provide your own API key for Google Gemini or GPT-OSS 120B (via Groq) in the system settings. Both providers offer generous tiers that are usually sufficient for standard team operations.',
    },
    {
      q: 'Is my corporate data used to train the AI?',
      a: 'Absolutely not. We utilize enterprise API endpoints from Google and Groq, which guarantee zero data retention for foundational model training. Your data remains strictly yours.',
    },
    {
      q: 'What browsers are supported? Can I use it on mobile?',
      a: 'INNOCEAN Tracker is optimized for modern desktop browsers like Google Chrome, Firefox, and Safari. While it is fully responsive and functional on mobile browsers, we recommend installing it as a Progressive Web App (PWA) for the best native-app-like experience on your phone.',
    },
    {
      q: 'Can I manage multiple projects at once?',
      a: "Yes! The 'Master View' (Global Workload) dashboard allows you to monitor, filter, and drag-and-drop tasks across all your accessible projects simultaneously.",
    },
    {
      q: 'What happens to old tasks and chats?',
      a: 'To maintain lightning-fast performance, the system automatically purges completed tasks after 6 months and chat history after 1 year.',
    },
  ];

  return (
        <section
          id="faq-section"
          className="py-24 md:py-32 bg-white dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800 relative z-10"
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-12 text-center reveal-on-scroll uppercase">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 reveal-on-scroll" style={{ animationDelay: '100ms' }}>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0e1116] transition-all duration-300 ${
                    activeFaq === idx
                      ? 'shadow-lg ring-2 ring-indigo-500/20'
                      : 'hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between font-bold text-left text-slate-800 dark:text-white focus:outline-none"
                  >
                    <span className="text-base sm:text-lg pr-4">{faq.q}</span>
                    <span
                      className={`transform transition-transform duration-300 text-indigo-500 shrink-0 ${
                        activeFaq === idx ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ${
                      activeFaq === idx ? 'max-h-[800px] pb-5 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Scroll Down to CTA */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-30">
            <button
              onClick={() => document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all animate-bounce"
              title="Next Section"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
            </button>
          </div>
        </section>
  );
}
