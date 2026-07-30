import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

const COLUMN_COLORS = {
  Pending: 'text-cu-muted',
  'In Progress': 'text-blue-400',
  Done: 'text-green-400',
  Rejected: 'text-red-400',
};

export default function KanbanBoard({ columns, tasks, onDragEnd, onTaskClick }) {
  const openCreateTask = useUIStore((s) => s.openCreateTask);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4 px-4 scrollbar-thin">
        {columns.map((colName) => {
          const colTasks = tasks.filter((t) => t.status === colName);
          return (
            <div key={colName} className="flex flex-col w-[280px] shrink-0">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={cn('text-xs font-semibold uppercase tracking-wide', COLUMN_COLORS[colName] || 'text-cu-muted')}>
                  {colName}
                </span>
                <span className="text-[11px] text-cu-muted bg-cu-hover rounded px-1.5 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={colName}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 space-y-2 min-h-[100px] rounded-lg p-1 transition-colors',
                      snapshot.isDraggingOver && 'bg-cu-accent/5'
                    )}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                            className={snapshot.isDragging ? 'rotate-1 shadow-xl' : ''}
                          >
                            <TaskCard task={task} onClick={onTaskClick} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {colName === 'Pending' && (
                      <button
                        onClick={openCreateTask}
                        className="flex items-center gap-1.5 w-full rounded-lg border border-dashed border-cu-border p-2 text-xs text-cu-muted hover:border-cu-accent/40 hover:text-cu-text transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Task
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
