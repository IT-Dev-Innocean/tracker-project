import * as Avatar from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const COLORS = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-cyan-600',
];

function getColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function UserAvatar({ username, src, size = 'md', className }) {
  const initials = (username || '?').slice(0, 2).toUpperCase();
  const sizeClass = { sm: 'h-6 w-6 text-[10px]', md: 'h-7 w-7 text-xs', lg: 'h-9 w-9 text-sm' }[size];

  return (
    <Avatar.Root
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        sizeClass,
        !src && getColor(username),
        className
      )}
    >
      {src && <Avatar.Image src={src} alt={username} className="h-full w-full object-cover" />}
      <Avatar.Fallback className="font-medium text-white">{initials}</Avatar.Fallback>
    </Avatar.Root>
  );
}
