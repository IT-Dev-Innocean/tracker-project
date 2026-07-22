import { INNOCEAN_LOGO_URL } from '../constants/branding';

export default function InnoceanLogo({
  showTracker = true,
  collapsed = false,
  size = 'md',
  className = '',
  onClick,
}) {
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5',
    xl: 'h-6',
  };

  const logoHeight = collapsed ? 'h-5' : sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`flex flex-col ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }>
      <img
        src={INNOCEAN_LOGO_URL}
        alt='INNOCEAN'
        className={`${logoHeight} w-auto object-contain brightness-0 dark:brightness-100`}
      />
      {showTracker && !collapsed && (
        <span
          className={`text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase mt-0.5 tracking-[2px]`}>
          Tracker
        </span>
      )}
    </div>
  );
}
