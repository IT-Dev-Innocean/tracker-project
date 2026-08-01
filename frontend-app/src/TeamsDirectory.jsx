import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAppContext } from './hooks/useAppContext';
import { Avatar } from './SharedUI';
import { Icon } from './components/icons/Icon';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_PROJECT_OWNER, ROLE_STAFF } from './permissions';

export default function TeamsDirectory() {
  const {
    language,
    currentUser,
    workspaceRole,
    isSuperAdmin,
    showNotification,
    avatarsMap = {},
  } = useAppContext();
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const canManage =
    workspaceRole === ROLE_ADMIN ||
    workspaceRole === ROLE_PROJECT_OWNER ||
    isSuperAdmin;

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: ROLE_MANAGER,
  });
  const [isInviting, setIsInviting] = useState(false);
  const [menuUser, setMenuUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          err.response?.data?.detail || tMsg('Failed to load people', 'Gagal memuat daftar orang'),
          'error'
        );
        setLoading(false);
      });
  }, [canManage, showNotification, language]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (people || [])
      .filter((user) => {
        if (roleFilter !== 'all' && (user.role || 'project_owner') !== roleFilter) return false;
        if (statusFilter === 'active' && user.account_status !== 'active') return false;
        if (statusFilter === 'frozen' && user.account_status !== 'suspended') return false;
        if (statusFilter === 'unverified' && user.is_verified === 1) return false;
        if (!needle) return true;
        return [user.full_name, user.username, user.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      })
      .sort((a, b) =>
        String(a.full_name || a.username).localeCompare(String(b.full_name || b.username))
      );
  }, [people, query, roleFilter, statusFilter]);

  const roleBadge = (role) => {
    const map = {
      admin: {
        label: tMsg('Admin', 'Admin'),
        className:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      },
      project_owner: {
        label: tMsg('Owner', 'Owner'),
        className:
          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      },
      manager: {
        label: tMsg('Manager', 'Manager'),
        className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
      },
      staff: {
        label: tMsg('Staff', 'Staff'),
        className:
          'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      },
    };
    return map[role] || map.staff;
  };

  const statusLabel = (user) => {
    if (user.is_verified !== 1) return { text: tMsg('Unverified', 'Belum Verifikasi'), tone: 'muted' };
    if (user.account_status === 'suspended') return { text: tMsg('Frozen', 'Beku'), tone: 'cyan' };
    if (user.account_status === 'pending_deletion')
      return { text: tMsg('Deleting', 'Dihapus'), tone: 'red' };
    if (user.account_status === 'offboarding')
      return { text: tMsg('Offboarding', 'Keluar'), tone: 'purple' };
    return { text: tMsg('Active', 'Aktif'), tone: 'green' };
  };

  const handleInvite = (e) => {
    e.preventDefault();
    setIsInviting(true);
    axios
      .post('/api/teams/invite', inviteForm)
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
          role: ROLE_MANAGER,
        });
        setIsInviting(false);
        loadPeople();
      })
      .catch((err) => {
        setIsInviting(false);
        showNotification?.(err.response?.data?.detail || 'Invite failed', 'error');
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
        setMenuUser(null);
        loadPeople();
      })
      .catch((err) =>
        showNotification?.(err.response?.data?.detail || 'Failed to update status', 'error')
      );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    axios
      .post('/api/admin/users/delete', { username: confirmDelete, status: '' })
      .then((res) => {
        showNotification?.(res.data.message || `User @${confirmDelete} deleted`, 'success');
        setConfirmDelete(null);
        setIsDeleting(false);
        setMenuUser(null);
        loadPeople();
      })
      .catch((err) => {
        setIsDeleting(false);
        showNotification?.(err.response?.data?.detail || 'Failed to delete user', 'error');
      });
  };

  const exportCsv = () => {
    const rows = [
      ['username', 'full_name', 'email', 'role', 'status'],
      ...filtered.map((u) => [
        u.username,
        u.full_name || '',
        u.email || '',
        u.role || '',
        u.account_status || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
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
      <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin">
        <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center">
          <Icon name="lock" className="w-10 h-10 mx-auto mb-4 text-neutral-400" />
          <h1 className="text-xl font-black text-black dark:text-white">
            {tMsg('Access restricted', 'Akses dibatasi')}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
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
    <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin relative">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {tMsg('Teams', 'Tim')}
            </div>
            <h1 className="mt-1 text-2xl font-black text-black dark:text-white">
              {tMsg('All People', 'Semua Orang')}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {tMsg(
                'Invite, manage roles, and remove people across your workspace.',
                'Undang, kelola peran, dan hapus orang di seluruh workspace Anda.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tMsg('Search people…', 'Cari orang…')}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
            </div>
            <button
              onClick={exportCsv}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              {tMsg('Export', 'Ekspor')}
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              className="rounded-xl bg-black dark:bg-white px-4 py-2.5 text-sm font-bold text-white dark:text-black hover:opacity-90"
            >
              + {tMsg('Invite', 'Undang')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="all">{tMsg('All Roles', 'Semua Peran')}</option>
            <option value={ROLE_ADMIN}>{tMsg('Admin', 'Admin')}</option>
            <option value={ROLE_PROJECT_OWNER}>{tMsg('Project Owner', 'Project Owner')}</option>
            <option value={ROLE_MANAGER}>{tMsg('Manager', 'Manager')}</option>
            <option value={ROLE_STAFF}>{tMsg('Staff', 'Staff')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="all">{tMsg('All Status', 'Semua Status')}</option>
            <option value="active">{tMsg('Active', 'Aktif')}</option>
            <option value="frozen">{tMsg('Frozen', 'Beku')}</option>
            <option value="unverified">{tMsg('Unverified', 'Belum Verifikasi')}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">{tMsg('Name', 'Nama')}</th>
                <th className="px-4 py-3">{tMsg('Email', 'Email')}</th>
                <th className="px-4 py-3">{tMsg('Role', 'Peran')}</th>
                <th className="px-4 py-3">{tMsg('User Status', 'Status')}</th>
                <th className="px-4 py-3 text-right">{tMsg('Actions', 'Tindakan')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-neutral-400">
                    {tMsg('Loading…', 'Memuat…')}
                  </td>
                </tr>
              ) : (
                filtered.map((person) => {
                  const badge = roleBadge(person.role || 'project_owner');
                  const status = statusLabel(person);
                  const isSelf = person.username === currentUser;
                  const isRootAdmin = person.username === 'admin';
                  return (
                    <tr
                      key={person.username}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-800/70 dark:hover:bg-neutral-900/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={person.username}
                            url={avatarsMap[person.username] || person.avatar}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-black dark:text-white">
                              {person.full_name || person.username}
                              {isSelf ? (
                                <span className="ml-2 text-[10px] font-bold uppercase text-neutral-400">
                                  {tMsg('You', 'Anda')}
                                </span>
                              ) : null}
                            </div>
                            <div className="truncate text-xs text-neutral-500">
                              @{person.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                        {person.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {status.text}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        {!isSelf && !isRootAdmin ? (
                          <button
                            onClick={() =>
                              setMenuUser(menuUser === person.username ? null : person.username)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title={tMsg('Actions', 'Tindakan')}
                          >
                            <Icon name="more-horizontal" className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                        {menuUser === person.username && (
                          <div className="absolute right-4 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950 text-left">
                            {person.account_status === 'suspended' ? (
                              <button
                                onClick={() => handleFreeze(person.username, false)}
                                className="block w-full px-3 py-2 text-left text-sm text-cyan-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                              >
                                {tMsg('Unfreeze', 'Cairkan')}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFreeze(person.username, true)}
                                className="block w-full px-3 py-2 text-left text-sm text-cyan-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                              >
                                {tMsg('Freeze', 'Bekukan')}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setConfirmDelete(person.username);
                                setMenuUser(null);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              {tMsg('Delete', 'Hapus')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-neutral-400">
                    {tMsg('No people found.', 'Tidak ada orang ditemukan.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleInvite}
            className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <h3 className="text-xl font-black text-black dark:text-white mb-1">
              {tMsg('Invite Person', 'Undang Orang')}
            </h3>
            <p className="text-sm text-neutral-500 mb-5">
              {tMsg(
                'Create a workspace account and send login details.',
                'Buat akun workspace dan kirim detail login.'
              )}
            </p>
            <div className="space-y-3">
              <input
                required
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@innocean.co.id"
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 text-sm outline-none"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 text-sm font-bold outline-none"
              >
                <option value={ROLE_PROJECT_OWNER}>{tMsg('Project Owner', 'Project Owner')}</option>
                <option value={ROLE_MANAGER}>{tMsg('Manager', 'Manager')}</option>
                <option value={ROLE_STAFF}>{tMsg('Staff', 'Staff')}</option>
                {(workspaceRole === ROLE_ADMIN || isSuperAdmin) && (
                  <option value={ROLE_ADMIN}>{tMsg('Admin', 'Admin')}</option>
                )}
              </select>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="flex-1 rounded-full bg-neutral-100 dark:bg-neutral-900 py-3 text-xs font-bold uppercase"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="flex-1 rounded-full bg-black dark:bg-white py-3 text-xs font-bold uppercase text-white dark:text-black disabled:opacity-50"
              >
                {isInviting ? tMsg('Inviting…', 'Mengundang…') : tMsg('Send Invite', 'Kirim Undangan')}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-xl font-black text-black dark:text-white mb-2">
              {tMsg('Delete User?', 'Hapus Pengguna?')}
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              {tMsg('Permanently remove', 'Hapus permanen')}{' '}
              <strong>@{confirmDelete}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full bg-neutral-100 dark:bg-neutral-900 py-3 text-xs font-bold uppercase"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-red-500 py-3 text-xs font-bold uppercase text-white disabled:opacity-50"
              >
                {isDeleting ? tMsg('Deleting…', 'Menghapus…') : tMsg('Delete', 'Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
