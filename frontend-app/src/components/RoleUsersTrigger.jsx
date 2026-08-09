import React from 'react';
import { Avatar } from '../SharedUI';

function getFullName(username, employees = []) {
  const key = String(username || '')
    .replace(/^@/, '')
    .trim()
    .toLowerCase();
  const emp = employees.find(
    (e) => String(e.username || '').toLowerCase() === key
  );
  return emp?.full_name || emp?.name || username;
}

function AvatarWithTooltip({
  username,
  fullName,
  avatarsMap,
  zIndex,
  offset,
  size = 'w-7 h-7',
  textClass = 'text-[9px]',
  withRing = true,
}) {
  const avatarUrl =
    avatarsMap?.[username] ||
    avatarsMap?.[String(username || '').toLowerCase()];

  return (
    <span
      className={`relative group/avatar inline-flex ${offset ? '-ml-2' : ''}`}
      style={{ zIndex }}>
      <Avatar
        name={fullName}
        url={avatarUrl}
        size={size}
        textClass={textClass}
        maxInitials={2}
        withRing={withRing}
      />
      <span
        role='tooltip'
        className='pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/avatar:opacity-100 dark:bg-white dark:text-neutral-900'>
        {fullName}
        <span className='absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-neutral-900 dark:border-t-white' />
      </span>
    </span>
  );
}

/**
 * Trigger display for Supervisor / R&C / Kanban involved users:
 * - 0: placeholder
 * - 1: name only (default) or avatar + name when singleMode='avatar-name'
 * - 2+: overlapping avatars, hover shows name
 */
export default function RoleUsersTrigger({
  selected = [],
  employees = [],
  avatarsMap = {},
  placeholder = '',
  emptyClassName = 'text-xs font-normal text-neutral-400 truncate',
  nameClassName = 'text-xs font-medium text-black dark:text-white truncate',
  singleMode = 'name',
  avatarSize = 'w-7 h-7',
  avatarTextClass = 'text-[9px]',
  maxVisible = 4,
  withRing = true,
}) {
  if (!selected.length) {
    return <span className={emptyClassName}>{placeholder}</span>;
  }

  if (selected.length === 1) {
    const fullName = getFullName(selected[0], employees);
    if (singleMode === 'avatar-name') {
      return (
        <span className='flex items-center gap-1.5 min-w-0'>
          <AvatarWithTooltip
            username={selected[0]}
            fullName={fullName}
            avatarsMap={avatarsMap}
            zIndex={1}
            offset={false}
            size={avatarSize}
            textClass={avatarTextClass}
            withRing={withRing}
          />
          <span className={nameClassName}>{fullName}</span>
        </span>
      );
    }
    return <span className={nameClassName}>{fullName}</span>;
  }

  const visible = selected.slice(0, maxVisible);
  const overflow = selected.slice(maxVisible);
  const overflowNames = overflow
    .map((username) => getFullName(username, employees))
    .join(', ');

  return (
    <span className='flex items-center'>
      {visible.map((username, idx) => (
        <AvatarWithTooltip
          key={username}
          username={username}
          fullName={getFullName(username, employees)}
          avatarsMap={avatarsMap}
          zIndex={10 - idx}
          offset={idx > 0}
          size={avatarSize}
          textClass={avatarTextClass}
          withRing={withRing}
        />
      ))}
      {overflow.length > 0 && (
        <span className='relative group/avatar inline-flex -ml-2 z-0'>
          <span
            className={`${avatarSize} rounded-full bg-neutral-300 dark:bg-neutral-700 ${avatarTextClass} font-bold text-black dark:text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-950`}>
            +{overflow.length}
          </span>
          <span
            role='tooltip'
            className='pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/avatar:opacity-100 dark:bg-white dark:text-neutral-900'>
            {overflowNames}
            <span className='absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-neutral-900 dark:border-t-white' />
          </span>
        </span>
      )}
    </span>
  );
}
