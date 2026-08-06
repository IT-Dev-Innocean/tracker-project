import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../hooks/useAppContext';
import { HighlightText } from '../Utils';
import { Icon } from './icons/Icon';
import { Avatar } from '../SharedUI';
import { TIMESHEETS_UI_ENABLED } from '../featureFlags';
import { excludeTodoListBoards } from '../utils/boards';

function Kbd({ children }) {
  return (
    <kbd className='inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-sm'>
      {children}
    </kbd>
  );
}

export default function GlobalSearchModal() {
  const {
    language,
    boards,
    userDirectory,
    avatarsMap,
    setSelectedBoard,
    setShowTeams,
    setShowTimesheets,
    setShowAdmin,
    setShowProjectManage,
    setShowClientManage,
    setSidebarNav,
    setIsMobileMenuOpen,
    setIsProactiveAIOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    isGlobalSearchOpen,
    isGlobalSearchClosing,
    closeGlobalSearch,
    formatDateMMM,
  } = useAppContext();

  const tMsg = (en, id) => (language === 'id' ? id : en);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(false);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    if (isGlobalSearchOpen && !isGlobalSearchClosing) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isGlobalSearchOpen, isGlobalSearchClosing]);

  useEffect(() => {
    if (!isGlobalSearchOpen || !TIMESHEETS_UI_ENABLED) return;
    setIsLoadingTimesheets(true);
    axios
      .get('/api/timesheets/entries')
      .then((res) => setTimesheetEntries(res.data.entries || []))
      .catch(() => setTimesheetEntries([]))
      .finally(() => setIsLoadingTimesheets(false));
  }, [isGlobalSearchOpen]);

  const keywords = useMemo(() => {
    return globalSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  }, [globalSearchQuery]);

  const hasMinQuery = keywords.length > 0 && globalSearchQuery.trim().length >= 2;

  const matchedProjects = useMemo(() => {
    if (!hasMinQuery) return [];
    return excludeTodoListBoards(boards).filter((b) => {
      const searchStr = `${b.name} ${b.owner_username}`.toLowerCase();
      return keywords.every((kw) => searchStr.includes(kw));
    });
  }, [boards, keywords, hasMinQuery]);

  const matchedTeams = useMemo(() => {
    if (!hasMinQuery) return [];
    return (userDirectory || []).filter((u) => {
      const searchStr = `${u.username} ${u.full_name || ''} ${u.email || ''}`.toLowerCase();
      return keywords.every((kw) => searchStr.includes(kw));
    });
  }, [userDirectory, keywords, hasMinQuery]);

  const matchedTimesheets = useMemo(() => {
    if (!hasMinQuery || !TIMESHEETS_UI_ENABLED) return [];
    return timesheetEntries.filter((entry) => {
      const searchStr = [
        entry.project_name,
        entry.custom_project_name,
        entry.task_name,
        entry.custom_task_name,
        entry.description,
        entry.status,
        entry.date,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return keywords.every((kw) => searchStr.includes(kw));
    });
  }, [timesheetEntries, keywords, hasMinQuery]);

  const flatResults = useMemo(() => {
    const items = [];
    matchedProjects.forEach((b) => items.push({ type: 'project', data: b }));
    matchedTeams.forEach((u) => items.push({ type: 'team', data: u }));
    matchedTimesheets.forEach((e) => items.push({ type: 'timesheet', data: e }));
    return items;
  }, [matchedProjects, matchedTeams, matchedTimesheets]);

  useEffect(() => {
    setActiveIndex(0);
  }, [globalSearchQuery, flatResults.length]);

  const navigateToProject = useCallback(
    (board) => {
      setSelectedBoard(board);
      setShowTeams?.(false);
      setShowAdmin?.(false);
      setShowProjectManage?.(false);
      setShowClientManage?.(false);
      setShowTimesheets?.(false);
      setSidebarNav?.('home');
      setIsMobileMenuOpen(false);
      setIsProactiveAIOpen(false);
      setGlobalSearchQuery('');
      closeGlobalSearch();
    },
    [
      setSelectedBoard,
      setShowTeams,
      setShowAdmin,
      setShowProjectManage,
      setShowClientManage,
      setShowTimesheets,
      setSidebarNav,
      setIsMobileMenuOpen,
      setIsProactiveAIOpen,
      setGlobalSearchQuery,
      closeGlobalSearch,
    ]
  );

  const navigateToTeams = useCallback(
    (user) => {
      setSelectedBoard(null);
      setShowTimesheets?.(false);
      setShowAdmin?.(false);
      setShowProjectManage?.(false);
      setShowClientManage?.(false);
      setShowTeams?.(true);
      setSidebarNav?.('teams');
      setIsMobileMenuOpen(false);
      setIsProactiveAIOpen(false);
      setGlobalSearchQuery('');
      closeGlobalSearch();
      void user;
    },
    [
      setSelectedBoard,
      setShowTimesheets,
      setShowAdmin,
      setShowProjectManage,
      setShowClientManage,
      setShowTeams,
      setSidebarNav,
      setIsMobileMenuOpen,
      setIsProactiveAIOpen,
      setGlobalSearchQuery,
      closeGlobalSearch,
    ]
  );

  const navigateToTimesheets = useCallback(
    (entry) => {
      setSelectedBoard(null);
      setShowTeams?.(false);
      setShowAdmin?.(false);
      setShowProjectManage?.(false);
      setShowClientManage?.(false);
      setShowTimesheets?.(true);
      setSidebarNav?.('home');
      setIsMobileMenuOpen(false);
      setIsProactiveAIOpen(false);
      setGlobalSearchQuery('');
      closeGlobalSearch();
      void entry;
    },
    [
      setSelectedBoard,
      setShowTeams,
      setShowAdmin,
      setShowProjectManage,
      setShowClientManage,
      setShowTimesheets,
      setSidebarNav,
      setIsMobileMenuOpen,
      setIsProactiveAIOpen,
      setGlobalSearchQuery,
      closeGlobalSearch,
    ]
  );

  const handleSelect = useCallback(
    (item) => {
      if (!item) return;
      if (item.type === 'project') navigateToProject(item.data);
      else if (item.type === 'team') navigateToTeams(item.data);
      else if (item.type === 'timesheet') navigateToTimesheets(item.data);
    },
    [navigateToProject, navigateToTeams, navigateToTimesheets]
  );

  useEffect(() => {
    if (!isGlobalSearchOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeGlobalSearch();
        return;
      }
      if (flatResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(flatResults[activeIndex]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isGlobalSearchOpen, flatResults, activeIndex, closeGlobalSearch, handleSelect]);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isGlobalSearchOpen) return null;

  let resultCounter = 0;

  const renderProjectItem = (board) => {
    const idx = resultCounter++;
    const isActive = idx === activeIndex;
    return (
      <button
        key={`project-${board.id}`}
        type='button'
        data-active={isActive}
        onClick={() => navigateToProject(board)}
        onMouseEnter={() => setActiveIndex(idx)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive
            ? 'bg-amber-50 dark:bg-amber-950/30'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
        }`}>
        <div className='w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0'>
          <Icon name='folder' className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-semibold text-black dark:text-white truncate'>
            <HighlightText text={board.name} query={globalSearchQuery} />
          </div>
          <div className='text-xs text-neutral-500 truncate'>
            @{<HighlightText text={board.owner_username} query={globalSearchQuery} />}
          </div>
        </div>
      </button>
    );
  };

  const renderTeamItem = (user) => {
    const idx = resultCounter++;
    const isActive = idx === activeIndex;
    return (
      <button
        key={`team-${user.username}`}
        type='button'
        data-active={isActive}
        onClick={() => navigateToTeams(user)}
        onMouseEnter={() => setActiveIndex(idx)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive
            ? 'bg-amber-50 dark:bg-amber-950/30'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
        }`}>
        <Avatar
          name={user.username}
          url={avatarsMap[user.username]}
          size='w-8 h-8'
          textClass='text-xs'
        />
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-semibold text-black dark:text-white truncate'>
            <HighlightText text={user.full_name || user.username} query={globalSearchQuery} />
          </div>
          <div className='text-xs text-neutral-500 truncate'>
            @<HighlightText text={user.username} query={globalSearchQuery} />
            {user.email && (
              <>
                {' · '}
                <HighlightText text={user.email} query={globalSearchQuery} />
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderTimesheetItem = (entry) => {
    const idx = resultCounter++;
    const isActive = idx === activeIndex;
    const projectLabel = entry.project_name || entry.custom_project_name || '-';
    const taskLabel = entry.task_name || entry.custom_task_name || '';
    return (
      <button
        key={`timesheet-${entry.id}`}
        type='button'
        data-active={isActive}
        onClick={() => navigateToTimesheets(entry)}
        onMouseEnter={() => setActiveIndex(idx)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive
            ? 'bg-amber-50 dark:bg-amber-950/30'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
        }`}>
        <div className='w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0'>
          <Icon name='timer' className='w-4 h-4 text-violet-600 dark:text-violet-400' />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-semibold text-black dark:text-white truncate'>
            <HighlightText text={projectLabel} query={globalSearchQuery} />
            {taskLabel && (
              <span className='font-normal text-neutral-500'>
                {' · '}
                <HighlightText text={taskLabel} query={globalSearchQuery} />
              </span>
            )}
          </div>
          <div className='text-xs text-neutral-500 truncate flex items-center gap-1.5'>
            <span>{formatDateMMM(entry.date)}</span>
            <span>·</span>
            <span>{entry.hours_logged}h</span>
            {entry.status && (
              <>
                <span>·</span>
                <span className='uppercase text-[10px] font-bold'>{entry.status}</span>
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  const hasResults =
    matchedProjects.length > 0 || matchedTeams.length > 0 || matchedTimesheets.length > 0;

  return (
    <div className='fixed inset-0 z-[120] flex items-start justify-center pt-[12vh] px-4'>
      <div
        className='absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm'
        onClick={closeGlobalSearch}
      />

      <div
        className={`relative w-full max-w-xl bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[min(70vh,560px)] ${
          isGlobalSearchClosing ? 'mac-exit' : 'mac-animate'
        }`}>
        {/* Search input */}
        <div className='flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800'>
          <Icon name='search' className='w-5 h-5 text-neutral-400 shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder={tMsg(
              'Search projects, teams, timesheets...',
              'Cari proyek, tim, timesheet...'
            )}
            className='flex-1 bg-transparent text-black dark:text-white text-base outline-none placeholder-neutral-400'
          />
          <button
            type='button'
            onClick={closeGlobalSearch}
            className='p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800'>
            <Icon name='x' className='w-4 h-4' />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className='flex-1 overflow-y-auto'>
          {!hasMinQuery ? (
            <div className='px-4 py-8 text-center'>
              <p className='text-sm text-neutral-400'>
                {tMsg(
                  'Type at least 2 characters to search',
                  'Ketik minimal 2 karakter untuk mencari'
                )}
              </p>
              <div className='flex items-center justify-center gap-4 mt-6 text-[11px] text-neutral-400'>
                <span className='flex items-center gap-1'>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  {tMsg('navigate', 'navigasi')}
                </span>
                <span className='flex items-center gap-1'>
                  <Kbd>Enter</Kbd>
                  {tMsg('open', 'buka')}
                </span>
                <span className='flex items-center gap-1'>
                  <Kbd>Esc</Kbd>
                  {tMsg('close', 'tutup')}
                </span>
              </div>
            </div>
          ) : hasResults ? (
            <>
              {matchedProjects.length > 0 && (
                <div>
                  <div className='px-4 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                    {tMsg('Projects', 'Proyek')}
                  </div>
                  {matchedProjects.map(renderProjectItem)}
                </div>
              )}
              {matchedTeams.length > 0 && (
                <div>
                  <div className='px-4 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                    {tMsg('Teams', 'Tim')}
                  </div>
                  {matchedTeams.map(renderTeamItem)}
                </div>
              )}
              {matchedTimesheets.length > 0 && (
                <div>
                  <div className='px-4 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                    {tMsg('Timesheets', 'Timesheet')}
                  </div>
                  {matchedTimesheets.map(renderTimesheetItem)}
                </div>
              )}
            </>
          ) : (
            <div className='px-4 py-8 text-center'>
              <p className='text-sm text-neutral-400'>
                {isLoadingTimesheets
                  ? tMsg('Searching...', 'Mencari...')
                  : tMsg(
                      'No projects, teams, or timesheets found.',
                      'Tidak ada proyek, tim, atau timesheet ditemukan.'
                    )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50'>
          <span className='text-[11px] text-neutral-400 font-medium'>INNOCEAN Search</span>
          <div className='flex items-center gap-1 text-[11px] text-neutral-400'>
            <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
            <span>+</span>
            <Kbd>K</Kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
