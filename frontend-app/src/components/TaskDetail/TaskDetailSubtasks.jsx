import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Icon } from '../icons/Icon';
import { Avatar } from '../../SharedUI';
import MultiUserSelect from '../MultiUserSelect';
import { SUBTASK_DEPARTMENT_OPTIONS } from '../../utils/formSubtasks';

function AssigneeTrigger({ selected, employees, avatarsMap, tMsg }) {
  if (!selected.length) {
    return (
      <span className='text-xs font-normal text-neutral-400 truncate'>
        {tMsg('Employee Names', 'Nama Karyawan')}
      </span>
    );
  }

  if (selected.length === 1) {
    const emp = employees.find((e) => e.username === selected[0]);
    const fullName = emp?.full_name || emp?.name || selected[0];
    return (
      <span className='flex items-center gap-2 min-w-0'>
        <Avatar
          name={fullName}
          url={avatarsMap?.[selected[0]]}
          size='w-7 h-7'
          textClass='text-[9px]'
          maxInitials={2}
          withRing
        />
        <span className='text-xs font-medium text-black dark:text-white truncate'>
          {fullName}
        </span>
      </span>
    );
  }

  return (
    <span className='flex items-center'>
      {selected.slice(0, 4).map((username, idx) => {
        const emp = employees.find((e) => e.username === username);
        const fullName = emp?.full_name || emp?.name || username;
        return (
          <span
            key={username}
            className={idx === 0 ? '' : '-ml-2'}
            style={{ zIndex: 10 - idx }}>
            <Avatar
              name={fullName}
              url={avatarsMap?.[username]}
              size='w-7 h-7'
              textClass='text-[9px]'
              maxInitials={2}
              withRing
            />
          </span>
        );
      })}
      {selected.length > 4 && (
        <span className='-ml-2 w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-[9px] font-bold text-black dark:text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-950'>
          +{selected.length - 4}
        </span>
      )}
    </span>
  );
}

function groupSubtasksByTeam(subtasks = []) {
  const groups = [];
  const indexByKey = new Map();
  subtasks.forEach((st) => {
    const displayName = String(st.task_name || '').trim();
    const key = displayName.toLowerCase() || '__unnamed__';
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        task_name: displayName,
        items: [st],
      });
    } else {
      groups[indexByKey.get(key)].items.push(st);
    }
  });

  // Sort groups consistently by SUBTASK_DEPARTMENT_OPTIONS order so card positions don't jump on assign
  groups.sort((a, b) => {
    const idxA = SUBTASK_DEPARTMENT_OPTIONS.findIndex(
      (dept) => dept.toLowerCase() === a.key
    );
    const idxB = SUBTASK_DEPARTMENT_OPTIONS.findIndex(
      (dept) => dept.toLowerCase() === b.key
    );
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.key.localeCompare(b.key);
  });

  return groups;
}

