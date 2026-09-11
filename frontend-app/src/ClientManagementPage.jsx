import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppContext } from './hooks/useAppContext';
import { HighlightText, LoadingSpinner } from './Utils';
import { IconPlus } from './SharedUI';
import { Icon } from './components/icons/Icon';
import { canManageClients } from './permissions';

const EMPTY_FORM = {
  client_code: '',
  client_name: '',
  status: 'active',
};

const CLIENT_COLUMN_STORAGE_KEY = 'innocean_client_visible_columns';
const DEFAULT_VISIBLE_COLUMNS = {
  client_code: true,
  client_name: true,
  created_by: true,
  status: true,
  actions: true,
};

const loadVisibleColumns = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_VISIBLE_COLUMNS };
  try {
    const saved = JSON.parse(
      localStorage.getItem(CLIENT_COLUMN_STORAGE_KEY) || '{}'
    );
    return { ...DEFAULT_VISIBLE_COLUMNS, ...saved };
  } catch {
    return { ...DEFAULT_VISIBLE_COLUMNS };
  }
};

export default function ClientManagementPage() {
  const {
    language,
    showNotification,
    accountStatus,
    workspaceRole,
    isSuperAdmin,
  } = useAppContext();
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const canManage =
    canManageClients(workspaceRole) || (!workspaceRole && isSuperAdmin);

  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClients, setSelectedClients] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientsToDelete, setClientsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(
        localStorage.getItem('innocean_client_manage_per_page')
      );
      if ([5, 10, 20, 50].includes(saved)) return saved;
    }
    return 5;
  });

  const setClientsPerPagePersist = (value) => {
    const next = Number(value);
    setClientsPerPage(next);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('innocean_client_manage_per_page', String(next));
    }
  };

  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef(null);

  const columnOptions = [
    { key: 'client_code', label: tMsg('Client Code', 'Kode Klien') },
    { key: 'client_name', label: tMsg('Client Name', 'Nama Klien') },
    { key: 'created_by', label: tMsg('Project Requester', 'Project Requester') },
    { key: 'status', label: tMsg('Status', 'Status') },
    { key: 'actions', label: tMsg('Actions', 'Tindakan') },
  ];

  const isColVisible = (key) => visibleColumns[key] !== false;
  const visibleDataCount = columnOptions.filter((col) =>
    isColVisible(col.key)
  ).length;

  const persistVisibleColumns = (next) => {
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLIENT_COLUMN_STORAGE_KEY, JSON.stringify(next));
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

  const loadClients = () => {
    setIsLoading(true);
    axios
      .get('/api/clients', { params: { include_inactive: true } })
      .then((res) => {
        setClients(res.data.clients || []);
        setSelectedClients([]);
        setIsLoading(false);
      })
      .catch(() => {
        showNotification?.(
          tMsg('Failed to load clients', 'Gagal memuat klien'),
          'error'
        );
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (canManage) loadClients();
    else setIsLoading(false);
  }, []);

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((c) => {
      const matchStatus =
        statusFilter === 'all' || (c.status || 'active') === statusFilter;
      const matchSearch =
        !q ||
        (c.client_code || '').toLowerCase().includes(q) ||
        (c.client_name || '').toLowerCase().includes(q) ||
        (c.created_by || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / clientsPerPage) || 1
  );

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * clientsPerPage;
    return filteredClients.slice(start, start + clientsPerPage);
  }, [filteredClients, currentPage, clientsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, clientsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const rangeStart =
    filteredClients.length === 0 ? 0 : (currentPage - 1) * clientsPerPage + 1;
  const rangeEnd = Math.min(
    currentPage * clientsPerPage,
    filteredClients.length
  );

  const handleToggleSelectClient = (id) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSelectAllClients = (e) => {
    if (e.target.checked) {
      setSelectedClients(paginatedClients.map((c) => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  const triggerDelete = (clientsArray) => {
    setClientsToDelete(clientsArray);
    setDeleteConfirmOpen(true);
  };

  const statusBadge = (status) => {
    if (status === 'inactive') {
      return (
        <span className='text-xs font-bold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-3 py-1 rounded-full'>
          {tMsg('Inactive', 'Nonaktif')}
        </span>
      );
    }
    return (
      <span className='text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full'>
        {tMsg('Active', 'Aktif')}
      </span>
    );
  };

  const openCreateForm = () => {
    setEditingClient(null);
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (client) => {
    setEditingClient(client);
    setFormData({
      client_code: client.client_code || '',
      client_name: client.client_name || '',
      status: client.status || 'active',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingClient(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = () => {
    const code = formData.client_code.trim();
    const name = formData.client_name.trim();
    if (!name) {
      showNotification?.(
        tMsg('Client name is required', 'Nama klien wajib diisi'),
        'error'
      );
      return;
    }

    const payload = {
      client_code: code || null,
      client_name: name,
      status: formData.status || 'active',
    };

    const previousClients = clients;

    if (editingClient) {
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? { ...c, ...payload } : c))
      );
    } else {
      const tempId = `temp-${Date.now()}`;
      setClients((prev) => [{ id: tempId, ...payload }, ...prev]);
    }
    closeForm();

    const request = editingClient
      ? axios.put(`/api/clients/${editingClient.id}`, payload)
      : axios.post('/api/clients', payload);

    request
      .then((res) => {
        showNotification?.(
          res.data.message ||
            tMsg('Client saved successfully', 'Klien berhasil disimpan'),
          'success'
        );
        loadClients();
      })
      .catch((err) => {
        setClients(previousClients);
        showNotification?.(
          err.response?.data?.detail ||
            tMsg('Failed to save client', 'Gagal menyimpan klien'),
          'error'
        );
      });
  };

  const executeDelete = () => {
    if (!clientsToDelete.length) return;
    const previousClients = clients;
    const deleteIds = new Set(clientsToDelete.map((c) => c.id));

    setClients((prev) => prev.filter((c) => !deleteIds.has(c.id)));
    setDeleteConfirmOpen(false);
    setClientsToDelete([]);
    setSelectedClients([]);

    const requests = clientsToDelete.map((c) =>
      axios.delete(`/api/clients/${c.id}`)
    );
    Promise.all(requests)
      .then(() => {
        showNotification?.(
          clientsToDelete.length > 1
            ? tMsg('Clients deleted successfully', 'Klien berhasil dihapus')
            : tMsg('Client deleted successfully', 'Klien berhasil dihapus'),
          'success'
        );
        loadClients();
      })
      .catch((err) => {
        setClients(previousClients);
        showNotification?.(
          err.response?.data?.detail ||
            tMsg('Failed to delete client', 'Gagal menghapus klien'),
          'error'
        );
      });
  };

  if (!canManage) {
    return (
      <div className='flex-1 overflow-auto p-4 sm:p-8'>
        <div className='mx-auto max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-8 text-center'>
          <h1 className='text-xl font-black text-black dark:text-white'>
            {tMsg('Access Denied', 'Akses Ditolak')}
          </h1>
          <p className='mt-2 text-sm text-neutral-500'>
            {tMsg(
              'Only Admin and Project Owner can manage clients.',
              'Hanya Admin dan Project Owner yang dapat mengelola klien.'
            )}
          </p>
        </div>
      </div>
    );
  }

  const deleteCount = clientsToDelete.length;
  const deleteLabel =
    deleteCount === 1
      ? clientsToDelete[0]?.client_name
      : tMsg(
          `${deleteCount} selected clients`,
          `${deleteCount} klien terpilih`
        );

  return (
    <div className='flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin relative'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='text-[10px] font-black uppercase tracking-widest text-neutral-400'>
              {tMsg('Clients', 'Klien')}
            </div>
            <h1 className='mt-1 text-2xl font-black text-black dark:text-white'>
              {tMsg('Client Management', 'Manajemen Klien')}
            </h1>
            <p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
              {tMsg(
                'Create and manage client directory for your workspace.',
                'Buat dan kelola direktori klien untuk workspace Anda.'
              )}
            </p>
          </div>
          <button
            type='button'
            onClick={openCreateForm}
            disabled={accountStatus === 'suspended'}
            className='flex items-center gap-2 justify-center bg-black dark:bg-white text-white dark:text-black hover:opacity-80 font-bold py-2.5 px-5 rounded-lg transition-opacity disabled:opacity-50 text-sm shadow-sm shrink-0'>
            <IconPlus className='w-4 h-4' />
            {tMsg('Create Client', 'Buat Klien')}
          </button>
        </div>

        <div className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'>
          <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 flex-wrap gap-4 rounded-t-2xl'>
            <div className='flex items-center gap-4 flex-wrap'>
              {selectedClients.length > 0 && (
                <button
                  type='button'
                  onClick={() =>
                    triggerDelete(
                      clients
                        .filter((c) => selectedClients.includes(c.id))
                        .map((c) => ({
                          id: c.id,
                          client_name: c.client_name,
                          client_code: c.client_code,
                        }))
                    )
                  }
                  className='text-[10px] font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm'>
                  <Icon name='trash' className='w-3.5 h-3.5 inline mr-1' />
                  {tMsg('Remove', 'Hapus')} ({selectedClients.length})
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
                  placeholder={tMsg('Search clients...', 'Cari klien...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full sm:w-56 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-neutral-400 outline-none text-xs font-medium'
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='py-2 px-3 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl outline-none text-xs font-bold'>
                <option value='all'>
                  {tMsg('All Status', 'Semua Status')}
                </option>
                <option value='active'>{tMsg('Active', 'Aktif')}</option>
                <option value='inactive'>{tMsg('Inactive', 'Nonaktif')}</option>
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
            {isLoading ? (
              <div className='p-16 flex justify-center'>
                <LoadingSpinner />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className='p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs'>
                {tMsg('No clients found.', 'Tidak ada klien ditemukan.')}
              </div>
            ) : (
              <table className='w-full text-left border-collapse text-sm'>
                <thead className='bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10'>
                  <tr>
                    <th className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 w-10'>
                      <input
                        type='checkbox'
                        className='cursor-pointer rounded border-neutral-300 dark:border-neutral-600'
                        checked={
                          paginatedClients.length > 0 &&
                          paginatedClients.every((c) =>
                            selectedClients.includes(c.id)
                          )
                        }
                        onChange={handleSelectAllClients}
                      />
                    </th>
                    {isColVisible('client_code') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                        {tMsg('Client Code', 'Kode Klien')}
                      </th>
                    )}
                    {isColVisible('client_name') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                        {tMsg('Client Name', 'Nama Klien')}
                      </th>
                    )}
                    {isColVisible('created_by') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                        {tMsg('Project Requester', 'Project Requester')}
                      </th>
                    )}
                    {isColVisible('status') && (
                      <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center'>
                        {tMsg('Status', 'Status')}
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
                  {paginatedClients.map((c) => (
                    <tr
                      key={c.id}
                      className='hover:bg-white dark:hover:bg-neutral-950 transition-colors'>
                      <td className='px-6 py-4 whitespace-nowrap w-10'>
                        <input
                          type='checkbox'
                          className='cursor-pointer rounded border-neutral-300 dark:border-neutral-600'
                          checked={selectedClients.includes(c.id)}
                          onChange={() => handleToggleSelectClient(c.id)}
                        />
                      </td>
                      {isColVisible('client_code') && (
                        <td className='px-6 py-4 font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap'>
                          {c.client_code ? (
                            <HighlightText
                              text={c.client_code}
                              query={searchQuery}
                            />
                          ) : (
                            <span className='text-neutral-300 dark:text-neutral-600 font-normal'>
                              —
                            </span>
                          )}
                        </td>
                      )}
                      {isColVisible('client_name') && (
                        <td className='px-6 py-4 font-bold text-black dark:text-white text-sm whitespace-nowrap'>
                          <HighlightText
                            text={c.client_name}
                            query={searchQuery}
                          />
                        </td>
                      )}
                      {isColVisible('created_by') && (
                        <td className='px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>
                          {c.created_by ? (
                            <>
                              @
                              <HighlightText
                                text={c.created_by}
                                query={searchQuery}
                              />
                            </>
                          ) : (
                            <span className='text-neutral-300 dark:text-neutral-600'>
                              —
                            </span>
                          )}
                        </td>
                      )}
                      {isColVisible('status') && (
                        <td className='px-6 py-4 text-center whitespace-nowrap'>
                          {statusBadge(c.status)}
                        </td>
                      )}
                      {isColVisible('actions') && (
                        <td className='px-6 py-4 text-right whitespace-nowrap'>
                          <div className='flex justify-end gap-2'>
                            <button
                              type='button'
                              onClick={() => openEditForm(c)}
                              className='flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50! hover:text-indigo-700! hover:border-indigo-300! dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-900/40! dark:hover:text-indigo-300! dark:hover:border-indigo-700! px-3 py-1.5 rounded-lg transition-colors'>
                              {tMsg('Edit', 'Ubah')}
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                triggerDelete([
                                  {
                                    id: c.id,
                                    client_name: c.client_name,
                                    client_code: c.client_code,
                                  },
                                ])
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

          {filteredClients.length > 0 && (
            <div className='px-4 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-2xl'>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-widest'>
                  {tMsg('Show', 'Tampilkan')}
                </span>
                <select
                  value={clientsPerPage}
                  onChange={(e) => setClientsPerPagePersist(e.target.value)}
                  className='py-1.5 px-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-xs font-bold'>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                  {tMsg(
                    `${rangeStart}–${rangeEnd} of ${filteredClients.length}`,
                    `${rangeStart}–${rangeEnd} dari ${filteredClients.length}`
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

      {formOpen && (
        <div className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4'>
          <div className='bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl'>
            <h3 className='text-2xl font-black text-black dark:text-white mb-2 uppercase text-center'>
              {editingClient
                ? tMsg('Edit Client', 'Ubah Klien')
                : tMsg('Create Client', 'Buat Klien')}
            </h3>
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-6 text-center'>
              {tMsg(
                'Fill in client name and status. Client code is optional.',
                'Isi nama klien dan status. Kode klien bersifat opsional.'
              )}
            </p>
            <div className='space-y-4 mb-6'>
              <div>
                <label className='block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'>
                  {tMsg('Client Code (optional)', 'Kode Klien (opsional)')}
                </label>
                <input
                  type='text'
                  value={formData.client_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_code: e.target.value,
                    }))
                  }
                  placeholder={tMsg('e.g. CLI-001', 'cth. CLI-001')}
                  className='w-full p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-sm font-medium outline-none text-black dark:text-white'
                />
              </div>
              <div>
                <label className='block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'>
                  {tMsg('Client Name', 'Nama Klien')}
                </label>
                <input
                  type='text'
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_name: e.target.value,
                    }))
                  }
                  placeholder={tMsg('e.g. Acme Corp', 'cth. Acme Corp')}
                  className='w-full p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-sm font-medium outline-none text-black dark:text-white'
                />
              </div>
              <div>
                <label className='block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'>
                  {tMsg('Status', 'Status')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className='w-full p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-sm font-bold outline-none text-black dark:text-white'>
                  <option value='active'>{tMsg('Active', 'Aktif')}</option>
                  <option value='inactive'>
                    {tMsg('Inactive', 'Nonaktif')}
                  </option>
                </select>
              </div>
            </div>
            <div className='flex gap-4'>
              <button
                type='button'
                onClick={closeForm}
                disabled={isSaving}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type='button'
                onClick={handleSave}
                disabled={isSaving}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-black dark:bg-white dark:text-black hover:opacity-80 disabled:opacity-50'>
                {isSaving
                  ? tMsg('Saving...', 'Menyimpan...')
                  : editingClient
                    ? tMsg('Save Changes', 'Simpan Perubahan')
                    : tMsg('Create', 'Buat')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && deleteCount > 0 && (
        <div className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4'>
          <div className='bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center'>
            <h3 className='text-2xl font-black text-black dark:text-white mb-2 uppercase'>
              {deleteCount > 1
                ? tMsg('Delete Clients?', 'Hapus Klien?')
                : tMsg('Delete Client?', 'Hapus Klien?')}
            </h3>
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-6'>
              {deleteCount > 1 ? (
                <>
                  {tMsg(
                    'This permanently deletes ',
                    'Ini akan menghapus permanen '
                  )}
                  <strong>{deleteLabel}</strong>.
                </>
              ) : (
                <>
                  {tMsg(
                    'This permanently deletes ',
                    'Ini akan menghapus permanen '
                  )}
                  <strong>{clientsToDelete[0].client_name}</strong>
                  {clientsToDelete[0].client_code
                    ? ` (${clientsToDelete[0].client_code})`
                    : ''}
                  .
                </>
              )}
            </p>
            <div className='flex gap-4'>
              <button
                type='button'
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setClientsToDelete([]);
                }}
                disabled={isDeleting}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type='button'
                onClick={executeDelete}
                disabled={isDeleting}
                className='flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-red-500 hover:bg-red-600'>
                {isDeleting
                  ? tMsg('Removing...', 'Menghapus...')
                  : tMsg('Confirm Remove', 'Konfirmasi Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
