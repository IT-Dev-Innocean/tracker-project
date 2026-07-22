import React from 'react';
import { LoadingSpinner } from '../../Utils';

export default function SmartAssistantPlanner({
  boards,
  plannerTargetBoardId,
  setPlannerTargetBoardId,
  plannedTasks,
  setPlannedTasks,
  isPlanning,
  setDiscardConfirmAction,
  clearPlanner,
  setAssistantMode,
  tMsg,
  plannerPrompt,
  setPlannerPrompt,
  handlePlannerSubmit,
  formatDateMMM,
  plannerEndRef,
  handleSavePlannedTasks,
  isSavingPlanned,
  renderDiscardModal,
}) {
  const targetBoardName =
    (boards || []).find((b) => String(b.id) === String(plannerTargetBoardId))?.name || 'Project';

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-neutral-50 dark:bg-neutral-950 relative z-20">
      <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center shrink-0 shadow-sm z-10">
        <button
          onClick={() => {
            if (plannedTasks.length > 0 && !isPlanning) {
              setDiscardConfirmAction(() => () => {
                setPlannedTasks([]);
                setAssistantMode('landing');
              });
              return;
            }
            clearPlanner();
            setAssistantMode('landing');
          }}
          className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors w-16"
        >
          ◀ {tMsg('Menu', 'Menu')}
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1.5 flex-1 justify-center">
          🚀 {tMsg('AI Task Planner', 'Perencana Tugas AI')}
        </span>
        <button
          onClick={() => {
            if (plannedTasks.length > 0 && !isPlanning) {
              setDiscardConfirmAction(() => () => {
                clearPlanner();
              });
              return;
            }
            clearPlanner();
          }}
          className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest flex items-center justify-end gap-1 transition-colors w-16"
        >
          {tMsg('Reset', 'Ulang')} ↻
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col justify-start relative">
        <div
          className={`flex flex-col items-center text-center max-w-sm mx-auto transition-all duration-700 ease-in-out w-full ${
            plannedTasks.length > 0 || isPlanning ? 'mt-0 mb-6' : 'my-auto'
          }`}
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
            🧠
          </div>
          {plannedTasks.length === 0 && !isPlanning && (
            <>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                {tMsg('What is your goal?', 'Apa tujuan Anda?')}
              </h3>
              <p className="text-xs text-neutral-500 font-medium mb-8 leading-relaxed">
                {tMsg(
                  'Describe your broad objective. The AI will instantly break it down into actionable tasks with complete details, subtasks, and ETCs.',
                  'Jelaskan tujuan besar Anda. AI akan langsung memecahnya menjadi tugas-tugas dengan detail lengkap, sub-tugas, dan estimasi waktu.'
                )}
              </p>
            </>
          )}
          <form onSubmit={handlePlannerSubmit} className="w-full">
            <div
              className={`flex gap-2 ${
                plannedTasks.length > 0 && !isPlanning ? 'flex-row items-center mt-2' : 'flex-col'
              }`}
            >
              <textarea
                value={plannerPrompt}
                onChange={(e) => setPlannerPrompt(e.target.value)}
                disabled={isPlanning}
                placeholder={tMsg(
                  'e.g. Plan a marketing campaign for our new product launch...',
                  'Contoh: Rencanakan kampanye pemasaran untuk peluncuran produk baru...'
                )}
                className={`w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-medium text-black dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-sm resize-none custom-scrollbar transition-all disabled:opacity-50 ${
                  plannedTasks.length > 0 && !isPlanning ? 'h-[52px] text-xs py-3.5' : 'h-32 text-sm'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (plannerPrompt.trim() && !isPlanning) handlePlannerSubmit(e);
                  }
                }}
                autoFocus
              />
              {plannedTasks.length > 0 && !isPlanning ? (
                <button
                  type="submit"
                  disabled={!plannerPrompt.trim() || isPlanning}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold w-[52px] h-[52px] rounded-2xl shadow-md transition-all flex items-center justify-center shrink-0 disabled:opacity-50 hover:-translate-y-0.5"
                  title={tMsg('Generate Plan', 'Buat Rencana')}
                >
                  ✨
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!plannerPrompt.trim() || isPlanning}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50 hover:-translate-y-0.5"
                >
                  {isPlanning ? <LoadingSpinner /> : '✨'}
                  {isPlanning ? tMsg('Planning...', 'Merencanakan...') : tMsg('Generate Plan', 'Buat Rencana')}
                </button>
              )}
            </div>
          </form>
        </div>
        {isPlanning && (
          <div className="flex flex-col gap-4 animate-slide-up pb-32 opacity-50 pointer-events-none">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex items-start gap-3 shadow-sm"
              >
                <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mt-0.5"></div>
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        {plannedTasks.length > 0 && (
          <div className="flex flex-col gap-4 animate-slide-up pb-32">
            <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm sticky top-0 z-20">
              <select
                value={plannerTargetBoardId}
                onChange={(e) => {
                  setPlannerTargetBoardId(e.target.value);
                  setPlannedTasks(plannedTasks.map((t) => ({ ...t, target_board_id: e.target.value })));
                }}
                className="flex-1 bg-transparent border-none text-xs font-bold p-1 outline-none focus:ring-0 text-black dark:text-white cursor-pointer truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950 [&>option]:text-black dark:[&>option]:text-white"
              >
                <option value="" disabled>
                  -- {tMsg('Select Target Project', 'Pilih Proyek Tujuan')} --
                </option>
                {(boards || [])
                  .filter((b) => b.id !== 'global')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      📁 {b.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  const allSelected = plannedTasks.every((t) => t.selected);
                  setPlannedTasks(plannedTasks.map((t) => ({ ...t, selected: !allSelected })));
                }}
                className="text-[10px] font-bold text-purple-600 hover:underline shrink-0 ml-4"
              >
                {plannedTasks.every((t) => t.selected)
                  ? tMsg('Deselect All', 'Batal Semua')
                  : tMsg('Select All', 'Pilih Semua')}
              </button>
            </div>

            {plannedTasks.map((t) => (
              <div
                key={t.id}
                onClick={() =>
                  setPlannedTasks(
                    plannedTasks.map((item) => (item.id === t.id ? { ...item, selected: !item.selected } : item))
                  )
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-3 ${
                  t.selected
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 shadow-sm'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.selected}
                    readOnly
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500 cursor-pointer pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-black dark:text-white text-sm leading-tight mb-2">
                      {t.project_name}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mb-2 mt-1 items-center">
                      <select
                        value={t.target_board_id || plannerTargetBoardId || ''}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setPlannedTasks((prev) =>
                            prev.map((item) => (item.id === t.id ? { ...item, target_board_id: newId } : item))
                          );
                        }}
                        className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400 uppercase tracking-wider outline-none cursor-pointer max-w-[120px] truncate [&>option]:bg-white dark:[&>option]:bg-neutral-900 [&>option]:text-black dark:[&>option]:text-white border border-indigo-100 dark:border-indigo-800/50"
                      >
                        {boards
                          .filter((b) => b.id !== 'global')
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              📁 {b.name}
                            </option>
                          ))}
                      </select>
                      <span className="text-[9px] font-bold bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-300 uppercase tracking-wider truncate max-w-[100px]">
                        {t.category}
                      </span>
                      <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400 uppercase tracking-wider truncate max-w-[100px]">
                        {t.requester}
                      </span>
                      <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        ⏳ {t.etc}h
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm ${
                          t.impact === 'High'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : t.impact === 'Low'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {t.impact === 'High' ? '🔥 High' : t.impact === 'Low' ? '🧊 Low' : '⚡ Med'}
                      </span>
                      {t.deadline && (
                        <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                          📅 {formatDateMMM ? formatDateMMM(t.deadline) : t.deadline}
                        </span>
                      )}
                      {t.auto_nudge && (
                        <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                          🔔 Auto Nudge ON
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={plannerEndRef} className="h-4 shrink-0"></div>
          </div>
        )}
      </div>

      {plannedTasks.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent dark:from-neutral-950 dark:via-neutral-950 pt-12 z-20">
          <button
            onClick={handleSavePlannedTasks}
            disabled={isSavingPlanned || !plannedTasks.some((t) => t.selected)}
            className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-purple-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSavingPlanned ? <LoadingSpinner /> : '🚀'}
            {isSavingPlanned
              ? tMsg('Saving...', 'Menyimpan...')
              : tMsg(
                  `Dispatch ${plannedTasks.filter((t) => t.selected).length} Tasks to ${targetBoardName}`,
                  `Kirim ${plannedTasks.filter((t) => t.selected).length} Tugas ke ${targetBoardName}`
                )}
          </button>
        </div>
      )}
      {renderDiscardModal()}
    </div>
  );
}
