import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCloseAnimation, HighlightText, LoadingSpinner } from './Utils';

export default function AdminModal({
  setIsAdminModalOpen,
  adminUsers,
  handleDeleteUser,
  handleUpdateUserStatus,
  handleToggleSuperAdmin,
  handleManualVerify,
  currentUser,
  language,
  showNotification,
  setAdminUsers,
}) {
  const [userToProcess, setUserToProcess] = useState(null);
  const [processAction, setProcessAction] = useState('schedule');
  const [confirmText, setConfirmText] = useState('');
  const [offboardDate, setOffboardDate] = useState('');
  const [showDeleteChoice, setShowDeleteChoice] = useState(false);
  const [deleteChoiceUser, setDeleteChoiceUser] = useState(null);
  const [isClosing, close] = useCloseAnimation(() => setIsAdminModalOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkUserConfirmOpen, setBulkUserConfirmOpen] = useState(false);
  const [bulkUserActionType, setBulkUserActionType] = useState('purge');
  const [isProcessingBulkUsers, setIsProcessingBulkUsers] = useState(false);

  const [approverModalOpen, setApproverModalOpen] = useState(false);
  const [approverTargetUser, setApproverTargetUser] = useState(null);
  const [approverInput, setApproverInput] = useState('');
  const [isSettingApprover, setIsSettingApprover] = useState(false);

  const executeSetApprover = async () => {
    if (!approverTargetUser) return;
    setIsSettingApprover(true);
    try {
      const token = localStorage.getItem('innocean_token');
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/users/approver`, { username: approverTargetUser, status: approverInput }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(res.data.message, 'success');
      const usersRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setAdminUsers(usersRes.data.users);
      setApproverModalOpen(false);
      setIsSettingApprover(false);
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to update approver', 'error');
      setIsSettingApprover(false);
    }
  };

  const [activeTab, setActiveTab] = useState('users');
  const [adminBoards, setAdminBoards] = useState([]);
  const [isBoardsLoading, setIsBoardsLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [boardsToDelete, setBoardsToDelete] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [boardToTransfer, setBoardToTransfer] = useState(null);
  const [newOwnerInput, setNewOwnerInput] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [configData, setConfigData] = useState({
    database_url: '',
    secret_key: '',
    google_calendar_api_key: '',
    smtp_server: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    gemini_api_key: '',
    groq_api_key: '',
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [showPass, setShowPass] = useState({
    db: false,
    jwt: false,
    cal: false,
    smtp: false,
    gemini: false,
    groq: false,
  });
  const togglePass = (key, val) => setShowPass((prev) => ({ ...prev, [key]: val }));

  const [isSudoVerified, setIsSudoVerified] = useState(false);
  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [isSudoLoading, setIsSudoLoading] = useState(false);
  const [showSudoPass, setShowSudoPass] = useState(false);

  const filteredUsers = adminUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const filteredAdminBoards = adminBoards.filter((b) => {
    const matchFilter = projectFilter === 'all' || b.owner_status === projectFilter;
    const matchSearch =
      b.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      b.owner_username.toLowerCase().includes(projectSearchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleToggleSelectUser = (username) => {
    if (username === 'admin') return;
    setSelectedUsers((prev) => (prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]));
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.filter((u) => u.username !== 'admin').map((u) => u.username));
    } else {
      setSelectedUsers([]);
    }
  };

  const executeBulkUserAction = () => {
    setIsProcessingBulkUsers(true);
    const requests = selectedUsers.map((username) => {
      if (bulkUserActionType === 'purge') {
        return axios.post('/api/admin/users/delete', { username, status: '' });
      } else {
        return axios.put('/api/admin/users/verify', { username, status: '' });
      }
    });

    Promise.allSettled(requests).then(() => {
      if (showNotification) showNotification(tMsg('Bulk action completed', 'Aksi massal selesai'), 'success');
      setSelectedUsers([]);
      setBulkUserConfirmOpen(false);
      setIsProcessingBulkUsers(false);
      if (setAdminUsers) {
        axios.get('/api/admin/users').then((res) => setAdminUsers(res.data.users || []));
      }
    });
  };

  const handleConfigTabClick = () => {
    if (isSudoVerified) {
      setActiveTab('config');
    } else {
      setShowSudoModal(true);
    }
  };

  const handleSudoSubmit = (e) => {
    e.preventDefault();
    if (!sudoPassword) return;
    setIsSudoLoading(true);
    axios
      .post('/api/admin/verify-sudo', { password: sudoPassword })
      .then(() => {
        setIsSudoLoading(false);
        setIsSudoVerified(true);
        setShowSudoModal(false);
        setSudoPassword('');
        setActiveTab('config');
      })
      .catch((err) => {
        setIsSudoLoading(false);
        if (showNotification)
          showNotification(err.response?.data?.detail || tMsg('Incorrect password.', 'Kata sandi salah.'), 'error');
      });
  };

  const handleProjectsTabClick = () => {
    setActiveTab('projects');
    setIsBoardsLoading(true);
    setSelectedBoards([]);
    axios
      .get('/api/admin/boards')
      .then((res) => {
        setAdminBoards(res.data.boards || []);
        setIsBoardsLoading(false);
      })
      .catch((err) => {
        if (showNotification) showNotification(tMsg('Failed to load projects', 'Gagal memuat proyek'), 'error');
        setIsBoardsLoading(false);
      });
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
        if (showNotification)
          showNotification(tMsg('Project(s) deleted successfully', 'Proyek berhasil dihapus'), 'success');
        setSelectedBoards([]);
        setBoardsToDelete([]);
        setDeleteConfirmOpen(false);
        setIsDeletingBulk(false);
        handleProjectsTabClick(); // refresh
      })
      .catch((err) => {
        if (showNotification)
          showNotification(tMsg('Failed to delete some projects', 'Gagal menghapus beberapa proyek'), 'error');
        setIsDeletingBulk(false);
      });
  };

  const handleAdminDeleteBoard = (boardId, boardName) => {
    triggerDelete([{ id: boardId, name: boardName }]);
  };

  const handleToggleSelectBoard = (id) => {
    setSelectedBoards((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const handleSelectAllBoards = (e) => {
    if (e.target.checked) {
      setSelectedBoards(filteredAdminBoards.map((b) => b.id));
    } else {
      setSelectedBoards([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'config' && currentUser === 'admin') {
      setIsConfigLoading(true);
      axios
        .get('/api/admin/config')
        .then((res) => {
          setConfigData(res.data);
          setIsConfigLoading(false);
        })
        .catch((err) => {
          if (showNotification)
            showNotification(tMsg('Failed to load configuration', 'Gagal memuat konfigurasi'), 'error');
          setIsConfigLoading(false);
        });
    }
  }, [activeTab, currentUser]);

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    setIsConfigLoading(true);
    axios
      .put('/api/admin/config', configData)
      .then((res) => {
        if (showNotification) showNotification(res.data.message, 'success');
        setIsConfigLoading(false);
      })
      .catch((err) => {
        if (showNotification)
          showNotification(
            err.response?.data?.detail || tMsg('Failed to save configuration', 'Gagal menyimpan konfigurasi'),
            'error'
          );
        setIsConfigLoading(false);
      });
  };

  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[80] p-2 sm:p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-4 sm:p-6 lg:p-8 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-[95vw] max-w-7xl max-h-[90vh] flex flex-col relative overflow-hidden ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="flex justify-between items-center mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-black dark:text-white flex items-center gap-3 tracking-tight">
              {tMsg('Admin Dashboard', 'Dasbor Admin')}
            </h2>
            <div className="flex items-center gap-4 mt-4 border-b border-neutral-200 dark:border-neutral-800 pb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-2 text-base font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {tMsg('User Management', 'Manajemen Pengguna')}
              </button>
              {currentUser === 'admin' && (
                <button
                  onClick={handleConfigTabClick}
                  className={`pb-2 text-base font-medium transition-colors ${
                    activeTab === 'config'
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {tMsg('System Configuration', 'Konfigurasi Sistem')}
                </button>
              )}
              <button
                onClick={handleProjectsTabClick}
                className={`pb-2 text-base font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {tMsg('Project Management', 'Manajemen Proyek')}
              </button>
              <button
                onClick={() => setActiveTab('approvers')}
                className={`pb-2 text-base font-medium transition-colors ${
                  activeTab === 'approvers'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {tMsg('Approver Management', 'Manajemen Penyetuju')}
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'users' ? (
          <div className="flex-1 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm bg-neutral-50 dark:bg-neutral-900 relative">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 shrink-0 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-black dark:text-white text-sm uppercase tracking-wider">
                  {tMsg('User Directory', 'Direktori Pengguna')}
                </h3>
                {selectedUsers.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setBulkUserActionType('verify');
                        setBulkUserConfirmOpen(true);
                      }}
                      className="text-[10px] font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      ✅ {tMsg('Verify', 'Verifikasi')} ({selectedUsers.length})
                    </button>
                    <button
                      onClick={() => {
                        setBulkUserActionType('purge');
                        setBulkUserConfirmOpen(true);
                      }}
                      className="text-[10px] font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm"
                    >
                      💥 {tMsg('Purge', 'Bersihkan')} ({selectedUsers.length})
                    </button>
                  </div>
                )}
              </div>
              <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder={tMsg('Search users...', 'Cari pengguna...')}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-xs font-medium transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 w-10">
                      <input
                        type="checkbox"
                        className="cursor-pointer rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500"
                        checked={
                          filteredUsers.filter((u) => u.username !== 'admin').length > 0 &&
                          selectedUsers.length === filteredUsers.filter((u) => u.username !== 'admin').length
                        }
                        onChange={handleSelectAllUsers}
                      />
                    </th>
                    <th className="px-6 py-4 font-bold text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                      {tMsg('Username', 'Nama Pengguna')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                      {tMsg('Full Name', 'Nama Lengkap')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                      Email
                    </th>
                    <th className="px-6 py-4 font-bold text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 text-center">
                      {tMsg('Role', 'Peran')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 text-center">
                      {tMsg('Status', 'Status')}
                    </th>
                    <th className="px-6 py-4 font-bold text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 text-right">
                      {tMsg('Actions', 'Tindakan')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.username} className="hover:bg-white dark:hover:bg-neutral-950 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap w-10">
                        {u.username !== 'admin' && (
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedUsers.includes(u.username)}
                            onChange={() => handleToggleSelectUser(u.username)}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-black dark:text-white text-sm whitespace-nowrap">
                        @<HighlightText text={u.username} query={userSearchQuery} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        <div><HighlightText text={u.full_name || '-'} query={userSearchQuery} /></div>
                        {(() => {
                          const approves = adminUsers.filter(usr => usr.timesheet_approver === u.username).map(usr => `@${usr.username}`);
                          if (approves.length > 0) {
                            return (
                              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/30 w-max" title={`Approves timesheets for: ${approves.join(', ')}`}>
                                🎯 {tMsg('Approves', 'Menyetujui')}: {approves.join(', ')}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        <HighlightText text={u.email} query={userSearchQuery} />
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {u.is_superadmin === 1 ? (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50 shadow-sm flex items-center justify-center gap-1.5 w-max mx-auto">
                            👑 {tMsg('Admin', 'Admin')}
                          </span>
                        ) : (
                          <span className="text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-1.5 w-max mx-auto">
                            👤 {tMsg('User', 'User')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.is_verified === 1 ? (
                          u.account_status === 'suspended' ? (
                            <span className="text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800/50 shadow-sm w-max mx-auto block">
                              {tMsg('Frozen', 'Beku')}
                            </span>
                          ) : u.account_status === 'pending_deletion' ? (
                            <span
                              className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full border border-red-200 dark:border-red-800/50 shadow-sm cursor-help w-max mx-auto block"
                              title={`Permanent deletion on ${u.deletion_date}`}
                            >
                              {tMsg('Deleting Soon', 'Segera Dihapus')}
                            </span>
                          ) : u.account_status === 'offboarding' ? (
                            <span
                              className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/50 shadow-sm cursor-help w-max mx-auto block"
                              title={`Account will be disabled on: ${u.deletion_date}`}
                            >
                              {tMsg('Offboarding', 'Akan Keluar')}
                            </span>
                          ) : (
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm w-max mx-auto block">
                              {tMsg('Active', 'Aktif')}
                            </span>
                          )
                        ) : (
                          <span
                            className="text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-full cursor-help border border-slate-200 dark:border-slate-700 shadow-sm w-max mx-auto block"
                            title={`Created at: ${u.created_at || 'Unknown'}`}
                          >
                            {tMsg('Unverified', 'Belum Verifikasi')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.username !== 'admin' && (
                          <div className="flex justify-end items-center gap-2 flex-wrap">

                            {u.is_verified === 1 && u.username !== currentUser && (
                              <button
                                onClick={() => {
                                  setUserToProcess(u.username);
                                  setProcessAction(u.is_superadmin === 1 ? 'demote' : 'promote');
                                  setConfirmText('');
                                  setOffboardDate('');
                                }}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border shadow-sm hover:-translate-y-0.5 ${
                                  u.is_superadmin === 1
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-500 hover:text-white dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                                    : 'text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
                                }`}
                                title={
                                  u.is_superadmin === 1
                                    ? tMsg('Demote to Regular User', 'Turunkan ke Pengguna Biasa')
                                    : tMsg('Promote to Super Admin', 'Naikkan ke Super Admin')
                                }
                              >
                                {u.is_superadmin === 1
                                  ? '👑 ' + tMsg('Demote', 'Turunkan')
                                  : '👤 ' + tMsg('Promote', 'Naikkan')}
                              </button>
                            )}
                            {u.is_verified === 1 &&
                              (u.account_status === 'active' || u.account_status === 'offboarding') && (
                                <button
                                  onClick={() => {
                                    setUserToProcess(u.username);
                                    setProcessAction('freeze');
                                    setConfirmText('');
                                    setOffboardDate('');
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-500 hover:text-white dark:bg-cyan-900/20 dark:text-cyan-400 px-3 py-1.5 rounded-lg transition-all border border-cyan-200 dark:border-cyan-800/50 shadow-sm hover:-translate-y-0.5"
                                  title={tMsg('Freeze Account', 'Bekukan Akun')}
                                >
                                  ❄️ {tMsg('Freeze', 'Bekukan')}
                                </button>
                              )}
                            {u.is_verified === 1 &&
                              (u.account_status === 'active' || u.account_status === 'offboarding') && (
                                <button
                                  onClick={() => {
                                    setUserToProcess(u.username);
                                    setProcessAction('offboard');
                                    setConfirmText('');
                                    setOffboardDate('');
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-500 hover:text-white dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1.5 rounded-lg transition-all border border-purple-200 dark:border-purple-800/50 shadow-sm hover:-translate-y-0.5"
                                  title={tMsg('Schedule Offboarding Date', 'Jadwalkan Waktu Keluar')}
                                >
                                  🚪 {tMsg('Offboard', 'Keluar')}
                                </button>
                              )}
                            {u.is_verified === 1 && u.account_status === 'suspended' && (
                              <button
                                onClick={() => {
                                  setUserToProcess(u.username);
                                  setProcessAction('unfreeze');
                                  setConfirmText('');
                                  setOffboardDate('');
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg transition-all border border-emerald-200 dark:border-emerald-800/50 shadow-sm hover:-translate-y-0.5"
                                title={tMsg('Unfreeze Account', 'Cairkan Akun')}
                              >
                                🔥 {tMsg('Unfreeze', 'Cairkan')}
                              </button>
                            )}
                            {u.is_verified === 1 && u.account_status === 'pending_deletion' && (
                              <button
                                onClick={() => {
                                  setUserToProcess(u.username);
                                  setProcessAction('restore');
                                  setConfirmText('');
                                  setOffboardDate('');
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-500 hover:text-white dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg transition-all border border-blue-200 dark:border-blue-800/50 shadow-sm hover:-translate-y-0.5"
                                title={tMsg('Restore Account', 'Pulihkan Akun')}
                              >
                                ♻️ {tMsg('Restore', 'Pulihkan')}
                              </button>
                            )}

                            {u.is_verified === 1 && u.account_status !== 'pending_deletion' ? (
                              <button
                                onClick={() => {
                                  setDeleteChoiceUser(u.username);
                                  setShowDeleteChoice(true);
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50 shadow-sm hover:-translate-y-0.5"
                                title={tMsg('Delete User', 'Hapus Pengguna')}
                              >
                                🗑️ {tMsg('Delete', 'Hapus')}
                              </button>
                            ) : u.is_verified === 0 ? (
                              <>
                                <button
                                  onClick={() => {
                                    setUserToProcess(u.username);
                                    setProcessAction('verify');
                                    setConfirmText('');
                                    setOffboardDate('');
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg transition-all border border-emerald-200 dark:border-emerald-800/50 shadow-sm hover:-translate-y-0.5"
                                  title={tMsg('Manually Verify Account', 'Verifikasi Akun Manual')}
                                >
                                  ✅ {tMsg('Verify', 'Verifikasi')}
                                </button>
                                <button
                                  onClick={() => {
                                    setUserToProcess(u.username);
                                    setProcessAction('purge');
                                    setConfirmText('');
                                    setOffboardDate('');
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50 shadow-sm hover:-translate-y-0.5"
                                  title={tMsg(
                                    'Hard Delete Unverified Account',
                                    'Hapus Permanen Akun Belum Terverifikasi'
                                  )}
                                >
                                  💥 {tMsg('Purge', 'Bersihkan')}
                                </button>
                              </>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs"
                      >
                        {tMsg('No users found.', 'Tidak ada pengguna ditemukan.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'projects' ? (
          <div className="flex-1 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm bg-neutral-50 dark:bg-neutral-900 relative">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-black dark:text-white text-sm uppercase tracking-wider">
                  {tMsg('Project Directory', 'Direktori Proyek')}
                </h3>
                {selectedBoards.length > 0 && (
                  <button
                    onClick={() => {
                      const toDelete = adminBoards
                        .filter((b) => selectedBoards.includes(b.id))
                        .map((b) => ({ id: b.id, name: b.name }));
                      triggerDelete(toDelete);
                    }}
                    className="text-[10px] font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm"
                  >
                    {tMsg('Delete Selected', 'Hapus Pilihan')} ({selectedBoards.length})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 flex-wrap sm:flex-nowrap">
                <div className="relative w-full sm:w-auto flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder={tMsg('Search projects...', 'Cari proyek...')}
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-xs font-medium transition-all shadow-inner"
                  />
                </div>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="bg-neutral-100 dark:bg-neutral-900 border-transparent focus:ring-0 text-xs font-bold p-2.5 rounded-xl outline-none cursor-pointer text-slate-700 dark:text-slate-300 shrink-0 [&>option]:bg-white dark:[&>option]:bg-neutral-900"
                >
                  <option value="all">{tMsg('All Projects', 'Semua Proyek')}</option>
                  <option value="orphan">👻 {tMsg('Orphaned Only', 'Hanya Yatim')}</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {isBoardsLoading ? (
                <div className="p-10 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                  Loading Projects...
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 w-10">
                        <input
                          type="checkbox"
                          className="cursor-pointer rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500"
                          checked={
                            filteredAdminBoards.length > 0 && selectedBoards.length === filteredAdminBoards.length
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
                    {filteredAdminBoards.map((b) => (
                      <tr key={b.id} className="hover:bg-white dark:hover:bg-neutral-950 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap w-10">
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedBoards.includes(b.id)}
                            onChange={() => handleToggleSelectBoard(b.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-500 text-sm whitespace-nowrap">{b.id}</td>
                        <td className="px-6 py-4 font-bold text-black dark:text-white text-sm whitespace-nowrap">
                          <HighlightText text={b.name} query={projectSearchQuery} />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          @<HighlightText text={b.owner_username} query={projectSearchQuery} />
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {b.owner_status === 'orphan' ? (
                            <span
                              className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full border border-red-200 dark:border-red-800/50 shadow-sm w-max mx-auto block cursor-help"
                              title="Owner account has been permanently deleted"
                            >
                              👻 {tMsg('Orphaned', 'Yatim')}
                            </span>
                          ) : b.owner_status === 'pending_deletion' ? (
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50 shadow-sm w-max mx-auto block">
                              ⏳ {tMsg('Owner Deleting', 'Pemilik Dihapus')}
                            </span>
                          ) : b.owner_status === 'suspended' ? (
                            <span className="text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800/50 shadow-sm w-max mx-auto block">
                              ❄️ {tMsg('Owner Frozen', 'Pemilik Beku')}
                            </span>
                          ) : (
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm w-max mx-auto block">
                              ✅ {tMsg('Active', 'Aktif')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setBoardToTransfer(b);
                                setNewOwnerInput('');
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-500 hover:text-white dark:bg-indigo-900/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg transition-all border border-indigo-200 dark:border-indigo-800/50 shadow-sm hover:-translate-y-0.5"
                              title={tMsg('Transfer Ownership', 'Pindah Kepemilikan')}
                            >
                              🔄 {tMsg('Transfer', 'Pindah')}
                            </button>
                            <button
                              onClick={() => handleAdminDeleteBoard(b.id, b.name)}
                              className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all border border-red-200 dark:border-red-800/50 shadow-sm hover:-translate-y-0.5"
                              title={tMsg('Delete Project', 'Hapus Proyek')}
                            >
                              🗑️ {tMsg('Delete', 'Hapus')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAdminBoards.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs"
                        >
                          {tMsg('No projects found.', 'Tidak ada proyek ditemukan.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {deleteConfirmOpen && (
              <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 mac-animate">
                <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-red-200 dark:border-red-800">
                    ⚠️
                  </div>
                  <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight text-center uppercase">
                    {tMsg('Delete Projects?', 'Hapus Proyek?')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-6">
                    {tMsg(
                      'Are you sure you want to permanently delete ',
                      'Apakah Anda yakin ingin menghapus permanen '
                    )}
                    <strong className="text-black dark:text-white mx-1">{boardsToDelete.length}</strong>
                    {tMsg(
                      ' project(s)? This action cannot be undone and will erase all associated tasks, sub-tasks, and comments.',
                      ' proyek? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua tugas, sub-tugas, dan komentar yang terkait.'
                    )}
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl max-h-40 overflow-y-auto mb-8 w-full text-left custom-scrollbar">
                    <ul className="list-disc pl-5 text-xs text-red-700 dark:text-red-400 font-bold space-y-1">
                      {boardsToDelete.map((b) => (
                        <li key={b.id}>
                          {b.name} (ID: {b.id})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => {
                        setDeleteConfirmOpen(false);
                        setBoardsToDelete([]);
                      }}
                      disabled={isDeletingBulk}
                      className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      {tMsg('Cancel', 'Batal')}
                    </button>
                    <button
                      onClick={executeDelete}
                      disabled={isDeletingBulk}
                      className="flex-1 px-4 py-4 rounded-full font-bold text-white transition-all text-xs uppercase tracking-widest shadow-md bg-red-500 hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
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
              <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 mac-animate">
                <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-indigo-200 dark:border-indigo-800">
                    🔄
                  </div>
                  <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight text-center uppercase">
                    {tMsg('Transfer Project', 'Pindahkan Proyek')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-6">
                    {tMsg('Select a new owner for ', 'Pilih pemilik baru untuk ')}
                    <strong className="text-black dark:text-white mx-1">{boardToTransfer.name}</strong>.
                  </p>
                  <div className="w-full mb-8 text-left">
                    <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
                      {tMsg('New Owner', 'Pemilik Baru')}
                    </label>
                    <select
                      value={newOwnerInput}
                      onChange={(e) => setNewOwnerInput(e.target.value)}
                      className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-xs font-bold transition-all [&>option]:bg-white dark:[&>option]:bg-neutral-900"
                    >
                      <option value="">-- {tMsg('Select User', 'Pilih Pengguna')} --</option>
                      {adminUsers
                        .filter((u) => u.username !== boardToTransfer.owner_username && u.is_verified === 1)
                        .map((u) => (
                          <option key={u.username} value={u.username}>
                            @{u.username} ({u.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => {
                        setBoardToTransfer(null);
                        setNewOwnerInput('');
                      }}
                      disabled={isTransferring}
                      className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      {tMsg('Cancel', 'Batal')}
                    </button>
                    <button
                      onClick={() => {
                        if (!newOwnerInput) return;
                        setIsTransferring(true);
                        axios
                          .put(`/api/admin/boards/${boardToTransfer.id}/transfer`, { new_owner: newOwnerInput })
                          .then((res) => {
                            setIsTransferring(false);
                            setBoardToTransfer(null);
                            setNewOwnerInput('');
                            if (showNotification) showNotification(res.data.message, 'success');
                            handleProjectsTabClick();
                          })
                          .catch((err) => {
                            setIsTransferring(false);
                            if (showNotification)
                              showNotification(err.response?.data?.detail || 'Failed to transfer', 'error');
                          });
                      }}
                      disabled={isTransferring || !newOwnerInput}
                      className="flex-1 px-4 py-4 rounded-full font-bold text-white transition-all text-xs uppercase tracking-widest shadow-md bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      {isTransferring
                        ? tMsg('Transferring...', 'Memindahkan...')
                        : tMsg('Confirm Transfer', 'Konfirmasi Pindah')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bulkUserConfirmOpen && (
              <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 mac-animate">
                <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border ${
                      bulkUserActionType === 'verify'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {bulkUserActionType === 'verify' ? '✅' : '⚠️'}
                  </div>
                  <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight text-center uppercase">
                    {bulkUserActionType === 'verify'
                      ? tMsg('Verify Users?', 'Verifikasi Pengguna?')
                      : tMsg('Purge Users?', 'Bersihkan Pengguna?')}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-6">
                    {tMsg('Are you sure you want to ', 'Apakah Anda yakin ingin ')}
                    {bulkUserActionType === 'verify'
                      ? tMsg('verify ', 'memverifikasi ')
                      : tMsg('permanently delete ', 'menghapus permanen ')}
                    <strong className="text-black dark:text-white mx-1">{selectedUsers.length}</strong>
                    {tMsg('user(s)?', 'pengguna?')}
                    {bulkUserActionType === 'purge' &&
                      tMsg(' This cannot be undone.', ' Tindakan ini tidak dapat dibatalkan.')}
                  </p>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setBulkUserConfirmOpen(false)}
                      disabled={isProcessingBulkUsers}
                      className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      {tMsg('Cancel', 'Batal')}
                    </button>
                    <button
                      onClick={executeBulkUserAction}
                      disabled={isProcessingBulkUsers}
                      className={`flex-1 px-4 py-4 rounded-full font-bold text-white transition-all text-xs uppercase tracking-widest shadow-md disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5 ${
                        bulkUserActionType === 'verify'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {isProcessingBulkUsers ? tMsg('Processing...', 'Memproses...') : tMsg('Confirm', 'Konfirmasi')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'approvers' ? (
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
            {/* Left Section: Assign Form */}
            <div className="w-full md:w-80 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 flex flex-col gap-4">
              <h3 className="font-bold text-black dark:text-white text-sm uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {tMsg('Assign Approver', 'Tugaskan Penyetuju')}
              </h3>
              
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                  {tMsg('Select User', 'Pilih Pengguna')}
                </label>
                <select
                  value={approverTargetUser || ''}
                  onChange={(e) => {
                    const usr = e.target.value;
                    setApproverTargetUser(usr);
                    const currentObj = adminUsers.find(u => u.username === usr);
                    setApproverInput(currentObj?.timesheet_approver || '');
                  }}
                  className="w-full p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 text-black dark:text-white rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold transition-all"
                >
                  <option value="">-- {tMsg('Select User', 'Pilih Pengguna')} --</option>
                  {adminUsers
                    .filter(u => u.is_verified === 1)
                    .map(u => (
                      <option key={u.username} value={u.username}>
                        @{u.username} ({u.full_name || u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                  {tMsg('Select Approver', 'Pilih Penyetuju')}
                </label>
                <select
                  value={approverInput}
                  disabled={!approverTargetUser}
                  onChange={(e) => setApproverInput(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 text-black dark:text-white rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <option value="">-- {tMsg('No Approver', 'Tidak Ada Penyetuju')} --</option>
                  {adminUsers
                    .filter(u => u.username !== approverTargetUser && u.is_verified === 1)
                    .map(u => (
                      <option key={u.username} value={u.username}>
                        @{u.username} ({u.full_name || u.email})
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={executeSetApprover}
                disabled={isSettingApprover || !approverTargetUser}
                className="w-full mt-2 px-4 py-3 rounded-full font-bold text-white transition-all text-xs uppercase tracking-widest shadow-md bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                {isSettingApprover
                  ? tMsg('Saving...', 'Menyimpan...')
                  : tMsg('Save Assignment', 'Simpan Penugasan')}
              </button>
            </div>

            {/* Right Section: Directory Table */}
            <div className="flex-1 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm min-h-0">
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0">
                <h3 className="font-bold text-black dark:text-white text-sm uppercase tracking-wider">
                  {tMsg('Approver Directory', 'Direktori Penyetuju')}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                    <tr>
                      <th className="px-6 py-3 font-bold">{tMsg('User', 'Pengguna')}</th>
                      <th className="px-6 py-3 font-bold">{tMsg('Timesheet Approver', 'Penyetuju Timesheet')}</th>
                      <th className="px-6 py-3 font-bold text-right">{tMsg('Actions', 'Tindakan')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {adminUsers
                      .filter(u => u.is_verified === 1)
                      .map(u => (
                        <tr key={u.username} className="hover:bg-neutral-50 dark:hover:bg-neutral-950/50 transition-colors">
                          <td className="px-6 py-3 text-sm font-bold text-black dark:text-white">
                            @{u.username}
                            <span className="block text-[10px] text-neutral-500 font-normal">{u.full_name || u.email}</span>
                          </td>
                          <td className="px-6 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                            {u.timesheet_approver ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/55">
                                ⏱️ @{u.timesheet_approver}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-850 text-neutral-500 px-2.5 py-1 rounded-full text-xs font-bold border border-neutral-250 dark:border-neutral-700">
                                {tMsg('No Approver', 'Tidak Ada Penyetuju')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {u.timesheet_approver && (
                              <button
                                onClick={async () => {
                                  setIsSettingApprover(true);
                                  try {
                                    const token = localStorage.getItem('innocean_token');
                                    const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/users/approver`, { username: u.username, status: '' }, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    showNotification(res.data.message, 'success');
                                    const usersRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
                                    setAdminUsers(usersRes.data.users);
                                    setIsSettingApprover(false);
                                  } catch (err) {
                                    showNotification(err.response?.data?.detail || 'Failed to remove approver', 'error');
                                    setIsSettingApprover(false);
                                  }
                                }}
                                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-650 hover:text-white dark:bg-red-950/20 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30 transition-all"
                              >
                                {tMsg('Remove', 'Hapus')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <form onSubmit={handleConfigSubmit} className="space-y-8 max-w-4xl mx-auto py-2">
              {/* Core System Settings */}
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">⚙️</span>
                  <div>
                    <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                      {tMsg('Core System Settings', 'Pengaturan Sistem Inti')}
                    </h3>
                    <p className="text-xs font-medium text-neutral-500 mt-1">
                      {tMsg(
                        'Configure database, security, and integrations.',
                        'Konfigurasikan basis data, keamanan, dan integrasi.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      Database URL (PostgreSQL)
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.db ? 'text' : 'password'}
                        value={configData.database_url || ''}
                        onChange={(e) => setConfigData({ ...configData, database_url: e.target.value })}
                        className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors pr-10"
                        placeholder="postgresql://user:password@host/dbname"
                      />
                      <button
                        type="button"
                        onMouseDown={() => togglePass('db', true)}
                        onMouseUp={() => togglePass('db', false)}
                        onMouseLeave={() => togglePass('db', false)}
                        onTouchStart={() => togglePass('db', true)}
                        onTouchEnd={() => togglePass('db', false)}
                        onTouchCancel={() => togglePass('db', false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                      >
                        {showPass.db ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      JWT Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.jwt ? 'text' : 'password'}
                        value={configData.secret_key || ''}
                        onChange={(e) => setConfigData({ ...configData, secret_key: e.target.value })}
                        className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors pr-10"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onMouseDown={() => togglePass('jwt', true)}
                        onMouseUp={() => togglePass('jwt', false)}
                        onMouseLeave={() => togglePass('jwt', false)}
                        onTouchStart={() => togglePass('jwt', true)}
                        onTouchEnd={() => togglePass('jwt', false)}
                        onTouchCancel={() => togglePass('jwt', false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                      >
                        {showPass.jwt ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      Google Calendar API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.cal ? 'text' : 'password'}
                        value={configData.google_calendar_api_key || ''}
                        onChange={(e) => setConfigData({ ...configData, google_calendar_api_key: e.target.value })}
                        className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors pr-10"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onMouseDown={() => togglePass('cal', true)}
                        onMouseUp={() => togglePass('cal', false)}
                        onMouseLeave={() => togglePass('cal', false)}
                        onTouchStart={() => togglePass('cal', true)}
                        onTouchEnd={() => togglePass('cal', false)}
                        onTouchCancel={() => togglePass('cal', false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                      >
                        {showPass.cal ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automate Email Setting */}
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">📧</span>
                  <div>
                    <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                      {tMsg('Automate Email Settings (SMTP)', 'Pengaturan Email Otomatis (SMTP)')}
                    </h3>
                    <p className="text-xs font-medium text-neutral-500 mt-1">
                      {tMsg(
                        'Configure the email server used for sending system notifications.',
                        'Konfigurasikan server email yang digunakan untuk mengirim notifikasi sistem.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      SMTP Server
                    </label>
                    <input
                      type="text"
                      value={configData.smtp_server}
                      onChange={(e) => setConfigData({ ...configData, smtp_server: e.target.value })}
                      className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                      placeholder="e.g. smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={configData.smtp_port}
                      onChange={(e) => setConfigData({ ...configData, smtp_port: e.target.value })}
                      className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                      placeholder="e.g. 587"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      {tMsg('SMTP Username', 'Nama Pengguna SMTP')}
                    </label>
                    <input
                      type="text"
                      value={configData.smtp_username}
                      onChange={(e) => setConfigData({ ...configData, smtp_username: e.target.value })}
                      className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                      placeholder="email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      {tMsg('SMTP Password', 'Kata Sandi SMTP')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.smtp ? 'text' : 'password'}
                        value={configData.smtp_password}
                        onChange={(e) => setConfigData({ ...configData, smtp_password: e.target.value })}
                        className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors pr-10"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onMouseDown={() => togglePass('smtp', true)}
                        onMouseUp={() => togglePass('smtp', false)}
                        onMouseLeave={() => togglePass('smtp', false)}
                        onTouchStart={() => togglePass('smtp', true)}
                        onTouchEnd={() => togglePass('smtp', false)}
                        onTouchCancel={() => togglePass('smtp', false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                      >
                        {showPass.smtp ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* API AI Setting */}
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🤖</span>
                  <div>
                    <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                      {tMsg('Smart Assistant APIs', 'API Asisten Pintar')}
                    </h3>
                    <p className="text-xs font-medium text-neutral-500 mt-1">
                      {tMsg(
                        'Set your AI Provider keys. You can use one or both.',
                        'Atur kunci Penyedia AI Anda. Anda dapat menggunakan salah satu atau keduanya.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      Google Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.gemini ? 'text' : 'password'}
                        value={configData.gemini_api_key}
                        onChange={(e) => setConfigData({ ...configData, gemini_api_key: e.target.value })}
                        className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors pr-10"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onMouseDown={() => togglePass('gemini', true)}
                        onMouseUp={() => togglePass('gemini', false)}
                        onMouseLeave={() => togglePass('gemini', false)}
                        onTouchStart={() => togglePass('gemini', true)}
                        onTouchEnd={() => togglePass('gemini', false)}
                        onTouchCancel={() => togglePass('gemini', false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                      >
                        {showPass.gemini ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      Groq API Key (GPT-OSS 120B)
                    </label>
                    <div className="relative">
                      <input
                        type={showPass.groq ? 'text' : 'password'}
                        value={configData.groq_api_key}
                        onChange={(e) => setConfigData({ ...configData, groq_api_key: e.target.value })}
                        className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors pr-10"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onMouseDown={() => togglePass('groq', true)}
                        onMouseUp={() => togglePass('groq', false)}
                        onMouseLeave={() => togglePass('groq', false)}
                        onTouchStart={() => togglePass('groq', true)}
                        onTouchEnd={() => togglePass('groq', false)}
                        onTouchCancel={() => togglePass('groq', false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                      >
                        {showPass.groq ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isConfigLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-full text-xs uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isConfigLoading
                    ? tMsg('Saving...', 'Menyimpan...')
                    : tMsg('Save Configuration', 'Simpan Konfigurasi')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={close}
            className="px-10 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
          >
            {tMsg('Close Panel', 'Tutup Panel')}
          </button>
        </div>

        {/* Delete Choice Modal */}
        {showDeleteChoice && deleteChoiceUser && (
          <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 mac-animate">
            <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border bg-red-50 dark:bg-red-900/30 text-red-500 border-red-200 dark:border-red-800">
                🗑️
              </div>
              <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight text-center uppercase">
                {tMsg('Delete User', 'Hapus Pengguna')}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-8">
                {tMsg('Choose how to delete', 'Pilih cara menghapus')}{' '}
                <strong className="text-black dark:text-white">@{deleteChoiceUser}</strong>.
              </p>

              {/* Soft Delete Option */}
              <button
                onClick={() => {
                  setShowDeleteChoice(false);
                  setUserToProcess(deleteChoiceUser);
                  setProcessAction('schedule');
                  setConfirmText('');
                  setOffboardDate('');
                  setDeleteChoiceUser(null);
                }}
                className="w-full mb-3 px-6 py-5 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-left transition-all group hover:-translate-y-0.5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">⏱️</span>
                  <div>
                    <div className="font-black text-amber-700 dark:text-amber-400 text-sm uppercase tracking-wide mb-1">
                      {tMsg('Soft Delete', 'Hapus Lunak')}
                    </div>
                    <div className="text-xs text-amber-600/80 dark:text-amber-500/80 font-medium leading-relaxed">
                      {tMsg(
                        'Account is disabled immediately and permanently deleted after 90 days. Can be restored.',
                        'Akun dinonaktifkan segera dan dihapus permanen setelah 90 hari. Dapat dipulihkan.'
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Hard Delete Option */}
              <button
                onClick={() => {
                  setShowDeleteChoice(false);
                  setUserToProcess(deleteChoiceUser);
                  setProcessAction('purge');
                  setConfirmText('');
                  setOffboardDate('');
                  setDeleteChoiceUser(null);
                }}
                className="w-full mb-6 px-6 py-5 rounded-2xl border-2 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-left transition-all group hover:-translate-y-0.5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">💥</span>
                  <div>
                    <div className="font-black text-red-700 dark:text-red-400 text-sm uppercase tracking-wide mb-1">
                      {tMsg('Delete Now', 'Hapus Sekarang')}
                    </div>
                    <div className="text-xs text-red-600/80 dark:text-red-500/80 font-medium leading-relaxed">
                      {tMsg(
                        'Permanently removes the account and all associated data immediately. Cannot be undone.',
                        'Menghapus akun dan semua data terkait secara permanen dan segera. Tidak dapat dibatalkan.'
                      )}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDeleteChoice(false);
                  setDeleteChoiceUser(null);
                }}
                className="px-10 py-3 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-xs uppercase tracking-widest"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
            </div>
          </div>
        )}

        {userToProcess &&
          (() => {
            let icon = '⚠️';
            let iconColor = 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-200 dark:border-red-800';
            let btnColor = 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5';
            let focusColor = 'focus:border-red-500';
            let textColor = 'text-red-500';
            let title = '';
            let desc = null;

            const requiresTyping = processAction === 'purge' || processAction === 'schedule';

            if (processAction === 'offboard') {
              icon = '🚪';
              iconColor = 'bg-purple-50 dark:bg-purple-900/30 text-purple-500 border-purple-200 dark:border-purple-800';
              btnColor = 'bg-purple-500 hover:bg-purple-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-purple-500';
              textColor = 'text-purple-500';
              title = tMsg('Schedule Offboarding', 'Jadwalkan Karyawan Keluar');
            } else if (processAction === 'promote') {
              icon = '👑';
              iconColor = 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 border-amber-200 dark:border-amber-800';
              btnColor = 'bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-amber-500';
              textColor = 'text-amber-500';
              title = tMsg('Promote to Admin', 'Jadikan Admin');
              desc = tMsg(
                'This user will gain full administrative access to the system.',
                'Pengguna ini akan mendapatkan akses administratif penuh ke sistem.'
              );
            } else if (processAction === 'demote') {
              icon = '👤';
              iconColor = 'bg-slate-50 dark:bg-slate-900/30 text-slate-500 border-slate-200 dark:border-slate-800';
              btnColor = 'bg-slate-500 hover:bg-slate-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-slate-500';
              textColor = 'text-slate-500';
              title = tMsg('Demote to User', 'Turunkan ke Pengguna Biasa');
              desc = tMsg(
                'This user will lose administrative privileges and become a regular member.',
                'Pengguna ini akan kehilangan hak administratif dan menjadi anggota biasa.'
              );
            } else if (processAction === 'freeze') {
              icon = '❄️';
              iconColor = 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 border-cyan-200 dark:border-cyan-800';
              btnColor = 'bg-cyan-500 hover:bg-cyan-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-cyan-500';
              textColor = 'text-cyan-500';
              title = tMsg('Freeze Account', 'Bekukan Akun');
              desc = tMsg(
                'This account will be temporarily disabled from making any changes.',
                'Akun ini akan dinonaktifkan sementara dari melakukan perubahan apa pun.'
              );
            } else if (processAction === 'unfreeze') {
              icon = '🔥';
              iconColor =
                'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 border-emerald-200 dark:border-emerald-800';
              btnColor = 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-emerald-500';
              textColor = 'text-emerald-500';
              title = tMsg('Unfreeze Account', 'Cairkan Akun');
              desc = tMsg(
                'This account will be reactivated and can use the system normally.',
                'Akun ini akan diaktifkan kembali dan dapat menggunakan sistem secara normal.'
              );
            } else if (processAction === 'restore') {
              icon = '♻️';
              iconColor = 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 border-blue-200 dark:border-blue-800';
              btnColor = 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-blue-500';
              textColor = 'text-blue-500';
              title = tMsg('Restore Account', 'Pulihkan Akun');
              desc = tMsg(
                'This account will be restored from the deletion queue.',
                'Akun ini akan dipulihkan dari antrean penghapusan.'
              );
            } else if (processAction === 'verify') {
              icon = '✅';
              iconColor =
                'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 border-emerald-200 dark:border-emerald-800';
              btnColor = 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5';
              focusColor = 'focus:border-emerald-500';
              textColor = 'text-emerald-500';
              title = tMsg('Verify Account', 'Verifikasi Akun');
              desc = tMsg(
                'This user will be manually verified and granted access to the system.',
                'Pengguna ini akan diverifikasi secara manual dan diberikan akses ke sistem.'
              );
            } else if (processAction === 'purge') {
              title = tMsg('Purge User', 'Bersihkan Pengguna');
            } else {
              title = tMsg('Schedule Deletion', 'Jadwalkan Penghapusan');
            }

            return (
              <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 mac-animate">
                <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border ${iconColor}`}
                  >
                    {icon}
                  </div>
                  <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight text-center uppercase">
                    {title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-6">
                    {desc ? (
                      desc
                    ) : processAction === 'purge' ? (
                      <>
                        {tMsg(
                          'This will immediately and permanently delete the account and all associated data. This cannot be undone.',
                          'Ini akan segera dan secara permanen menghapus akun dan semua data terkait. Tindakan ini tidak dapat dibatalkan.'
                        )}
                      </>
                    ) : processAction === 'offboard' ? (
                      <>
                        {tMsg('Set the last working day for', 'Atur hari kerja terakhir untuk')}{' '}
                        <strong className={textColor}>@{userToProcess}</strong>.
                        {tMsg(
                          ' The account will be automatically disabled at the end of this date, and queued for 90-day permanent deletion.',
                          ' Akun akan dinonaktifkan secara otomatis pada akhir tanggal ini, dan diantrekan untuk penghapusan permanen 90 hari.'
                        )}
                      </>
                    ) : (
                      <>
                        {tMsg('This action will', 'Tindakan ini akan')}{' '}
                        <strong className="text-red-500">{tMsg('disable', 'menonaktifkan')}</strong>{' '}
                        {tMsg(
                          'the account immediately and schedule it for permanent deletion in',
                          'akun ini segera dan menjadwalkan penghapusan permanen dalam'
                        )}{' '}
                        <strong className="text-red-500">{tMsg('90 days', '90 hari')}</strong>.
                      </>
                    )}
                  </p>

                  {processAction === 'offboard' && (
                    <div className="w-full mb-4 text-left">
                      <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
                        {tMsg('Last Working Day', 'Hari Kerja Terakhir')}
                      </label>
                      <input
                        type="date"
                        value={offboardDate}
                        onChange={(e) => setOffboardDate(e.target.value)}
                        className={`w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl ${focusColor} focus:bg-white dark:focus:bg-black outline-none text-xs font-bold transition-all mb-4 shadow-inner`}
                        required
                      />
                    </div>
                  )}

                  {requiresTyping && (
                    <div className="w-full mb-8 text-left">
                      <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
                        {tMsg('Type', 'Ketik')} <strong className={textColor}>@{userToProcess}</strong>{' '}
                        {tMsg('to confirm', 'untuk konfirmasi:')}
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className={`w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl ${focusColor} focus:bg-white dark:focus:bg-black outline-none text-xs font-bold transition-all shadow-inner`}
                        placeholder={tMsg('Enter username...', 'Masukkan nama pengguna...')}
                        autoComplete="off"
                      />
                    </div>
                  )}

                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => {
                        setUserToProcess(null);
                        setConfirmText('');
                        setOffboardDate('');
                      }}
                      className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-xs uppercase tracking-widest"
                    >
                      {tMsg('Cancel', 'Batal')}
                    </button>
                    <button
                      onClick={() => {
                        if (processAction === 'purge') handleDeleteUser(userToProcess);
                        else if (processAction === 'offboard')
                          handleUpdateUserStatus(userToProcess, 'offboarding', offboardDate);
                        else if (processAction === 'promote' || processAction === 'demote')
                          handleToggleSuperAdmin(userToProcess);
                        else if (processAction === 'freeze') handleUpdateUserStatus(userToProcess, 'suspended');
                        else if (processAction === 'unfreeze' || processAction === 'restore')
                          handleUpdateUserStatus(userToProcess, 'active');
                        else if (processAction === 'verify') handleManualVerify(userToProcess);
                        else handleUpdateUserStatus(userToProcess, 'pending_deletion');

                        setUserToProcess(null);
                        setConfirmText('');
                        setOffboardDate('');
                      }}
                      disabled={
                        (requiresTyping && confirmText !== `@${userToProcess}`) ||
                        (processAction === 'offboard' && !offboardDate)
                      }
                      className={`flex-1 px-4 py-4 rounded-full font-bold text-white transition-all text-xs uppercase tracking-widest shadow-md ${
                        (!requiresTyping || confirmText === `@${userToProcess}`) &&
                        (processAction !== 'offboard' || offboardDate)
                          ? btnColor
                          : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {tMsg('Confirm', 'Konfirmasi')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {showSudoModal && (
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-8 mac-animate">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-indigo-200 dark:border-indigo-800">
              🔐
            </div>
            <h3 className="text-3xl font-black text-black dark:text-white mb-2 tracking-tight">
              {tMsg('Security Verification', 'Verifikasi Keamanan')}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md text-center text-sm leading-relaxed mb-8">
              {tMsg(
                'Please re-enter your admin password to access the System Configuration.',
                'Silakan masukkan kembali kata sandi admin Anda untuk mengakses Konfigurasi Sistem.'
              )}
            </p>

            <form onSubmit={handleSudoSubmit} className="w-full max-w-sm mb-8">
              <div className="relative mb-6">
                <input
                  type={showSudoPass ? 'text' : 'password'}
                  autoFocus
                  value={sudoPassword}
                  onChange={(e) => setSudoPassword(e.target.value)}
                  className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-sm font-bold transition-all shadow-inner pr-12"
                  placeholder={tMsg('Enter admin password...', 'Masukkan kata sandi admin...')}
                />
                <button
                  type="button"
                  onMouseDown={() => setShowSudoPass(true)}
                  onMouseUp={() => setShowSudoPass(false)}
                  onMouseLeave={() => setShowSudoPass(false)}
                  onTouchStart={() => setShowSudoPass(true)}
                  onTouchEnd={() => setShowSudoPass(false)}
                  onTouchCancel={() => setShowSudoPass(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                >
                  {showSudoPass ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowSudoModal(false);
                    setSudoPassword('');
                  }}
                  className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-sm"
                >
                  {tMsg('Cancel', 'Batal')}
                </button>
                <button
                  type="submit"
                  disabled={!sudoPassword || isSudoLoading}
                  className="flex-1 px-4 py-4 rounded-full font-bold text-white transition-all text-sm shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {isSudoLoading ? tMsg('Verifying...', 'Memverifikasi...') : tMsg('Unlock', 'Buka Kunci')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {approverModalOpen && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 mac-animate">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-indigo-200 dark:border-indigo-800">
              ⏱️
            </div>
            <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight text-center uppercase">
              {tMsg('Set Approver', 'Atur Penyetuju')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-6">
              {tMsg('Select a timesheet approver for ', 'Pilih penyetuju timesheet untuk ')}
              <strong className="text-black dark:text-white mx-1">@{approverTargetUser}</strong>.
              <br />
              <span className="text-[10px] italic">({tMsg('Leave blank to remove approver', 'Kosongkan untuk menghapus penyetuju')})</span>
            </p>
            <div className="w-full mb-8 text-left">
              <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
                {tMsg('Select Approver', 'Pilih Penyetuju')}
              </label>
              <select
                value={approverInput}
                onChange={(e) => setApproverInput(e.target.value)}
                className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-xs font-bold transition-all [&>option]:bg-white dark:[&>option]:bg-neutral-900"
              >
                <option value="">-- {tMsg('No Approver', 'Tidak Ada Penyetuju')} --</option>
                {adminUsers
                  .filter((u) => u.username !== approverTargetUser && u.is_verified === 1)
                  .map((u) => (
                    <option key={u.username} value={u.username}>
                      @{u.username} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setApproverModalOpen(false)}
                disabled={isSettingApprover}
                className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                onClick={executeSetApprover}
                disabled={isSettingApprover}
                className="flex-1 px-4 py-4 rounded-full font-bold text-white transition-all text-xs uppercase tracking-widest shadow-md bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                {isSettingApprover
                  ? tMsg('Saving...', 'Menyimpan...')
                  : tMsg('Save Approver', 'Simpan Penyetuju')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
