import React from 'react';

export default function SmartAssistantLanding({
  currentUser,
  tMsg,
  setAssistantMode,
  startQuickNote,
  startConversation,
  renderDiscardModal,
}) {
  return (
    <div className="flex-1 flex flex-col w-full h-full bg-white dark:bg-neutral-950 relative z-20 items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg mac-animate">
        ✨
      </div>
      <h2
        className="text-2xl font-black text-black dark:text-white mb-2 mac-animate"
        style={{ animationDelay: '100ms' }}
      >
        {tMsg('Hello', 'Halo')} @{currentUser}
      </h2>
      <p
        className="text-sm text-neutral-500 font-medium mb-10 max-w-xs mx-auto mac-animate"
        style={{ animationDelay: '150ms' }}
      >
        {tMsg('What would you like to do today?', 'Apa yang ingin Anda lakukan hari ini?')}
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm mac-animate" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => setAssistantMode('quick_todo')}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center gap-4 text-left group"
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-emerald-100 dark:border-emerald-800/50">
            ⚡
          </div>
          <div>
            <h3 className="font-bold text-black dark:text-white text-sm">
              {tMsg('Quick To-Do List', 'To-Do List Cepat')}
            </h3>
            <p className="text-[10px] font-medium text-neutral-500 mt-0.5">
              {tMsg('Rapidly add multiple tasks', 'Tambah banyak tugas dengan cepat')}
            </p>
          </div>
        </button>

        <button
          onClick={() => setAssistantMode('planner')}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-purple-500 dark:hover:border-purple-500 transition-all flex items-center gap-4 text-left group"
        >
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-purple-100 dark:border-purple-800/50">
            🚀
          </div>
          <div>
            <h3 className="font-bold text-black dark:text-white text-sm">
              {tMsg('AI Task Planner', 'Perencana Tugas AI')}
            </h3>
            <p className="text-[10px] font-medium text-neutral-500 mt-0.5">
              {tMsg('Auto-generate full project structures', 'Buat struktur proyek secara otomatis')}
            </p>
          </div>
        </button>

        <button
          onClick={() => startQuickNote()}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-amber-500 dark:hover:border-amber-500 transition-all flex items-center gap-4 text-left group"
        >
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-amber-100 dark:border-amber-800/50">
            📝
          </div>
          <div>
            <h3 className="font-bold text-black dark:text-white text-sm">{tMsg('Meeting Notes', 'Catatan Rapat')}</h3>
            <p className="text-[10px] font-medium text-neutral-500 mt-0.5">
              {tMsg('Extract bulk tasks from notes', 'Ekstrak tugas massal dari catatan')}
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setAssistantMode('chat');
            startConversation();
          }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center gap-4 text-left group"
        >
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-indigo-100 dark:border-indigo-800/50">
            💬
          </div>
          <div>
            <h3 className="font-bold text-black dark:text-white text-sm">
              {tMsg('Smart AI Chat', 'Obrolan AI Pintar')}
            </h3>
            <p className="text-[10px] font-medium text-neutral-500 mt-0.5">
              {tMsg('Draft, Analyze, Summarize', 'Draf, Analisis, Ringkas')}
            </p>
          </div>
        </button>
      </div>
      {renderDiscardModal()}
    </div>
  );
}
