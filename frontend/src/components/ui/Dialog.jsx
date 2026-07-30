import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DialogRoot({ children, ...props }) {
  return <Dialog.Root {...props}>{children}</Dialog.Root>;
}

export function DialogTrigger({ children, ...props }) {
  return <Dialog.Trigger asChild {...props}>{children}</Dialog.Trigger>;
}

export function DialogContent({ children, className, title, description, onClose, ...props }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-cu-border bg-cu-surface p-6 shadow-xl',
          'max-h-[90vh] overflow-y-auto scrollbar-thin',
          className
        )}
        {...props}
      >
        {title && (
          <Dialog.Title className="text-lg font-semibold text-cu-text mb-1">{title}</Dialog.Title>
        )}
        {description && (
          <Dialog.Description className="text-sm text-cu-muted mb-4">{description}</Dialog.Description>
        )}
        {children}
        <Dialog.Close
          className="absolute right-4 top-4 rounded-sm p-1 text-cu-muted hover:text-cu-text transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export { Dialog };
