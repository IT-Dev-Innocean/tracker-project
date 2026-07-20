import React from 'react';
import ReactDOM from 'react-dom';
import { Droppable, Draggable } from '@hello-pangea/dnd';

export default function TaskDetailSubtasks({
  tMsg,
  selectedTask,
  isPreviewMode,
  subtasks,
  currentUser,
  isTaskAdmin,
  accountStatus,
  isSystemTicket,
  handleToggleSubtask,
  teamMembers,
  handleUpdateSubtaskAssignee,
  handleDeleteSubtask,
  handleAddSubtask,
  newSubtaskName,
  setNewSubtaskName,
  newSubtaskAssignee,
  setNewSubtaskAssignee,
}) {
  return (
    <div className="mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
          📋 {tMsg('Sub-task Checklist', 'Daftar Periksa Sub-tugas')}
        </h3>
        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
          {isPreviewMode ? selectedTask.subtask_done : subtasks.filter((s) => s.is_done).length}/
          {isPreviewMode ? selectedTask.subtask_total : subtasks.length} (
          {(isPreviewMode ? selectedTask.subtask_total : subtasks.length) > 0
            ? Math.round(
                ((isPreviewMode
                  ? selectedTask.subtask_done
                  : subtasks.filter((s) => s.is_done).length) /
                  (isPreviewMode ? selectedTask.subtask_total : subtasks.length)) *
                  100
              )
            : 0}
          %)
        </span>
      </div>

      <div className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-full h-3 mb-8 overflow-hidden">
        <div
          className="bg-black dark:bg-white h-full transition-all duration-700 ease-out rounded-full"
          style={{
            width: `${
              (isPreviewMode ? selectedTask.subtask_total : subtasks.length) > 0
                ? Math.round(
                    ((isPreviewMode
                      ? selectedTask.subtask_done
                      : subtasks.filter((s) => s.is_done).length) /
                      (isPreviewMode ? selectedTask.subtask_total : subtasks.length)) *
                      100
                  )
                : 0
            }%`,
          }}
        ></div>
      </div>

      {isPreviewMode ? (
        <div className="relative mb-8">
          <div className="space-y-3 filter blur-[4px] select-none opacity-50 pointer-events-none">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800"
              >
                <div className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-700"></div>
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/80 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-xl backdrop-blur-md text-center">
              🔒{' '}
              {currentUser
                ? tMsg('Project Members Only', 'Khusus Anggota Proyek')
                : tMsg('Login to View Checklists', 'Login untuk Melihat Daftar Periksa')}
            </span>
          </div>
        </div>
      ) : (
        <Droppable droppableId="subtask-list" type="subtask">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="mb-8 pr-2">
              {subtasks.map((st, index) => {
                const canEditSt =
                  isTaskAdmin || (!isSystemTicket && (!st.assignee || st.assignee === currentUser));
                const subtaskItem = (providedDrag, snapshot) => (
                  <div
                    ref={providedDrag.innerRef}
                    {...providedDrag.draggableProps}
                    className={`flex items-start gap-3 group bg-white dark:bg-neutral-950 p-2 -ml-2 rounded-xl mb-2.5 ${
                      snapshot.isDragging
                        ? 'shadow-lg border border-indigo-500 dark:border-indigo-400 scale-[1.02] z-[9999]'
                        : 'transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
                    }`}
                  >
                    <div
                      {...providedDrag.dragHandleProps}
                      className={`mt-1 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-black dark:hover:text-white transition-colors ${
                        !isTaskAdmin || accountStatus === 'suspended'
                          ? 'opacity-0 pointer-events-none w-0 -mr-2'
                          : ''
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                      </svg>
                    </div>
                    <input
                      type="checkbox"
                      checked={st.is_done === 1}
                      disabled={!canEditSt || accountStatus === 'suspended'}
                      onChange={() => handleToggleSubtask(st.id, st.is_done, st.assignee)}
                      className={`mt-0.5 w-5 h-5 text-black dark:text-white bg-transparent border-2 border-neutral-300 dark:border-neutral-600 rounded transition-colors ${
                        canEditSt ? 'cursor-pointer focus:ring-0' : 'cursor-not-allowed opacity-50'
                      }`}
                    />
                    <div
                      className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 break-words"
                    >
                      <span className={`text-sm font-medium flex-1 ${
                        st.is_done
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-black dark:text-white'
                      }`}>{st.task_name}</span>
                      <select
                        value={st.assignee || ''}
                        onChange={(e) =>
                          handleUpdateSubtaskAssignee(st.id, st.is_done, e.target.value)
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-md outline-none normal-case tracking-normal transition-colors text-black dark:text-white ${
                          st.is_done
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                            : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                        } [&>option]:bg-white dark:[&>option]:bg-neutral-950 [&>option]:text-black dark:[&>option]:text-white ${
                          isTaskAdmin && !st.is_done ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                        }`}
                        disabled={st.is_done || !isTaskAdmin || accountStatus === 'suspended'}
                      >
                        <option value="">{tMsg('Unassigned', 'Belum Ditugaskan')}</option>
                        {teamMembers.map((m) => (
                          <option key={m} value={m}>
                            @{m}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isTaskAdmin && accountStatus !== 'suspended' && (
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="text-neutral-400 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-sm md:text-xs font-bold mt-0.5 md:mt-1 px-2 py-1 md:p-0"
                        title="Delete Subtask"
                      >
                        ✖
                      </button>
                    )}
                  </div>
                );

                return (
                  <Draggable
                    key={`subtask-${st.id}`}
                    draggableId={`subtask-${st.id}`}
                    index={index}
                    isDragDisabled={!isTaskAdmin || accountStatus === 'suspended'}
                  >
                    {(providedDrag, snapshot) =>
                      snapshot.isDragging
                        ? ReactDOM.createPortal(subtaskItem(providedDrag, snapshot), document.body)
                        : subtaskItem(providedDrag, snapshot)
                    }
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {subtasks.length === 0 && (
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold ml-2">
                  {tMsg('No sub-tasks yet. Add one below!', 'Belum ada sub-tugas. Tambahkan di bawah!')}
                </p>
              )}
            </div>
          )}
        </Droppable>
      )}

      {isTaskAdmin && accountStatus !== 'suspended' && !isPreviewMode && (
        <form onSubmit={handleAddSubtask} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            placeholder={tMsg('Add a new sub-task...', 'Tambah sub-tugas baru...')}
            className="flex-2 p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:bg-white dark:focus:bg-black focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none text-sm font-medium placeholder-neutral-400 transition-all"
          />
          <select
            value={newSubtaskAssignee}
            onChange={(e) => setNewSubtaskAssignee(e.target.value)}
            className="flex-1 p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:bg-white dark:focus:bg-black focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none text-sm font-medium normal-case tracking-normal transition-all [&>option]:bg-white dark:[&>option]:bg-neutral-950 [&>option]:text-black dark:[&>option]:text-white"
          >
            <option value="">{tMsg('Unassigned', 'Belum Ditugaskan')}</option>
            {teamMembers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-xl font-bold hover:opacity-80 transition-all text-xs uppercase tracking-widest shadow-md hover:-translate-y-0.5"
          >
            {tMsg('ADD', 'TAMBAH')}
          </button>
        </form>
      )}
    </div>
  );
}
