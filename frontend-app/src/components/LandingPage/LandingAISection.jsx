import { Icon } from '../icons/Icon';
import React, { useState } from 'react';

export default function LandingAISection({ tMsg = (en) => en }) {
  const [activeStep, setActiveStep] = useState(0);

  const capabilities = [
    {
      icon: 'clipboard-list',
      title: tMsg('Manage tasks on the board', 'Kelola tugas di papan proyek'),
      desc: tMsg(
        'Move cards across columns as work progresses. Open a task to see details, subtasks, and comments.',
        'Geser kartu antar kolom sesuai progres. Buka tugas untuk lihat detail, subtugas, dan komentar.'
      ),
    },
    {
      icon: 'message-circle',
      title: tMsg('Chat with your team', 'Chat dengan tim'),
      desc: tMsg(
        'Open workspace chat for project threads, task discussions, and one-to-one messages — without leaving Tracker.',
        'Buka chat workspace untuk percakapan proyek, diskusi tugas, dan pesan langsung — tanpa keluar dari Tracker.'
      ),
    },
    {
      icon: 'calendar',
      title: tMsg('See deadlines on calendar and timeline', 'Lihat deadline di kalender dan timeline'),
      desc: tMsg(
        'Check due dates in calendar or timeline view. Weekends and Indonesian public holidays are already counted.',
        'Cek tanggal jatuh tempo di tampilan kalender atau timeline. Akhir pekan dan libur nasional Indonesia sudah dihitung.'
      ),
    },
    {
      icon: 'sun',
      title: tMsg('Request time off', 'Catat cuti'),
      desc: tMsg(
        'Submit leave from your profile so the team can see when you are away.',
        'Ajukan cuti dari profil kamu supaya tim tahu kapan kamu tidak masuk.'
      ),
    },
  ];

  const steps = [
    {
      title: tMsg('1. Log in with your work account', '1. Masuk dengan akun kantor'),
      desc: tMsg(
        'Use Google or your @innocean.co.id / @innocean.com email. This workspace is for INNOCEAN Indonesia employees.',
        'Pakai Google atau email @innocean.co.id / @innocean.com. Workspace ini untuk karyawan INNOCEAN Indonesia.'
      ),
      icon: 'home',
    },
    {
      title: tMsg('2. Open your project or your tasks', '2. Buka proyek atau tugas kamu'),
      desc: tMsg(
        'Home shows your workspace. Open a project board, or if you are Staff, start from My Tasks.',
        'Beranda menampilkan workspace kamu. Buka papan proyek, atau jika kamu Staff, mulai dari Tugas Saya.'
      ),
      icon: 'clipboard-list',
    },
    {
      title: tMsg('3. Update status, chat, or ask the assistant', '3. Update status, chat, atau tanya asisten'),
      desc: tMsg(
        'Move the card when work moves. Ask a teammate in chat, or ask Smart Assistant if you need a hand.',
        'Geser kartu jika pekerjaan maju. Tanya rekan di chat, atau tanya Smart Assistant jika butuh bantuan.'
      ),
      icon: 'check-circle',
    },
  ];

  const renderStepMockup = () => {
    if (activeStep === 0) {
      return (
        <div className="h-full p-5 sm:p-8 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-center">
          <div className="w-full max-w-[280px] bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-lg">
            <div className="text-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white mx-auto mb-2" />
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {tMsg('Log in', 'Masuk')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {tMsg('Use your work account', 'Pakai akun kantor kamu')}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-3">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-500 via-green-400 to-yellow-400" />
              Google
            </div>
            <div className="flex items-center gap-2 my-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-[9px] font-bold text-slate-400">{tMsg('or', 'atau')}</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-2 px-3 flex items-center text-[10px] text-slate-400">
              @innocean.co.id
            </div>
            <div className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-3 px-3 flex items-center text-[10px] text-slate-400">
              ••••••••
            </div>
            <div className="h-9 rounded-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold flex items-center justify-center">
              {tMsg('Log in', 'Masuk')}
            </div>
          </div>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="flex h-full bg-white dark:bg-[#0e1116]">
          <div className="w-[30%] border-r border-slate-100 dark:border-slate-800 p-3 space-y-1.5 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-5 h-5 rounded bg-black dark:bg-white" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Tracker</span>
            </div>
            {[
              tMsg('Home', 'Beranda'),
              tMsg('My Tasks', 'Tugas Saya'),
              tMsg('Brand Campaign', 'Kampanye Brand'),
            ].map((label, i) => (
              <div
                key={label}
                className={`text-[10px] font-semibold px-2 py-1.5 rounded-lg ${
                  i === 0
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div className="text-[11px] font-bold text-slate-800 dark:text-white">
              {tMsg('Home', 'Beranda')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: tMsg('Assigned to you', 'Ditugaskan ke kamu'), count: '4' },
                { label: tMsg('Due this week', 'Tenggat minggu ini'), count: '2' },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
                >
                  <div className="text-lg font-black text-slate-900 dark:text-white">{card.count}</div>
                  <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 space-y-2">
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {tMsg('Your tasks', 'Tugas kamu')}
              </div>
              {[
                tMsg('Draft key visual', 'Draft key visual'),
                tMsg('Edit TVC cutdown', 'Edit cutdown TVC'),
              ].map((task) => (
                <div
                  key={task}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-2 border border-slate-100 dark:border-slate-700"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-900/50 flex gap-3">
        <div className="flex-1 grid grid-cols-3 gap-2">
          {[
            { title: tMsg('To Do', 'To Do'), cards: [tMsg('Collect client brief', 'Kumpulkan brief klien')] },
            { title: tMsg('In Progress', 'Dikerjakan'), cards: [tMsg('Draft key visual', 'Draft key visual')] },
            { title: tMsg('Done', 'Selesai'), cards: [tMsg('Kickoff deck', 'Deck kickoff')] },
          ].map((col, i) => (
            <div key={col.title} className="bg-white dark:bg-slate-800/40 rounded-xl p-2 flex flex-col gap-2">
              <div className="text-[9px] font-bold text-slate-500 px-0.5">{col.title}</div>
              {col.cards.map((card) => (
                <div
                  key={card}
                  className={`rounded-lg px-2 py-2 text-[9px] font-medium shadow-sm border ${
                    i === 1
                      ? 'bg-white dark:bg-slate-700 border-slate-900 dark:border-white text-slate-800 dark:text-white ring-2 ring-slate-900/10 dark:ring-white/10'
                      : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-200'
                  }`}
                >
                  {card}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="hidden sm:flex w-[42%] flex-col bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-700 rounded-xl p-3 gap-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Icon name="sparkles" className="w-3 h-3" />
            </div>
            <div className="text-[10px] font-bold text-slate-800 dark:text-white">Smart Assistant</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl rounded-br-sm px-2.5 py-2 text-[9px] text-slate-600 dark:text-slate-300 ml-auto max-w-[95%]">
            {tMsg('What should I update next?', 'Apa yang perlu di-update berikutnya?')}
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl rounded-bl-sm px-2.5 py-2 text-[9px] text-slate-700 dark:text-slate-200 max-w-[95%]">
            {tMsg('Move the key visual card, then ping the team.', 'Geser kartu key visual, lalu chat tim.')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <section
        id="can-do-section"
        className="py-24 md:py-32 bg-white dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-[1.15]">
              {tMsg('What you can do here', 'Yang bisa kamu lakukan di sini')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              {tMsg(
                'INNOCEAN Tracker is the internal workspace for daily project work at INNOCEAN Indonesia.',
                'INNOCEAN Tracker adalah workspace internal untuk kerja proyek harian di INNOCEAN Indonesia.'
              )}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1116]"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>

          <div
            id="assistant-section"
            className="mt-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0e1116] p-6 sm:p-10"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200 font-bold text-xs mb-5 border border-slate-200 dark:border-slate-700">
                <Icon name="sparkles" className="w-3.5 h-3.5" />
                Smart Assistant
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-snug">
                {tMsg(
                  'Tracker is also powered by an AI assistant.',
                  'Tracker juga dibantu Smart Assistant.'
                )}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {tMsg(
                  'Write what you need in everyday language. Smart Assistant can summarize a discussion, suggest next steps, or help you get unstuck on a task — so you don’t have to start from a blank page.',
                  'Tulis saja yang kamu butuhkan dengan bahasa biasa. Smart Assistant bisa merangkum diskusi, menyarankan langkah berikutnya, atau membantu saat kamu stuck di suatu tugas — supaya tidak perlu mulai dari halaman kosong.'
                )}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Icon name="sparkles" className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">Smart Assistant</div>
                  <div className="text-[11px] text-slate-500">
                    {tMsg('Ready to help', 'Siap membantu')}
                  </div>
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-slate-600 dark:text-slate-300 ml-auto max-w-[90%]">
                {tMsg(
                  'Can you summarize what we still need to finish this week?',
                  'Bisa ringkas apa yang masih perlu diselesaikan minggu ini?'
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-700 dark:text-slate-200 max-w-[90%]">
                {tMsg(
                  'Two things left: the key visual draft, and the TVC cutdown review. I can help you write the next update.',
                  'Tersisa dua hal: draft key visual, dan review cutdown TVC. Saya bisa bantu tulis update berikutnya.'
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works-section"
        className="pt-16 pb-24 md:pt-20 md:pb-32 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-[1.15]">
              {tMsg('How a typical day starts', 'Bagaimana hari kerja biasanya dimulai')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
              {tMsg(
                'Three steps. No extra tools to learn before you can do real work.',
                'Tiga langkah. Tidak perlu belajar tool tambahan sebelum bisa kerja.'
              )}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="flex flex-col gap-3">
              {steps.map((step, idx) => (
                <button
                  type="button"
                  key={step.title}
                  onClick={() => setActiveStep(idx)}
                  className={`text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                    activeStep === idx
                      ? 'bg-white dark:bg-[#0e1116] border-slate-900 dark:border-slate-100 shadow-xl'
                      : 'bg-transparent border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 opacity-70 hover:opacity-100'
                  }`}
                >
                  <h3
                    className={`text-base sm:text-lg font-bold mb-1.5 flex items-center gap-3 ${
                      activeStep === idx ? 'text-black dark:text-white' : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    <Icon name={step.icon} className="w-5 h-5 shrink-0" /> {step.title}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed font-medium ${
                      activeStep === idx
                        ? 'text-slate-600 dark:text-slate-200'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="relative h-80 sm:h-[420px] lg:h-[440px] w-full rounded-[2rem] bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-11 bg-slate-50/80 dark:bg-black/40 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2 z-10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-500 dark:bg-neutral-400" />
                </div>
                <div className="mx-auto bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-md px-8 py-1">
                  <span className="text-[10px] text-slate-400 font-medium">INNOCEAN Tracker</span>
                </div>
              </div>
              <div className="absolute inset-x-0 top-11 bottom-0">{renderStepMockup()}</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
