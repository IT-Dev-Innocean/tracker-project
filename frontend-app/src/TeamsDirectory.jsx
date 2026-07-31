import { useMemo, useState } from 'react';
import { useAppContext } from './hooks/useAppContext';
import { Avatar } from './SharedUI';
import { Icon } from './components/icons/Icon';

export default function TeamsDirectory() {
  const { userDirectory = [], avatarsMap = {}, language, currentUser, isSuperAdmin } =
    useAppContext();
  const [query, setQuery] = useState('');
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const people = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (userDirectory || [])
      .filter((user) => isSuperAdmin || user.is_connected || user.username === currentUser)
      .filter((user) => {
        if (!needle) return true;
        return [user.full_name, user.username, user.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      })
      .sort((a, b) =>
        String(a.full_name || a.username).localeCompare(String(b.full_name || b.username))
      );
  }, [currentUser, isSuperAdmin, query, userDirectory]);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {tMsg('Teams', 'Tim')}
            </div>
            <h1 className="mt-1 text-2xl font-black text-black dark:text-white">
              {tMsg('All People', 'Semua Orang')}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {tMsg(
                'People connected across your workspace.',
                'Orang yang terhubung di workspace Anda.'
              )}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tMsg('Search people…', 'Cari orang…')}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">{tMsg('Name', 'Nama')}</th>
                <th className="px-4 py-3">{tMsg('Email', 'Email')}</th>
                <th className="px-4 py-3">{tMsg('Role', 'Peran')}</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
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
                        </div>
                        <div className="truncate text-xs text-neutral-500">@{person.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {person.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {person.is_superadmin
                        ? tMsg('Admin', 'Admin')
                        : person.username === currentUser
                          ? tMsg('You', 'Anda')
                          : tMsg('Member', 'Anggota')}
                    </span>
                  </td>
                </tr>
              ))}
              {!people.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center text-neutral-400">
                    {tMsg('No people found.', 'Tidak ada orang ditemukan.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
