import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const toast = useUIStore((s) => s.toast);
  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-2">
      <div className={cn(
        'flex items-center gap-2 rounded-lg border border-cu-border bg-cu-surface px-4 py-2.5 shadow-lg text-sm'
      )}>
        {icons[toast.type] || icons.info}
        {toast.message}
      </div>
    </div>
  );
}
