import { Search, Plus, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useUIStore } from '@/stores/uiStore';
import { useBoardStore } from '@/stores/boardStore';

const VIEW_TABS = [
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
];

export default function TopBar({ title, showViews = true, showAddTask = true }) {
  const { searchQuery, setSearchQuery, openCreateTask, openTeamModal } = useUIStore();
  const { selectedBoard } = useBoardStore();

  return (
    <header className="shrink-0 border-b border-cu-border bg-cu-bg">
      {/* Title row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-base font-semibold truncate">{title || 'Home'}</h1>
          {selectedBoard && selectedBoard.role === 'owner' && (
            <Button variant="ghost" size="icon" onClick={openTeamModal} title="Team">
              <Users className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cu-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 w-48 h-7 text-xs"
            />
          </div>
          {showAddTask && (
            <Button size="sm" onClick={openCreateTask}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* View tabs */}
      {showViews && (
        <div className="flex items-center justify-between px-4">
          <TabsList>
            {VIEW_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1 pb-1">
            <Button variant="ghost" size="sm">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
