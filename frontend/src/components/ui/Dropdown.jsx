import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export function Dropdown({ trigger, children, align = 'end' }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            'z-50 min-w-[180px] rounded-md border border-cu-border bg-cu-surface p-1 shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DropdownItem({ children, onClick, destructive, className }) {
  return (
    <DropdownMenu.Item
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none',
        'hover:bg-cu-hover focus:bg-cu-hover',
        destructive ? 'text-red-400' : 'text-cu-text',
        className
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}

export function DropdownSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-cu-border" />;
}

export function DropdownLabel({ children }) {
  return (
    <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-cu-muted">
      {children}
    </DropdownMenu.Label>
  );
}
