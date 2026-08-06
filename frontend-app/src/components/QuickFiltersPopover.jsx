import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons/Icon';

export default function QuickFiltersPopover({
  language,
  accountStatus,
  viewMode,
  showMyTasks,
  setShowMyTasks,
  showOverdueOnly,
  setShowOverdueOnly,
  showUnreadOnly,
  setShowUnreadOnly,
  showHasSubtasks,
  setShowHasSubtasks,
  hideCompleted,
  setHideCompleted,
}) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const activeCount = [
    showMyTasks,
    showOverdueOnly,
    showUnreadOnly,
    showHasSubtasks,
    hideCompleted,
  ].filter(Boolean).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        event.target instanceof Node &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll(event) {
      if (isOpen) {
        if (
          popoverRef.current &&
          event.target instanceof Node &&
          popoverRef.current.contains(event.target)
        ) {
          return;
        }
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const togglePopover = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const topPos = rect.bottom + 8;
      setCoords({
        top: topPos,
        right: window.innerWidth - rect.right,
        maxHeight: `calc(100vh - ${topPos + 16}px)`,
      });
    }
    setIsOpen(!isOpen);
  };

  const clearAll = () => {
    setShowMyTasks(false);
    setShowOverdueOnly(false);
    setShowUnreadOnly(false);
    setShowHasSubtasks(false);
    setHideCompleted(false);
  };

  const chipClass = (active, activeTone) =>
    `py-1.5 px-3 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${
      active
        ? activeTone
        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
    }`;

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        onClick={togglePopover}
        className={`theme-interactive flex items-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg shadow-sm border text-[11px] sm:text-sm font-medium transition-all ${
          isOpen || activeCount > 0
            ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}>
        <Icon name='filter' className='w-4 h-4' />
        <span>{tMsg('Filter', 'Filter')}</span>
        {activeCount > 0 && (
          <span className='min-w-5 h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center'>
            {activeCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className='fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 flex flex-col'
            style={{
              top: coords.top,
              right: coords.right,
              width: '320px',
              maxHeight: coords.maxHeight || '70vh',
            }}>
            <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0'>
              <span className='text-sm font-bold text-slate-800 dark:text-white'>
                {tMsg('Filters', 'Filter')}
              </span>
              {activeCount > 0 && (
                <button
                  type='button'
                  onClick={clearAll}
                  className='text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline'>
                  {tMsg('Clear', 'Hapus')}
                </button>
              )}
            </div>

            <div className='overflow-y-auto p-4 custom-scrollbar'>
              <div className='text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3'>
                {tMsg('Quick filters', 'Filter cepat')}
              </div>
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setShowMyTasks(!showMyTasks);
                    if (!showMyTasks) setShowOverdueOnly(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className={chipClass(
                    showMyTasks,
                    'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300'
                  )}>
                  <Icon name='user' className='w-3.5 h-3.5' />
                  {tMsg('My Tasks', 'Tugas Saya')}
                </button>

                <button
                  type='button'
                  onClick={() => {
                    setShowOverdueOnly(!showOverdueOnly);
                    if (!showOverdueOnly) setShowMyTasks(false);
                  }}
                  className={chipClass(
                    showOverdueOnly,
                    'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300'
                  )}>
                  <Icon name='alert-triangle' className='w-3.5 h-3.5' />
                  {tMsg('Overdue', 'Terlambat')}
                </button>

                <button
                  type='button'
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={chipClass(
                    showUnreadOnly,
                    'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300'
                  )}>
                  <Icon name='message-square' className='w-3.5 h-3.5' />
                  {tMsg('Unread', 'Belum Dibaca')}
                </button>

                <button
                  type='button'
                  onClick={() => setShowHasSubtasks(!showHasSubtasks)}
                  className={chipClass(
                    showHasSubtasks,
                    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300'
                  )}>
                  <Icon name='square-check' className='w-3.5 h-3.5' />
                  {tMsg('Has Subtasks', 'Ada Sub-tugas')}
                </button>

                {(viewMode === 'kanban' ||
                  viewMode === 'list' ||
                  viewMode === 'timeline' ||
                  viewMode === 'calendar') && (
                  <button
                    type='button'
                    onClick={() => setHideCompleted(!hideCompleted)}
                    className={chipClass(
                      hideCompleted,
                      'bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-400'
                    )}
                    title={tMsg(
                      'Hide Done & Rejected tasks to declutter the view',
                      'Sembunyikan tugas Selesai & Ditolak agar tampilan lebih bersih'
                    )}>
                    {hideCompleted ? (
                      <>
                        <Icon name='eye-off' className='w-3.5 h-3.5' />
                        {tMsg('Completed Hidden', 'Selesai Disembunyikan')}
                      </>
                    ) : (
                      <>
                        <Icon name='eye' className='w-3.5 h-3.5' />
                        {tMsg('Show Completed', 'Tampilkan Selesai')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
