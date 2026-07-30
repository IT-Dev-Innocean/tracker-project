import { cn } from '@/lib/utils';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-8 w-full rounded-md border border-cu-border bg-cu-bg px-3 py-1 text-sm text-cu-text',
        'placeholder:text-cu-muted focus:outline-none focus:ring-2 focus:ring-cu-accent/50',
        'disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-cu-border bg-cu-bg px-3 py-2 text-sm text-cu-text',
        'placeholder:text-cu-muted focus:outline-none focus:ring-2 focus:ring-cu-accent/50',
        'disabled:opacity-50 resize-y',
        className
      )}
      {...props}
    />
  );
}

export function Label({ children, className, ...props }) {
  return (
    <label className={cn('text-xs font-medium text-cu-muted', className)} {...props}>
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-8 w-full rounded-md border border-cu-border bg-cu-bg px-3 text-sm text-cu-text',
        'focus:outline-none focus:ring-2 focus:ring-cu-accent/50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Badge({ children, className, variant = 'default' }) {
  const variants = {
    default: 'bg-cu-hover text-cu-text',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-violet-500/20 text-violet-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
