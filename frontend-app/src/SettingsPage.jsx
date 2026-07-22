import React, { useState } from 'react';
import { Avatar, SegmentedControl } from './SharedUI';

const SettingsSection = ({ title, description, children }) => (
  <div className="animate-in fade-in duration-300">
    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-8">{description}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

const TabButton = ({ id, icon, label, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
      activeTab === id
        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
        : 'text-neutral-500 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-white'
    }`}
  >
    <span className="text-lg w-6 text-center">{icon}</span>
    <span>{label}</span>
  </button>
);

const SettingItem = ({ title, description, children, stack = false }) => (
  <div
    className={`flex ${
      stack ? 'flex-col gap-4' : 'flex-col sm:flex-row sm:items-center justify-between gap-6'
    } border-b border-neutral-200 dark:border-neutral-800/50 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0`}
  >
    <div className="flex-1 pr-0 sm:pr-8">
      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{title}</h4>
      {description && (
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
    <div className={`shrink-0 ${stack ? 'w-full' : 'w-full sm:w-auto flex justify-start sm:justify-end items-center'}`}>
      {children}
    </div>
  </div>
);

export default function SettingsPage({
  closeSettings,
  profileData,
  setProfileData,
  handleUpdateProfile,
  handleAvatarUpload,
  appTheme,
  handleSelectAppTheme,
  appBgImage,
  handleAppBgUpload,
  removeAppBgImage,
  appTexture,
  handleSelectAppTexture,
  chatBg,
  handleChatBgUpload,
  removeChatBg,
  handleSelectDefaultBg,
  cardTheme,
  handleSelectCardTheme,
  isDarkMode,
  setIsDarkMode,
  language,
  setLanguage,
  tMsg,
  dateFormat,
  setDateFormat,
  showLiveClock,
  setShowLiveClock,
  showLiveClockDate,
  setShowLiveClockDate,
  pomodoroEnabled,
  setPomodoroEnabled,
  showAssistantButton,
  setShowAssistantButton,
  notifPosition,
  setNotifPosition,
  notifSound,
  setNotifSound,
  notifPrivacy,
  setNotifPrivacy,
  browserNotifEnabled,
  setBrowserNotifEnabled,
  showNotification,
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const onProfileSubmit = (e) => {
    e.preventDefault();
    if (profileData.new_password && profileData.new_password !== confirmPassword) {
      showNotification(
        tMsg('New password and confirm password do not match!', 'Kata sandi baru dan konfirmasi tidak cocok!'),
        'error'
      );
      return;
    }
    handleUpdateProfile(e);
    setConfirmPassword('');
  };

  const handleToggleBrowserNotif = (val) => {
    if (val) {
      if (!('Notification' in window)) {
        showNotification(
          tMsg('This browser does not support desktop notification', 'Browser ini tidak mendukung notifikasi desktop'),
          'error'
        );
        setBrowserNotifEnabled(false);
        return;
      }
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          setBrowserNotifEnabled(true);
          localStorage.setItem('innocean_browser_notif', 'true');
          new Notification('INNOCEAN Tracker', {
            body: tMsg('Desktop notifications enabled!', 'Notifikasi desktop diaktifkan!'),
          });
        } else {
          setBrowserNotifEnabled(false);
          localStorage.setItem('innocean_browser_notif', 'false');
          showNotification(
            tMsg('Notification permission denied by browser.', 'Izin notifikasi ditolak oleh browser.'),
            'error'
          );
        }
      });
    } else {
      setBrowserNotifEnabled(false);
      localStorage.setItem('innocean_browser_notif', 'false');
    }
  };

  const handlePreviewNotif = (msg, type) => {
    showNotification(msg, type);
    if (browserNotifEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('INNOCEAN Tracker', { body: msg });
    }
  };

  const triggerClose = () => {
    setIsClosing(true);
    setTimeout(closeSettings, 200); // Sesuaikan dengan durasi mac-exit
  };

  const defaultBackgrounds = [
    'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(to right, #434343 0%, #000000 100%)',
  ];

  const uiThemes = [
    { name: 'Default', value: '' },
    { name: 'Gamer Dark', value: 'gamer' },
    { name: 'Minimal Light', value: 'minimal' },
    { name: 'Sunset Glass', value: 'sunset' },
    { name: 'Hacker Terminal', value: 'hacker' },
    { name: 'Chat App Dark', value: 'chatapp' },
    { name: 'Code Editor', value: 'editor' },
    { name: 'Cupertino', value: 'cupertino' },
    { name: 'Social Blue', value: 'social' },
    { name: 'Retail Orange', value: 'retail' },
  ];

  const gradientThemes = [
    { name: 'Midnight Dust', value: 'linear-gradient(to right, #243949 0%, #517fa4 100%)' },
    { name: 'Plum Plate', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Sunset Peach', value: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)' },
    { name: 'Rosy Pink', value: 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Lavender Blush', value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
    { name: 'Mint Breeze', value: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)' },
    { name: 'Ocean Blue', value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
    { name: 'Dark Noir', value: 'linear-gradient(to right, #434343 0%, #000000 100%)' },
    { name: 'Warm Flame', value: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
    { name: 'Night Sky', value: 'linear-gradient(to top, #1e3c72 0%, #2a5298 100%)' },
    { name: 'Forest', value: 'linear-gradient(to top, #5ee7df 0%, #b490ca 100%)' },
    { name: 'Amour', value: 'linear-gradient(to top, #f77062 0%, #fe5196 100%)' },
    { name: 'Royal Purple', value: 'linear-gradient(to top, #c471f5 0%, #fa71cd 100%)' },
    { name: 'Cherry', value: 'linear-gradient(to right, #eb3349 0%, #f45c43 100%)' },
    { name: 'Deep Space', value: 'linear-gradient(to right, #000000 0%, #434343 100%)' },
    { name: 'Soft Grass', value: 'linear-gradient(to right, #c1dfc4 0%, #deecdd 100%)' },
    { name: 'Magic', value: 'linear-gradient(to right, #ff758c 0%, #ff7eb3 100%)' },
    { name: 'Coffee', value: 'linear-gradient(to right, #b9935a 0%, #e7c582 100%)' },
    { name: 'Hazy Apple', value: 'linear-gradient(to right, #fdfbfb 0%, #ebedee 100%)' },
  ];

  const InputClass =
    'w-full md:w-72 bg-neutral-50 dark:bg-[#0e1116] border border-neutral-200 dark:border-neutral-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-2.5 text-sm font-bold text-black dark:text-white transition-all outline-none shadow-inner placeholder-neutral-400 dark:placeholder-neutral-600';

  return (
    <div
      className={`fixed inset-0 bg-neutral-50 dark:bg-[#0e1116] overflow-y-auto z-[100] ${
        isClosing ? 'mac-exit' : 'mac-animate'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-8 md:py-16">
        <div className="mb-12 flex justify-between items-center mac-animate">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <span className="text-3xl md:text-4xl">⚙️</span> {tMsg('Settings', 'Pengaturan')}
          </h2>
          <button
            onClick={triggerClose}
            className="text-neutral-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold flex items-center gap-2 transition-colors text-xs md:text-sm uppercase tracking-widest"
          >
            <span className="hidden sm:inline">← {tMsg('Back to App', 'Kembali')}</span>
            <span className="sm:hidden text-2xl">✖</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 mac-animate" style={{ animationDelay: '100ms' }}>
          {/* Left Navigation */}
          <div className="md:w-64 shrink-0 space-y-2">
            <TabButton
              id="profile"
              icon="👤"
              label={tMsg('Account Profile', 'Profil Akun')}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              id="appearance"
              icon="🎨"
              label={tMsg('Appearance', 'Tampilan')}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              id="preferences"
              icon="🛠️"
              label={tMsg('Preferences', 'Preferensi')}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              id="notifications"
              icon="🔔"
              label={tMsg('Notifications', 'Notifikasi')}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 bg-white dark:bg-[#15181e] p-6 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <SettingsSection
                title={tMsg('Account Profile', 'Profil Akun')}
                description={tMsg(
                  'Manage your personal details and security credentials.',
                  'Kelola detail pribadi dan kredensial keamanan Anda.'
                )}
              >
                <form onSubmit={onProfileSubmit}>
                  <SettingItem
                    title={tMsg('Profile Avatar', 'Avatar Profil')}
                    description={tMsg(
                      'Upload a custom image to be displayed across the workspace. Maximum size is 1MB.',
                      'Unggah gambar kustom untuk ditampilkan di seluruh ruang kerja. Ukuran maksimum 1MB.'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={profileData.username}
                        url={profileData.avatar}
                        size="w-12 h-12"
                        textClass="text-sm"
                      />
                      <label className="cursor-pointer bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-black dark:text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        {tMsg('Change Avatar', 'Ganti Avatar')}{' '}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                  </SettingItem>

                  <SettingItem
                    title={tMsg('Username', 'Nama Pengguna')}
                    description={tMsg('Your unique system identifier.', 'Pengenal sistem unik Anda.')}
                  >
                    <input
                      type="text"
                      value={`@${profileData.username}`}
                      disabled
                      className={`${InputClass} opacity-50 cursor-not-allowed select-none`}
                    />
                  </SettingItem>

                  <SettingItem
                    title={tMsg('Full Name', 'Nama Lengkap')}
                    description={tMsg(
                      'Your real name for official reporting and exports.',
                      'Nama asli Anda untuk pelaporan dan ekspor resmi.'
                    )}
                  >
                    <input
                      type="text"
                      value={profileData.full_name || ''}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className={InputClass}
                      required
                    />
                  </SettingItem>

                  <SettingItem
                    title={tMsg('Email Address', 'Alamat Email')}
                    description={tMsg(
                      'Used for system notifications and account recovery.',
                      'Digunakan untuk notifikasi sistem dan pemulihan akun.'
                    )}
                  >
                    <div className="flex flex-col w-full md:w-auto">
                      <input
                        type="email"
                        value={profileData.email || ''}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className={InputClass}
                        required
                      />
                      <p className="text-[9px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest mt-1.5 px-1">
                        ⚠️{' '}
                        {tMsg(
                          'Changing email requires re-verification.',
                          'Mengubah email memerlukan verifikasi ulang.'
                        )}
                      </p>
                    </div>
                  </SettingItem>

                  <SettingItem
                    title={tMsg('Change Password', 'Ubah Kata Sandi')}
                    description={tMsg(
                      'Leave these fields blank if you do not wish to change your current password.',
                      'Biarkan kolom ini kosong jika Anda tidak ingin mengubah kata sandi saat ini.'
                    )}
                    stack={true}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="relative w-full md:w-[calc(50%-0.5rem)]">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={profileData.current_password || ''}
                          onChange={(e) => setProfileData({ ...profileData, current_password: e.target.value })}
                          className={`w-full ${InputClass}`}
                          style={{ paddingRight: '2.5rem' }}
                          placeholder={tMsg('Current Password', 'Kata Sandi Saat Ini')}
                        />
                        <button
                          type="button"
                          onMouseDown={() => setShowCurrentPass(true)}
                          onMouseUp={() => setShowCurrentPass(false)}
                          onMouseLeave={() => setShowCurrentPass(false)}
                          onTouchStart={() => setShowCurrentPass(true)}
                          onTouchEnd={() => setShowCurrentPass(false)}
                          onTouchCancel={() => setShowCurrentPass(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d={
                                showCurrentPass
                                  ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                  : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                              }
                            ></path>
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={profileData.new_password || ''}
                            onChange={(e) => setProfileData({ ...profileData, new_password: e.target.value })}
                            className={`w-full ${InputClass}`}
                            style={{ paddingRight: '2.5rem' }}
                            placeholder={tMsg('New Password', 'Kata Sandi Baru')}
                          />
                          <button
                            type="button"
                            onMouseDown={() => setShowNewPass(true)}
                            onMouseUp={() => setShowNewPass(false)}
                            onMouseLeave={() => setShowNewPass(false)}
                            onTouchStart={() => setShowNewPass(true)}
                            onTouchEnd={() => setShowNewPass(false)}
                            onTouchCancel={() => setShowNewPass(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={
                                  showNewPass
                                    ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                                }
                              ></path>
                            </svg>
                          </button>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full ${InputClass}`}
                            style={{ paddingRight: '2.5rem' }}
                            placeholder={tMsg('Confirm Password', 'Konfirmasi Sandi')}
                          />
                          <button
                            type="button"
                            onMouseDown={() => setShowConfirmPass(true)}
                            onMouseUp={() => setShowConfirmPass(false)}
                            onMouseLeave={() => setShowConfirmPass(false)}
                            onTouchStart={() => setShowConfirmPass(true)}
                            onTouchEnd={() => setShowConfirmPass(false)}
                            onTouchCancel={() => setShowConfirmPass(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer select-none"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={
                                  showConfirmPass
                                    ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                                }
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </SettingItem>

                  <div className="flex justify-end mt-8">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      💾 {tMsg('Save Profile Changes', 'Simpan Perubahan Profil')}
                    </button>
                  </div>
                </form>
              </SettingsSection>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <SettingsSection
                title={tMsg('Appearance', 'Tampilan')}
                description={tMsg(
                  'Customize the look and feel of your workspace.',
                  'Sesuaikan tampilan dan nuansa ruang kerja Anda.'
                )}
              >
                <SettingItem
                  title={tMsg('Workspace Interface Theme', 'Tema Antarmuka Ruang Kerja')}
                  description={tMsg(
                    'Change the entire look and feel of the application.',
                    'Ubah keseluruhan tampilan dan nuansa aplikasi.'
                  )}
                  stack={true}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {tMsg('Complete UI Overhauls', 'Perombakan UI Lengkap')}
                    </span>
                    {appTheme && (
                      <button
                        type="button"
                        onClick={() => handleSelectAppTheme('')}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md text-[10px] font-bold transition-colors uppercase tracking-widest"
                      >
                        {tMsg('Reset to Default', 'Atur Ulang ke Bawaan')}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {uiThemes.map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectAppTheme(bg.value)}
                        className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl border-4 transition-all shadow-sm flex items-center justify-center relative ${
                          !bg.value ? 'bg-neutral-200 dark:bg-neutral-800' : ''
                        } ${
                          appTheme === bg.value ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={
                          bg.value === 'gamer'
                            ? {
                                background:
                                  'radial-gradient(circle at top left, #2a475e 0%, #1b2838 50%, #171a21 100%)',
                              }
                            : bg.value === 'minimal'
                            ? { background: '#f8f9fa', border: '1px solid #dadce0' }
                            : bg.value === 'sunset'
                            ? {
                                background:
                                  'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                              }
                            : bg.value === 'hacker'
                            ? { background: '#373c44', border: '1px solid #21252b' }
                            : bg.value === 'chatapp'
                            ? { background: '#313338', border: '1px solid #1e1f22' }
                            : bg.value === 'editor'
                            ? { background: '#2D2A2E', border: '1px solid #221F22' }
                            : bg.value === 'cupertino'
                            ? { background: '#F5F5F7', border: '1px solid #E5E5EA' }
                            : bg.value === 'social'
                            ? { background: '#F0F2F5', border: '1px solid #CED0D4' }
                            : bg.value === 'retail'
                            ? { background: '#131921', border: '1px solid #232F3E' }
                            : {}
                        }
                        title={bg.name}
                      >
                        {!bg.value && <span className="text-lg">🚫</span>}
                        {bg.value === 'gamer' && <span className="text-lg font-black text-[#66c0f4]">G</span>}
                        {bg.value === 'minimal' && <span className="text-lg font-black text-[#1a73e8]">M</span>}
                        {bg.value === 'sunset' && <span className="text-lg font-black text-white">S</span>}
                        {bg.value === 'hacker' && <span className="text-lg font-black text-[#A6E22E]">H</span>}
                        {bg.value === 'chatapp' && <span className="text-lg font-black text-[#5865F2]">C</span>}
                        {bg.value === 'editor' && <span className="text-lg font-black text-[#a8a0ee]">E</span>}
                        {bg.value === 'cupertino' && <span className="text-lg font-black text-[#86868B]">C</span>}
                        {bg.value === 'social' && <span className="text-lg font-black text-[#1877F2]">S</span>}
                        {bg.value === 'retail' && <span className="text-lg font-black text-[#FF9900]">R</span>}
                        {appTheme === bg.value && (
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-[#15181e]">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </SettingItem>

                <SettingItem
                  title={tMsg('Gradient Backgrounds', 'Latar Belakang Gradien')}
                  description={tMsg(
                    'Apply a beautiful gradient to the default interface. (Will override UI Themes)',
                    'Terapkan gradien indah ke antarmuka bawaan. (Akan menimpa Tema UI)'
                  )}
                  stack={true}
                >
                  <div className="flex flex-wrap gap-3">
                    {gradientThemes.map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectAppTheme(bg.value)}
                        className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl border-4 transition-all shadow-sm flex items-center justify-center relative ${
                          appTheme === bg.value ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ background: bg.value }}
                        title={bg.name}
                      >
                        {appTheme === bg.value && (
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-[#15181e]">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </SettingItem>

                <SettingItem
                  title={tMsg('Texture Overlay', 'Hamparan Tekstur')}
                  description={tMsg(
                    'Apply a subtle pattern over the background to reduce eye strain.',
                    'Terapkan pola halus di atas latar belakang untuk mengurangi ketegangan mata.'
                  )}
                >
                  <div className="flex flex-wrap gap-2 justify-end w-full md:max-w-xs">
                    {[
                      { id: '', label: tMsg('None', 'Tidak Ada') },
                      { id: 'noise', label: tMsg('Noise', 'Noise') },
                      { id: 'dots', label: tMsg('Dots', 'Titik') },
                      { id: 'grid', label: tMsg('Grid', 'Kisi') },
                    ].map((tex) => (
                      <button
                        key={tex.id}
                        type="button"
                        onClick={() => handleSelectAppTexture(tex.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                          appTexture === tex.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {tex.label}
                      </button>
                    ))}
                  </div>
                </SettingItem>

                <SettingItem
                  title={tMsg('Custom Photo Wallpaper', 'Wallpaper Foto Kustom')}
                  description={tMsg(
                    'Override the theme with a local image (Max 5MB).',
                    'Timpa tema dengan gambar lokal (Maks 5MB).'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {appBgImage && (
                      <button
                        type="button"
                        onClick={removeAppBgImage}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                      >
                        {tMsg('Remove', 'Hapus')}
                      </button>
                    )}
                    <label className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm">
                      {tMsg('Upload Image', 'Unggah Gambar')}{' '}
                      <input type="file" accept="image/*" onChange={handleAppBgUpload} className="hidden" />
                    </label>
                  </div>
                </SettingItem>

                <SettingItem
                  title={tMsg('Task Card Background', 'Latar Kartu Tugas')}
                  description={tMsg(
                    'Apply a custom color specifically for active Kanban cards.',
                    'Terapkan warna kustom khusus untuk kartu Kanban yang aktif.'
                  )}
                  stack={true}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {tMsg('Available Colors', 'Warna Tersedia')}
                    </span>
                    {cardTheme && (
                      <button
                        type="button"
                        onClick={() => handleSelectCardTheme('')}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md text-[10px] font-bold transition-colors uppercase tracking-widest"
                      >
                        {tMsg('Reset', 'Atur Ulang')}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectCardTheme('')}
                      className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg border-2 transition-all shadow-sm flex items-center justify-center relative bg-neutral-200 dark:bg-neutral-800 ${
                        cardTheme === '' ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      title="None"
                    >
                      <span className="text-[10px]">🚫</span>
                      {cardTheme === '' && (
                        <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold shadow-sm ring-2 ring-white dark:ring-[#15181e]">
                          ✓
                        </div>
                      )}
                    </button>
                    {gradientThemes.map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCardTheme(bg.value)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg border-2 transition-all shadow-sm flex items-center justify-center relative ${
                          cardTheme === bg.value ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ background: bg.value }}
                        title={bg.name}
                      >
                        {cardTheme === bg.value && (
                          <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold shadow-sm ring-2 ring-white dark:ring-[#15181e]">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </SettingItem>

                <SettingItem
                  title={tMsg('Chat Area Background', 'Latar Area Obrolan')}
                  description={tMsg(
                    'Change the wallpaper behind task comments and team chat.',
                    'Ubah wallpaper di belakang komentar tugas dan obrolan tim.'
                  )}
                  stack={true}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {tMsg('Background & Gradients', 'Latar Belakang & Gradien')}
                    </span>
                    <div className="flex items-center gap-3">
                      {chatBg && (
                        <button
                          type="button"
                          onClick={removeChatBg}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors uppercase tracking-widest"
                        >
                          {tMsg('Remove', 'Hapus')}
                        </button>
                      )}
                      <label className="cursor-pointer bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                        {tMsg('Upload Image', 'Unggah Gambar')}{' '}
                        <input type="file" accept="image/*" onChange={handleChatBgUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {defaultBackgrounds.map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDefaultBg(bg)}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-800 hover:scale-110 transition-transform shadow-sm cursor-pointer"
                        style={{ background: bg }}
                        title={`Theme ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div
                    className="mt-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 h-40 overflow-hidden flex flex-col justify-end gap-3 relative bg-neutral-50 dark:bg-neutral-900 bg-cover bg-center shadow-inner"
                    style={
                      chatBg
                        ? chatBg.startsWith('data:image')
                          ? { backgroundImage: `url(${chatBg})` }
                          : { background: chatBg }
                        : {}
                    }
                  >
                    {chatBg && (
                      <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px] z-0"></div>
                    )}
                    <div className="relative z-10 self-start bg-white dark:bg-neutral-800 px-4 py-2.5 rounded-2xl rounded-tl-sm text-xs font-medium shadow-sm text-black dark:text-white max-w-[80%]">
                      {tMsg(
                        'Hey, what do you think of this background?',
                        'Hei, bagaimana menurutmu latar belakang ini?'
                      )}
                    </div>
                    <div className="relative z-10 self-end bg-indigo-600 px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs font-medium shadow-sm text-white max-w-[80%]">
                      {tMsg('Looks highly professional! ✨', 'Terlihat sangat profesional! ✨')}
                    </div>
                  </div>
                </SettingItem>
              </SettingsSection>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <SettingsSection
                title={tMsg('Preferences', 'Preferensi')}
                description={tMsg('Set your language and system modes.', 'Atur bahasa dan mode sistem Anda.')}
              >
                <SettingItem
                  title={tMsg('System Theme', 'Tema Sistem')}
                  description={tMsg(
                    'Toggle between the classic Light Mode and the sleek Dark Mode interface.',
                    'Beralih antara Mode Terang klasik dan antarmuka Mode Gelap yang elegan.'
                  )}
                >
                  <SegmentedControl
                    options={[
                      { label: '☀️ Light', value: 'light' },
                      { label: '🌙 Dark', value: 'dark' },
                    ]}
                    value={isDarkMode ? 'dark' : 'light'}
                    onChange={(val) => setIsDarkMode(val === 'dark')}
                  />
                </SettingItem>

                <SettingItem
                  title={tMsg('Language Options', 'Opsi Bahasa')}
                  description={tMsg(
                    'Select your preferred system language for all menus and labels.',
                    'Pilih bahasa sistem yang Anda inginkan untuk semua menu dan label.'
                  )}
                >
                  <SegmentedControl
                    options={[
                      { label: '🇺🇸 EN', value: 'en' },
                      { label: '🇮🇩 ID', value: 'id' },
                    ]}
                    value={language}
                    onChange={(val) => {
                      setLanguage(val);
                      localStorage.setItem('innocean_lang', val);
                    }}
                  />
                </SettingItem>

                <SettingItem
                  title={tMsg('Date Format', 'Format Tanggal')}
                  description={tMsg(
                    'Choose how dates are displayed across the application.',
                    'Pilih bagaimana tanggal ditampilkan di seluruh aplikasi.'
                  )}
                >
                  <div className="relative w-full md:w-auto">
                    <select
                      value={dateFormat}
                      onChange={(e) => {
                        setDateFormat(e.target.value);
                        localStorage.setItem('innocean_date_format', e.target.value);
                      }}
                      className={`w-full md:w-56 appearance-none pr-10 cursor-pointer ${InputClass}`}
                    >
                      <option value="DD MMM YYYY">31 Dec 2026</option>
                      <option value="MMM DD, YYYY">Dec 31, 2026</option>
                      <option value="DD/MM/YYYY">31/12/2026</option>
                      <option value="YYYY-MM-DD">2026-12-31</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 font-bold text-xs">
                      ▼
                    </div>
                  </div>
                </SettingItem>
              </SettingsSection>
            )}

            {activeTab === 'preferences' && (
              <div className="mt-10">
                <SettingsSection
                  title={tMsg('Productivity', 'Produktivitas')}
                  description={tMsg(
                    'Enable extra tools to help you focus and track time.',
                    'Aktifkan alat tambahan untuk membantu Anda fokus dan melacak waktu.'
                  )}
                >
                  <SettingItem
                    title={tMsg('Live Clock', 'Jam Langsung')}
                    description={tMsg(
                      'Show the current time in the navigation bar.',
                      'Tampilkan waktu saat ini di bilah navigasi.'
                    )}
                  >
                    <SegmentedControl
                      options={[
                        { label: 'ON', value: true },
                        { label: 'OFF', value: false },
                      ]}
                      value={showLiveClock}
                    size="small"
                      onChange={(v) => {
                        setShowLiveClock(v);
                        localStorage.setItem('innocean_show_clock', v);
                      }}
                    />
                  </SettingItem>
                  {showLiveClock && (
                    <SettingItem
                      title={tMsg('Show Date in Clock', 'Tampilkan Tanggal di Jam')}
                      description={tMsg(
                        'Display the day and date alongside the live clock.',
                        'Tampilkan hari dan tanggal di samping jam langsung.'
                      )}
                    >
                      <SegmentedControl
                        options={[
                          { label: 'ON', value: true },
                          { label: 'OFF', value: false },
                        ]}
                        value={showLiveClockDate}
                        size="small"
                        onChange={(v) => {
                          setShowLiveClockDate(v);
                          localStorage.setItem('innocean_show_clock_date', v);
                        }}
                      />
                    </SettingItem>
                  )}
                  <SettingItem
                    title={tMsg('Pomodoro Timer', 'Penghitung Waktu Pomodoro')}
                    description={tMsg(
                      'Enable a floating Pomodoro timer. The Pomodoro Technique is a time management method based on 25-minute stretches of focused work broken by 5-minute breaks.',
                      'Aktifkan penghitung waktu Pomodoro mengambang. Teknik Pomodoro adalah metode manajemen waktu berdasarkan 25 menit kerja fokus yang dipisahkan oleh 5 menit istirahat.'
                    )}
                  >
                    <SegmentedControl
                      options={[
                        { label: 'ON', value: true },
                        { label: 'OFF', value: false },
                      ]}
                      value={pomodoroEnabled}
                      size="small"
                      onChange={(v) => {
                        setPomodoroEnabled(v);
                        localStorage.setItem('innocean_pomodoro', v);
                      }}
                    />
                  </SettingItem>
                  <SettingItem
                    title={tMsg('Floating AI Assistant', 'Asisten AI Mengambang')}
                    description={tMsg(
                      'Show the floating Smart Assistant button on the bottom right of your screen. You can still access it from the Account Menu.',
                      'Tampilkan tombol Asisten Pintar mengambang di kanan bawah layar Anda. Anda tetap bisa mengaksesnya dari Menu Akun.'
                    )}
                  >
                    <SegmentedControl
                      options={[
                        { label: 'ON', value: true },
                        { label: 'OFF', value: false },
                      ]}
                      value={showAssistantButton}
                      size="small"
                      onChange={(v) => {
                        setShowAssistantButton(v);
                        localStorage.setItem('innocean_show_assistant_btn', v);
                      }}
                    />
                  </SettingItem>
                </SettingsSection>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <SettingsSection
                title={tMsg('Notifications', 'Notifikasi')}
                description={tMsg(
                  'Manage how and where you receive system alerts.',
                  'Kelola bagaimana dan di mana Anda menerima peringatan sistem.'
                )}
              >
                <SettingItem
                  title={tMsg('Notification Sound', 'Suara Notifikasi')}
                  description={tMsg(
                    'Play a short chime when a notification arrives.',
                    'Mainkan suara pendek saat notifikasi tiba.'
                  )}
                >
                  <SegmentedControl
                    options={[
                      { label: 'ON', value: true },
                      { label: 'OFF', value: false },
                    ]}
                    value={notifSound}
                    size="small"
                    onChange={(v) => {
                      setNotifSound(v);
                      localStorage.setItem('innocean_notif_sound', v);
                    }}
                  />
                </SettingItem>
                <SettingItem
                  title={tMsg('Privacy Mode', 'Mode Privasi')}
                  description={tMsg(
                    'Hide sensitive content (like messages or task names) from pop-up notifications.',
                    'Sembunyikan konten sensitif (seperti pesan atau nama tugas) dari notifikasi pop-up.'
                  )}
                >
                  <SegmentedControl
                    options={[
                      { label: 'ON', value: true },
                      { label: 'OFF', value: false },
                    ]}
                    value={notifPrivacy}
                    size="small"
                    onChange={(v) => {
                      setNotifPrivacy(v);
                      localStorage.setItem('innocean_notif_privacy', v);
                    }}
                  />
                </SettingItem>
                <SettingItem
                  title={tMsg('Desktop Notifications', 'Notifikasi Desktop')}
                  description={tMsg(
                    'Receive system alerts as native browser/OS notifications.',
                    'Terima peringatan sistem sebagai notifikasi bawaan browser/OS.'
                  )}
                >
                  <SegmentedControl
                    options={[
                      { label: 'ON', value: true },
                      { label: 'OFF', value: false },
                    ]}
                    value={browserNotifEnabled}
                    size="small"
                    onChange={handleToggleBrowserNotif}
                  />
                </SettingItem>
                <SettingItem
                  title={tMsg('Notification Position', 'Posisi Notifikasi')}
                  description={tMsg(
                    'Choose where pop-up notifications appear on your screen.',
                    'Pilih di mana notifikasi pop-up muncul di layar Anda.'
                  )}
                  stack={true}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['top-left', 'top-center', 'top-right', 'center', 'bottom-center', 'bottom-right'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => {
                          setNotifPosition(pos);
                          localStorage.setItem('innocean_notif_pos', pos);
                        }}
                        className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                          notifPosition === pos
                            ? 'bg-indigo-50 border border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300 shadow-sm'
                            : 'bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </SettingItem>
                <SettingItem
                  title={tMsg('Preview Notification', 'Pratinjau Notifikasi')}
                  description={tMsg(
                    'Test how different notification types look and sound with your current settings.',
                    'Uji tampilan dan suara berbagai jenis notifikasi dengan pengaturan Anda saat ini.'
                  )}
                  stack={true}
                >
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewNotif(
                          tMsg('This is a test info notification! ✨', 'Ini adalah notifikasi info pengujian! ✨'),
                          'info'
                        )
                      }
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border border-blue-200 dark:border-blue-800/50"
                    >
                      ℹ️ {tMsg('Preview Info', 'Pratinjau Info')}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewNotif(
                          tMsg('This is a test success notification! ✅', 'Ini adalah notifikasi sukses pengujian! ✅'),
                          'success'
                        )
                      }
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/50"
                    >
                      ✅ {tMsg('Preview Success', 'Pratinjau Sukses')}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewNotif(
                          tMsg('This is a test error notification! ⚠️', 'Ini adalah notifikasi error pengujian! ⚠️'),
                          'error'
                        )
                      }
                      className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border border-red-200 dark:border-red-800/50"
                    >
                      ⚠️ {tMsg('Preview Error', 'Pratinjau Error')}
                    </button>
                  </div>
                </SettingItem>
              </SettingsSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
