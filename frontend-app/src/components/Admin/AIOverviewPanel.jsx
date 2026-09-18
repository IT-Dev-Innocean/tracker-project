import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { LoadingSpinner } from '../../Utils';
import { Icon } from '../icons/Icon';

function formatLastUsed(value) {
  if (!value) return '—';
  const date = new Date(
    value.endsWith('Z') || value.includes('+') ? value : `${value}Z`
  );
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

function formatCompactNumber(value, language) {
  if (value === null || value === undefined) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  if (number >= 1000000) {
    const compact = number / 1000000;
    const text = Number.isInteger(compact)
      ? String(compact)
      : compact.toFixed(1).replace(/\.0$/, '');
    return `${text}${language === 'id' ? ' jt' : 'M'}`;
  }
  if (number >= 1000) {
    const compact = number / 1000;
    const text = Number.isInteger(compact)
      ? String(compact)
      : compact.toFixed(1).replace(/\.0$/, '');
    return `${text}K`;
  }
  return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US').format(
    number
  );
}

function formatOverviewDate(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

export default function AIOverviewPanel({ language, showNotification }) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [defaultLimit, setDefaultLimit] = useState(20);
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [overrideDraft, setOverrideDraft] = useState({});
  const [savingUser, setSavingUser] = useState('');
  const [savingEngine, setSavingEngine] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(
        localStorage.getItem('innocean_ai_overview_per_page')
      );
      if ([5, 10, 20, 50].includes(saved)) return saved;
    }
    return 5;
  });

  const setUsersPerPagePersist = (value) => {
    const next = Number(value);
    setUsersPerPage(next);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('innocean_ai_overview_per_page', String(next));
    }
  };

  const applyOverview = (data) => {
    setOverview(data);
    setDefaultLimit(data?.default_daily_limit ?? 20);
    const nextDraft = {};
    (data?.users || []).forEach((user) => {
      nextDraft[user.username] =
        user.override === null || user.override === undefined
          ? ''
          : String(user.override);
    });
    setOverrideDraft(nextDraft);
  };

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/admin/ai/overview');
      applyOverview(res.data);
    } catch (err) {
      if (showNotification) {
        showNotification(
          err.response?.data?.detail ||
            tMsg('Failed to load AI overview', 'Gagal memuat AI Overview'),
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    const users = overview?.users || [];
    if (!query) return users;
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        (user.full_name && user.full_name.toLowerCase().includes(query))
    );
  }, [overview, userSearch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage) || 1
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch, usersPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const rangeStart =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1;
  const rangeEnd = Math.min(currentPage * usersPerPage, filteredUsers.length);

  const handleSaveDefault = async () => {
    const parsed = Number.parseInt(String(defaultLimit), 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      if (showNotification) {
        showNotification(
          tMsg(
            'Default limit must be 0 or higher',
            'Limit default harus 0 atau lebih'
          ),
          'error'
        );
      }
      return;
    }
    setIsSavingDefault(true);
    try {
      const res = await axios.put('/api/admin/ai/limits', {
        default_daily_limit: parsed,
      });
      applyOverview(res.data);
      if (showNotification) {
        showNotification(
          tMsg('Default AI limit saved', 'Limit AI default disimpan'),
          'success'
        );
      }
    } catch (err) {
      if (showNotification) {
        showNotification(
          err.response?.data?.detail ||
            tMsg(
              'Failed to save default limit',
              'Gagal menyimpan limit default'
            ),
          'error'
        );
      }
    } finally {
      setIsSavingDefault(false);
    }
  };

  const handleSaveUserLimit = async (username) => {
    const raw = (overrideDraft[username] ?? '').trim();
    let value = null;
    if (raw !== '') {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        if (showNotification) {
          showNotification(
            tMsg(
              'User limit must be 0 or higher',
              'Limit pengguna harus 0 atau lebih'
            ),
            'error'
          );
        }
        return;
      }
      value = parsed;
    }
    setSavingUser(username);
    try {
      const res = await axios.put('/api/admin/ai/limits', {
        user_limits: { [username]: value },
      });
      applyOverview(res.data);
      if (showNotification) {
        showNotification(
          value === null
            ? tMsg(
                `@${username} now uses the default limit`,
                `@${username} memakai limit default`
              )
            : tMsg(
                `Limit updated for @${username}`,
                `Limit @${username} diperbarui`
              ),
          'success'
        );
      }
    } catch (err) {
      if (showNotification) {
        showNotification(
          err.response?.data?.detail ||
            tMsg('Failed to save user limit', 'Gagal menyimpan limit pengguna'),
          'error'
        );
      }
    } finally {
      setSavingUser('');
    }
  };

  const handleSaveEnginePlan = async (engine, plan) => {
    setSavingEngine(engine);
    try {
      const res = await axios.put('/api/admin/ai/limits', {
        engine_plans: { [engine]: plan },
      });
      applyOverview(res.data);
    } catch (err) {
      if (showNotification) {
        showNotification(
          err.response?.data?.detail ||
            tMsg('Failed to save AI plan', 'Gagal menyimpan plan AI'),
          'error'
        );
      }
    } finally {
      setSavingEngine('');
    }
  };

  if (isLoading && !overview) {
    return (
      <div className='flex items-center justify-center py-16'>
        <LoadingSpinner />
      </div>
    );
  }

  const today = overview?.today || {};
  const engines = overview?.engines || {};
  const capacity = overview?.capacity || {};
  const engineCardMeta = {
    groq: 'Groq GPT-OSS 120B',
    gemini_35: 'Gemini 3.5 Flash-Lite',
    gemini_31: 'Gemini 3.1 Flash-Lite',
  };
  const engineOrder = (capacity.order || []).filter((key) => engineCardMeta[key]);
  const engineCards = (engineOrder.length
    ? engineOrder
    : ['groq', 'gemini_35', 'gemini_31']
  ).map((key) => ({
    key,
    title: engines[key]?.label || engineCardMeta[key],
    data: engines[key] || {},
  }));

  return (
    <div className='space-y-5'>
      <div className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 sm:p-5'>
        <div className='flex items-start gap-3'>
          <Icon
            name='sparkles'
            className='w-5 h-5 text-neutral-400 mt-0.5 shrink-0'
          />
          <div>
            <h3 className='text-sm font-black uppercase tracking-wider text-black dark:text-white'>
              {tMsg('AI Overview', 'AI Overview')}
            </h3>
            <p className='mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed'>
              {tMsg(
                'Monitor Smart Assistant usage for today (WIB) and set a daily prompt limit per user. 0 means unlimited.',
                'Pantau pemakaian Smart Assistant hari ini (WIB) dan atur limit prompt harian per pengguna. 0 berarti tanpa batas.'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {[
          {
            icon: 'sparkles',
            label: tMsg('Prompts today', 'Prompt hari ini'),
            value: today.total_prompts || 0,
          },
          {
            icon: 'users',
            label: tMsg('Active users', 'Pengguna aktif'),
            value: today.active_users || 0,
          },
          {
            icon: 'alert-triangle',
            label: tMsg('At daily limit', 'Mencapai limit'),
            value: today.users_at_limit || 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4'>
            <div className='flex items-center gap-2 text-neutral-400'>
              <Icon name={card.icon} className='w-4 h-4' />
              <p className='text-[10px] font-black uppercase tracking-widest'>
                {card.label}
              </p>
            </div>
            <p className='mt-2 text-2xl font-black text-black dark:text-white'>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className='flex flex-wrap items-center gap-2 mb-3'>
          <div className='inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3.5 py-2'>
            <span className='text-[10px] font-medium uppercase tracking-widest text-neutral-400'>
              {tMsg('Today', 'Hari ini')}
            </span>
            <span className='text-[11px] font-semibold text-black dark:text-white'>
              {formatOverviewDate(today.date, language)}
            </span>
          </div>
          <p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>
            {tMsg(
              'Engine usage vs plan quota',
              'Pemakaian engine vs kuota plan'
            )}
          </p>
        </div>
        {/* {capacity.rpd_total ? (
          <p className='mb-3 text-xs text-neutral-500 dark:text-neutral-400'>
            {tMsg(
              `Fallback order: Groq → 3.5 Flash-Lite → 3.1 Flash-Lite. Combined Free RPD ${formatCompactNumber(capacity.rpd_total, language)} vs ${formatCompactNumber(capacity.app_need_100_users, language)} needed for 100 users × ${overview?.default_daily_limit ?? 20} prompts.`,
              `Urutan fallback: Groq → 3.5 Flash-Lite → 3.1 Flash-Lite. Gabungan Free RPD ${formatCompactNumber(capacity.rpd_total, language)} vs ${formatCompactNumber(capacity.app_need_100_users, language)} yang dibutuhkan untuk 100 pengguna × ${overview?.default_daily_limit ?? 20} prompt.`
            )}
          </p>
        ) : null} */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-3'>
          {engineCards.map((card, index) => {
            const used = card.data.used_today || 0;
            const unlimited = Boolean(card.data.unlimited);
            const limit = card.data.rpd;
            const remaining = unlimited ? null : card.data.remaining;
            const percent =
              unlimited || !limit
                ? 0
                : Math.min(100, Math.round((used / limit) * 100));
            const atLimit = Boolean(card.data.at_limit);
            const extraLimits = [
              card.data.rpm
                ? `${formatCompactNumber(card.data.rpm, language)} RPM`
                : null,
              card.data.tpm
                ? `${formatCompactNumber(card.data.tpm, language)} TPM`
                : null,
              card.data.tpd
                ? `${formatCompactNumber(card.data.tpd, language)} TPD`
                : null,
            ].filter(Boolean);

            return (
              <div
                key={card.key}
                className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 sm:p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-[10px] font-black uppercase tracking-widest text-neutral-400'>
                      {index + 1}. {card.title}
                    </p>
                    <p className='mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate'>
                      {card.data.model || '—'}
                    </p>
                  </div>
                  <select
                    value={card.data.plan || 'free'}
                    disabled={savingEngine === card.key}
                    onChange={(e) =>
                      handleSaveEnginePlan(card.key, e.target.value)
                    }
                    className='shrink-0 py-1.5 px-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-[10px] font-bold uppercase tracking-widest'>
                    {(card.data.available_plans || []).map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className='mt-4 text-2xl font-black text-black dark:text-white'>
                  {formatCompactNumber(used, language)}
                  <span className='text-neutral-400 font-semibold text-base'>
                    {' '}
                    /{' '}
                    {unlimited
                      ? tMsg('unl', 'unl')
                      : formatCompactNumber(limit, language)}
                  </span>
                </p>
                <p className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                  {unlimited
                    ? tMsg(
                        'No daily request cap on this plan.',
                        'Tidak ada batas request harian di plan ini.'
                      )
                    : tMsg(
                        `${formatCompactNumber(remaining, language)} requests left today`,
                        `${formatCompactNumber(remaining, language)} request tersisa hari ini`
                      )}
                </p>
                <div className='mt-3 h-2 rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden'>
                  <div
                    className={`h-full rounded-full transition-all ${
                      atLimit ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: unlimited ? '0%' : `${percent}%` }}
                  />
                </div>
                {extraLimits.length > 0 ? (
                  <p className='mt-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400'>
                    {extraLimits.join(' · ')}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 sm:p-5'>
        <h4 className='text-xs font-black uppercase tracking-wider text-black dark:text-white'>
          {tMsg('Default daily limit', 'Limit harian default')}
        </h4>
        <p className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
          {tMsg(
            'Applies to users without a custom override. Use 0 for unlimited.',
            'Berlaku untuk pengguna tanpa override. Gunakan 0 untuk tanpa batas.'
          )}
        </p>
        <div className='mt-3 flex flex-col sm:flex-row gap-3 sm:items-center'>
          <input
            type='number'
            min='0'
            value={defaultLimit}
            onChange={(e) => setDefaultLimit(e.target.value)}
            className='w-full sm:w-40 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-sm font-medium'
          />
          <button
            type='button'
            onClick={handleSaveDefault}
            disabled={isSavingDefault}
            className='px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black disabled:opacity-50'>
            {isSavingDefault
              ? tMsg('Saving...', 'Menyimpan...')
              : tMsg('Save default', 'Simpan default')}
          </button>
        </div>
      </div>

      <div className='flex-1 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm bg-neutral-50 dark:bg-neutral-900 relative'>
        <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 shrink-0 flex-wrap gap-4'>
          <h3 className='font-bold text-black dark:text-white text-sm uppercase tracking-wider'>
            {tMsg('Usage by user', 'Pemakaian per pengguna')}
          </h3>
          <div className='relative w-full sm:w-auto'>
            <Icon
              name='search'
              className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none'
            />
            <input
              type='text'
              placeholder={tMsg('Search users...', 'Cari pengguna...')}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className='w-full sm:w-64 pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-black outline-none text-xs font-medium'
            />
          </div>
        </div>
        <div className='flex-1 overflow-auto'>
          <table className='w-full text-left border-collapse text-sm'>
            <thead className='bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 sticky top-0 z-10'>
              <tr>
                <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                  {tMsg('User', 'Pengguna')}
                </th>
                <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center'>
                  {tMsg('Used today', 'Dipakai hari ini')}
                </th>
                <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700 text-center'>
                  {tMsg('Remaining', 'Sisa')}
                </th>
                <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                  {tMsg('Last used', 'Terakhir dipakai')}
                </th>
                <th className='px-6 py-4 font-bold text-xs border-b border-neutral-200 dark:border-neutral-700'>
                  {tMsg('Custom limit', 'Limit khusus')}
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-neutral-950'>
              {paginatedUsers.map((user) => (
                <tr
                  key={user.username}
                  className='border-b border-neutral-100 dark:border-neutral-900'>
                  <td className='px-6 py-4'>
                    <p className='font-bold text-black dark:text-white'>
                      @{user.username}
                    </p>
                    {user.full_name ? (
                      <p className='text-xs text-neutral-500'>
                        {user.full_name}
                      </p>
                    ) : null}
                    {user.at_limit ? (
                      <p className='mt-1 text-[10px] font-black uppercase tracking-widest text-amber-600'>
                        {tMsg('Limit reached', 'Limit tercapai')}
                      </p>
                    ) : null}
                  </td>
                  <td className='px-6 py-4 text-center font-bold text-black dark:text-white'>
                    {user.used_today}
                    <span className='text-neutral-400 font-medium'>
                      /{user.unlimited ? tMsg('unl', 'unl') : user.limit}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-center text-neutral-600 dark:text-neutral-300'>
                    {user.unlimited
                      ? tMsg('Unlimited', 'Tanpa batas')
                      : user.remaining}
                  </td>
                  <td className='px-6 py-4 text-xs text-neutral-500'>
                    {formatLastUsed(user.last_used_at)}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='number'
                        min='0'
                        placeholder={String(
                          overview?.default_daily_limit ?? 20
                        )}
                        value={overrideDraft[user.username] ?? ''}
                        onChange={(e) =>
                          setOverrideDraft((prev) => ({
                            ...prev,
                            [user.username]: e.target.value,
                          }))
                        }
                        className='w-24 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:border-indigo-500 outline-none text-xs font-medium'
                      />
                      <button
                        type='button'
                        onClick={() => handleSaveUserLimit(user.username)}
                        disabled={savingUser === user.username}
                        className='px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-700 disabled:opacity-50'>
                        {savingUser === user.username
                          ? tMsg('Saving', 'Simpan')
                          : tMsg('Save', 'Simpan')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-10 text-center text-sm text-neutral-500'>
                    {tMsg('No users found.', 'Tidak ada pengguna ditemukan.')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 0 && (
          <div className='px-4 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-3xl'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-widest'>
                {tMsg('Show', 'Tampilkan')}
              </span>
              <select
                value={usersPerPage}
                onChange={(e) => setUsersPerPagePersist(e.target.value)}
                className='py-1.5 px-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-lg outline-none text-xs font-bold'>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
                {tMsg(
                  `${rangeStart}–${rangeEnd} of ${filteredUsers.length}`,
                  `${rangeStart}–${rangeEnd} dari ${filteredUsers.length}`
                )}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
  );
}
