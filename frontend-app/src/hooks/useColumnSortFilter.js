import { useCallback, useState } from 'react';

export function useColumnSortFilter(defaultSortKey = null, defaultSortDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [columnFilters, setColumnFilters] = useState({});

  const toggleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey === key) return prevKey;
      return key;
    });
    setSortDir((dir) => (sortKey === key ? (dir === 'asc' ? 'desc' : 'asc') : 'asc'));
  }, [sortKey]);

  const setColumnFilter = useCallback((key, values) => {
    setColumnFilters((prev) => {
      if (!values || values.length === 0) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: values };
    });
  }, []);

  const clearColumnFilter = useCallback((key) => {
    setColumnFilters((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  return {
    sortKey,
    sortDir,
    toggleSort,
    columnFilters,
    setColumnFilter,
    clearColumnFilter,
  };
}

export function uniqueColumnValues(rows, getValue) {
  const set = new Set();
  (rows || []).forEach((row) => {
    set.add(String(getValue(row) ?? ''));
  });
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export function applyColumnSortFilter(
  rows,
  { sortKey, sortDir, columnFilters, getValue }
) {
  let result = rows || [];

  Object.entries(columnFilters || {}).forEach(([key, selected]) => {
    if (!Array.isArray(selected) || selected.length === 0) return;
    const allowed = new Set(selected.map(String));
    result = result.filter((row) =>
      allowed.has(String(getValue(row, key) ?? ''))
    );
  });

  if (!sortKey) return result;

  const dir = sortDir === 'desc' ? -1 : 1;
  return [...result].sort((a, b) => {
    const av = String(getValue(a, sortKey) ?? '');
    const bv = String(getValue(b, sortKey) ?? '');
    return (
      av.localeCompare(bv, undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * dir
    );
  });
}
