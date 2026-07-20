import { useState } from 'react';

export function useFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('innocean_view_mode');
      if (savedMode === 'timeline') return 'Project';
    }
    return 'Status';
  });
  const [sortBy, setSortBy] = useState('Default');

  return {
    searchQuery, setSearchQuery,
    groupBy, setGroupBy,
    sortBy, setSortBy,
  };
}
