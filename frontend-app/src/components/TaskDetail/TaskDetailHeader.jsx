import React from 'react';
import { Icon } from '../icons/Icon';

export default function TaskDetailHeader({
  isInline,
  isEditing,
  selectedTask,
  handleDirectStatusChange,
  columns,
  isPreviewMode,
  accountStatus,
  isTaskAdmin,
  isSubtasksLoading,
  close,
  tMsg,
}) {
  return (
    <div
      className={`flex gap-4 justify-between items-center border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl z-20 ${
        isInline ? 'p-4 sm:p-5' : 'p-4 sm:p-6 lg:p-8'
      }`}
    >
      <h2 className="text-lg sm:text-2xl font-extrabold text-black dark:text-white uppercase truncate flex-1 flex items-center gap-2">
        {isEditing ? (
          <>
            <Icon name="pencil" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            {tMsg('Edit Task', 'Edit Tugas')}
          </>
        ) : (
          tMsg('Task Details', 'Detail Tugas')
        )}
      </h2>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {isEditing ? (
          <span className="text-[9px] sm:text-[10px] font-bold text-white bg-black dark:bg-white dark:text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full uppercase tracking-widest shadow-sm">
            {selectedTask.status}
          </span>
        ) : (
          <div className="relative flex-shrink-0">
            <select
              value={selectedTask.status}
              onChange={(e) => handleDirectStatusChange(e.target.value)}
              className={
                `appearance-none text-[9px] sm:text-[10px] font-black pl-4 sm:pl-5 pr-10 sm:pr-12 py-2 sm:py-3 rounded-full cursor-pointer border border-transparent outline-none transition-all shadow-sm hover:shadow-md uppercase tracking-widest ${
                  selectedTask.status === 'Done'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : selectedTask.status === 'Rejected'
                    ? 'bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white border-neutral-300 dark:border-neutral-700'
                    : 'bg-white text-black dark:bg-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-700'
                } [&>option]:bg-white dark:[&>option]:bg-neutral-950 [&>option]:text-black dark:[&>option]:text-white` +
                (isPreviewMode || accountStatus === 'suspended' || !isTaskAdmin || isSubtasksLoading
                  ? ' opacity-70 cursor-not-allowed'
                  : '')
              }
              title="Change Status"
              disabled={isPreviewMode || accountStatus === 'suspended' || !isTaskAdmin || isSubtasksLoading}
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-100">
              <Icon name="chevron-down" className="w-3 h-3" strokeWidth={3} />
            </div>
          </div>
        )}
        {!isEditing && (
          <button
            onClick={close}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white rounded-full transition-colors shrink-0"
            title={tMsg('Close', 'Tutup')}
          >
            <Icon name="x" className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
