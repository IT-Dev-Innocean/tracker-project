import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanBoard from '@/components/board/KanbanBoard';
import ListView from '@/components/board/ListView';
import CalendarView from '@/components/board/CalendarView';
import HomeDashboard from '@/components/board/HomeDashboard';
import { TabsRoot, TabsContent } from '@/components/ui/Tabs';
import { useBoardStore } from '@/stores/boardStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { taskApi } from '@/api';
import { isUserAssigned, isOverdue } from '@/lib/utils';

function useFilteredTasks() {
  const tasks = useBoardStore((s) => s.tasks);
  const { searchQuery, showMyTasks, showOverdueOnly } = useUIStore();
  const username = useAuthStore((s) => s.username);

  return useMemo(() => {
    let filtered = [...tasks];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.project_name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.requester?.toLowerCase().includes(q)
      );
    }
    if (showMyTasks) {
      filtered = filtered.filter((t) => isUserAssigned(t, username));
    }
    if (showOverdueOnly) {
      filtered = filtered.filter((t) => isOverdue(t.deadline, t.status));
    }
    return filtered;
  }, [tasks, searchQuery, showMyTasks, showOverdueOnly, username]);
}

export function HomePage() {
  const { fetchBoards, fetchGlobalTasks } = useBoardStore();

  useEffect(() => {
    fetchBoards();
    fetchGlobalTasks();
  }, [fetchBoards, fetchGlobalTasks]);

  return (
    <>
      <TopBar title="Home" showViews={false} showAddTask={false} />
      <HomeDashboard />
    </>
  );
}

export function GlobalPage() {
  const selectBoard = useBoardStore((s) => s.selectBoard);
  const { columns, isTasksLoading } = useBoardStore();
  const { viewMode, setViewMode, openTask } = useUIStore();
  const filteredTasks = useFilteredTasks();

  useEffect(() => {
    selectBoard({ id: 'global', name: 'Global Workload', role: 'owner', isVirtual: true });
  }, [selectBoard]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = filteredTasks.find((t) => String(t.id) === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await taskApi.updateStatus(taskId, newStatus);
      useBoardStore.getState().updateTaskInList(Number(taskId), { status: newStatus });
    } catch {
      useBoardStore.getState().refreshTasks();
    }
  };

  const handleTaskClick = (task) => openTask(task.id);

  return (
    <TabsRoot
      value={viewMode}
      onValueChange={setViewMode}
      className="flex flex-1 min-h-0 flex-col"
    >
      <TopBar title="Global Workload" />
      {isTasksLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-cu-muted">
          Loading tasks...
        </div>
      ) : (
        <>
          <TabsContent value="board" className="flex-1 overflow-hidden">
            <KanbanBoard columns={columns} tasks={filteredTasks} onDragEnd={handleDragEnd} onTaskClick={handleTaskClick} />
          </TabsContent>
          <TabsContent value="list" className="flex flex-1 flex-col overflow-hidden">
            <ListView tasks={filteredTasks} columns={columns} onTaskClick={handleTaskClick} />
          </TabsContent>
          <TabsContent value="calendar" className="flex-1 overflow-hidden">
            <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          </TabsContent>
        </>
      )}
    </TabsRoot>
  );
}

export function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { boards, selectedBoard, columns, isTasksLoading, selectBoard, fetchBoards } = useBoardStore();
  const { viewMode, setViewMode, openTask } = useUIStore();
  const filteredTasks = useFilteredTasks();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    const board = boards.find((b) => String(b.id) === boardId);
    if (board) {
      selectBoard(board);
    } else if (boards.length > 0) {
      navigate(`/board/${boards[0].id}`, { replace: true });
    }
  }, [boardId, boards, selectBoard, navigate]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = filteredTasks.find((t) => String(t.id) === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await taskApi.updateStatus(taskId, newStatus);
      useBoardStore.getState().updateTaskInList(Number(taskId), { status: newStatus });
    } catch {
      useBoardStore.getState().refreshTasks();
    }
  };

  const handleTaskClick = (task) => openTask(task.id);

  return (
    <TabsRoot
      value={viewMode}
      onValueChange={setViewMode}
      className="flex flex-1 min-h-0 flex-col"
    >
      <TopBar title={selectedBoard?.name || 'Loading...'} />
      {isTasksLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-cu-muted">
          Loading tasks...
        </div>
      ) : (
        <>
          <TabsContent value="board" className="flex-1 overflow-hidden">
            <KanbanBoard columns={columns} tasks={filteredTasks} onDragEnd={handleDragEnd} onTaskClick={handleTaskClick} />
          </TabsContent>
          <TabsContent value="list" className="flex flex-1 flex-col overflow-hidden">
            <ListView tasks={filteredTasks} columns={columns} onTaskClick={handleTaskClick} />
          </TabsContent>
          <TabsContent value="calendar" className="flex-1 overflow-hidden">
            <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          </TabsContent>
        </>
      )}
    </TabsRoot>
  );
}
