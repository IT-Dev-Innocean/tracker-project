import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons/Icon';

export default function TableSortFilterButton({
  columns = [],
  sortKey,
  sortDir,
  defaultSortKey = null,
  defaultSortDir = 'asc',
  onSort,
  onResetSort,
  columnFilters = {},
  onFilterChange,
  onClearFilters,
  dismissWhen = false,
  onOpen,
  tMsg = (en) => en,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('sort');
  const [filterKey, setFilterKey] = useState(columns[0]?.key || '');
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  const filterCount = Object.values(columnFilters).filter(
    (values) => Array.isArray(values) && values.length > 0
  ).length;
  const sortIsCustom =
    sortKey !== defaultSortKey ||
    (Boolean(sortKey) && sortDir !== defaultSortDir);
  const isActive = sortIsCustom || filterCount > 0;

  useEffect(() => {
    if (dismissWhen) setOpen(false);
  }, [dismissWhen]);

  useEffect(() => {
    if (!columns.some((col) => col.key === filterKey)) {
      setFilterKey(columns[0]?.key || '');
      setQuery('');
    }
  }, [columns, filterKey]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const activeColumn =
    columns.find((col) => col.key === filterKey) || columns[0] || null;
  const selectedFilters = activeColumn
    ? columnFilters[activeColumn.key]
    : null;
  const hasFilter =
    Array.isArray(selectedFilters) && selectedFilters.length > 0;
  const uniqueValues = activeColumn?.uniqueValues || [];
  const checkedValues = hasFilter ? selectedFilters : uniqueValues;

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return uniqueValues.filter((value) => {
      const text = activeColumn?.formatValue
        ? activeColumn.formatValue(value)
        : value || tMsg('(Blank)', '(Kosong)');
      return !q || String(text).toLowerCase().includes(q);
    });
  }, [uniqueValues, query, activeColumn, tMsg]);

  const toggleValue = (value) => {
    if (!activeColumn) return;
    const current = hasFilter ? [...selectedFilters] : [...uniqueValues];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    if (next.length === 0 || next.length === uniqueValues.length) {
      onFilterChange?.(activeColumn.key, null);
      return;
    }
    onFilterChange?.(activeColumn.key, next);
  };

  return (
    <div className='relative' ref={wrapRef}>
      <button
        type='button'
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) onOpen?.();
            return next;
          })
        }
        className={`relative flex items-center justify-center p-2 border outline-none rounded-xl transition-colors ${
          open || isActive
            ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-black dark:text-white'
            : 'bg-neutral-100 dark:bg-neutral-900 border-transparent text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
        }`}
        title={tMsg('Sort & Filter', 'Urutkan & Filter')}
        aria-label={tMsg('Sort & Filter', 'Urutkan & Filter')}
        aria-expanded={open}>
        <Icon name='filter' className='w-3.5 h-3.5' />
        {isActive && (
          <span className='absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] leading-4 text-center'>
            {filterCount > 0 ? filterCount : ''}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-2 z-30 w-72 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl'>
          <div className='grid grid-cols-2 gap-1 p-1.5 border-b border-neutral-100 dark:border-neutral-800'>
            <button
              type='button'
              onClick={() => setTab('sort')}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                tab === 'sort'
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white'
                  : 'text-neutral-400 hover:text-black dark:hover:text-white'
              }`}>
              {tMsg('Sort', 'Urutkan')}
            </button>
            <button
              type='button'
              onClick={() => setTab('filter')}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                tab === 'filter'
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white'
                  : 'text-neutral-400 hover:text-black dark:hover:text-white'
              }`}>
              {tMsg('Filter', 'Filter')}
              {filterCount > 0 ? ` (${filterCount})` : ''}
            </button>
          </div>

          {tab === 'sort' ? (
            <>
              <div className='max-h-64 overflow-y-auto p-1.5'>
                {columns.length === 0 ? (
                  <div className='px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 text-center'>
                    {tMsg('No columns', 'Tidak ada kolom')}
                  </div>
                ) : (
                  columns.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <button
                        key={col.key}
                        type='button'
                        onClick={() => onSort?.(col.key)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold ${
                          active
                            ? 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                        }`}>
                        <span className='truncate'>{col.label}</span>
                        {active && (
                          <Icon
                            name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'}
                            className='w-3.5 h-3.5 shrink-0'
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <div className='border-t border-neutral-100 dark:border-neutral-800 p-1.5'>
                <button
                  type='button'
                  onClick={() => onResetSort?.()}
                  disabled={!sortIsCustom}
                  className='w-full rounded-lg px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed'>
                  {tMsg('Reset Sort', 'Atur Ulang Urutan')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className='p-2 border-b border-neutral-100 dark:border-neutral-800 space-y-2'>
                <select
                  value={activeColumn?.key || ''}
                  onChange={(event) => {
                    setFilterKey(event.target.value);
                    setQuery('');
                  }}
                  className='w-full py-2 px-2.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-xs font-bold'>
                  {columns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                      {Array.isArray(columnFilters[col.key]) &&
                      columnFilters[col.key].length > 0
                        ? ' •'
                        : ''}
                    </option>
                  ))}
                </select>
                <input
                  type='text'
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tMsg('Search...', 'Cari...')}
                  className='w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-xs font-medium'
                />
              </div>
              <div className='max-h-48 overflow-y-auto p-1.5'>
                {visibleOptions.length === 0 ? (
                  <div className='px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 text-center'>
                    {tMsg('No values', 'Tidak ada nilai')}
                  </div>
                ) : (
                  visibleOptions.map((value) => {
                    const checked = checkedValues.includes(value);
                    const display = activeColumn?.formatValue
                      ? activeColumn.formatValue(value)
                      : value || tMsg('(Blank)', '(Kosong)');
                    return (
                      <label
                        key={value === '' ? '__blank__' : value}
                        className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={() => toggleValue(value)}
                          className='rounded border-neutral-300 dark:border-neutral-600'
                        />
                        <span className='truncate'>{display}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <div className='border-t border-neutral-100 dark:border-neutral-800 p-1.5 flex gap-1'>
                <button
                  type='button'
                  onClick={() =>
                    activeColumn && onFilterChange?.(activeColumn.key, null)
                  }
                  className='flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'>
                  {tMsg('Clear', 'Hapus')}
                </button>
                <button
                  type='button'
                  onClick={() => onClearFilters?.()}
                  disabled={filterCount === 0}
                  className='flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed'>
                  {tMsg('Clear All', 'Hapus Semua')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
