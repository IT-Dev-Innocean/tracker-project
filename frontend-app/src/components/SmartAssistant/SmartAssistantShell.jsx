import React, { useEffect, useState } from 'react';
import { Icon } from '../icons/Icon';
import AIUsageMeter from './AIUsageMeter';

const EXPANDED_KEY = 'innocean_assistant_expanded';

export default function SmartAssistantShell({
  isOpen,
  onClose,
  onNewChat,
  showNewChat = false,
  onShowHighlights,
  tMsg,
  sidebar,
  usage = null,
  children,
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(EXPANDED_KEY) === 'true';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(EXPANDED_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, isExpanded ? 'true' : 'false');
  }, [isExpanded]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isSidebarOpen && !isExpanded) {
          setIsSidebarOpen(false);
          return;
        }
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSidebarOpen, isExpanded, onClose]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      setIsSidebarOpen(next);
      return next;
    });
  };

  const overlayOpen = isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none';
  const panelOpen = isOpen
    ? 'opacity-100 scale-100 translate-y-0'
    : 'opacity-0 scale-90 translate-y-10 pointer-events-none';

  return (
    <>
      <div
        className={`fixed inset-0 z-85 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isExpanded ? 'sm:bg-black/50' : ''
        } ${overlayOpen}`}
        onClick={onClose}
      />
      <div
        className={`fixed z-90 flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded
            ? `inset-0 sm:inset-3 lg:inset-4 sm:rounded-3xl origin-center ${panelOpen}`
            : `inset-0 sm:inset-auto sm:bottom-28 sm:right-10 w-full sm:w-100 xl:w-112.5 sm:h-[calc(100vh-160px)] sm:max-h-200 sm:rounded-4xl origin-bottom-right ${panelOpen}`
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={tMsg('Smart Assistant', 'Smart Assistant')}
      >
        <div className="flex items-center gap-1 px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            title={tMsg('Menu', 'Menu')}
            aria-label={tMsg('Open menu', 'Buka menu')}
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
            <Icon iconify="carbon:ai-agent" className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p className="text-sm font-black text-black dark:text-white truncate">
              {tMsg('Smart Assistant', 'Smart Assistant')}
            </p>
            <AIUsageMeter usage={usage} tMsg={tMsg} compact />
          </div>
          {onShowHighlights && (
            <button
              type="button"
              onClick={onShowHighlights}
              className="p-2 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              title={tMsg('Feature highlights', 'Highlight fitur')}
              aria-label={tMsg('Feature highlights', 'Highlight fitur')}
            >
              <Icon name="sparkles" className="w-4 h-4" />
            </button>
          )}
          {showNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="p-2 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              title={tMsg('New chat', 'Chat baru')}
              aria-label={tMsg('New chat', 'Chat baru')}
            >
              <Icon name="square-pen" className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-2 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors hidden sm:inline-flex"
            title={
              isExpanded
                ? tMsg('Collapse chat', 'Kecilkan chat')
                : tMsg('Expand chat', 'Perbesar chat')
            }
            aria-label={
              isExpanded
                ? tMsg('Collapse chat', 'Kecilkan chat')
                : tMsg('Expand chat', 'Perbesar chat')
            }
          >
            <Icon name={isExpanded ? 'minimize-2' : 'maximize-2'} className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            title={tMsg('Close', 'Tutup')}
            aria-label={tMsg('Close', 'Tutup')}
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 relative">
          {isSidebarOpen && (
            <button
              type="button"
              className={`absolute inset-0 z-30 bg-black/30 ${isExpanded ? 'sm:hidden' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
              aria-label={tMsg('Close sidebar', 'Tutup sidebar')}
            />
          )}
          <aside
            className={`h-full bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 transition-all duration-300 ease-out ${
              isExpanded
                ? `absolute sm:relative inset-y-0 left-0 z-40 w-[min(288px,85vw)] sm:z-0 ${
                    isSidebarOpen
                      ? 'translate-x-0 sm:w-72'
                      : '-translate-x-full sm:translate-x-0 sm:w-0 sm:border-r-0 sm:overflow-hidden'
                  }`
                : `absolute inset-y-0 left-0 z-40 w-[min(288px,85vw)] shadow-2xl ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
                  }`
            }`}
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              {typeof sidebar === 'function'
                ? sidebar(() => {
                    if (!isExpanded || (typeof window !== 'undefined' && window.innerWidth < 640)) {
                      setIsSidebarOpen(false);
                    }
                  })
                : sidebar}
            </div>
          </aside>
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">{children}</div>
        </div>
      </div>
    </>
  );
}
