import { useEffect, useMemo, useState } from 'react';
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClients = () => {
    setIsLoading(true);
    axios
      .get('/api/clients')
      .then((res) => {
        setClients(res.data.clients || []);
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
        (c.client_name || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, searchQuery, statusFilter]);

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
    if (!code || !name) {
      showNotification?.(
        tMsg(
          'Client code and name are required',
          'Kode dan nama klien wajib diisi'
        ),
        'error'
      );
      return;
    }

    setIsSaving(true);
    const payload = {
      client_code: code,
      client_name: name,
      status: formData.status || 'active',
    };

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
        setIsSaving(false);
        closeForm();
        loadClients();
      })
      .catch((err) => {
        setIsSaving(false);
        showNotification?.(
          err.response?.data?.detail ||
            tMsg('Failed to save client', 'Gagal menyimpan klien'),
          'error'
        );
      });
  };

  const executeDelete = () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    axios
      .delete(`/api/clients/${clientToDelete.id}`)
      .then((res) => {
        showNotification?.(
          res.data.message ||
            tMsg('Client deleted successfully', 'Klien berhasil dihapus'),
          'success'
        );
        setIsDeleting(false);
        setDeleteConfirmOpen(false);
        setClientToDelete(null);
        loadClients();
      })
      .catch((err) => {
        setIsDeleting(false);
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

        <div className='overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'>
          <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 flex-wrap gap-4'>
            <h3 className='font-bold text-black dark:text-white text-sm uppercase tracking-wider'>
              {tMsg('Client Directory', 'Direktori Klien')}
            </h3>
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
              <table className='w-full min-w-3xl text-left border-collapse text-sm'>
                <thead className='bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10'>
                  <tr>
                    <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                      {tMsg('Client Code', 'Kode Klien')}
                    </th>
                    <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                      {tMsg('Client Name', 'Nama Klien')}
                    </th>
                    <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center'>
                      {tMsg('Status', 'Status')}
                    </th>
                    <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-right'>
                      {tMsg('Actions', 'Tindakan')}
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                  {filteredClients.map((c) => (
                    <tr
                      key={c.id}
                      className='hover:bg-white dark:hover:bg-neutral-950 transition-colors'>
                      <td className='px-6 py-4 font-bold text-black dark:text-white text-sm whitespace-nowrap'>
                        <HighlightText
                          text={c.client_code}
                          query={searchQuery}
                        />
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>
                        <HighlightText
                          text={c.client_name}
                          query={searchQuery}
                        />
                      </td>
                      <td className='px-6 py-4 text-center whitespace-nowrap'>
                        {statusBadge(c.status)}
                      </td>
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
                            onClick={() => {
                              setClientToDelete(c);
                              setDeleteConfirmOpen(true);
                            }}
                            className='flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50'>
                            <Icon name='trash' className='w-3.5 h-3.5' />
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
                'Fill in client code, name, and status.',
                'Isi kode klien, nama, dan status.'
              )}
            </p>
            <div className='space-y-4 mb-6'>
              <div>
                <label className='block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'>
                  {tMsg('Client Code', 'Kode Klien')}
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

      {deleteConfirmOpen && clientToDelete && (
        <div className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4'>
          <div className='bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center'>
            <h3 className='text-2xl font-black text-black dark:text-white mb-2 uppercase'>
              {tMsg('Delete Client?', 'Hapus Klien?')}
            </h3>
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-6'>
              {tMsg(
                'This permanently deletes ',
                'Ini akan menghapus permanen '
              )}
              <strong>{clientToDelete.client_name}</strong> (
              {clientToDelete.client_code}).
            </p>
            <div className='flex gap-4'>
              <button
                type='button'
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setClientToDelete(null);
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
                  ? tMsg('Deleting...', 'Menghapus...')
                  : tMsg('Confirm Delete', 'Konfirmasi Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
