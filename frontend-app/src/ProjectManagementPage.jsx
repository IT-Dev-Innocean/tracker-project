import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppContext } from './hooks/useAppContext';
import { HighlightText, LoadingSpinner } from './Utils';
import { IconPlus } from './SharedUI';
import { Icon } from './components/icons/Icon';
import { excludeTodoListBoards } from './utils/boards';

const PROJECT_COLUMN_STORAGE_KEY = 'innocean_project_visible_columns';
const DEFAULT_VISIBLE_COLUMNS = {
  project_number: true,
  client_code: false,
  name: true,
  created_by: true,
  billing_type: true,
  owner_status: false,
  actions: true,
};

const loadVisibleColumns = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_VISIBLE_COLUMNS };
  try {
    const saved = JSON.parse(
      localStorage.getItem(PROJECT_COLUMN_STORAGE_KEY) || '{}'
    );
    return { ...DEFAULT_VISIBLE_COLUMNS, ...saved };
  } catch {
    return { ...DEFAULT_VISIBLE_COLUMNS };
  }
};

export default function ProjectManagementPage() {
  const {
    language,
    showNotification,
    userDirectory = [],
    currentUser,
    boards = [],
    fetchBoards,
    setIsCreateBoardOpen,
    accountStatus,
    workspaceRole,
    isSuperAdmin,
  } = useAppContext();
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const canManageProjects =
    workspaceRole === 'admin' ||
    workspaceRole === 'project_owner' ||
    (!workspaceRole && isSuperAdmin);

  const [manageBoards, setManageBoards] = useState([]);
  const [isBoardsLoading, setIsBoardsLoading] = useState(true);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [boardsToDelete, setBoardsToDelete] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [boardToTransfer, setBoardToTransfer] = useState(null);
  const [newOwnerInput, setNewOwnerInput] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    project_number: '',
    name: '',
    client_name: '',
    billing_type: 'Billable',
  });
  const [clients, setClients] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(
        localStorage.getItem('innocean_project_manage_per_page')
      );
      if ([5, 10, 20, 50].includes(saved)) return saved;
    }
    return 5;
  });
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('innocean_project_manage_view') || 'table';
    }
    return 'table';
  });

  const setViewModePersist = (mode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('innocean_project_manage_view', mode);
    }
  };

  const setProjectsPerPagePersist = (value) => {
    const next = Number(value);
    setProjectsPerPage(next);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('innocean_project_manage_per_page', String(next));
    }
  };

  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef(null);

  const columnOptions = [
    { key: 'project_number', label: tMsg('Job Number', 'Nomor Job') },
    { key: 'client_code', label: tMsg('Client Code', 'Kode Klien') },
    { key: 'name', label: tMsg('Project Name', 'Nama Proyek') },
    { key: 'created_by', label: tMsg('Project Requester', 'Project Requester') },
    { key: 'billing_type', label: tMsg('Billing Type', 'Tipe Penagihan') },
    { key: 'owner_status', label: tMsg('Owner Status', 'Status Pemilik') },
    { key: 'actions', label: tMsg('Actions', 'Tindakan') },
  ];

  const isColVisible = (key) => visibleColumns[key] !== false;
  const visibleDataCount = columnOptions.filter((col) =>
    isColVisible(col.key)
  ).length;

  const persistVisibleColumns = (next) => {
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROJECT_COLUMN_STORAGE_KEY, JSON.stringify(next));
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

  const [editClientSearch, setEditClientSearch] = useState('');
  const [editClientDropdownOpen, setEditClientDropdownOpen] = useState(false);
  const editClientDropdownRef = useRef(null);

  useEffect(() => {
    if (!editClientDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (
        editClientDropdownRef.current &&
        !editClientDropdownRef.current.contains(e.target)
      ) {
        setEditClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editClientDropdownOpen]);

  const filteredEditClients = useMemo(() => {
    const q = editClientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        (c.client_name || '').toLowerCase().includes(q) ||
        (c.client_code || '').toLowerCase().includes(q)
    );
  }, [clients, editClientSearch]);

  const ownerStatusBadge = (status) => {
    if (status === 'orphan') {
      return (
        <span className='text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full'>
          {tMsg('Orphaned', 'Yatim')}
        </span>
      );
    }
    if (status === 'pending_deletion') {
      return (
        <span className='text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full'>
          {tMsg('Owner Deleting', 'Pemilik Dihapus')}
        </span>
      );
    }
    if (status === 'suspended') {
      return (
        <span className='text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-3 py-1 rounded-full'>
          {tMsg('Owner Frozen', 'Pemilik Beku')}
        </span>
      );
    }
    return (
      <span className='text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full'>
        {tMsg('Active', 'Aktif')}
      </span>
    );
  };

  const showNotificationRef = useRef(showNotification);
  const languageRef = useRef(language);
  useEffect(() => {
    showNotificationRef.current = showNotification;
    languageRef.current = language;
  }, [showNotification, language]);

  const loadBoards = useCallback((silent = false) => {
    if (!silent) {
      setIsBoardsLoading(true);
      setSelectedBoards([]);
    }
    axios
      .get('/api/admin/boards')
      .then((res) => {
        setManageBoards(excludeTodoListBoards(res.data.boards || []));
        setIsBoardsLoading(false);
      })
      .catch(() => {
        if (!silent) {
          const isId = languageRef.current === 'id';
          showNotificationRef.current?.(
            isId ? 'Gagal memuat proyek' : 'Failed to load projects',
            'error'
          );
        }
        setIsBoardsLoading(false);
      });
  }, []);

  // Full-page loading spinner only on first enter
  useEffect(() => {
    loadBoards(false);
  }, [loadBoards]);

  // Silent refresh only when project IDs change (create/delete), not on background polls
  const boardIdsKey = useMemo(
    () =>
      (boards || [])
        .map((b) => b.id)
        .sort((a, b) => a - b)
        .join(','),
    [boards]
  );
  const prevBoardIdsKey = useRef(null);
  useEffect(() => {
    if (prevBoardIdsKey.current === null) {
      prevBoardIdsKey.current = boardIdsKey;
      return;
    }
    if (prevBoardIdsKey.current === boardIdsKey) return;
    prevBoardIdsKey.current = boardIdsKey;
    loadBoards(true);
  }, [boardIdsKey, loadBoards]);

  const filteredBoards = useMemo(() => {
    return manageBoards.filter((b) => {
      const matchFilter =
        projectFilter === 'all' || b.owner_status === projectFilter;
      const q = projectSearchQuery.toLowerCase();
      const matchSearch =
        b.name.toLowerCase().includes(q) ||
        b.owner_username.toLowerCase().includes(q) ||
        (b.project_number || '').toLowerCase().includes(q) ||
        (b.client_code || '').toLowerCase().includes(q) ||
        (b.client_name || '').toLowerCase().includes(q) ||
        (b.billing_type || '').toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [manageBoards, projectFilter, projectSearchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBoards.length / projectsPerPage) || 1
  );

  const paginatedBoards = useMemo(() => {
    const start = (currentPage - 1) * projectsPerPage;
    return filteredBoards.slice(start, start + projectsPerPage);
  }, [filteredBoards, currentPage, projectsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projectSearchQuery, projectFilter, projectsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const rangeStart =
    filteredBoards.length === 0 ? 0 : (currentPage - 1) * projectsPerPage + 1;
  const rangeEnd = Math.min(
    currentPage * projectsPerPage,
    filteredBoards.length
  );

  const transferCandidates = useMemo(() => {
    const names = new Set();
    const list = [];
    (userDirectory || []).forEach((u) => {
      if (!u?.username || names.has(u.username)) return;
      if (boardToTransfer && u.username === boardToTransfer.owner_username)
        return;
      names.add(u.username);
      list.push(u);
    });
    return list.sort((a, b) =>
      String(a.username).localeCompare(String(b.username))
    );
  }, [userDirectory, boardToTransfer]);

  const handleToggleSelectBoard = (id) => {
    setSelectedBoards((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSelectAllBoards = (e) => {
    if (e.target.checked) {
      setSelectedBoards(paginatedBoards.map((b) => b.id));
    } else {
      setSelectedBoards([]);
    }
  };

  const triggerDelete = (boardsArray) => {
    setBoardsToDelete(boardsArray);
    setDeleteConfirmOpen(true);
  };

  useEffect(() => {
    axios
      .get('/api/clients')
      .then((res) => setClients(res.data.clients || []))
      .catch(console.error);
  }, []);

  const openEditBoard = (board) => {
    setBoardToEdit(board);
    setEditClientSearch('');
    setEditClientDropdownOpen(false);
    setEditForm({
      project_number: board.project_number || '',
      name: board.name || '',
      client_name: board.client_name || '',
      billing_type: board.billing_type || 'Billable',
    });
  };

  const closeEditBoard = () => {
    setBoardToEdit(null);
    setEditClientSearch('');
    setEditClientDropdownOpen(false);
    setEditForm({
      project_number: '',
      name: '',
      client_name: '',
      billing_type: 'Billable',
    });
  };

  const executeEditBoard = () => {
    if (!boardToEdit || !editForm.name.trim()) return;
    setIsSavingEdit(true);
    axios
      .put(`/api/boards/${boardToEdit.id}`, {
        name: editForm.name.trim(),
        project_number: editForm.project_number.trim() || null,
        client_name: editForm.client_name || null,
        billing_type: editForm.billing_type || 'Billable',
      })
      .then((res) => {
        showNotification?.(
          res.data.message ||
            tMsg('Project updated successfully', 'Proyek berhasil diperbarui'),
          'success'
        );
        closeEditBoard();
        loadBoards();
        fetchBoards?.();
      })
      .catch((err) => {
        showNotification?.(
          err.response?.data?.detail ||
            tMsg('Failed to update project', 'Gagal memperbarui proyek'),
          'error'
        );
      })
      .finally(() => setIsSavingEdit(false));
  };

  const executeDelete = () => {
    setIsDeletingBulk(true);
    const requests = boardsToDelete.map((b) =>
      axios.delete(`/api/boards/${b.id}`)
    );
    Promise.all(requests)
      .then(() => {
        showNotification?.(
          tMsg('Project(s) deleted successfully', 'Proyek berhasil dihapus'),
          'success'
        );
        setSelectedBoards([]);
        setBoardsToDelete([]);
        setDeleteConfirmOpen(false);
        setIsDeletingBulk(false);
        loadBoards();
        fetchBoards?.();
      })
      .catch(() => {
        showNotification?.(
          tMsg(
            'Failed to delete some projects',
            'Gagal menghapus beberapa proyek'
          ),
          'error'
        );
        setIsDeletingBulk(false);
      });
  };

  return (
    <div className='flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin relative'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='text-[10px] font-black uppercase tracking-widest text-neutral-400'>
              {tMsg('Projects', 'Proyek')}
            </div>
            <h1 className='mt-1 text-2xl font-black text-black dark:text-white'>
              {tMsg('Project Management', 'Manajemen Proyek')}
            </h1>
            <p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
              {tMsg(
                'Transfer ownership or delete projects you manage.',
                'Pindahkan kepemilikan atau hapus proyek yang Anda kelola.'
              )}
            </p>
          </div>
          {canManageProjects && (
            <button
              type='button'
              onClick={() => setIsCreateBoardOpen(true)}
              disabled={accountStatus === 'suspended'}
              className='flex items-center gap-2 justify-center bg-black dark:bg-white text-white dark:text-black hover:opacity-80 font-bold py-2.5 px-5 rounded-lg transition-opacity disabled:opacity-50 text-sm shadow-sm shrink-0'>
              <IconPlus className='w-4 h-4' />
              {tMsg('Create Project', 'Buat Proyek')}
            </button>
          )}
        </div>

        <div className='overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'>
          <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 flex-wrap gap-4'>
            <div className='flex items-center gap-4 flex-wrap'>
              {selectedBoards.length > 0 && (
                <button
                  onClick={() =>
                    triggerDelete(
                      manageBoards
                        .filter((b) => selectedBoards.includes(b.id))
                        .map((b) => ({
                          id: b.id,
                          name: b.name,
                        }))
                    )
                  }
                  className='text-[10px] font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm'>
                  <Icon name='trash' className='w-3.5 h-3.5 inline mr-1' />
                  {tMsg('Remove', 'Hapus')} ({selectedBoards.length})
                </button>
              )}
            </div>
            <div className='flex items-center gap-2 flex-wrap'>
              <div className='relative'>
                <Icon
                  name='search'
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none'
                />
                <input
                  type='text'
                  placeholder={tMsg('Search projects...', 'Cari proyek...')}
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className='w-full sm:w-56 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-neutral-400 outline-none text-xs font-medium'
                />
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className='py-2 px-3 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl outline-none text-xs font-bold'>
                <option value='all'>
                  {tMsg('All Projects', 'Semua Proyek')}
                </option>
                <option value='active'>{tMsg('Active', 'Aktif')}</option>
                <option value='suspended'>
                  {tMsg('Frozen Owner', 'Pemilik Beku')}
                </option>
                <option value='pending_deletion'>
                  {tMsg('Deleting Owner', 'Pemilik Dihapus')}
                </option>
                <option value='orphan'>{tMsg('Orphaned', 'Yatim')}</option>
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
              <div className='flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1'>
                <button
                  type='button'
                  onClick={() => setViewModePersist('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                      : 'text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={tMsg('List view', 'Tampilan daftar')}
                  aria-label={tMsg('List view', 'Tampilan daftar')}>
                  <Icon name='list' className='w-4 h-4' />
                </button>
                <button
                  type='button'
                  onClick={() => setViewModePersist('card')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                      : 'text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={tMsg('Card view', 'Tampilan kartu')}
                  aria-label={tMsg('Card view', 'Tampilan kartu')}>
                  <Icon name='layout-grid' className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>

          <div className='overflow-auto'>
            {isBoardsLoading ? (
              <div className='p-16 flex justify-center'>
                <LoadingSpinner />
              </div>
            ) : filteredBoards.length === 0 ? (
              <div className='p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs'>
                {tMsg('No projects found.', 'Tidak ada proyek ditemukan.')}
              </div>
            ) : viewMode === 'card' ? (
              <div className='p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                {paginatedBoards.map((b) => (
                  <div
                    key={b.id}
                    className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 flex flex-col gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors'>
                    <div className='flex items-start gap-3'>
                      <input
                        type='checkbox'
                        className='mt-1 cursor-pointer rounded border-neutral-300 dark:border-neutral-600'
                        checked={selectedBoards.includes(b.id)}
                        onChange={() => handleToggleSelectBoard(b.id)}
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2 flex-wrap mb-0.5'>
                          {b.project_number && (
                            <p className='text-[10px] font-bold uppercase tracking-wider text-neutral-400'>
                              <HighlightText
                                text={b.project_number}
                                query={projectSearchQuery}
                              />
                            </p>
                          )}
                          {b.client_code && (
                            <span className='text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50'>
                              <HighlightText
                                text={b.client_code}
                                query={projectSearchQuery}
                              />
                            </span>
                          )}
                        </div>
                        <h4 className='font-bold text-black dark:text-white truncate'>
                          <HighlightText
                            text={b.name}
                            query={projectSearchQuery}
                          />
                        </h4>
                        <p className='mt-1 text-sm text-neutral-500 truncate'>
                          @
                          <HighlightText
                            text={b.owner_username}
                            query={projectSearchQuery}
                          />
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center justify-between gap-2 pt-1'>
                      {ownerStatusBadge(b.owner_status)}
                      <div className='flex gap-2'>
                        {canManageProjects && (
                          <button
                            onClick={() => openEditBoard(b)}
                            disabled={accountStatus === 'suspended'}
                            className='p-2 rounded-lg text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-900/40! hover:text-white! hover:border-slate-700! dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-600! dark:hover:text-white! dark:hover:border-slate-600! transition-colors disabled:opacity-40'
                            title={tMsg('Edit', 'Ubah')}
                            aria-label={tMsg('Edit', 'Ubah')}>
                            <Icon name='pencil' className='w-3.5 h-3.5' />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setBoardToTransfer(b);
                            setNewOwnerInput('');
                          }}
                          className='p-2 rounded-lg text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-600! hover:text-white! hover:border-indigo-600! dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-500! dark:hover:text-white! dark:hover:border-indigo-500! transition-colors'
                          title={tMsg('Handover', 'Handover')}
                          aria-label={tMsg('Handover', 'Handover')}>
                          <Icon name='repeat' className='w-3.5 h-3.5' />
                        </button>
                        <button
                          onClick={() =>
                            triggerDelete([{ id: b.id, name: b.name }])
                          }
                          disabled={
                            b.owner_username !== currentUser &&
                            b.owner_username === 'admin'
                          }
                          className='p-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50 transition-all disabled:opacity-40'
                          title={tMsg('Remove', 'Hapus')}
                          aria-label={tMsg('Remove', 'Hapus')}>
                          <Icon name='trash' className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className='w-full min-w-3xl text-left border-collapse text-sm'>
                <thead className='bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10'>
                  <tr>
                    <th className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 w-10'>
                      <input
                        type='checkbox'
                        className='cursor-pointer rounded border-neutral-300 dark:border-neutral-600'
                        checked={
                          paginatedBoards.length > 0 &&
                          paginatedBoards.every((b) =>
                            selectedBoards.includes(b.id)
                          )
                        }
                        onChange={handleSelectAllBoards}
                      />
                    </th>
                    {isColVisible('project_number') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap'>
                        {tMsg('Job Number', 'Nomor Job')}
                      </th>
                    )}
                    {isColVisible('client_code') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap'>
                        {tMsg('Client Code', 'Kode Klien')}
                      </th>
                    )}
                    {isColVisible('name') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                        {tMsg('Project Name', 'Nama Proyek')}
                      </th>
                    )}
                    {isColVisible('created_by') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                        {tMsg('Project Requester', 'Project Requester')}
                      </th>
                    )}
                    {isColVisible('billing_type') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap'>
                        {tMsg('Billing Type', 'Tipe Penagihan')}
                      </th>
                    )}
                    {isColVisible('owner_status') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center'>
                        {tMsg('Owner Status', 'Status Pemilik')}
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
                  {paginatedBoards.map((b) => (
                    <tr
                      key={b.id}
                      className='hover:bg-white dark:hover:bg-neutral-950 transition-colors'>
                      <td className='px-6 py-4 whitespace-nowrap w-10'>
                        <input
                          type='checkbox'
                          className='cursor-pointer rounded border-neutral-300 dark:border-neutral-600'
                          checked={selectedBoards.includes(b.id)}
                          onChange={() => handleToggleSelectBoard(b.id)}
                        />
                      </td>
                      {isColVisible('project_number') && (
                        <td className='px-6 py-4 text-sm font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap'>
                          {b.project_number ? (
                            <HighlightText
                              text={b.project_number}
                              query={projectSearchQuery}
                            />
                          ) : (
                            <span className='text-neutral-300 dark:text-neutral-600'>
                              —
                            </span>
                          )}
                        </td>
                      )}
                      {isColVisible('client_code') && (
                        <td className='px-6 py-4 text-sm font-bold font-mono text-neutral-800 dark:text-neutral-200 whitespace-nowrap'>
                          {b.client_code ? (
                            <HighlightText
                              text={b.client_code}
                              query={projectSearchQuery}
                            />
                          ) : (
                            <span className='text-neutral-300 dark:text-neutral-600 font-normal'>
                              —
                            </span>
                          )}
                        </td>
                      )}
                      {isColVisible('name') && (
                        <td className='px-6 py-4 font-bold text-black dark:text-white text-sm whitespace-nowrap'>
                          <HighlightText
                            text={b.name}
                            query={projectSearchQuery}
                          />
                        </td>
                      )}
                      {isColVisible('created_by') && (
                        <td className='px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>
                          @
                          <HighlightText
                            text={b.owner_username}
                            query={projectSearchQuery}
                          />
                        </td>
                      )}
                      {isColVisible('billing_type') && (
                        <td className='px-6 py-4 text-sm font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap'>
                          {b.billing_type ? (
                            <HighlightText
                              text={b.billing_type}
                              query={projectSearchQuery}
                            />
                          ) : (
                            <span className='text-neutral-300 dark:text-neutral-600'>
                              —
                            </span>
                          )}
                        </td>
                      )}
                      {isColVisible('owner_status') && (
                        <td className='px-6 py-4 text-center whitespace-nowrap'>
                          {ownerStatusBadge(b.owner_status)}
                        </td>
                      )}
                      {isColVisible('actions') && (
                        <td className='px-6 py-4 text-right whitespace-nowrap'>
                          <div className='flex justify-end gap-2'>
                            {canManageProjects && (
                              <button
                                onClick={() => openEditBoard(b)}
                                disabled={accountStatus === 'suspended'}
                                className='flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-900/40! hover:text-white! hover:border-slate-700! dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-600! dark:hover:text-white! dark:hover:border-slate-600! px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40'>
                                <Icon name='pencil' className='w-3.5 h-3.5' />
                                {tMsg('Edit', 'Ubah')}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setBoardToTransfer(b);
                                setNewOwnerInput('');
                              }}
                              className='flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-600! hover:text-white! hover:border-indigo-600! dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-500! dark:hover:text-white! dark:hover:border-indigo-500! px-3 py-1.5 rounded-lg transition-colors'>
                              {tMsg('Handover', 'Handover')}
                            </button>
                            <button
                              onClick={() =>
                                triggerDelete([{ id: b.id, name: b.name }])
                              }
                              disabled={
                                b.owner_username !== currentUser &&
                                b.owner_username === 'admin'
                              }
                              className='flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50'>
                              <Icon name='trash' className='w-3.5 h-3.5' />
                              {tMsg('Remove', 'Hapus')}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredBoards.length > 0 && (
            <div className='px-4 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-widest'>
                  {tMsg('Show', 'Tampilkan')}
                </span>
                <select
                  value={projectsPerPage}
                  onChange={(e) => setProjectsPerPagePersist(e.target.value)}
                  className='py-1.5 px-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-xs font-bold'>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                  {tMsg(
                    `${rangeStart}–${rangeEnd} of ${filteredBoards.length}`,
                    `${rangeStart}–${rangeEnd} dari ${filteredBoards.length}`
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
      </div>

      {deleteConfirmOpen && (
        <div className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4'>
          <div className='bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center'>
            <h3 className='text-2xl font-black text-black dark:text-white mb-2 uppercase'>
              {tMsg('Delete Projects?', 'Hapus Proyek?')}
            </h3>
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-6'>
              {tMsg(
                'This permanently deletes selected projects and related tasks.',
                'Ini akan menghapus permanen proyek terpilih beserta tugas terkait.'
              )}
            </p>
            <div className='flex gap-4'>
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setBoardsToDelete([]);
                }}
                disabled={isDeletingBulk}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeletingBulk}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-red-500 hover:bg-red-600'>
                {isDeletingBulk
                  ? tMsg('Deleting...', 'Menghapus...')
                  : tMsg('Confirm Delete', 'Konfirmasi Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}

      {boardToEdit && (
        <div className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4'>
          <div className='bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl'>
            <h3 className='text-2xl font-black text-black dark:text-white mb-2 uppercase text-center'>
              {tMsg('Edit Project', 'Ubah Proyek')}
            </h3>
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-6 text-center'>
              {tMsg(
                'Update project number, name, and assigned client.',
                'Perbarui nomor proyek, nama proyek, dan klien terkait.'
              )}
            </p>
            <div className='mb-4 text-left'>
              <label className='block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider'>
                {tMsg('Client Name', 'Nama Klien')}
              </label>
              <div className='relative' ref={editClientDropdownRef}>
                <button
                  type='button'
                  onClick={() => setEditClientDropdownOpen((prev) => !prev)}
                  className='group flex w-full items-center justify-between gap-2 p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm font-bold transition-all cursor-pointer text-left'>
                  <span className={editForm.client_name ? 'text-black dark:text-white font-bold' : 'text-neutral-400 font-medium'}>
                    {editForm.client_name || `-- ${tMsg('No Client (None)', 'Tanpa Klien')} --`}
                  </span>
                  <Icon
                    name='chevron-down'
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      editClientDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {editClientDropdownOpen && (
                  <div className='absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl'>
                    {/* Search Input Box */}
                    <div className='p-2.5 border-b border-neutral-100 dark:border-neutral-800'>
                      <div className='relative'>
                        <Icon
                          name='search'
                          className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none'
                        />
                        <input
                          type='text'
                          value={editClientSearch}
                          onChange={(e) => setEditClientSearch(e.target.value)}
                          placeholder={tMsg('Search client...', 'Cari klien...')}
                          className='w-full pl-8 pr-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-neutral-300 dark:focus:border-neutral-700 outline-none text-xs font-semibold'
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className='p-1.5 max-h-56 overflow-y-auto space-y-0.5'>
                      <button
                        type='button'
                        onClick={() => {
                          setEditForm((prev) => ({ ...prev, client_name: '' }));
                          setEditClientDropdownOpen(false);
                          setEditClientSearch('');
                        }}
                        className='flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-left transition-colors'>
                        <span>-- {tMsg('No Client (None)', 'Tanpa Klien')} --</span>
                        {!editForm.client_name && (
                          <Icon name='check' className='w-3.5 h-3.5 text-neutral-400' />
                        )}
                      </button>

                      {filteredEditClients.length === 0 ? (
                        <div className='px-3 py-4 text-center text-xs text-neutral-400 italic'>
                          {tMsg('No clients found', 'Tidak ada klien ditemukan')}
                        </div>
                      ) : (
                        filteredEditClients.map((c) => {
                          const isSelected = editForm.client_name === c.client_name;
                          return (
                            <button
                              key={c.id || c.client_name}
                              type='button'
                              onClick={() => {
                                setEditForm((prev) => ({
                                  ...prev,
                                  client_name: c.client_name,
                                }));
                                setEditClientDropdownOpen(false);
                                setEditClientSearch('');
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-left transition-colors ${
                                isSelected
                                  ? 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white'
                                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                              }`}>
                              <span>
                                {c.client_name}{' '}
                                {c.client_code && (
                                  <span className='text-[10px] font-mono text-neutral-400'>
                                    ({c.client_code})
                                  </span>
                                )}
                              </span>
                              {isSelected && (
                                <Icon
                                  name='check'
                                  className='w-3.5 h-3.5 text-black dark:text-white'
                                />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className='mb-4 text-left'>
              <label className='block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider'>
                {tMsg('Job Number', 'Nomor Job')}
              </label>
              <input
                type='text'
                value={editForm.project_number}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    project_number: e.target.value,
                  }))
                }
                placeholder='Mirroring from JobBag'
                className='w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm font-bold placeholder-neutral-400 transition-all'
              />
            </div>
            <div className='mb-4 text-left'>
              <label className='block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider'>
                {tMsg('Project Name', 'Nama Proyek')}
              </label>
              <input
                type='text'
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder='Product Name - Campaign Name'
                className='w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm font-bold placeholder-neutral-400 transition-all'
                required
                autoFocus
              />
            </div>
            <div className='mb-6 text-left'>
              <label className='block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider'>
                {tMsg('Billing Type', 'Tipe Penagihan')}
              </label>
              <select
                value={editForm.billing_type || 'Billable'}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    billing_type: e.target.value,
                  }))
                }
                className='w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm font-bold transition-all cursor-pointer'>
                <option value='Billable'>Billable</option>
                <option value='Non - Billable'>Non - Billable</option>
              </select>
            </div>
            <div className='flex gap-4'>
              <button
                type='button'
                onClick={closeEditBoard}
                disabled={isSavingEdit}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900 disabled:opacity-50'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type='button'
                onClick={executeEditBoard}
                disabled={isSavingEdit || !editForm.name.trim()}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-black hover:opacity-80 dark:bg-white dark:text-black disabled:opacity-50'>
                {isSavingEdit
                  ? tMsg('Saving...', 'Menyimpan...')
                  : tMsg('Save Changes', 'Simpan Perubahan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {boardToTransfer && (
        <div className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4'>
          <div className='bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center'>
            <h3 className='text-2xl font-black text-black dark:text-white mb-2 uppercase'>
              {tMsg('Transfer Project', 'Pindahkan Proyek')}
            </h3>
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-6'>
              {tMsg('Select a new owner for ', 'Pilih pemilik baru untuk ')}
              <strong>{boardToTransfer.name}</strong>.
            </p>
            <select
              value={newOwnerInput}
              onChange={(e) => setNewOwnerInput(e.target.value)}
              className='w-full p-4 mb-6 bg-neutral-100 dark:bg-neutral-900 rounded-2xl text-xs font-bold outline-none'>
              <option value=''>
                -- {tMsg('Select User', 'Pilih Pengguna')} --
              </option>
              {transferCandidates.map((u) => (
                <option key={u.username} value={u.username}>
                  @{u.username}
                  {u.email ? ` (${u.email})` : ''}
                </option>
              ))}
            </select>
            <div className='flex gap-4'>
              <button
                onClick={() => {
                  setBoardToTransfer(null);
                  setNewOwnerInput('');
                }}
                disabled={isTransferring}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                onClick={() => {
                  if (!newOwnerInput) return;
                  setIsTransferring(true);
                  axios
                    .put(`/api/admin/boards/${boardToTransfer.id}/transfer`, {
                      new_owner: newOwnerInput,
                    })
                    .then((res) => {
                      setIsTransferring(false);
                      setBoardToTransfer(null);
                      setNewOwnerInput('');
                      showNotification?.(res.data.message, 'success');
                      loadBoards();
                      fetchBoards?.();
                    })
                    .catch((err) => {
                      setIsTransferring(false);
                      showNotification?.(
                        err.response?.data?.detail || 'Failed to transfer',
                        'error'
                      );
                    });
                }}
                disabled={isTransferring || !newOwnerInput}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50'>
                {isTransferring
                  ? tMsg('Transferring...', 'Memindahkan...')
                  : tMsg('Confirm Transfer', 'Konfirmasi Pindah')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