export default function TaskDetailSubtasks({
  tMsg,
  selectedTask,
  isPreviewMode,
  subtasks,
  currentUser,
  isTaskAdmin,
  accountStatus,
  isSystemTicket,
  handleToggleTeamGroup,
  handleToggleSubtask,
  teamMembers,
  allEmployees = [],
  avatarsMap = {},
  handleSyncTeamAssignees,
  handleRenameTeamGroup,
  handleUpdateSubtaskName,
  handleDeleteTeamGroup,
  handleDeleteSubtask,
  handleAddTeamSubtasks,
  handleAddSubtask,
  newSubtaskName,
  setNewSubtaskName,
  newSubtaskAssignee,
  setNewSubtaskAssignee,
}) {
  const [draftNames, setDraftNames] = useState({});
  const [addAssignees, setAddAssignees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const employees = useMemo(() => {
    if (allEmployees.length > 0) return allEmployees;
    return (teamMembers || [])
      .filter((m) => m && m !== 'admin')
      .map((username) => ({
        username,
        full_name: username,
        name: username,
      }));
  }, [allEmployees, teamMembers]);

  const teamGroups = useMemo(() => groupSubtasksByTeam(subtasks), [subtasks]);

  const doneCount = isPreviewMode
    ? selectedTask.subtask_done
    : subtasks.filter((s) => s.is_done).length;
  const totalCount = isPreviewMode
    ? selectedTask.subtask_total
    : subtasks.length;
  const progressPct =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const submitAddTeam = (e) => {
    e.preventDefault();
    const name = String(newSubtaskName || '').trim();
    if (!name) return;
    const assignees =
      addAssignees.length > 0
        ? addAssignees
        : newSubtaskAssignee
          ? [newSubtaskAssignee]
          : [];
    const addFn = handleAddTeamSubtasks || handleAddSubtask;
    if (handleAddTeamSubtasks) {
      Promise.resolve(handleAddTeamSubtasks(name, assignees)).then(() => {
        setAddAssignees([]);
        setShowAddForm(false);
      });
    } else if (typeof addFn === 'function') {
      addFn(e);
      setAddAssignees([]);
      setShowAddForm(false);
    }
  };

  return (
    <div className='mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800'>
      <div className='flex justify-between items-center mb-2'>
        <h3 className='text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2'>
          <Icon name='clipboard-list' className='w-4 h-4' />{' '}
          {tMsg('Sub-task Checklist', 'Daftar Periksa Sub-tugas')}
        </h3>
        <span className='text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest'>
          {doneCount}/{totalCount} ({progressPct}%)
        </span>
      </div>

      <p className='text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4'>
        {tMsg(
          'Brief assigned to and collaborated with:',
          'Brief ditugaskan dan dikolaborasikan dengan:'
        )}
      </p>

      <div className='w-full bg-neutral-100 dark:bg-neutral-900 rounded-full h-3 mb-6 overflow-hidden'>
        <div
          className='bg-black dark:bg-white h-full transition-all duration-700 ease-out rounded-full'
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {isPreviewMode ? (
        <div className='relative mb-8'>
          <div className='grid grid-cols-1 gap-3 filter blur-2xl select-none opacity-50 pointer-events-none'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3 flex flex-col gap-2'>
                <div className='h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3' />
                <div className='h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl' />
              </div>
            ))}
          </div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='bg-black/80 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-xl backdrop-blur-md text-center inline-flex items-center gap-2'>
              <Icon name='lock' className='w-3.5 h-3.5' />
              {currentUser
                ? tMsg('Project Members Only', 'Khusus Anggota Proyek')
                : tMsg(
                    'Login to View Checklists',
                    'Login untuk Melihat Daftar Periksa'
                  )}
            </span>
          </div>
        </div>
      ) : (
        <div className='mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {teamGroups.map((group) => {
            const { items, task_name: teamName, key } = group;
            const assignees = [
              ...new Set(items.map((st) => st.assignee).filter(Boolean)),
            ];
            const allDone =
              items.length > 0 && items.every((st) => st.is_done === 1);
            const canToggle =
              isTaskAdmin ||
              (!isSystemTicket &&
                items.some(
                  (st) => !st.assignee || st.assignee === currentUser
                ));
            const nameValue =
              draftNames[key] !== undefined ? draftNames[key] : teamName;
            const anyDone = items.some((st) => st.is_done === 1);

            return (
              <div
                key={`team-${key}`}
                className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3 flex flex-col gap-2.5 relative group/team hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  <input
                    type='checkbox'
                    checked={allDone}
                    disabled={!canToggle || accountStatus === 'suspended'}
                    onChange={() => {
                      const toggleable = items.filter(
                        (st) =>
                          isTaskAdmin ||
                          (!isSystemTicket &&
                            (!st.assignee || st.assignee === currentUser))
                      );
                      if (!toggleable.length) return;
                      if (handleToggleTeamGroup) {
                        handleToggleTeamGroup(toggleable);
                      } else {
                        toggleable.forEach((st) =>
                          handleToggleSubtask?.(
                            st.id,
                            st.is_done,
                            st.assignee
                          )
                        );
                      }
                    }}
                    className={`w-4 h-4 text-black dark:text-white bg-transparent border-2 border-neutral-300 dark:border-neutral-600 rounded transition-colors shrink-0 ${
                      canToggle
                        ? 'cursor-pointer focus:ring-0'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    title={
                      allDone
                        ? tMsg('Mark team incomplete', 'Tandai tim belum selesai')
                        : tMsg('Mark team complete', 'Tandai tim selesai')
                    }
                  />

                  <select
                    value={nameValue}
                    disabled={
                      !isTaskAdmin ||
                      accountStatus === 'suspended' ||
                      anyDone
                    }
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next && next !== teamName) {
                        if (handleRenameTeamGroup) {
                          handleRenameTeamGroup(items, next);
                        } else {
                          items.forEach((st) =>
                            handleUpdateSubtaskName?.(
                              st.id,
                              st.is_done,
                              st.assignee,
                              next
                            )
                          );
                        }
                      }
                    }}
                    className={`w-full bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 outline-none text-xs font-bold px-0 py-1 cursor-pointer truncate ${
                      allDone
                        ? 'line-through text-neutral-400 dark:text-neutral-500'
                        : 'text-black dark:text-white'
                    }`}>
                    <option value="" disabled className='dark:bg-neutral-900'>
                      {tMsg('-- Select Department --', '-- Pilih Departemen --')}
                    </option>
                    {SUBTASK_DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept} className='dark:bg-neutral-900'>
                        {dept}
                      </option>
                    ))}
                    {nameValue && !SUBTASK_DEPARTMENT_OPTIONS.includes(nameValue) && (
                      <option value={nameValue} className='dark:bg-neutral-900'>
                        {nameValue}
                      </option>
                    )}
                  </select>

                  {isTaskAdmin && accountStatus !== 'suspended' && (
                    <button
                      type='button'
                      onClick={() => {
                        if (handleDeleteTeamGroup) {
                          handleDeleteTeamGroup(items);
                        } else {
                          items.forEach((st) =>
                            handleDeleteSubtask?.(st.id)
                          );
                        }
                      }}
                      className='text-neutral-400 hover:text-red-500 opacity-100 sm:opacity-0 group-hover/team:opacity-100 transition-opacity shrink-0'
                      title={tMsg('Remove team', 'Hapus tim')}>
                      <Icon name='x' className='w-3.5 h-3.5' />
                    </button>
                  )}
                </div>

                <MultiUserSelect
                  hideLabel
                  label={tMsg('Employees', 'Karyawan')}
                  icon='users'
                  selected={assignees}
                  disabled={
                    !isTaskAdmin ||
                    allDone ||
                    accountStatus === 'suspended'
                  }
                  onChange={(users) => {
                    if (
                      !isTaskAdmin ||
                      allDone ||
                      accountStatus === 'suspended'
                    )
                      return;
                    if (handleSyncTeamAssignees) {
                      handleSyncTeamAssignees(teamName, items, users);
                    }
                  }}
                  employees={employees}
                  placeholder={tMsg('Employee Names', 'Nama Karyawan')}
                  tMsg={tMsg}
                  teamMembers={teamMembers}
                  renderSelected={(selected) => (
                    <AssigneeTrigger
                      selected={selected}
                      employees={employees}
                      avatarsMap={avatarsMap}
                      tMsg={tMsg}
                    />
                  )}
                />
              </div>
            );
          })}
          {teamGroups.length === 0 && (
            <p className='text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold col-span-full'>
              {tMsg(
                'No sub-tasks yet. Add one below!',
                'Belum ada sub-tugas. Tambahkan di bawah!'
              )}
            </p>
          )}
        </div>
      )}

      {isTaskAdmin && accountStatus !== 'suspended' && !isPreviewMode && (
        <div>
          {!showAddForm ? (
            <button
              type='button'
              onClick={() => setShowAddForm(true)}
              className='mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline'>
              + {tMsg('Add Team', 'Tambah Tim')}
            </button>
          ) : (
            <form
              onSubmit={submitAddTeam}
              className='mt-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end'>
              <div>
                <label className='block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5'>
                  {tMsg('Team name', 'Nama tim')}
                </label>
                <select
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  className='w-full p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:bg-white dark:focus:bg-black focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none text-sm font-medium cursor-pointer transition-all'
                  autoFocus>
                  <option value="" disabled className='dark:bg-neutral-900'>
                    {tMsg('-- Select Department --', '-- Pilih Departemen --')}
                  </option>
                  {SUBTASK_DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept} className='dark:bg-neutral-900'>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <MultiUserSelect
                hideLabel
                label={tMsg('Employees', 'Karyawan')}
                icon='users'
                selected={addAssignees}
                onChange={(users) => {
                  setAddAssignees(users);
                  setNewSubtaskAssignee?.(users[users.length - 1] || '');
                }}
                employees={employees}
                placeholder={tMsg('Employee Names', 'Nama Karyawan')}
                tMsg={tMsg}
                teamMembers={teamMembers}
                renderSelected={(selected) => (
                  <AssigneeTrigger
                    selected={selected}
                    employees={employees}
                    avatarsMap={avatarsMap}
                    tMsg={tMsg}
                  />
                )}
              />
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setShowAddForm(false);
                    setAddAssignees([]);
                    setNewSubtaskName('');
                    setNewSubtaskAssignee?.('');
                  }}
                  className='px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white h-12 sm:h-14'>
                  {tMsg('Cancel', 'Batal')}
                </button>
                <button
                  type='submit'
                  className='bg-black dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-xl font-bold hover:opacity-80 transition-all text-xs uppercase tracking-widest shadow-md hover:-translate-y-0.5 h-12 sm:h-14'>
                  {tMsg('ADD', 'TAMBAH')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
