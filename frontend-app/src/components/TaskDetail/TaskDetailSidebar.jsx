import React from 'react';
import axios from 'axios';

export default function TaskDetailSidebar({
  selectedTask,
  tMsg,
  queuePosition,
  totalQueue,
  mainAssignee,
  queueType,
  queueLabel,
  formatDateMMM,
  openCalendarPopup,
  generateGoogleMeetScheduleUrl,
  generateGoogleCalendarUrl,
  isPreviewMode,
  setIsNudgeConfirmOpen,
  isGeneratingNudge,
  hasAnyAssignee,
  isTaskAdmin,
  accountStatus,
  handleToggleAutoNudge,
  setSelectedTask,
  showNotification,
}) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 mb-6 mt-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
            {selectedTask.requester?.includes('@') ? tMsg('Assigned To', 'Pekerja') : tMsg('Requester', 'Peminta')}
          </p>
          <div className="flex flex-col gap-1.5 mt-1">
            <p className="font-bold uppercase tracking-wide text-sm truncate leading-none" title={selectedTask.requester}>
              {selectedTask.requester}
            </p>
            {queuePosition && totalQueue && selectedTask.status !== 'Done' && selectedTask.status !== 'Rejected' && (
              <span
                className="text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/50 cursor-help w-max"
                title={tMsg(
                  `This task is number ${queuePosition} out of ${totalQueue} in ${mainAssignee}'s current ${queueType} queue.`,
                  `Tugas ini berada di urutan ke-${queuePosition} dari ${totalQueue} dalam antrean ${queueType} ${mainAssignee} saat ini.`
                )}
              >
                {queueLabel} #{queuePosition} of {totalQueue}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
            {tMsg('Category', 'Kategori')}
          </p>
          <p className="font-bold uppercase tracking-wide text-sm truncate" title={selectedTask.category}>
            {selectedTask.category}
          </p>
        </div>
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
            {tMsg('Impact', 'Dampak')}
          </p>
          <p className="font-bold uppercase tracking-wide text-sm truncate">
            {selectedTask.impact === 'High'
              ? '🔥 High'
              : selectedTask.impact === 'Low'
              ? '🧊 Low'
              : '⚡ Medium'}
          </p>
        </div>
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
            {tMsg('Recurring', 'Berulang')}
          </p>
          <p className="font-bold uppercase tracking-wide text-sm truncate">
            {selectedTask.recurring === 'daily'
              ? '🔁 Daily'
              : selectedTask.recurring === 'weekly'
              ? '🔁 Weekly'
              : selectedTask.recurring === 'monthly'
              ? '🔁 Monthly'
              : '✖ None'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-5">
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
            {tMsg('Start Date', 'Tanggal Mulai')}
          </p>
          <p className="font-bold uppercase tracking-wide text-sm truncate">
            {formatDateMMM(selectedTask.start_date || selectedTask.timestamp)}
          </p>
        </div>
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
            {selectedTask.status === 'Done' ? tMsg('Completed At', 'Selesai Pada') : tMsg('Target Deadline', 'Tenggat Waktu')}
          </p>
          <p className="font-bold uppercase tracking-wide text-[11px] xl:text-sm truncate flex items-center gap-1.5 xl:gap-2">
            <span className="truncate">
              {selectedTask.status === 'Done'
                ? formatDateMMM(selectedTask.completed_time)
                : formatDateMMM(selectedTask.deadline)}
            </span>
            {(() => {
              if (selectedTask.status !== 'Done' && selectedTask.status !== 'Rejected' && selectedTask.deadline) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dl = new Date(selectedTask.deadline.replace(/-/g, '/'));
                dl.setHours(0, 0, 0, 0);
                const diffDays = Math.round((dl - today) / (1000 * 60 * 60 * 24));
                let timeStr = '';
                let timeClass = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
                if (diffDays < 0) {
                  timeStr = tMsg(`${Math.abs(diffDays)}d overdue`, `${Math.abs(diffDays)}h lewat`);
                  timeClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
                } else if (diffDays === 0) {
                  timeStr = tMsg('Today', 'Hari Ini');
                  timeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
                } else if (diffDays === 1) {
                  timeStr = tMsg('1d left', '1h lagi');
                  timeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
                } else if (diffDays < 7) {
                  timeStr = tMsg(`${diffDays}d left`, `${diffDays}h lagi`);
                  timeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
                } else {
                  const w = Math.floor(diffDays / 7);
                  const d = diffDays % 7;
                  timeStr = d === 0 ? tMsg(`${w}w left`, `${w}m lagi`) : tMsg(`${w}w ${d}d left`, `${w}m ${d}h lagi`);
                  timeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
                }
                return (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border shrink-0 ${timeClass}`}>
                    {timeStr}
                  </span>
                );
              }
              return null;
            })()}
          </p>
        </div>
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1" title="Estimated Time Consumption">
            {tMsg('ETC', 'Estimasi')} <span className="cursor-help opacity-70">🛈</span>
          </p>
          <p className="font-bold uppercase tracking-wide text-sm truncate">
            ⏳ {selectedTask.etc || 2}h
          </p>
        </div>
      </div>

      {selectedTask.status !== 'Done' && (
        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-5">
          <button
            type="button"
            onClick={() => openCalendarPopup(generateGoogleMeetScheduleUrl())}
            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/50 transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 uppercase tracking-widest shadow-sm"
          >
            🗓️ {tMsg('Schedule Meeting', 'Jadwalkan Rapat')}
          </button>
          <button
            type="button"
            onClick={() => openCalendarPopup(generateGoogleCalendarUrl())}
            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 uppercase tracking-widest shadow-sm"
          >
            📅 {tMsg('Add to Calendar', 'Ke Kalender')}
          </button>
          {!isPreviewMode && (
            <button
              type="button"
              onClick={() => setIsNudgeConfirmOpen(true)}
              disabled={isGeneratingNudge || !hasAnyAssignee}
              className={`text-[9px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 uppercase tracking-widest shadow-sm disabled:opacity-50 ${!hasAnyAssignee ? 'cursor-not-allowed' : ''}`}
              title={!hasAnyAssignee ? tMsg('No assignees to nudge', 'Tidak ada pekerja untuk dipantau') : ''}
            >
              {isGeneratingNudge ? '⏳...' : '🔔 ' + tMsg('Smart Nudge', 'Pantauan Cerdas')}
            </button>
          )}
          {isTaskAdmin && accountStatus !== 'suspended' && !isPreviewMode && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof handleToggleAutoNudge === 'function') {
                  handleToggleAutoNudge(selectedTask.id, !selectedTask?.auto_nudge);
                } else {
                  const taskId = selectedTask.id;
                  const isEnabled = !selectedTask?.auto_nudge;
                  setSelectedTask((prev) => ({ ...prev, auto_nudge: isEnabled }));
                  axios
                    .put(`/api/tasks/${taskId}/auto-nudge`, { auto_nudge: isEnabled })
                    .then(() => {
                      if (showNotification) showNotification(isEnabled ? 'Auto Nudge enabled' : 'Auto Nudge disabled', 'success');
                    })
                    .catch(() => {
                      setSelectedTask((prev) => ({ ...prev, auto_nudge: !isEnabled }));
                      if (showNotification) showNotification('Failed to toggle Auto Nudge', 'error');
                    });
                }
              }}
              className={`text-[9px] font-bold px-4 py-2 rounded-lg border transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 uppercase tracking-widest shadow-sm ${!!selectedTask.auto_nudge ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900/30 dark:text-neutral-400 dark:border-neutral-800/50'}`}
            >
              🤖 {!!selectedTask.auto_nudge ? tMsg('Auto Nudge: ON', 'Auto Nudge: AKTIF') : tMsg('Auto Nudge: OFF', 'Auto Nudge: MATI')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
