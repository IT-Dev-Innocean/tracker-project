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
      width: rect.width,
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
        className='bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl max-h-48 overflow-y-auto py-2 mac-animate'>
        {employees.length > 0 ? (
          employees.map((emp) => {
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
      </div>,
      document.body
    );

  return (
    <div
      className={`group relative ${isOpen ? 'z-9998' : ''}`}
      ref={wrapperRef}>
      <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2'>
        <Icon name={icon} className='w-4 h-4' /> {label}
      </label>
      <button
        ref={buttonRef}
        type='button'
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        className='w-full bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black transition-all flex items-center h-12 sm:h-14 px-3.5 text-left'>
        <span
          className={`text-xs font-normal truncate ${
            selected.length > 0
              ? 'text-black dark:text-white'
              : 'text-neutral-400'
          }`}>
          {displayLabel}
        </span>
      </button>
      {dropdownMenu}
    </div>
  );
}
