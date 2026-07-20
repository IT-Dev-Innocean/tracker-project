import React from 'react';

export const IconPerson = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export const IconPlus = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Komponen Auto-Avatar (Warna & Inisial Acak Berdasarkan Nama)
export const Avatar = ({ name, url, size = 'w-5 h-5', textClass = 'text-[10px]' }) => {
  const [imgError, setImgError] = React.useState(false);
  if (url && !imgError)
    return (
      <img
        src={url}
        alt={name}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover shrink-0 shadow-sm`}
        title={name?.replace('@', '').trim()}
        referrerPolicy="no-referrer"
      />
    );
  if (!name) return <IconPerson className={size} />;
  const cleanName = name.replace('@', '').trim();
  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : '?';
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  return (
    <div
      className={`${size} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold ${textClass} shrink-0 shadow-sm`}
      title={cleanName}
    >
      {initial}
    </div>
  );
};

export const SegmentedControl = ({ options, value, onChange, size = 'default', fullWidth = false }) => {
  const padding = size === 'small' ? 'py-2 px-4' : 'py-3 px-4';
  const textSize = size === 'small' ? 'text-[10px]' : 'text-xs';

  return (
    <div
      className={`flex bg-neutral-100 dark:bg-[#0e1116] p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-800 shadow-inner ${
        fullWidth ? 'w-full' : 'w-full sm:w-auto'
      }`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={(e) => {
            e.preventDefault();
            onChange(opt.value);
          }}
          className={`flex-1 ${
            fullWidth ? '' : 'sm:flex-none'
          } ${padding} rounded-lg ${textSize} font-bold uppercase tracking-widest transition-all duration-200 ${
            value === opt.value
              ? 'bg-white dark:bg-neutral-800 shadow-sm text-black dark:text-white'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
