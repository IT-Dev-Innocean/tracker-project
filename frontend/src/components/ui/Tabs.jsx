import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export function TabsRoot({ children, value, onValueChange, className }) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} className={className}>
      {children}
    </Tabs.Root>
  );
}

export function TabsList({ children, className }) {
  return (
    <Tabs.List
      className={cn(
        'inline-flex items-center gap-1 border-b border-cu-border w-full',
        className
      )}
    >
      {children}
    </Tabs.List>
  );
}

export function TabsTrigger({ children, value, className }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        'px-3 py-2 text-sm font-medium text-cu-muted transition-colors',
        'border-b-2 border-transparent -mb-px',
        'data-[state=active]:text-cu-text data-[state=active]:border-cu-accent',
        'hover:text-cu-text',
        className
      )}
    >
      {children}
    </Tabs.Trigger>
  );
}

export function TabsContent({ children, value, className }) {
  return (
    <Tabs.Content value={value} className={cn('flex-1 outline-none', className)}>
      {children}
    </Tabs.Content>
  );
}
