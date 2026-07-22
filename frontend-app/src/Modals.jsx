import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IconPerson, IconPlus, Avatar, SegmentedControl } from './SharedUI';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { HighlightText, stripHtml, useCloseAnimation, LoadingSpinner, renderRichText } from './Utils';

export function BaseConfirmModal({
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  icon = '⚠️',
  color = 'red',
  isSubmitting = false,
  matchText = null,
  inputText = '',
  setInputText = () => {},
  matchLabel = '',
  matchPlaceholder = '',
}) {
  const [isClosing, close] = useCloseAnimation(onClose);

  const theme =
    color === 'amber'
      ? {
          iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 border-amber-200 dark:border-amber-800/50',
          btn: 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-500 border border-amber-200 dark:border-amber-800/50',
          btnDisabled:
            'opacity-50 cursor-not-allowed bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
        }
      : {
          iconBg: 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-200 dark:border-red-800/50',
          btn: 'bg-red-500 hover:bg-red-600 text-white',
          btnDisabled: 'bg-red-300 dark:bg-red-900/50 text-white cursor-not-allowed',
        };

  const isMatchValid = matchText === null || inputText === matchText;

  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border ${theme.iconBg}`}
        >
          {icon}
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white mb-4 uppercase">
          {title}
        </h3>
        <div className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
          {description}
        </div>

        {matchText !== null && (
          <div className="mb-8 text-left">
            <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
              {matchLabel}
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-red-500 focus:bg-white dark:focus:bg-black focus:outline-none text-xs font-bold transition-all"
              placeholder={matchPlaceholder}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex justify-center gap-3 sm:gap-4">
          <button
            onClick={close}
            className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-[10px] sm:text-xs"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              if (isMatchValid && !isSubmitting) onConfirm();
            }}
            disabled={!isMatchValid || isSubmitting}
            className={`flex-1 px-4 py-4 rounded-full font-bold transition-all uppercase tracking-widest text-[10px] sm:text-xs shadow-md hover:-translate-y-0.5 ${
              !isMatchValid || isSubmitting ? theme.btnDisabled : theme.btn
            }`}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner /> Loading...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WelcomeTourModal({
  setShowWelcomeTour,
  startDriverTour,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  setIsProactiveAIOpen,
  currentUser,
}) {
  const [isClosing, close] = useCloseAnimation((action) => {
    setShowWelcomeTour(false);
    if (action === 'start') {
      startDriverTour();
    } else {
      localStorage.setItem(`innocean_tour_done_v2_${currentUser}`, 'true');
      setIsProactiveAIOpen(true);
    }
  });
  const tMsg = (en, id) => (language === 'id' ? id : en);

  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-md text-center ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-indigo-200 dark:border-indigo-800/50 hover:scale-110 transition-transform cursor-default">
          👋
        </div>
        <h2 className="text-2xl font-black text-black dark:text-white uppercase mb-2">
          {tMsg('Welcome to Tracker', 'Selamat Datang di Tracker')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-8 leading-relaxed">
          {tMsg(
            "Before we start the tour, let's set up your basic preferences.",
            'Sebelum kita mulai tur, mari atur preferensi dasar Anda.'
          )}
        </p>

        <div className="space-y-6 text-left mb-8">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
              {tMsg('Language', 'Bahasa')}
            </label>
            <SegmentedControl
              options={[
                { label: '🇺🇸 English', value: 'en' },
                { label: '🇮🇩 Indonesia', value: 'id' },
              ]}
              value={language}
              onChange={(val) => {
                setLanguage(val);
                localStorage.setItem('innocean_lang', val);
              }}
              fullWidth={true}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
              {tMsg('Theme', 'Tema')}
            </label>
            <SegmentedControl
              options={[
                { label: '☀️ Light', value: 'light' },
                { label: '🌙 Dark', value: 'dark' },
              ]}
              value={isDarkMode ? 'dark' : 'light'}
              onChange={(val) => setIsDarkMode(val === 'dark')}
              fullWidth={true}
            />
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={() => close('skip')}
            className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
          >
            {tMsg('Skip Tour', 'Lewati')}
          </button>
          <button
            onClick={() => close('start')}
            className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
          >
            {tMsg('Start Tour', 'Mulai Tur')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnfinishedSubtasksModal({ setPendingStatusChange, confirmPendingStatusChange, cancelPendingStatusChange, language }) {
  const tMsg = (en, id) => (language === 'id' ? id : en);

  return (
    <BaseConfirmModal
      onClose={cancelPendingStatusChange || (() => setPendingStatusChange(null))}
      onConfirm={confirmPendingStatusChange}
      title={tMsg('Incomplete Sub-tasks', 'Sub-tugas Belum Selesai')}
      description={tMsg(
        'There are still unfinished sub-tasks in this request. Are you sure you want to mark the main task as Done?',
        'Masih ada sub-tugas yang belum selesai pada permintaan ini. Apakah Anda yakin ingin menandai tugas utama sebagai Selesai?'
      )}
      confirmText={tMsg('Yes, Mark Done', 'Ya, Selesai')}
      cancelText={tMsg('Cancel', 'Batal')}
      color="amber"
    />
  );
}

export function DeleteTaskModal({ setIsDeleteConfirmOpen, selectedTask, handleDelete, language, isSubmitting }) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <BaseConfirmModal
      onClose={() => setIsDeleteConfirmOpen(false)}
      onConfirm={handleDelete}
      title={tMsg('Delete Task?', 'Hapus Tugas?')}
      description={
        <>
          {tMsg('Are you sure you want to delete', 'Apakah Anda yakin ingin menghapus')} <br />
          <strong className="text-black dark:text-white font-bold">{selectedTask?.project_name}</strong>?<br />{' '}
          {tMsg('This action cannot be undone.', 'Tindakan ini tidak dapat dibatalkan.')}
        </>
      }
      confirmText={tMsg('Delete', 'Hapus')}
      cancelText={tMsg('Cancel', 'Batal')}
      isSubmitting={isSubmitting}
    />
  );
}

export function DeleteCommentModal({ setCommentToDelete, confirmDeleteComment, language }) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <BaseConfirmModal
      onClose={() => setCommentToDelete(null)}
      onConfirm={confirmDeleteComment}
      title={tMsg('Delete Comment?', 'Hapus Komentar?')}
      description={
        <>
          {tMsg('Are you sure you want to delete this comment?', 'Apakah Anda yakin ingin menghapus komentar ini?')}{' '}
          <br /> {tMsg('This action cannot be undone.', 'Tindakan ini tidak dapat dibatalkan.')}
        </>
      }
      confirmText={tMsg('Delete', 'Hapus')}
      cancelText={tMsg('Cancel', 'Batal')}
    />
  );
}

export function RevokeMemberModal({ setMemberToRevoke, confirmRevokeMember, language, isRequesting, isPending }) {
  const tMsg = (en, id) => (language === 'id' ? id : en);

  let title = tMsg('Revoke Access?', 'Cabut Akses?');
  let description = tMsg(
    'Are you sure you want to revoke access for this member?',
    'Apakah Anda yakin ingin mencabut akses untuk anggota ini?'
  );
  let confirmText = tMsg('Revoke', 'Cabut');

  if (isRequesting) {
    title = tMsg('Decline Request?', 'Tolak Permintaan?');
    description = tMsg(
      'Are you sure you want to decline this access request?',
      'Apakah Anda yakin ingin menolak permintaan akses ini?'
    );
    confirmText = tMsg('Decline', 'Tolak');
  } else if (isPending) {
    title = tMsg('Cancel Invitation?', 'Batalkan Undangan?');
    description = tMsg(
      'Are you sure you want to cancel this invitation?',
      'Apakah Anda yakin ingin membatalkan undangan ini?'
    );
    confirmText = tMsg('Cancel Invite', 'Batal Undang');
  }

  return (
    <BaseConfirmModal
      onClose={() => setMemberToRevoke(null)}
      onConfirm={confirmRevokeMember}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={tMsg('Cancel', 'Batal')}
    />
  );
}

export function TransferOwnershipModal({
  transferTargetUsername,
  setTransferTargetUsername,
  confirmTransferOwnership,
  language,
  isSubmitting,
}) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <BaseConfirmModal
      onClose={() => setTransferTargetUsername(null)}
      onConfirm={confirmTransferOwnership}
      title={tMsg('Transfer Ownership', 'Transfer Kepemilikan')}
      description={tMsg(
        `Are you sure you want to hand over ownership to @${transferTargetUsername}? You will be demoted to a regular member and lose administrative rights to this project.`,
        `Apakah Anda yakin ingin menyerahkan kepemilikan ke @${transferTargetUsername}? Anda akan turun menjadi anggota biasa dan kehilangan hak administratif atas proyek ini.`
      )}
      confirmText={tMsg('Transfer', 'Transfer')}
      cancelText={tMsg('Cancel', 'Batal')}
      icon="👑"
      color="amber"
      isSubmitting={isSubmitting}
    />
  );
}

export function DeleteBoardModal({
  boardToDelete,
  setBoardToDelete,
  deleteBoardConfirmText,
  setDeleteBoardConfirmText,
  confirmDeleteBoard,
  language,
  isSubmitting,
}) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <BaseConfirmModal
      onClose={() => {
        setBoardToDelete(null);
        setDeleteBoardConfirmText('');
      }}
      onConfirm={confirmDeleteBoard}
      title={tMsg('Delete Project?', 'Hapus Proyek?')}
      description={
        <>
          {tMsg('Are you sure you want to delete', 'Apakah Anda yakin ingin menghapus')} <br />
          <strong className="text-black dark:text-white font-bold border-b border-black dark:border-white">
            {boardToDelete.name}
          </strong>{' '}
          {tMsg('and all its tasks?', 'dan semua tugasnya?')}
          <br /> {tMsg('This action cannot be undone.', 'Tindakan ini tidak dapat dibatalkan.')}
        </>
      }
      confirmText={tMsg('Delete', 'Hapus')}
      cancelText={tMsg('Cancel', 'Batal')}
      isSubmitting={isSubmitting}
      matchText={boardToDelete.name}
      inputText={deleteBoardConfirmText}
      setInputText={setDeleteBoardConfirmText}
      matchLabel={
        <>
          {tMsg('Type', 'Ketik')} <strong className="text-red-500">{boardToDelete.name}</strong>{' '}
          {tMsg('to confirm:', 'untuk konfirmasi:')}
        </>
      }
      matchPlaceholder={tMsg('Enter project name', 'Masukkan nama proyek')}
    />
  );
}

export function ExportModal({
  setIsExportModalOpen,
  exportMode,
  handleExportCSV,
  exportStartDate,
  setExportStartDate,
  exportEndDate,
  setExportEndDate,
  language,
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsExportModalOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-sm text-center ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <h2 className="text-2xl font-black text-black dark:text-white mb-2 uppercase">
          {exportMode === 'global' ? tMsg('Global Report', 'Laporan Global') : tMsg('Export Data', 'Ekspor Data')}
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-8">
          {exportMode === 'global'
            ? tMsg('Export all your assigned tasks across all projects.', 'Ekspor semua tugas Anda di seluruh proyek.')
            : tMsg('Select a date range to export tasks.', 'Pilih rentang tanggal untuk diekspor.')}
        </p>

        <form onSubmit={handleExportCSV} className="text-left space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
              {tMsg('Start Date (Optional)', 'Tanggal Mulai (Opsional)')}
            </label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 outline-none text-xs tracking-widest uppercase transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
              {tMsg('End Date (Optional)', 'Tanggal Akhir (Opsional)')}
            </label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 outline-none text-xs tracking-widest uppercase transition-all"
            />
          </div>

          <div className="flex justify-between gap-4 pt-6 mt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={close}
              className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
            >
              {tMsg('Cancel', 'Batal')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-black dark:bg-white dark:text-black border border-black dark:border-white shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
            >
              {tMsg('Export', 'Ekspor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateBoardModal({
  setIsCreateBoardOpen,
  handleCreateBoard,
  newBoardName,
  setNewBoardName,
  isPrivateBoard,
  setIsPrivateBoard,
  language,
  isSubmitting,
}) {
  const [isClosing, close] = useCloseAnimation(() => {
    setIsCreateBoardOpen(false);
    setNewBoardName('');
    if (setIsPrivateBoard) setIsPrivateBoard(false);
  });
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md rounded-3xl md:rounded-[2.5rem] ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <h2 className="text-3xl font-black text-black dark:text-white mb-2 uppercase">
          {tMsg('New Project', 'Proyek Baru')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
          {tMsg('Set up a new workspace to start collaborating.', 'Siapkan ruang kerja baru untuk mulai kolaborasi.')}
        </p>
        <form onSubmit={handleCreateBoard}>
          <div className="mb-8">
            <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
              {tMsg('Project Name', 'Nama Proyek')}
            </label>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="E.g. Website Redesign"
              className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm font-bold placeholder-neutral-400 transition-all"
              required
              autoFocus
            />
          </div>
          <div className="mb-8">
            <label className="block text-[10px] font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
              {tMsg('Workspace Type', 'Tipe Ruang Kerja')}
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsPrivateBoard(false)}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  !isPrivateBoard
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                <span className="text-2xl">👥</span>
                <span className="text-xs font-bold uppercase tracking-widest">{tMsg('Team', 'Tim')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivateBoard(true)}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  isPrivateBoard
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                <span className="text-2xl">🔒</span>
                <span className="text-xs font-bold uppercase tracking-widest">{tMsg('Private', 'Pribadi')}</span>
              </button>
            </div>
            {!isPrivateBoard && (
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-3 font-medium bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                {tMsg(
                  'Collaborative workspace. You can invite team members, share tasks, and chat together in real-time.',
                  'Ruang kerja kolaboratif. Anda dapat mengundang anggota tim, berbagi tugas, dan mengobrol bersama secara real-time.'
                )}
              </p>
            )}
            {isPrivateBoard && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-3 font-medium bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                {tMsg(
                  'Only you can access this workspace. Team chat and invitations will be permanently disabled.',
                  'Hanya Anda yang dapat mengakses ruang kerja ini. Obrolan tim dan undangan akan dinonaktifkan secara permanen.'
                )}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={close}
              className="px-8 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
            >
              {tMsg('Cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-4 rounded-full font-bold text-white transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-black dark:border-white ${
                isSubmitting
                  ? 'bg-neutral-600 dark:bg-neutral-400 dark:text-neutral-900 border-neutral-600 dark:border-neutral-400'
                  : 'bg-black hover:opacity-80 dark:bg-white dark:text-black hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner /> {tMsg('Creating...', 'Membuat...')}
                </>
              ) : (
                tMsg('Create Project', 'Buat Proyek')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TeamModal({
  setIsTeamModalOpen,
  handleInviteTeam,
  inviteInput,
  handleInviteInputChange,
  inviteSuggestions,
  inviteIndex,
  setInviteIndex,
  setInviteSuggestions,
  avatarsMap,
  currentUser,
  applyInviteSuggestion,
  myTeam,
  handleRevokeMember,
  handleAcceptAccessRequest,
  handleTransferToMember,
  language,
  selectedBoard,
  isSuperAdmin,
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsTeamModalOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const isOwner = selectedBoard?.owner_username === currentUser || isSuperAdmin;
  const isRealOwner = selectedBoard?.owner_username === currentUser;
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-2xl flex flex-col max-h-[90vh] ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <h2 className="text-3xl font-black text-black dark:text-white mb-2 flex items-center gap-3">
          <span className="text-4xl">🤝</span> {tMsg('Project Members', 'Anggota Proyek')}
        </h2>

        {isOwner && (
          <form onSubmit={handleInviteTeam} className="shrink-0 mt-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {tMsg(
                'Invite by username or email. Use commas for multiple users.',
                'Undang dengan nama pengguna atau email. Gunakan koma untuk mengundang lebih dari satu.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inviteInput}
                  onChange={handleInviteInputChange}
                  onKeyDown={(e) => {
                    if (inviteSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setInviteIndex((prev) => (prev + 1) % inviteSuggestions.length);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setInviteIndex((prev) => (prev - 1 + inviteSuggestions.length) % inviteSuggestions.length);
                      } else if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        applyInviteSuggestion(inviteSuggestions[inviteIndex].username);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setInviteSuggestions([]);
                      }
                    }
                  }}
                  placeholder="e.g. john, jane@innocean.co.id, mike..."
                  className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-full focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm font-medium placeholder-neutral-400 transition-all"
                  required
                  autoComplete="off"
                />

                {inviteSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-2 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2">
                    {inviteSuggestions.map((u, idx) => (
                      <div
                        key={u.username}
                        className={`px-4 py-3 cursor-pointer flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 last:border-0 transition-colors ${
                          inviteIndex === idx
                            ? 'bg-neutral-200 dark:bg-neutral-800'
                            : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                        }`}
                        onClick={() => applyInviteSuggestion(u.username)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={u.username}
                            url={avatarsMap[u.username]}
                            size="w-6 h-6"
                            textClass="text-[8px]"
                          />
                          <span className="text-sm text-black dark:text-white font-bold">@{u.username}</span>
                        </div>
                        <span className="text-xs text-neutral-400 truncate ml-4">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-white bg-black hover:opacity-80 dark:bg-white dark:text-black shadow-md transition-all shrink-0 text-sm hover:-translate-y-0.5"
              >
                {tMsg('Invite', 'Undang')}
              </button>
            </div>
          </form>
        )}

        <div
          className={`flex-1 overflow-y-auto border-neutral-200 dark:border-neutral-800 ${
            isOwner ? 'border-t pt-8 mt-2' : 'mt-4'
          }`}
        >
          <h3 className="text-lg font-bold text-black dark:text-white mb-4">
            {tMsg('Team Directory', 'Direktori Tim')} ({myTeam.length + 1})
          </h3>
          <div className="space-y-4 pr-2">
            {selectedBoard && (
              <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={selectedBoard.owner_username}
                    url={avatarsMap[selectedBoard.owner_username]}
                    size="w-10 h-10"
                    textClass="text-sm"
                  />
                  <div>
                    <p className="font-bold text-sm text-black dark:text-white">@{selectedBoard.owner_username}</p>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {tMsg('Project Owner', 'Pemilik Proyek')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {myTeam.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6 italic">
                {tMsg('No team members yet.', 'Belum ada anggota tim.')}
              </p>
            ) : (
              myTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={member.username}
                      url={avatarsMap[member.username]}
                      size="w-10 h-10"
                      textClass="text-sm"
                    />
                    <div>
                      <p className="font-bold text-sm text-black dark:text-white">@{member.username}</p>
                      <p
                        className={`text-xs font-medium capitalize ${
                          member.status === 'accepted'
                            ? 'text-black dark:text-white'
                            : member.status === 'requesting'
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {member.status === 'requesting' ? tMsg('Requesting Access', 'Meminta Akses') : member.status}
                      </p>
                    </div>
                  </div>
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      {member.status === 'requesting' ? (
                        <>
                          <button
                            onClick={() => handleAcceptAccessRequest(member.id)}
                            className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-500 hover:text-white px-4 py-2.5 rounded-full transition-all border border-emerald-200 dark:border-emerald-800/50 shadow-sm"
                          >
                            {tMsg('Accept', 'Terima')}
                          </button>
                          <button
                            onClick={() => handleRevokeMember(member.id)}
                            className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-full transition-all border border-red-200 dark:border-red-800/50 shadow-sm"
                          >
                            {tMsg('Decline', 'Tolak')}
                          </button>
                        </>
                      ) : (
                        <>
                          {isRealOwner && member.status === 'accepted' && (
                            <button
                              onClick={() => handleTransferToMember(member.username)}
                              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-600 hover:text-white px-4 py-2.5 rounded-full transition-all border border-indigo-100 dark:border-indigo-800/50 shadow-sm"
                              title={tMsg('Hand over ownership to this user', 'Serahkan kepemilikan ke pengguna ini')}
                            >
                              👑 <span className="hidden sm:inline">{tMsg('Make Owner', 'Jadikan Pemilik')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRevokeMember(member.id)}
                            className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-full transition-all border border-red-200 dark:border-red-800/50 shadow-sm"
                          >
                            {member.status === 'pending'
                              ? tMsg('Cancel Invite', 'Batal Undang')
                              : tMsg('Revoke', 'Cabut')}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    member.username === currentUser && (
                      <button
                        onClick={() => handleRevokeMember(member.id)}
                        className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-full transition-all"
                      >
                        {tMsg('Leave Project', 'Keluar Proyek')}
                      </button>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="shrink-0 mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={close}
            className="px-10 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-sm"
          >
            {tMsg('Close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InvitationsModal({
  setIsInvitesModalOpen,
  invitations,
  handleAcceptInvite,
  handleDeclineInvite,
  language,
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsInvitesModalOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-md max-h-[80vh] flex flex-col ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="flex justify-between items-center mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-8">
          <h2 className="text-3xl font-black text-black dark:text-white">
            🔔 {tMsg('Invitations', 'Undangan')}
          </h2>
          <span className="bg-black text-white dark:bg-white dark:text-black font-bold px-3 py-1 rounded-full shadow-sm text-xs">
            {invitations.length} {tMsg('New', 'Baru')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {invitations.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-sm font-medium">
                {tMsg('You have no pending invitations.', 'Anda tidak memiliki undangan tertunda.')}
              </p>
            </div>
          ) : (
            invitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-3xl p-6 flex flex-col gap-4"
              >
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <strong className="text-black dark:text-white font-bold bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                    @{inv.owner_username}
                  </strong>{' '}
                  {tMsg('invited you to collaborate on:', 'mengundang Anda untuk berkolaborasi di:')} <br />
                  <b className="text-base text-black dark:text-white mt-3 inline-block">{inv.board_name}</b>
                </p>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:opacity-80 font-bold py-3 rounded-full transition-all text-sm shadow-md hover:-translate-y-0.5"
                  >
                    {tMsg('Accept', 'Terima')}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    className="flex-1 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700 font-bold py-3 rounded-full transition-colors text-sm"
                  >
                    {tMsg('Decline', 'Tolak')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={close}
            className="px-10 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-sm"
          >
            {tMsg('Close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ColumnModal({ colModal, setColModal, handleColSubmit, language }) {
  const [isClosing, close] = useCloseAnimation(() =>
    setColModal({ isOpen: false, target: 'Status', mode: 'add', oldName: '', newName: '' })
  );
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-sm ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <h2 className="text-2xl font-black text-black dark:text-white mb-6 uppercase">
          {colModal.mode === 'add'
            ? `➕ ${tMsg('Add New', 'Tambah Baru')} ${colModal.target}`
            : colModal.mode === 'rename'
            ? `✏️ ${tMsg('Rename', 'Ubah Nama')} ${colModal.target}`
            : `⚠️ ${tMsg('Delete', 'Hapus')} ${colModal.target}`}
        </h2>
        <form onSubmit={handleColSubmit}>
          {colModal.mode !== 'delete' ? (
            <input
              type="text"
              value={colModal.newName}
              onChange={(e) => setColModal({ ...colModal, newName: e.target.value })}
              placeholder={tMsg(
                `ENTER ${colModal.target.toUpperCase()} NAME...`,
                `MASUKKAN NAMA ${colModal.target.toUpperCase()}...`
              )}
              className="w-full p-4 mb-8 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none uppercase tracking-widest text-xs font-bold placeholder-neutral-400 transition-all"
              autoFocus
              required
            />
          ) : (
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
                ⚠️
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium text-center leading-relaxed">
                {tMsg('Are you sure you want to delete the', 'Apakah Anda yakin ingin menghapus')} <br />
                <strong className="text-black dark:text-white font-bold border-b border-black dark:border-white">
                  {colModal.oldName}
                </strong>
                ?
                {colModal.target === 'Category' && (
                  <span className="block mt-4 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg font-bold border border-red-100 dark:border-red-800/50">
                    {tMsg(
                      'All tasks in this category will be automatically moved to "Other".',
                      'Semua tugas dalam kategori ini akan otomatis dipindahkan ke "Other".'
                    )}
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-4 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={close}
              className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
            >
              {tMsg('Cancel', 'Batal')}
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-4 rounded-full font-bold text-white transition-all uppercase tracking-widest text-xs shadow-md border hover:-translate-y-0.5 ${
                colModal.mode === 'delete'
                  ? 'bg-red-500 hover:bg-red-600 border-red-500'
                  : 'bg-black dark:bg-white dark:text-black hover:opacity-80 border-black dark:border-white'
              }`}
            >
              {colModal.mode === 'add'
                ? tMsg('Add', 'Tambah')
                : colModal.mode === 'rename'
                ? tMsg('Save', 'Simpan')
                : tMsg('Delete', 'Hapus')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LeaveModal({
  setIsLeaveModalOpen,
  handleAddLeave,
  leaveForm,
  setLeaveForm,
  isSuperAdmin,
  currentUser,
  leaves,
  handleDeleteLeave,
  formatDateMMM,
  language,
  isSubmitting,
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsLeaveModalOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl flex flex-col max-h-[90vh] rounded-3xl md:rounded-[2.5rem] ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2 flex items-center gap-3">
          🌴 {tMsg('Time Off & Holidays', 'Cuti & Libur Nasional')}
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-8">
          {tMsg(
            'Manage personal leaves and view public holidays.',
            'Kelola cuti pribadi dan lihat hari libur nasional.'
          )}
        </p>

        <form
          onSubmit={handleAddLeave}
          className="flex flex-col gap-4 mb-8 shrink-0 bg-neutral-50 dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800"
        >
          <div className="flex items-center gap-4 group">
            <span
              className="text-neutral-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors w-8 text-center text-xl shrink-0"
              title="Leave Date Range"
            >
              📅
            </span>
            <div className="flex-1 bg-white dark:bg-black rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 transition-all flex items-center p-1.5 px-3 shadow-sm">
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  className="w-full bg-transparent border-0 focus:ring-0 p-2 text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 cursor-pointer outline-none uppercase tracking-wider"
                  title="Start Date"
                  required
                />
                <span className="hidden sm:block text-neutral-300 dark:text-neutral-700 font-bold">➔</span>
                <input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  className="w-full bg-transparent border-0 focus:ring-0 p-2 text-[10px] sm:text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider"
                  title="End Date (Optional)"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <input
              type="text"
              value={leaveForm.desc}
              onChange={(e) => setLeaveForm({ ...leaveForm, desc: e.target.value })}
              placeholder={tMsg('Reason / Description...', 'Alasan / Deskripsi...')}
              className="flex-1 w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-xs font-bold text-black dark:text-white outline-none uppercase placeholder-neutral-400"
              required
            />
            {isSuperAdmin && (
              <select
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-xs font-bold text-black dark:text-white outline-none uppercase"
              >
                <option value="personal">{tMsg('Personal Leave', 'Cuti Pribadi')}</option>
                <option value="mass_leave">
                  {tMsg('Mass Leave / Public Holiday', 'Cuti Bersama / Libur Nasional (Admin)')}
                </option>
              </select>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold px-8 py-3 rounded-xl text-xs uppercase hover:opacity-80 transition-all shadow-md w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner /> {tMsg('Adding...', 'Menambah...')}
                </>
              ) : (
                tMsg('Add Leave', 'Tambah Cuti')
              )}
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {leaves
            .sort((a, b) => new Date(a.leave_date) - new Date(b.leave_date))
            .map((l) => (
              <div
                key={l.id}
                className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {l.leave_type === 'personal' ? '🌴' : l.leave_type === 'mass_leave' ? '🏖️' : '🎌'}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-black dark:text-white uppercase tracking-wider">
                      {l.leave_type === 'personal' && l.username !== currentUser ? `@${l.username} : ` : ''}
                      {l.description}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">
                      {formatDateMMM(l.leave_date)} • {l.leave_type.replace('_', ' ')}
                      {l.leave_type === 'personal' && l.username === currentUser ? tMsg(' (YOU)', ' (ANDA)') : ''}
                    </p>
                  </div>
                </div>
                {l.leave_type !== 'public_holiday' && (l.username === currentUser || isSuperAdmin) && (
                  <button
                    onClick={() => handleDeleteLeave(l.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg text-[10px] font-bold uppercase transition-colors"
                  >
                    {tMsg('Delete', 'Hapus')}
                  </button>
                )}
              </div>
            ))}
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 mt-6 flex justify-end shrink-0">
          <button
            onClick={close}
            className="px-10 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
          >
            {tMsg('Close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackModal({
  setIsFeedbackOpen,
  feedbackText,
  setFeedbackText,
  handleFeedbackSubmit,
  language,
  isSubmitting,
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsFeedbackOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[80] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-md ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500 rounded-full flex items-center justify-center mb-6 text-3xl shadow-sm border border-yellow-200 dark:border-yellow-800/50">
          💡
        </div>
        <h2 className="text-3xl font-black text-black dark:text-white mb-2">
          {tMsg('Submit Idea', 'Kirim Ide')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
          {tMsg(
            'Help us improve the system. Your idea will be sent to the Admin queue.',
            'Bantu kami meningkatkan sistem. Ide Anda akan dikirim ke antrean Admin.'
          )}
        </p>

        <form onSubmit={handleFeedbackSubmit}>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={tMsg('I think it would be great if...', 'Menurut saya akan luar biasa jika...')}
            className="w-full p-4 mb-8 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black focus:outline-none text-sm placeholder-neutral-400 transition-all min-h-[120px] resize-y shadow-inner"
            required
            autoFocus
          ></textarea>

          <div className="flex justify-end gap-4 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={close}
              className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-sm"
            >
              {tMsg('Cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-black dark:bg-white dark:text-black border border-black dark:border-white shadow-lg transition-all text-sm hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner /> {tMsg('Sending...', 'Mengirim...')}
                </>
              ) : (
                tMsg('Send Idea', 'Kirim Ide')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ContactSupportModal({
  setIsSupportOpen,
  supportText,
  setSupportText,
  handleSupportSubmit,
  language,
  isSubmitting,
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsSupportOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[80] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-md ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-6 text-3xl shadow-sm border border-blue-200 dark:border-blue-800/50">
          🎧
        </div>
        <h2 className="text-3xl font-black text-black dark:text-white mb-2">
          {tMsg('Contact Support', 'Hubungi Dukungan')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
          {tMsg(
            'Having trouble? Describe your issue below and our IT Support team will assist you.',
            'Mengalami masalah? Jelaskan masalah Anda di bawah ini dan tim IT kami akan membantu.'
          )}
        </p>

        <form onSubmit={handleSupportSubmit}>
          <textarea
            value={supportText}
            onChange={(e) => setSupportText(e.target.value)}
            placeholder={tMsg('I am unable to do...', 'Saya tidak bisa melakukan...')}
            className="w-full p-4 mb-8 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-black focus:outline-none text-sm placeholder-neutral-400 transition-all min-h-[120px] resize-y shadow-inner"
            required
            autoFocus
          ></textarea>

          <div className="flex justify-end gap-4 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={close}
              className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors text-sm"
            >
              {tMsg('Cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all text-sm hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner /> {tMsg('Sending...', 'Mengirim...')}
                </>
              ) : (
                tMsg('Send Message', 'Kirim Pesan')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LogoutConfirmModal({ setIsLogoutConfirmOpen, handleLogout, language }) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  return (
    <BaseConfirmModal
      onClose={() => setIsLogoutConfirmOpen(false)}
      onConfirm={handleLogout}
      title={tMsg('Sign Out?', 'Keluar?')}
      description={tMsg(
        'Are you sure you want to sign out of your account?',
        'Apakah Anda yakin ingin keluar dari akun Anda?'
      )}
      confirmText={tMsg('Sign Out', 'Keluar')}
      cancelText={tMsg('Cancel', 'Batal')}
      icon="🚪"
    />
  );
}

export function NotificationModal({
  notification,
  setNotification,
  language,
  notifPosition = 'bottom-right',
  notifSound = true,
  notifPrivacy = false,
}) {
  const [isClosing, close] = useCloseAnimation(() => setNotification(null));
  const tMsg = (en, id) => (language === 'id' ? id : en);

  useEffect(() => {
    if (notifSound) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notification.type === 'error' ? 440 : 880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    }
    const timer = setTimeout(() => {
      close();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!notification) return null;

  const isToast = notifPosition !== 'center';
  const posClasses = {
    'top-left': 'top-4 left-4 items-start justify-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-start justify-center',
    'top-right': 'top-4 right-4 items-start justify-end',
    center: 'inset-0 items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-md',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-end justify-center',
    'bottom-right': 'bottom-4 right-4 items-end justify-end',
  };

  const animationClass = isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100';
  const displayMessage =
    notifPrivacy && notification.type !== 'error' && notification.type !== 'success'
      ? tMsg('You have a new notification.', 'Anda memiliki notifikasi baru.')
      : notification.message.replace(/(?:<!--|&lt;!--)\s*TASK_ID:\d+\s*(?:-->|--&gt;)/gi, '');

  return (
    <div
      className={`fixed flex ${posClasses[notifPosition]} pointer-events-none transition-all duration-300 ${
        isToast ? 'p-0' : 'p-4'
      } ${!isToast && isClosing ? 'opacity-0' : 'opacity-100'}`}
      style={{ zIndex: 9999 }}
    >
      <div
        className={`pointer-events-auto bg-white dark:bg-neutral-950 p-5 ${
          isToast
            ? 'w-80 shadow-2xl rounded-2xl flex-row text-left border border-neutral-200 dark:border-neutral-800'
            : 'w-full max-w-sm shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center flex-col items-center border border-neutral-200 dark:border-neutral-800'
        } flex gap-4 transform transition-all duration-300 ${animationClass}`}
      >
        <div
          className={`${
            isToast ? 'w-10 h-10 text-xl' : 'w-20 h-20 text-4xl mb-6'
          } rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
            notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-200 dark:border-red-800/50'
              : notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 border-emerald-200 dark:border-emerald-800/50'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 border-blue-200 dark:border-blue-800/50'
          }`}
        >
          {notification.type === 'error' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}
        </div>
        <div className={`flex-1 ${isToast ? 'min-w-0' : 'w-full'}`}>
          <h3
            className={`${
              isToast ? 'text-sm mb-1' : 'text-2xl mb-2'
            } font-black text-black dark:text-white uppercase`}
          >
            {notification.type === 'error'
              ? tMsg('Error', 'Kesalahan')
              : notification.type === 'success'
              ? tMsg('Success', 'Berhasil')
              : tMsg('Notice', 'Pemberitahuan')}
          </h3>
          <p
            className={`text-neutral-600 dark:text-neutral-400 ${
              isToast ? 'text-xs' : 'mb-8 text-sm'
            } font-medium leading-relaxed break-words`}
          >
            {displayMessage}
          </p>
          {!isToast && (
            <button
              onClick={close}
              className="w-full px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs mt-4"
            >
              {tMsg('Dismiss', 'Tutup')}
            </button>
          )}
        </div>
        {isToast && (
          <button
            onClick={close}
            className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors self-start ml-2 shrink-0"
          >
            ✖
          </button>
        )}
      </div>
    </div>
  );
}

export function MyTicketsModal({ setIsMyTicketsOpen, language, setSelectedTask, notifications }) {
  const [isClosing, close] = useCloseAnimation(() => setIsMyTicketsOpen(false));
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Feedback');
  const tMsg = (en, id) => (language === 'id' ? id : en);

  useEffect(() => {
    axios
      .get('/api/my-tickets')
      .then((res) => {
        setTickets(res.data.tickets || []);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
      });
  }, []);

  const filteredTickets = tickets.filter((t) => t.category === activeTab);

  const handleTicketClick = (ticket) => {
    close();
    axios
      .get(`/api/tasks/${ticket.id}`)
      .then((res) => {
        setSelectedTask(res.data.task);
      })
      .catch((err) => alert(tMsg('Failed to load ticket details.', 'Gagal memuat detail tiket.')));
  };

  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[80] p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] flex flex-col ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="flex justify-between items-center mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-6 shrink-0">
          <h2 className="text-2xl font-black text-black dark:text-white uppercase flex items-center gap-3">
            <span className="text-3xl">🎫</span> {tMsg('My Tickets & Feedback', 'Tiket & Masukan Saya')}
          </h2>
          <button onClick={close} className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex border-b border-neutral-200 dark:border-neutral-800 shrink-0 mb-4 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('Feedback')}
            className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all rounded-md ${
              activeTab === 'Feedback'
                ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                : 'text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            💡 {tMsg('System Feedback', 'Masukan Sistem')}
          </button>
          <button
            onClick={() => setActiveTab('Support')}
            className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all rounded-md ${
              activeTab === 'Support'
                ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                : 'text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            🎧 {tMsg('Contact Support', 'Dukungan IT')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-sm font-medium">
                {tMsg('No items found in this category.', 'Tidak ada item ditemukan di kategori ini.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleTicketClick(t)}
                  className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-black dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {t.project_name}
                      {notifications && notifications.some((n) => !n.is_read && n.related_task_id === t.id) && (
                        <span className="ml-2 w-2 h-2 inline-block bg-red-500 rounded-full animate-pulse align-middle"></span>
                      )}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ml-4 ${
                        t.status === 'Done'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : t.status === 'Rejected'
                          ? 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                    <span>{t.category}</span>
                    <div className="flex items-center gap-2">
                      <span>{t.timestamp.split(' ')[0]}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
                        {tMsg('View Details →', 'Lihat Detail →')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
