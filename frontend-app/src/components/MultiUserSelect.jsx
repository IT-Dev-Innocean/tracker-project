import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons/Icon';

function getEmployeeLabel(emp, fallback = '') {
  if (!emp) return fallback;
  return emp.full_name || emp.name || emp.username || fallback;
}

export default function MultiUserSelect({
  label,
  icon,
  selected,
  onChange,
  employees,
  placeholder,
  tMsg,
  teamMembers = [],
  hideLabel = false,
  renderSelected,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    updateDropdownPosition();

    const handleClickOutside = (e) => {
      if (
        wrapperRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleReposition = () => updateDropdownPosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updateDropdownPosition]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = React.useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((emp) => {
      const name = String(emp.full_name || emp.name || '').toLowerCase();
      const username = String(emp.username || '').toLowerCase();
      const email = String(emp.email || '').toLowerCase();
      return name.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [employees, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const toggleUser = (username) => {
    if (selected.includes(username)) {
      onChange(selected.filter((u) => u !== username));
    } else {
      onChange([...selected, username]);
    }
  };

  const displayLabel =
    selected.length > 0
      ? selected
          .map((username) => {
            const emp = employees.find((e) => e.username === username);
            return getEmployeeLabel(emp, username);
          })
          .join(', ')
      : placeholder;

  const dropdownMenu =
    isOpen &&
    createPortal(
      <div
        ref={dropdownRef}
        style={dropdownStyle}
        className='bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl max-h-64 overflow-hidden flex flex-col mac-animate z-[9999]'>
        <div className='p-2 border-b border-neutral-200 dark:border-neutral-800 shrink-0'>
          <div className='flex items-center gap-2 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 focus-within:border-indigo-500'>
            <Icon name='search' className='w-3.5 h-3.5 text-neutral-400 shrink-0' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tMsg('Search user...', 'Cari karyawan...')}
              className='w-full bg-transparent text-xs text-black dark:text-white placeholder-neutral-400 outline-none font-medium'
              autoFocus
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => setSearchQuery('')}
                className='text-neutral-400 hover:text-black dark:hover:text-white text-xs font-bold px-1'>
                ✕
              </button>
            )}
          </div>
        </div>
        <div className='overflow-y-auto py-1 flex-1 max-h-48 custom-scrollbar'>
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => {
              const isAutoInvite =
                teamMembers.length > 0 && !teamMembers.includes(emp.username);
              return (
                <label
                  key={emp.username}
                  className='flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-normal text-black dark:text-white'>
                  <input
                    type='checkbox'
                    checked={selected.includes(emp.username)}
                    onChange={() => toggleUser(emp.username)}
                    className='rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500'
                  />
                  <span>{getEmployeeLabel(emp)}</span>
                  {isAutoInvite && (
                    <span className='text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ml-auto'>
                      +Invite
                    </span>
                  )}
                </label>
              );
            })
          ) : (
            <div className='px-4 py-3 text-xs text-neutral-400 uppercase tracking-widest font-normal'>
              {tMsg('NO EMPLOYEES FOUND', 'TIDAK ADA KARYAWAN')}
            </div>
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div
      className={`group relative ${isOpen ? 'z-9998' : ''} ${className}`}
      ref={wrapperRef}>
      {!hideLabel && (
        <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2'>
          <Icon name={icon} className='w-4 h-4' /> {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type='button'
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        className={`w-full bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black transition-all flex items-center min-h-12 sm:min-h-14 px-3.5 text-left ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}>
        {renderSelected ? (
          renderSelected(selected, employees)
        ) : (
          <span
            className={`text-xs font-normal truncate ${
              selected.length > 0
                ? 'text-black dark:text-white'
                : 'text-neutral-400'
            }`}>
            {displayLabel}
          </span>
        )}
      </button>
      {dropdownMenu}
    </div>
  );
}
