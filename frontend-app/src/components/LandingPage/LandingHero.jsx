import { Icon } from '../icons/Icon';
import React from 'react';
import InnoceanLogo from '../InnoceanLogo';

export default function LandingHero({
  setIsLoginMode,
  setShowAuthForm,
  isInstallable,
  handleInstallClick,
  language = 'en',
  tMsg = (en) => en,
  onLanguageChange,
}) {

  const openLogin = () => {
    setIsLoginMode(true);
    setShowAuthForm(true);
  };

  const openRegister = () => {
    setIsLoginMode(false);
    setShowAuthForm(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-neutral-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-500/5 via-transparent to-black/5 dark:from-white/5 dark:to-transparent"></div>
        <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl" aria-hidden="true">
          <div
            className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-tr from-neutral-300 to-neutral-500 opacity-20 dark:from-neutral-700 dark:to-neutral-900 dark:opacity-40"
            style={{
              clipPath:
                'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
            }}
          ></div>
        </div>
      </div>

      <nav className="px-6 lg:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-20">
        <InnoceanLogo size="xl" trackerClassName="text-[10px] mt-1" />
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-800 p-0.5 bg-white dark:bg-neutral-900"
            role="group"
            aria-label={tMsg('Language', 'Bahasa')}
          >
            <button
              type="button"
              onClick={() => onLanguageChange?.('en')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                language === 'en'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange?.('id')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                language === 'id'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            >
              ID
            </button>
          </div>
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors items-center gap-1.5"
            >
              <Icon name="download" className="w-4 h-4" />
              {tMsg('Install App', 'Pasang Aplikasi')}
            </button>
          )}
          <button
            onClick={openLogin}
            className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold py-2 px-5 rounded-full transition-all text-sm items-center gap-2 group shadow-lg flex"
          >
            {tMsg('Log in', 'Masuk')}
            <Icon name="arrow-right" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center pt-10 pb-24 lg:pt-20 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-2xl text-left">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white font-bold text-xs mb-6 border border-neutral-200 dark:border-neutral-800"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 dark:bg-neutral-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-black dark:bg-white"></span>
              </span>
              {tMsg('For INNOCEAN Indonesia employees', 'Untuk karyawan INNOCEAN Indonesia')}
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] text-slate-900 dark:text-white"
            >
              {tMsg(
                'Your tasks and projects — in one place.',
                'Tugas dan proyek kamu. Satu tempat.'
              )}
            </h1>
            <p
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 font-medium leading-relaxed"
            >
              {tMsg(
                'See work assigned to you, update progress on the project board, and chat with your team. Tracker is also powered by Smart Assistant — an AI that can help employees day to day.',
                'Lihat pekerjaan yang ditugaskan, update progres di papan proyek, dan chat dengan tim. Tracker juga dibantu Smart Assistant — AI yang bisa membantu karyawan setiap hari.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={openLogin}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold py-3.5 px-8 rounded-full shadow-lg transition-all text-sm flex items-center justify-center gap-2 group hover:-translate-y-0.5"
              >
                {tMsg('Log in', 'Masuk')}
                <Icon name="arrow-right" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={openRegister}
                className="bg-transparent text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-bold py-3.5 px-8 border border-slate-300 dark:border-white/50 rounded-full transition-all text-sm flex items-center justify-center"
              >
                {tMsg('Sign up', 'Daftar')}
              </button>
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-full shadow-lg transition-all text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <Icon name="download" className="w-4 h-4" />
                  {tMsg('Install App', 'Pasang Aplikasi')}
                </button>
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => document.getElementById('can-do-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-semibold text-slate-500 hover:text-black dark:hover:text-white transition-colors"
              >
                {tMsg('See what you can do', 'Lihat yang bisa kamu lakukan')}
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('assistant-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-semibold text-slate-500 hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <Icon name="sparkles" className="w-3.5 h-3.5" />
                {tMsg('Meet Smart Assistant', 'Lihat Smart Assistant')}
              </button>
            </div>
          </div>

          <div
            className="relative hidden lg:block lg:h-full lg:w-full perspective-[1000px]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-300/40 to-neutral-400/40 dark:from-neutral-700/40 dark:to-neutral-800/40 rounded-[2.5rem] transform rotate-3 scale-105 blur-lg"></div>

            <div className="relative w-full bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden animate-float">
              <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
                  <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-600"></div>
                  <div className="w-3 h-3 rounded-full bg-neutral-500 dark:bg-neutral-500"></div>
                </div>
                <div className="mx-auto bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-md px-10 py-1.5 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-medium">INNOCEAN Tracker</span>
                </div>
              </div>
              <div className="flex h-[400px]">
                <div className="w-[28%] border-r border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded bg-black dark:bg-white"></div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Tracker</span>
                  </div>
                  {[
                    tMsg('Home', 'Beranda'),
                    tMsg('Brand Campaign', 'Kampanye Brand'),
                    tMsg('Client Pitch', 'Pitch Klien'),
                  ].map((label, i) => (
                    <div
                      key={label}
                      className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg ${
                        i === 1
                          ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-5 bg-white dark:bg-[#0e1116]">
                  <div className="text-xs font-bold text-slate-800 dark:text-white mb-4">
                    {tMsg('Brand Campaign', 'Kampanye Brand')}
                  </div>
                  <div className="grid grid-cols-3 gap-3 h-[300px]">
                    {[
                      {
                        title: tMsg('To Do', 'To Do'),
                        cards: [
                          tMsg('Draft key visual', 'Draft key visual'),
                          tMsg('Collect client brief', 'Kumpulkan brief klien'),
                        ],
                      },
                      {
                        title: tMsg('In Progress', 'Dikerjakan'),
                        cards: [tMsg('Edit TVC cutdown', 'Edit cutdown TVC')],
                      },
                      {
                        title: tMsg('Done', 'Selesai'),
                        cards: [tMsg('Kickoff deck', 'Deck kickoff')],
                      },
                    ].map((col) => (
                      <div key={col.title} className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">{col.title}</div>
                        {col.cards.map((card) => (
                          <div
                            key={card}
                            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[10px] font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                          >
                            {card}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-30">
        <button
          onClick={() => document.getElementById('can-do-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-black dark:hover:text-white hover:border-slate-400 shadow-sm transition-all"
          title={tMsg('Next section', 'Bagian berikutnya')}
        >
          <Icon name="chevron-down" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
