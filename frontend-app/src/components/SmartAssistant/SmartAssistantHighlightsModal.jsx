import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';

const SLIDE_MS = 8000;

function BrowserFrame({ children }) {
  return (
    <div className="relative h-full min-h-[240px] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0e1116] sm:min-h-[280px] md:min-h-0">
      <div className="flex h-10 items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 dark:border-slate-800 dark:bg-black/40">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-neutral-500 dark:bg-neutral-400" />
        </div>
        <div className="mx-auto rounded-md border border-slate-200 bg-white px-6 py-1 dark:border-slate-800 dark:bg-black">
          <span className="text-[10px] font-medium text-slate-400">INNOCEAN Tracker</span>
        </div>
      </div>
      <div className="h-[calc(100%-2.5rem)]">{children}</div>
    </div>
  );
}

function PromptsPreview({ tMsg }) {
  const prompts = [
    { icon: 'calendar', label: tMsg('Nearest deadlines', 'Deadline terdekat') },
    { icon: 'users', label: tMsg('Who is overloaded today', 'Siapa yang paling sibuk hari ini') },
    { icon: 'clipboard-list', label: tMsg('How many tasks and projects', 'Jumlah task dan project') },
  ];

  return (
    <BrowserFrame>
      <div className="flex h-full items-center bg-slate-50/70 p-4 dark:bg-slate-900/50 sm:p-6">
        <div className="w-full space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
              <Icon name="sparkles" className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">Smart Assistant</div>
              <div className="text-[11px] text-slate-500">{tMsg('Ready to help', 'Siap membantu')}</div>
            </div>
          </div>
          {prompts.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Icon name={item.icon} className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function AnswersPreview({ tMsg }) {
  return (
    <BrowserFrame>
      <div className="flex h-full flex-col gap-3 bg-slate-50/70 p-4 dark:bg-slate-900/50 sm:p-5">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-slate-200 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {tMsg(
            'Which tasks have the nearest deadlines?',
            'Task mana yang deadline-nya paling dekat?'
          )}
        </div>
        <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-3 text-[11px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-[#0e1116] dark:text-slate-200">
          <p className="mb-2 font-medium">
            {tMsg('Two tasks need attention first:', 'Dua tugas yang perlu didahulukan:')}
          </p>
          <p className="font-bold text-slate-900 dark:text-white">1. Draft key visual</p>
          <p>{tMsg('Deadline: 11 Aug · In Progress · Eka', 'Deadline: 11 Agu · Dikerjakan · Eka')}</p>
          <p className="mt-2 font-bold text-slate-900 dark:text-white">2. TVC cutdown review</p>
          <p>{tMsg('Deadline: 12 Aug · In Progress · Unassigned', 'Deadline: 12 Agu · Dikerjakan · Belum ada PIC')}</p>
        </div>
      </div>
    </BrowserFrame>
  );
}

function HistoryPreview({ tMsg }) {
  const chats = [
    tMsg('Nearest deadlines', 'Deadline terdekat'),
    tMsg('Who is overloaded today', 'Siapa yang paling sibuk'),
    tMsg('Tasks due yesterday', 'Tugas yang jatuh tempo kemarin'),
  ];

  return (
    <BrowserFrame>
      <div className="flex h-full bg-white dark:bg-[#0e1116]">
        <div className="flex w-[46%] flex-col border-r border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">
            <Icon name="search" className="h-3 w-3" />
            deadline
          </div>
          <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {tMsg('Chat history', 'Riwayat chat')}
          </div>
          <div className="space-y-1">
            {chats.map((chat, chatIndex) => (
              <div
                key={chat}
                className={`truncate rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
                  chatIndex === 0
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {chat}
              </div>
            ))}
          </div>
          <div className="mt-auto border-t border-slate-200 pt-2 dark:border-slate-800">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {tMsg('AI usage', 'Pemakaian AI')}
            </div>
            <div className="text-[11px] font-black text-slate-900 dark:text-white">1 / 20</div>
            <div className="text-[9px] text-slate-500">{tMsg('19 prompts left today', '19 prompt tersisa hari ini')}</div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-3 text-center">
          <div>
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
              <Icon name="sparkles" className="h-4 w-4" />
            </div>
            <div className="text-[11px] font-bold text-slate-800 dark:text-white">
              {tMsg('Pick up where you left off', 'Lanjutkan percakapan sebelumnya')}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

const SLIDES = [
  {
    id: 'prompts',
    Preview: PromptsPreview,
    title: ['Ask in plain language', 'Tanya dengan bahasa sehari-hari'],
    description: [
      'Open Smart Assistant and start from a ready-made question: nearest deadlines, who is overloaded today, or how many tasks and projects you have.',
      'Buka Smart Assistant dan mulai dari pertanyaan yang sudah disiapkan: deadline terdekat, siapa yang paling sibuk hari ini, atau berapa jumlah task dan project.',
    ],
  },
  {
    id: 'answers',
    Preview: AnswersPreview,
    title: ['Answers from your task data', 'Jawaban dari data tugas'],
    description: [
      'Ask in everyday language. The assistant replies in chat with the task name, deadline, status, and the person in charge.',
      'Tanyakan dengan bahasa sehari-hari. Asisten membalas di chat dengan nama tugas, tanggal deadline, status, dan PIC.',
    ],
  },
  {
    id: 'history',
    Preview: HistoryPreview,
    title: ['History, search, and daily limit', 'Riwayat, pencarian, dan batas harian'],
    description: [
      'Previous chats stay in the menu. Search them by keyword, and check how many AI prompts you have left today.',
      'Percakapan lama tetap ada di menu. Cari dengan kata kunci, lalu lihat sisa prompt AI yang masih bisa dipakai hari ini.',
    ],
  },
];

export default function SmartAssistantHighlightsModal({ open, onClose, onTryNow, tMsg }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setIndex(0);
    return undefined;
  }, [open]);

  if (!open) return null;

  const slide = SLIDES[index];
  const Preview = slide.Preview;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8" style={{ zIndex: 400 }}>
      <style>{`
        @keyframes sa-highlight-fill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes sa-highlight-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 md:hidden"
        aria-label={tMsg('Close', 'Tutup')}
      >
        <Icon name="x" className="h-4 w-4" />
      </button>

      <div className="relative w-full max-w-4xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute -left-5 -top-5 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-neutral-900 text-white shadow-lg transition-colors hover:bg-black md:flex"
        aria-label={tMsg('Close', 'Tutup')}
      >
        <Icon name="x" className="h-4 w-4" />
      </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tMsg('Smart Assistant highlights', 'Highlight Smart Assistant')}
        className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-[#0e1116] md:grid-cols-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="order-2 flex flex-col justify-center p-6 sm:p-8 md:order-1 md:p-10">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-neutral-900 dark:text-slate-200">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Smart Assistant
          </div>
          <div key={slide.id} style={{ animation: 'sa-highlight-in 0.35s ease' }}>
            <h2 className="text-2xl font-black leading-snug tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {tMsg(slide.title[0], slide.title[1])}
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[15px]">
              {tMsg(slide.description[0], slide.description[1])}
            </p>
            {index === SLIDES.length - 1 && (
              <button
                type="button"
                onClick={onTryNow}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200"
              >
                {tMsg('Try now', 'Coba sekarang')}
                <Icon name="arrow-right" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mt-8 flex items-center gap-2" role="tablist" aria-label={tMsg('Highlights', 'Highlight')}>
            {SLIDES.map((item, itemIndex) => {
              const active = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={tMsg(item.title[0], item.title[1])}
                  onClick={() => setIndex(itemIndex)}
                  className={`h-2 rounded-full transition-all ${
                    active
                      ? 'w-6 bg-slate-900 dark:bg-white'
                      : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-500'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-5 h-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              key={slide.id}
              className="h-full w-full origin-left bg-slate-900 dark:bg-white"
              style={{
                animation: reduceMotion ? 'none' : `sa-highlight-fill ${SLIDE_MS}ms linear forwards`,
                animationPlayState: paused ? 'paused' : 'running',
                transform: reduceMotion ? 'scaleX(1)' : undefined,
              }}
              onAnimationEnd={() => {
                if (reduceMotion || pausedRef.current) return;
                setIndex((current) => (current + 1) % SLIDES.length);
              }}
            />
          </div>
        </div>

        <div className="order-1 bg-white p-4 dark:bg-neutral-950 sm:p-6 md:order-2 md:p-8">
          <div key={slide.id} className="h-full" style={{ animation: 'sa-highlight-in 0.35s ease' }}>
            <Preview tMsg={tMsg} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
