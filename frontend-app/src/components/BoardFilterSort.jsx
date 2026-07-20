import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Custom SVG Icons
const SlidersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function BoardFilterSort({
  columns = [],
  categories = [],
  assigneeOptions = [],
  filterStatus, setFilterStatus,
  filterCategory, setFilterCategory,
  filterAssignee, setFilterAssignee,
  groupBy, setGroupBy,
  sortBy, setSortBy
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Close popover when clicking outside or scrolling
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        event.target instanceof Node &&
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        popoverRef.current && !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    
    function handleScroll(event) {
      if (isOpen) {
        // Jangan tutup jika yang discroll adalah isi popover itu sendiri
        if (popoverRef.current && event.target instanceof Node && popoverRef.current.contains(event.target)) {
          return;
        }
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // true for capturing phase to catch inner scrolls
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const togglePopover = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const topPos = rect.bottom + 8;
      setCoords({
        top: topPos,
        right: window.innerWidth - rect.right,
        maxHeight: `calc(100vh - ${topPos + 16}px)`
      });
    }
    setIsOpen(!isOpen);
  };

  const hasActiveFilters = filterStatus !== 'All' || filterCategory !== 'All' || filterAssignee !== 'All';

  const SelectGroup = ({ title, value, onChange, options }) => (
    <div className="mb-4 last:mb-0">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{title}</div>
      <div className="space-y-1">
        {options.map((opt, idx) => (
          <label 
            key={opt.value ? opt.value.toString() : `opt-${idx}`} 
            className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
              value === opt.value 
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <input 
                type="radio" 
                className="hidden" 
                checked={value === opt.value} 
                onChange={() => onChange(opt.value)} 
              />
              <span className="text-sm">{opt.label}</span>
            </div>
            {value === opt.value && <CheckIcon />}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={togglePopover}
        className={`flex items-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg shadow-sm border text-[11px] sm:text-sm font-medium transition-all ${
          isOpen || hasActiveFilters
            ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        <SlidersIcon />
        <span>Display</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>
        )}
      </button>

      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[9999] flex flex-col"
          style={{ top: coords.top, right: coords.right, width: '256px', maxHeight: coords.maxHeight || '70vh' }}
        >
          <div className="overflow-y-auto p-4 custom-scrollbar">
            
            <SelectGroup 
              title="Group By" 
              value={groupBy} 
              onChange={setGroupBy} 
              options={[
                { value: 'Status', label: 'Status' },
                { value: 'Category', label: 'Category' },
                { value: 'Assignee', label: 'Assignee' },
                { value: 'Project', label: 'Project' },
              ]} 
            />

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-3"></div>

            <SelectGroup 
              title="Sort By" 
              value={sortBy} 
              onChange={setSortBy} 
              options={[
                { value: 'Default', label: 'Default' },
                { value: 'Due Date', label: 'Due Date' },
                { value: 'Date Created', label: 'Date Created' },
                { value: 'Impact', label: 'Impact' },
              ]} 
            />

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-3"></div>

            <SelectGroup 
              title="Filter Status" 
              value={filterStatus} 
              onChange={setFilterStatus} 
              options={[
                { value: 'All', label: 'All Status' },
                ...columns.filter(Boolean).map(c => ({ value: c, label: c }))
              ]} 
            />

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-3"></div>

            <SelectGroup 
              title="Filter Category" 
              value={filterCategory} 
              onChange={setFilterCategory} 
              options={[
                { value: 'All', label: 'All Categories' },
                ...categories.filter(Boolean).map(c => ({ value: c, label: c }))
              ]} 
            />

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-3"></div>

            <SelectGroup 
              title="Filter Assignee" 
              value={filterAssignee} 
              onChange={setFilterAssignee} 
              options={[
                { value: 'All', label: 'All Assignees' },
                ...assigneeOptions.filter(Boolean).map(a => ({ value: a, label: a }))
              ]} 
            />

          </div>
          
          {hasActiveFilters && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl shrink-0">
              <button 
                onClick={() => {
                  setFilterStatus('All');
                  setFilterCategory('All');
                  setFilterAssignee('All');
                }}
                className="w-full py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
