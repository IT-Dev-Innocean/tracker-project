import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons/Icon';

export default function TableColumnHeader({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  uniqueValues = [],
  selectedFilters,
  onFilterChange,
  formatValue,
  align = 'left',
  tMsg = (en) => en,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef(null);
  const isSorted = sortKey === columnKey;
  const hasFilter = Array.isArray(selectedFilters) && selectedFilters.length > 0;

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

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const width = 224;
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - width - 8)
      );
      setMenuPos({ top: rect.bottom + 8, left });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return uniqueValues.filter((value) => {
      const text = formatValue
        ? formatValue(value)
        : value || tMsg('(Blank)', '(Kosong)');
      return !q || String(text).toLowerCase().includes(q);
    });
  }, [uniqueValues, query, formatValue, tMsg]);

  const checkedValues = hasFilter ? selectedFilters : uniqueValues;

  const toggleValue = (value) => {
    const current = hasFilter ? [...selectedFilters] : [...uniqueValues];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    if (next.length === 0 || next.length === uniqueValues.length) {
      onFilterChange?.(null);
      return;
    }
    onFilterChange?.(next);
  };

  const alignClass =
    align === 'right'
      ? 'justify-end'
      : align === 'center'
        ? 'justify-center'
        : 'justify-start';

  return (
    <th
      className={`px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap ${className}`}>
      <div className={`relative flex items-center gap-1.5 ${alignClass}`} ref={wrapRef}>
        <button
          type='button'
          onClick={() => onSort?.(columnKey)}
          className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-black dark:hover:text-white transition-colors ${
            isSorted ? 'text-black dark:text-white' : ''
          }`}
          title={tMsg('Sort', 'Urutkan')}>
          <span>{label}</span>
          <Icon
            name={isSorted && sortDir === 'asc' ? 'chevron-up' : 'chevron-down'}
            className={`w-3 h-3 ${isSorted ? 'opacity-100' : 'opacity-30'}`}
          />
        </button>
        <button
          type='button'
          onClick={() => {
            setOpen((prev) => !prev);
            setQuery('');
          }}
          className={`p-0.5 rounded transition-colors ${
            hasFilter || open
              ? 'text-black dark:text-white bg-neutral-200 dark:bg-neutral-700'
              : 'text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
          title={tMsg('Filter', 'Filter')}
          aria-label={tMsg('Filter', 'Filter')}>
          <Icon name='filter' className='w-3 h-3' />
        </button>

        {open && (
          <div
            className='fixed z-50 w-56 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl'
            style={{ top: menuPos.top, left: menuPos.left }}>
            <div className='p-2 border-b border-neutral-100 dark:border-neutral-800'>
              <input
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
                  const display = formatValue
                    ? formatValue(value)
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
                onClick={() => onFilterChange?.(null)}
                className='flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'>
                {tMsg('Clear', 'Hapus')}
              </button>
            </div>
          </div>
        )}
      </div>
    </th>
  );
}
