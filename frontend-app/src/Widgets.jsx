import React, { useState, useEffect } from 'react';

export const PomodoroWidget = ({ isDarkMode }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work');

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 1);
      } catch (e) {}
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl p-4 flex flex-col gap-2 w-48 mac-animate hidden md:flex tour-pomodoro">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          {mode === 'work' ? '🍅 Focus' : '☕ Break'}
        </span>
        <button
          onClick={() => {
            setIsRunning(false);
            setMode('work');
            setTimeLeft(25 * 60);
          }}
          className="text-neutral-400 hover:text-red-500"
          title="Reset"
        >
          ↻
        </button>
      </div>
      <div className="text-4xl font-black tabular-nums tracking-tight text-center my-2 text-black dark:text-white">
        {mins}:{secs}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-colors shadow-sm ${
            isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => {
            setMode(mode === 'work' ? 'break' : 'work');
            setTimeLeft(mode === 'work' ? 5 * 60 : 25 * 60);
            setIsRunning(false);
          }}
          className="px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-200 dark:border-neutral-700"
          title="Skip Session"
        >
          ⏭
        </button>
      </div>
    </div>
  );
};

export const ProjectLifecycleBanner = ({ deletionDateStr, language }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const tMsg = (en, id) => (language === 'id' ? id : en);

  useEffect(() => {
    if (!deletionDateStr || typeof deletionDateStr !== 'string') return;
    const interval = setInterval(() => {
      try {
        const dest = new Date(deletionDateStr.replace(/-/g, '/'));
        if (isNaN(dest.getTime())) return;
        const now = new Date();
        const diff = dest - now;
        if (diff <= 0) {
          setTimeLeft(tMsg('Deleting soon...', 'Menghapus segera...'));
        } else {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [deletionDateStr, language]);
  if (!deletionDateStr) return null;
  return (
    <div className="bg-red-500 text-white text-center py-2.5 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-md sticky top-0 z-[99] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
      <span>
        ⚠️{' '}
        {tMsg(
          'PROJECT INACTIVE FOR 6 MONTHS. AUTO-DELETING IN:',
          'PROYEK TIDAK AKTIF SELAMA 6 BULAN. HAPUS OTOMATIS DALAM:'
        )}{' '}
        <span className="font-black text-yellow-300 ml-1">{timeLeft}</span>
      </span>
      <span className="opacity-90 ml-0 sm:ml-4 text-[9px] sm:text-[10px] bg-red-700/50 px-2.5 py-1 rounded-full">
        {tMsg('Add a task or comment to cancel', 'Tambahkan tugas atau komentar untuk membatalkan')}
      </span>
    </div>
  );
};

export const LiveClock = ({ showLiveClockDate, language }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div
      className="hidden lg:flex items-center gap-2 text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800 pr-3 sm:pr-4 mr-1 sm:mr-2 tour-live-clock"
      title="Current Local Time"
    >
      <span className="text-sm">🕒</span>
      {showLiveClockDate && (
        <span className="uppercase tracking-widest">
          {currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}{' '}
          •
        </span>
      )}
      <span className="uppercase tracking-widest">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};
