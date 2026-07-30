import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-cu-accent hover:bg-cu-accent-hover text-white',
  secondary: 'bg-cu-surface hover:bg-cu-hover text-cu-text border border-cu-border',
  ghost: 'hover:bg-cu-hover text-cu-muted hover:text-cu-text',
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-cu-border hover:bg-cu-hover text-cu-text',
};

const sizes = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-9 px-4 text-sm',
  icon: 'h-8 w-8',
};

export function Button({ className, variant = 'default', size = 'md', asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cu-accent/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
