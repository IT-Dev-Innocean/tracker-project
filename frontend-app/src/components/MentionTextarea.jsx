import React, { useEffect, useMemo, useRef, useState } from 'react';

function getMentionQuery(text, cursor) {
  const before = String(text || '').slice(0, cursor);
  const match = before.match(/(?:^|[\s([{])@([\w.-]*)$/);
  return match ? match[1] : null;
}

function insertMention(text, cursor, username) {
  const before = String(text || '').slice(0, cursor);
  const after = String(text || '').slice(cursor);
  const match = before.match(/@([\w.-]*)$/);
  const atIndex = match ? before.lastIndexOf(`@${match[1]}`) : before.length;
  const newBefore = `${before.slice(0, atIndex)}@${username} `;
  return {
    text: newBefore + after,
    cursor: newBefore.length,
  };
}

export default function MentionTextarea({
  value,
  onChange,
  employees = [],
  teamMembers = [],
  tMsg = (en) => en,
  className = '',
  disabled = false,
  placeholder = '',
  ...textareaProps
}) {
  const textareaRef = useRef(null);
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const mentionUsers = useMemo(() => {
    const fromEmployees = (employees || [])
      .filter((u) => u?.username && u.username !== 'admin')
      .map((u) => ({
        username: u.username,
        full_name: u.full_name || u.name || u.username,
      }));
    if (fromEmployees.length > 0) return fromEmployees;

    return (teamMembers || [])
      .filter((m) => m && m !== 'admin')
      .map((username) => ({
        username,
        full_name: username,
      }));
  }, [employees, teamMembers]);

  const filteredUsers = useMemo(() => {
    const q = String(mentionQuery || '').toLowerCase();
    return mentionUsers.filter((u) => {
      const username = String(u.username || '').toLowerCase();
      const fullName = String(u.full_name || '').toLowerCase();
      return username.includes(q) || fullName.includes(q);
    });
  }, [mentionUsers, mentionQuery]);

  useEffect(() => {
    if (mentionIndex >= filteredUsers.length) setMentionIndex(0);
  }, [filteredUsers.length, mentionIndex]);

  const syncMentionState = (nextValue, cursor) => {
    const query = getMentionQuery(nextValue, cursor);
    if (query !== null) {
      setIsMentioning(true);
      setMentionQuery(query.toLowerCase());
      setMentionIndex(0);
    } else {
      setIsMentioning(false);
      setMentionQuery('');
    }
  };

  const applyMention = (username) => {
    const el = textareaRef.current;
    const cursor = el ? el.selectionStart : String(value || '').length;
    const next = insertMention(value, cursor, username);
    onChange(next.text);
    setIsMentioning(false);
    setMentionQuery('');
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(next.cursor, next.cursor);
    });
  };

  const handleChange = (e) => {
    const nextValue = e.target.value;
    onChange(nextValue);
    syncMentionState(nextValue, e.target.selectionStart);
  };

  const handleKeyUp = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) return;
    syncMentionState(e.target.value, e.target.selectionStart);
  };

  const handleClick = (e) => {
    syncMentionState(e.target.value, e.target.selectionStart);
  };

  const handleKeyDown = (e) => {
    if (!isMentioning) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % (filteredUsers.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(
        (prev) => (prev - 1 + filteredUsers.length) % (filteredUsers.length || 1)
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredUsers.length > 0) {
        e.preventDefault();
        applyMention(filteredUsers[mentionIndex]?.username || filteredUsers[0].username);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsMentioning(false);
    }
  };

  return (
    <div className='relative'>
      {isMentioning && !disabled && (
        <div className='absolute left-0 right-0 bottom-full mb-2 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-48 overflow-y-auto py-2'>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, idx) => (
              <button
                type='button'
                key={user.username}
                className={`w-full px-4 py-2.5 cursor-pointer text-sm text-left text-black dark:text-white font-medium border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${
                  mentionIndex === idx
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMention(user.username)}>
                <span className='text-indigo-600 dark:text-indigo-400'>
                  @{user.username}
                </span>
                {user.full_name && user.full_name !== user.username && (
                  <span className='text-xs text-neutral-500 dark:text-neutral-400 font-normal truncate'>
                    {user.full_name}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className='px-4 py-3 text-sm text-neutral-500 italic'>
              {tMsg('No members found', 'Tidak ada anggota ditemukan')}
            </div>
          )}
        </div>
      )}
      <textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        className={className}
      />
    </div>
  );
}
