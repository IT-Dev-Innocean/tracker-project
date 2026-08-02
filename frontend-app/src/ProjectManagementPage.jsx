import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAppContext } from './hooks/useAppContext';
import { HighlightText, LoadingSpinner } from './Utils';
import { Icon } from './components/icons/Icon';
import { excludeTodoListBoards } from './utils/boards';

export default function ProjectManagementPage() {
  const {
    language,
    showNotification,
    userDirectory = [],
    currentUser,
    fetchBoards,
  } = useAppContext();
  const tMsg = (en, id) => (language === 'id' ? id : en);

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

  const ownerStatusBadge = (status) => {
    if (status === 'orphan') {
      return (
        <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full">
          {tMsg('Orphaned', 'Yatim')}
        </span>
      );
    }
    if (status === 'pending_deletion') {
      return (
        <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full">
          {tMsg('Owner Deleting', 'Pemilik Dihapus')}
        </span>
      );
    }
    if (status === 'suspended') {
      return (
        <span className="text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-3 py-1 rounded-full">
          {tMsg('Owner Frozen', 'Pemilik Beku')}
        </span>
      );
    }
    return (
      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full">
        {tMsg('Active', 'Aktif')}
      </span>
    );
  };

  const loadBoards = () => {
    setIsBoardsLoading(true);
    setSelectedBoards([]);
    axios
      .get('/api/admin/boards')
      .then((res) => {
        setManageBoards(excludeTodoListBoards(res.data.boards || []));
        setIsBoardsLoading(false);
      })
      .catch(() => {
        showNotification?.(tMsg('Failed to load projects', 'Gagal memuat proyek'), 'error');
        setIsBoardsLoading(false);
      });
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const filteredBoards = useMemo(() => {
    return manageBoards.filter((b) => {
      const matchFilter = projectFilter === 'all' || b.owner_status === projectFilter;
      const matchSearch =
        b.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        b.owner_username.toLowerCase().includes(projectSearchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [manageBoards, projectFilter, projectSearchQuery]);

  const transferCandidates = useMemo(() => {
    const names = new Set();
    const list = [];
    (userDirectory || []).forEach((u) => {
      if (!u?.username || names.has(u.username)) return;
      if (boardToTransfer && u.username === boardToTransfer.owner_username) return;
      names.add(u.username);
      list.push(u);
    });
    return list.sort((a, b) =>
      String(a.username).localeCompare(String(b.username))
    );
  }, [userDirectory, boardToTransfer]);

  const handleToggleSelectBoard = (id) => {
    setSelectedBoards((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const handleSelectAllBoards = (e) => {
    if (e.target.checked) {
      setSelectedBoards(filteredBoards.map((b) => b.id));
    } else {
      setSelectedBoards([]);
    }
  };

  const triggerDelete = (boardsArray) => {
    setBoardsToDelete(boardsArray);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    setIsDeletingBulk(true);
    const requests = boardsToDelete.map((b) => axios.delete(`/api/boards/${b.id}`));
    Promise.all(requests)
      .then(() => {
        showNotification?.(tMsg('Project(s) deleted successfully', 'Proyek berhasil dihapus'), 'success');
        setSelectedBoards([]);
        setBoardsToDelete([]);
        setDeleteConfirmOpen(false);
        setIsDeletingBulk(false);
        loadBoards();
        fetchBoards?.();
      })
      .catch(() => {
        showNotification?.(tMsg('Failed to delete some projects', 'Gagal menghapus beberapa proyek'), 'error');
        setIsDeletingBulk(false);
      });
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin relative">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {tMsg('Projects', 'Proyek')}
            </div>
            <h1 className="mt-1 text-2xl font-black text-black dark:text-white">
              {tMsg('Project Management', 'Manajemen Proyek')}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {tMsg(
                'Transfer ownership or delete projects you manage.',
                'Pindahkan kepemilikan atau hapus proyek yang Anda kelola.'
              )}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h3 className="font-bold text-black dark:text-white text-sm uppercase tracking-wider">
                {tMsg('Project Directory', 'Direktori Proyek')}
              </h3>
              {selectedBoards.length > 0 && (
                <button
                  onClick={() =>
                    triggerDelete(
                      manageBoards.filter((b) => selectedBoards.includes(b.id)).map((b) => ({
                        id: b.id,
                        name: b.name,
                      }))
                    )
                  }
                  className="text-[10px] font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm"
                >
                  <Icon name="trash" className="w-3.5 h-3.5 inline mr-1" />
                  {tMsg('Delete', 'Hapus')} ({selectedBoards.length})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder={tMsg('Search projects...', 'Cari proyek...')}
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full sm:w-56 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-neutral-400 outline-none text-xs font-medium"
                />
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="py-2 px-3 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl outline-none text-xs font-bold"
              >
                <option value="all">{tMsg('All Projects', 'Semua Proyek')}</option>
                <option value="active">{tMsg('Active', 'Aktif')}</option>
                <option value="suspended">{tMsg('Frozen Owner', 'Pemilik Beku')}</option>
                <option value="pending_deletion">{tMsg('Deleting Owner', 'Pemilik Dihapus')}</option>
                <option value="orphan">{tMsg('Orphaned', 'Yatim')}</option>
              </select>
              <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1">
                <button
                  type="button"
                  onClick={() => setViewModePersist('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                      : 'text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={tMsg('List view', 'Tampilan daftar')}
                  aria-label={tMsg('List view', 'Tampilan daftar')}
                >
                  <Icon name="list" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewModePersist('card')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                      : 'text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={tMsg('Card view', 'Tampilan kartu')}
                  aria-label={tMsg('Card view', 'Tampilan kartu')}
                >
                  <Icon name="layout-grid" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-auto">
            {isBoardsLoading ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredBoards.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">
                {tMsg('No projects found.', 'Tidak ada proyek ditemukan.')}
              </div>
            ) : viewMode === 'card' ? (
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBoards.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 flex flex-col gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                        checked={selectedBoards.includes(b.id)}
                        onChange={() => handleToggleSelectBoard(b.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          ID {b.id}
                        </div>
                        <h4 className="mt-0.5 font-bold text-black dark:text-white truncate">
                          <HighlightText text={b.name} query={projectSearchQuery} />
                        </h4>
                        <p className="mt-1 text-sm text-neutral-500 truncate">
                          @
                          <HighlightText text={b.owner_username} query={projectSearchQuery} />
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {ownerStatusBadge(b.owner_status)}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBoardToTransfer(b);
                            setNewOwnerInput('');
                          }}
                          className="p-2 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-500 hover:text-white dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 transition-all"
                          title={tMsg('Transfer', 'Pindah')}
                          aria-label={tMsg('Transfer', 'Pindah')}
                        >
                          <Icon name="repeat" className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete([{ id: b.id, name: b.name }])}
                          disabled={b.owner_username !== currentUser && b.owner_username === 'admin'}
                          className="p-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50 transition-all disabled:opacity-40"
                          title={tMsg('Delete', 'Hapus')}
                          aria-label={tMsg('Delete', 'Hapus')}
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[720px] text-left border-collapse text-sm">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 w-10">
                      <input
                        type="checkbox"
                        className="cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                        checked={
                          filteredBoards.length > 0 &&
                          selectedBoards.length === filteredBoards.length
                        }
                        onChange={handleSelectAllBoards}
                      />
                    </th>
                    <th className="px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700">
                      ID
                    </th>
                    <th className="px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700">
                      {tMsg('Project Name', 'Nama Proyek')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700">
                      {tMsg('Owner', 'Pemilik')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center">
                      {tMsg('Owner Status', 'Status Pemilik')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-right">
                      {tMsg('Actions', 'Tindakan')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredBoards.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-white dark:hover:bg-neutral-950 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-10">
                        <input
                          type="checkbox"
                          className="cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                          checked={selectedBoards.includes(b.id)}
                          onChange={() => handleToggleSelectBoard(b.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-neutral-500 text-sm whitespace-nowrap">
                        {b.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-black dark:text-white text-sm whitespace-nowrap">
                        <HighlightText text={b.name} query={projectSearchQuery} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        @
                        <HighlightText text={b.owner_username} query={projectSearchQuery} />
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {ownerStatusBadge(b.owner_status)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setBoardToTransfer(b);
                              setNewOwnerInput('');
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-500 hover:text-white dark:bg-indigo-900/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg transition-all border border-indigo-200 dark:border-indigo-800/50"
                          >
                            {tMsg('Transfer', 'Pindah')}
                          </button>
                          <button
                            onClick={() => triggerDelete([{ id: b.id, name: b.name }])}
                            disabled={b.owner_username !== currentUser && b.owner_username === 'admin'}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50"
                          >
                            <Icon name="trash" className="w-3.5 h-3.5" />
                            {tMsg('Delete', 'Hapus')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center">
            <h3 className="text-2xl font-black text-black dark:text-white mb-2 uppercase">
              {tMsg('Delete Projects?', 'Hapus Proyek?')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
              {tMsg(
                'This permanently deletes selected projects and related tasks.',
                'Ini akan menghapus permanen proyek terpilih beserta tugas terkait.'
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setBoardsToDelete([]);
                }}
                disabled={isDeletingBulk}
                className="flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeletingBulk}
                className="flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-red-500 hover:bg-red-600"
              >
                {isDeletingBulk
                  ? tMsg('Deleting...', 'Menghapus...')
                  : tMsg('Confirm Delete', 'Konfirmasi Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}

      {boardToTransfer && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center">
            <h3 className="text-2xl font-black text-black dark:text-white mb-2 uppercase">
              {tMsg('Transfer Project', 'Pindahkan Proyek')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
              {tMsg('Select a new owner for ', 'Pilih pemilik baru untuk ')}
              <strong>{boardToTransfer.name}</strong>.
            </p>
            <select
              value={newOwnerInput}
              onChange={(e) => setNewOwnerInput(e.target.value)}
              className="w-full p-4 mb-6 bg-neutral-100 dark:bg-neutral-900 rounded-2xl text-xs font-bold outline-none"
            >
              <option value="">-- {tMsg('Select User', 'Pilih Pengguna')} --</option>
              {transferCandidates.map((u) => (
                <option key={u.username} value={u.username}>
                  @{u.username}
                  {u.email ? ` (${u.email})` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setBoardToTransfer(null);
                  setNewOwnerInput('');
                }}
                disabled={isTransferring}
                className="flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase bg-neutral-100 dark:bg-neutral-900"
              >
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
                className="flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50"
              >
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
