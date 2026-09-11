import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppContext } from './hooks/useAppContext';
import { HighlightText, LoadingSpinner } from './Utils';
import { Avatar, IconPlus } from './SharedUI';
import { Icon } from './components/icons/Icon';
import { ROLE_ADMIN, ROLE_PROJECT_OWNER, ROLE_STAFF } from './permissions';

const TEAMS_COLUMN_STORAGE_KEY = 'innocean_teams_visible_columns';
const DEFAULT_VISIBLE_COLUMNS = {
  name: true,
  email: true,
  job_position: true,
  department: true,
  status: true,
  actions: true,
};

const loadVisibleColumns = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_VISIBLE_COLUMNS };
  try {
    const saved = JSON.parse(
      localStorage.getItem(TEAMS_COLUMN_STORAGE_KEY) || '{}'
    );
    return { ...DEFAULT_VISIBLE_COLUMNS, ...saved };
  } catch {
    return { ...DEFAULT_VISIBLE_COLUMNS };
  }
};

export default function TeamsDirectory() {
  const {
    language,
    currentUser,
    workspaceRole,
    isSuperAdmin,
    showNotification,
    avatarsMap = {},
    leaves = [],
    formatDateMMM,
    teamsSubNav = 'people',
  } = useAppContext();
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const canManage =
    workspaceRole === ROLE_ADMIN ||
    workspaceRole === ROLE_PROJECT_OWNER ||
    isSuperAdmin;

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const activeTab = teamsSubNav;
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: ROLE_STAFF,
  });
  const [isInviting, setIsInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [peoplePerPage, setPeoplePerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(
        localStorage.getItem('innocean_teams_people_per_page')
      );
      if ([5, 10, 20, 50].includes(saved)) return saved;
    }
    return 5;
  });

  const setPeoplePerPagePersist = (value) => {
    const next = Number(value);
    setPeoplePerPage(next);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('innocean_teams_people_per_page', String(next));
    }
  };

  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef(null);

  const columnOptions = [
    { key: 'name', label: tMsg('Name', 'Nama') },
    { key: 'email', label: tMsg('Email', 'Email') },
    { key: 'job_position', label: tMsg('Job Position', 'Posisi Kerja') },
    { key: 'department', label: tMsg('Department', 'Departemen') },
    { key: 'status', label: tMsg('User Status', 'Status') },
    { key: 'actions', label: tMsg('Actions', 'Tindakan') },
  ];

  const isColVisible = (key) => visibleColumns[key] !== false;
  const visibleDataCount = columnOptions.filter((col) =>
    isColVisible(col.key)
  ).length;

  const persistVisibleColumns = (next) => {
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEAMS_COLUMN_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const toggleColumn = (key) => {
    const currentlyVisible = isColVisible(key);
    if (currentlyVisible && visibleDataCount <= 1) return;
    persistVisibleColumns({
      ...visibleColumns,
      [key]: !currentlyVisible,
    });
  };

  const resetColumns = () => {
    persistVisibleColumns({ ...DEFAULT_VISIBLE_COLUMNS });
  };

  useEffect(() => {
    if (!columnsMenuOpen) return;
    const handleClickOutside = (event) => {
      if (
        columnsMenuRef.current &&
        !columnsMenuRef.current.contains(event.target)
      ) {
        setColumnsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnsMenuOpen]);

  const loadPeople = useCallback(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    axios
      .get('/api/admin/users')
      .then((res) => {
        setPeople(res.data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        showNotification?.(
          err.response?.data?.detail ||
            (language === 'id'
              ? 'Gagal memuat daftar orang'
              : 'Failed to load people'),
          'error'
        );
        setLoading(false);
      });
  }, [canManage]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const divisionsList = useMemo(() => {
    const set = new Set();
    (people || []).forEach((u) => {
      if (u.division_name) set.add(u.division_name);
    });
    return Array.from(set).sort();
  }, [people]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (people || [])
      .filter((user) => {
        if (user.username === 'admin') return false;
        if (
          divisionFilter !== 'all' &&
          (user.division_name || '') !== divisionFilter
        )
          return false;
        if (statusFilter === 'active' && user.account_status !== 'active')
          return false;
        if (statusFilter === 'frozen' && user.account_status !== 'suspended')
          return false;
        if (statusFilter === 'unverified' && user.is_verified === 1)
          return false;
        if (!needle) return true;
        return [
          user.full_name,
          user.username,
          user.email,
          user.job_position,
          user.division_name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      })
      .sort((a, b) =>
        String(a.full_name || a.username).localeCompare(
          String(b.full_name || b.username)
        )
      );
  }, [people, query, divisionFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / peoplePerPage) || 1
  );

  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * peoplePerPage;
    return filtered.slice(start, start + peoplePerPage);
  }, [filtered, currentPage, peoplePerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, divisionFilter, statusFilter, peoplePerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * peoplePerPage + 1;
  const rangeEnd = Math.min(currentPage * peoplePerPage, filtered.length);

  const statusBadge = (user) => {
    if (user.account_status === 'suspended') {
      return (
        <span className='text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full'>
          {tMsg('Frozen', 'Beku')}
        </span>
      );
    }
    if (user.is_verified === 0) {
      return (
        <span className='text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full'>
          {tMsg('Unverified', 'Belum Verifikasi')}
        </span>
      );
    }
    return (
      <span className='text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full'>
        {tMsg('Active', 'Aktif')}
      </span>
    );
  };

  const handleInvite = (e) => {
    e.preventDefault();
    setIsInviting(true);
    axios
      .post('/api/teams/invite', {
        ...inviteForm,
        role: ROLE_STAFF,
      })
      .then((res) => {
        showNotification?.(res.data.message, 'success');
        if (res.data.temporary_password) {
          showNotification?.(
            tMsg(
              `Temporary password: ${res.data.temporary_password}`,
              `Password sementara: ${res.data.temporary_password}`
            ),
            'info'
          );
        }
        setInviteOpen(false);
        setInviteForm({
          email: '',
          role: ROLE_STAFF,
        });
        setIsInviting(false);
        loadPeople();
      })
      .catch((err) => {
        setIsInviting(false);
        showNotification?.(
          err.response?.data?.detail || 'Invite failed',
          'error'
        );
      });
  };

  const handleFreeze = (username, freeze) => {
    axios
      .put('/api/admin/users/status', {
        username,
        status: freeze ? 'suspended' : 'active',
      })
      .then((res) => {
        showNotification?.(res.data.message, 'success');
        loadPeople();
      })
      .catch((err) =>
        showNotification?.(
          err.response?.data?.detail || 'Failed to update status',
          'error'
        )
      );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    axios
      .post('/api/admin/users/delete', { username: confirmDelete, status: '' })
      .then((res) => {
        showNotification?.(
          res.data.message || `User @${confirmDelete} deleted`,
          'success'
        );
        setConfirmDelete(null);
        setIsDeleting(false);
        loadPeople();
      })
      .catch((err) => {
        setIsDeleting(false);
        showNotification?.(
          err.response?.data?.detail || 'Failed to delete user',
          'error'
        );
      });
  };

  const exportCsv = () => {
    const rows = [
      [
        'username',
        'full_name',
        'email',
        'job_position',
        'division_name',
        'status',
      ],
      ...filtered.map((u) => [
        u.username,
        u.full_name || '',
        u.email || '',
        u.job_position || '',
        u.division_name || '',
        u.account_status || '',
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams-people.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canManage) {
    return (
      <div className='flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin'>
        <div className='mx-auto max-w-3xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center'>
          <Icon
            name='lock'
            className='w-10 h-10 mx-auto mb-4 text-neutral-400'
          />
          <h1 className='text-xl font-black text-black dark:text-white'>
            {tMsg('Access restricted', 'Akses dibatasi')}
          </h1>
          <p className='mt-2 text-sm text-neutral-500'>
            {tMsg(
              'Only Admin and Project Owner can open Teams management.',
              'Hanya Admin dan Project Owner yang dapat membuka manajemen Tim.'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin relative'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='text-[10px] font-black uppercase tracking-widest text-neutral-400'>
              {tMsg('Teams', 'Tim')}
            </div>
            <h1 className='mt-1 text-2xl font-black text-black dark:text-white'>
              {activeTab === 'leaves'
                ? tMsg('User Leave', 'Cuti Pengguna')
                : tMsg('All People', 'Semua Orang')}
            </h1>
            <p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
              {activeTab === 'people'
                ? tMsg(
                    'Invite and remove people across your workspace.',
                    'Undang dan hapus orang di seluruh workspace Anda.'
                  )
                : tMsg(
                    'View leaves submitted by users.',
                    'Lihat daftar cuti yang diajukan oleh pengguna.'
                  )}
            </p>
          </div>
          {activeTab === 'people' && (
            <div className='flex flex-wrap items-center gap-2 shrink-0'>
              <button
                type='button'
                onClick={exportCsv}
                className='flex items-center justify-center border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 font-bold py-2.5 px-5 rounded-lg transition-colors text-sm text-neutral-700 dark:text-neutral-200'>
                {tMsg('Export', 'Ekspor')}
              </button>
              <button
                type='button'
                onClick={() => setInviteOpen(true)}
                className='flex items-center gap-2 justify-center bg-black dark:bg-white text-white dark:text-black hover:opacity-80 font-bold py-2.5 px-5 rounded-lg transition-opacity text-sm shadow-sm'>
                <IconPlus className='w-4 h-4' />
                {tMsg('Invite', 'Undang')}
              </button>
            </div>
          )}
        </div>

        {activeTab === 'leaves' && (
          <div className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-sm'>
            <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 flex-wrap gap-4'>
              <h3 className='font-bold text-black dark:text-white text-sm uppercase tracking-wider'>
                {tMsg('Leave Directory', 'Direktori Cuti')}
              </h3>
              <div className='relative'>
                <Icon
                  name='search'
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none'
                />
                <input
                  type='text'
                  placeholder={tMsg('Search leaves...', 'Cari cuti...')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className='w-full sm:w-56 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-neutral-400 outline-none text-xs font-medium'
                />
              </div>
            </div>
            <div className='overflow-x-auto scrollbar-thin'>
              <table className='w-full text-left text-sm'>
                <thead>
                  <tr className='border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
                    <th className='px-5 py-3.5'>{tMsg('User', 'Pengguna')}</th>
                    <th className='px-5 py-3.5'>
                      {tMsg('Leave Date', 'Tanggal Cuti')}
                    </th>
                    <th className='px-5 py-3.5'>
                      {tMsg('Leave Type', 'Tipe Cuti')}
                    </th>
                    <th className='px-5 py-3.5'>
                      {tMsg('Description / Reason', 'Deskripsi / Alasan')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const needle = query.trim().toLowerCase();
                    const filteredLeaves = leaves
                      .filter((l) => l.leave_type === 'personal')
                      .filter((l) => {
                        if (!needle) return true;
                        const u = people.find((p) => p.username === l.username);
                        const nameMatch = (u?.full_name || '')
                          .toLowerCase()
                          .includes(needle);
                        const unameMatch = (l.username || '')
                          .toLowerCase()
                          .includes(needle);
                        const descMatch = (l.description || '')
                          .toLowerCase()
                          .includes(needle);
                        const dateMatch = (l.leave_date || '')
                          .toLowerCase()
                          .includes(needle);
                        return (
                          nameMatch || unameMatch || descMatch || dateMatch
                        );
                      })
                      .sort(
                        (a, b) =>
                          new Date(b.leave_date) - new Date(a.leave_date)
                      );

                    if (filteredLeaves.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={4}
                            className='p-12 text-center text-neutral-400'>
                            <Icon
                              name='calendar'
                              className='w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600'
                            />
                            {needle
                              ? tMsg(
                                  'No matching leave records found.',
                                  'Tidak ditemukan catatan cuti yang cocok.'
                                )
                              : tMsg(
                                  'No personal leave records submitted.',
                                  'Belum ada catatan cuti personal yang diajukan.'
                                )}
                          </td>
                        </tr>
                      );
                    }

                    return filteredLeaves.map((l) => {
                      const u = people.find((p) => p.username === l.username);
                      return (
                        <tr
                          key={l.id}
                          className='border-b border-neutral-100 dark:border-neutral-800/70 last:border-0 hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40 transition-colors'>
                          <td className='px-5 py-3.5 font-medium text-black dark:text-white flex items-center gap-3'>
                            <Avatar
                              url={avatarsMap[l.username]}
                              name={l.username}
                              size='w-8 h-8'
                            />
                            <div className='flex flex-col min-w-0'>
                              <span className='font-semibold text-black dark:text-white leading-tight'>
                                {u?.full_name || l.username}
                              </span>
                              <span className='text-[11px] text-neutral-400'>
                                @{l.username}
                              </span>
                            </div>
                          </td>
                          <td className='px-5 py-3.5 text-neutral-700 dark:text-neutral-300 font-medium'>
                            {formatDateMMM
                              ? formatDateMMM(l.leave_date)
                              : l.leave_date}
                          </td>
                          <td className='px-5 py-3.5'>
                            <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400'>
                              🌴 {tMsg('Personal Leave', 'Cuti Personal')}
                            </span>
                          </td>
                          <td className='px-5 py-3.5 text-neutral-600 dark:text-neutral-400 italic'>
                            {l.description || '—'}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'>
            <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 flex-wrap gap-4 rounded-t-2xl'>
              <h3 className='font-bold text-black dark:text-white text-sm uppercase tracking-wider'>
                {tMsg('People Directory', 'Direktori Orang')}
              </h3>
              <div className='flex items-center gap-2 flex-wrap'>
                <div className='relative'>
                  <Icon
                    name='search'
                    className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none'
                  />
                  <input
                    type='text'
                    placeholder={tMsg('Search people...', 'Cari orang...')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className='w-full sm:w-56 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-neutral-400 outline-none text-xs font-medium'
                  />
                </div>
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className='py-2 px-3 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl outline-none text-xs font-bold'>
                  <option value='all'>
                    {tMsg('All Departments', 'Semua Departemen')}
                  </option>
                  {divisionsList.map((divName) => (
                    <option key={divName} value={divName}>
                      {divName}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className='py-2 px-3 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl outline-none text-xs font-bold'>
                  <option value='all'>
                    {tMsg('All Status', 'Semua Status')}
                  </option>
                  <option value='active'>{tMsg('Active', 'Aktif')}</option>
                  <option value='frozen'>{tMsg('Frozen', 'Beku')}</option>
                  <option value='unverified'>
                    {tMsg('Unverified', 'Belum Verifikasi')}
                  </option>
                </select>
                <div className='relative' ref={columnsMenuRef}>
                  <button
                    type='button'
                    onClick={() => setColumnsMenuOpen((open) => !open)}
                    className={`flex items-center gap-1.5 py-2 px-3 border outline-none text-xs font-bold rounded-xl transition-colors ${
                      columnsMenuOpen || visibleDataCount < columnOptions.length
                        ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-black dark:text-white'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-transparent text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
                    }`}>
                    <Icon name='sliders' className='w-3.5 h-3.5' />
                    {tMsg('Columns', 'Kolom')}
                    {visibleDataCount < columnOptions.length && (
                      <span className='min-w-4 h-4 px-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] leading-4 text-center'>
                        {columnOptions.length - visibleDataCount}
                      </span>
                    )}
                  </button>
                  {columnsMenuOpen && (
                    <div className='absolute right-0 top-full mt-2 z-30 w-56 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl'>
                      <div className='px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-400'>
                        {tMsg('Show / Hide Columns', 'Tampil / Sembunyi Kolom')}
                      </div>
                      <div className='p-1.5'>
                        {columnOptions.map((col) => {
                          const visible = isColVisible(col.key);
                          const locked = visible && visibleDataCount <= 1;
                          return (
                            <button
                              key={col.key}
                              type='button'
                              disabled={locked}
                              onClick={() => toggleColumn(col.key)}
                              className='flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed'>
                              <span>{col.label}</span>
                              <Icon
                                name={visible ? 'eye' : 'eye-off'}
                                className={`w-3.5 h-3.5 ${
                                  visible
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-neutral-400'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <div className='border-t border-neutral-100 dark:border-neutral-800 p-1.5'>
                        <button
                          type='button'
                          onClick={resetColumns}
                          className='w-full rounded-lg px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'>
                          {tMsg('Reset Columns', 'Atur Ulang Kolom')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='overflow-auto'>
              {loading ? (
                <div className='p-16 flex justify-center'>
                  <LoadingSpinner />
                </div>
              ) : filtered.length === 0 ? (
                <div className='p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs'>
                  {tMsg('No people found.', 'Tidak ada orang ditemukan.')}
                </div>
              ) : (
                <table className='w-full text-left border-collapse text-sm'>
                  <thead className='bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10'>
                    <tr>
                      {isColVisible('name') && (
                        <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                          {tMsg('Name', 'Nama')}
                        </th>
                      )}
                      {isColVisible('email') && (
                        <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                          {tMsg('Email', 'Email')}
                        </th>
                      )}
                      {isColVisible('job_position') && (
                        <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                          {tMsg('Job Position', 'Posisi Kerja')}
                        </th>
                      )}
                      {isColVisible('department') && (
                        <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                          {tMsg('Department', 'Departemen')}
                        </th>
                      )}
                      {isColVisible('status') && (
                        <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center'>
                          {tMsg('User Status', 'Status')}
                        </th>
                      )}
                      {isColVisible('actions') && (
                        <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-right'>
                          {tMsg('Actions', 'Tindakan')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                    {paginatedPeople.map((person) => {
                      const isSelf = person.username === currentUser;
                      const isRootAdmin = person.username === 'admin';
                      const canAct = !isSelf && !isRootAdmin;
                      return (
                        <tr
                          key={person.username}
                          className='hover:bg-white dark:hover:bg-neutral-950 transition-colors'>
                          {isColVisible('name') && (
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='flex items-center gap-3'>
                                <Avatar
                                  name={person.username}
                                  url={
                                    avatarsMap[person.username] || person.avatar
                                  }
                                />
                                <div className='min-w-0'>
                                  <div className='truncate font-bold text-black dark:text-white text-sm'>
                                    <HighlightText
                                      text={person.full_name || person.username}
                                      query={query}
                                    />
                                    {isSelf ? (
                                      <span className='ml-2 text-[10px] font-bold uppercase text-neutral-400'>
                                        {tMsg('You', 'Anda')}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className='truncate text-xs text-neutral-500'>
                                    @
                                    <HighlightText
                                      text={person.username}
                                      query={query}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          {isColVisible('email') && (
                            <td className='px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>
                              {person.email ? (
                                <HighlightText
                                  text={person.email}
                                  query={query}
                                />
                              ) : (
                                <span className='text-neutral-300 dark:text-neutral-600'>
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {isColVisible('job_position') && (
                            <td className='px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>
                              {person.job_position ? (
                                <span className='font-medium'>
                                  <HighlightText
                                    text={person.job_position}
                                    query={query}
                                  />
                                </span>
                              ) : (
                                <span className='text-xs italic text-amber-500/90 dark:text-amber-400/90 font-medium'>
                                  {tMsg('Not updated yet', 'Belum diupdate')}
                                </span>
                              )}
                            </td>
                          )}
                          {isColVisible('department') && (
                            <td className='px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>
                              {person.division_name ? (
                                <span className='font-medium'>
                                  <HighlightText
                                    text={person.division_name}
                                    query={query}
                                  />
                                </span>
                              ) : (
                                <span className='text-xs italic text-amber-500/90 dark:text-amber-400/90 font-medium'>
                                  {tMsg('Not updated yet', 'Belum diupdate')}
                                </span>
                              )}
                            </td>
                          )}
                          {isColVisible('status') && (
                            <td className='px-6 py-4 text-center whitespace-nowrap'>
                              {statusBadge(person)}
                            </td>
                          )}
                          {isColVisible('actions') && (
                            <td className='px-6 py-4 text-right whitespace-nowrap'>
                              {canAct ? (
                                <div className='flex justify-end gap-2'>
                                  {person.account_status === 'suspended' ? (
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleFreeze(person.username, false)
                                      }
                                      className='flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50! hover:text-indigo-700! hover:border-indigo-300! dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-900/40! dark:hover:text-indigo-300! dark:hover:border-indigo-700! px-3 py-1.5 rounded-lg transition-colors'>
                                      {tMsg('Unfreeze', 'Cairkan')}
                                    </button>
                                  ) : (
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleFreeze(person.username, true)
                                      }
                                      className='flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50! hover:text-indigo-700! hover:border-indigo-300! dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-900/40! dark:hover:text-indigo-300! dark:hover:border-indigo-700! px-3 py-1.5 rounded-lg transition-colors'>
                                      {tMsg('Freeze', 'Bekukan')}
                                    </button>
                                  )}
                                  <button
                                    type='button'
                                    onClick={() =>
                                      setConfirmDelete(person.username)
                                    }
                                    className='flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50'>
                                    <Icon name='trash' className='w-3.5 h-3.5' />
                                    {tMsg('Delete', 'Hapus')}
                                  </button>
                                </div>
                              ) : (
                                <span className='text-neutral-300 dark:text-neutral-600'>
                                  —
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {filtered.length > 0 && (
              <div className='px-4 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-2xl'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-widest'>
                    {tMsg('Show', 'Tampilkan')}
                  </span>
                  <select
                    value={peoplePerPage}
                    onChange={(e) => setPeoplePerPagePersist(e.target.value)}
                    className='py-1.5 px-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-xs font-bold'>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                    {tMsg(
                      `${rangeStart}–${rangeEnd} of ${filtered.length}`,
                      `${rangeStart}–${rangeEnd} dari ${filtered.length}`
                    )}
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className='px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'>
                    {tMsg('Prev', 'Sebelumnya')}
                  </button>
                  <span className='text-xs font-bold text-neutral-700 dark:text-neutral-300 min-w-16 text-center'>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className='px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'>
                    {tMsg('Next', 'Berikutnya')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {inviteOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <form
            onSubmit={handleInvite}
            className='w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950'>
            <h3 className='text-xl font-black text-black dark:text-white mb-1'>
              {tMsg('Invite Person', 'Undang Orang')}
            </h3>
            <p className='text-sm text-neutral-500 mb-5'>
              {tMsg(
                'Create a workspace account and send login details.',
                'Buat akun workspace dan kirim detail login.'
              )}
            </p>
            <div className='space-y-3'>
              <input
                required
                type='email'
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder='email@innocean.co.id'
                className='w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 text-sm outline-none'
              />
            </div>
            <div className='mt-6 flex gap-3'>
              <button
                type='button'
                onClick={() => setInviteOpen(false)}
                className='flex-1 rounded-full bg-neutral-100 dark:bg-neutral-900 py-3 text-xs font-bold uppercase'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type='submit'
                disabled={isInviting}
                className='flex-1 rounded-full bg-black dark:bg-white py-3 text-xs font-bold uppercase text-white dark:text-black disabled:opacity-50'>
                {isInviting
                  ? tMsg('Inviting…', 'Mengundang…')
                  : tMsg('Send Invite', 'Kirim Undangan')}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-950'>
            <h3 className='text-xl font-black text-black dark:text-white mb-2'>
              {tMsg('Delete User?', 'Hapus Pengguna?')}
            </h3>
            <p className='text-sm text-neutral-500 mb-6'>
              {tMsg('Permanently remove', 'Hapus permanen')}{' '}
              <strong>@{confirmDelete}</strong>.
            </p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setConfirmDelete(null)}
                className='flex-1 rounded-full bg-neutral-100 dark:bg-neutral-900 py-3 text-xs font-bold uppercase'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type='button'
                onClick={handleDelete}
                disabled={isDeleting}
                className='flex-1 rounded-full bg-red-500 py-3 text-xs font-bold uppercase text-white disabled:opacity-50'>
                {isDeleting
                  ? tMsg('Deleting…', 'Menghapus…')
                  : tMsg('Delete', 'Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
