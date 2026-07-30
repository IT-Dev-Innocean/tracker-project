import { useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Plus,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Mail,
  Users,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { useAuthStore } from '@/stores/authStore';
import { useBoardStore } from '@/stores/boardStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUIStore } from '@/stores/uiStore';
import { isAdmin } from '@/lib/access';

export default function Sidebar() {
  const navigate = useNavigate();
  const { username, profile, logout } = useAuthStore();
  const { boards, selectedBoard, fetchBoards } = useBoardStore();
  const { unreadCount, invitations } = useNotificationStore();
  const {
    sidebarCollapsed,
    toggleSidebar,
    openCreateBoard,
    openInvitesModal,
    openSettings,
  } = useUIStore();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const sortedBoards = useMemo(() => {
    return [...boards].sort((a, b) => {
      const aPending = a.my_pending || 0;
      const bPending = b.my_pending || 0;
      if (aPending !== bPending) return bPending - aPending;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [boards]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    cn(
      'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
      isActive
        ? 'bg-cu-hover text-cu-text font-medium'
        : 'text-cu-muted hover:bg-cu-hover/60 hover:text-cu-text'
    );

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-cu-sidebar border-r border-cu-border transition-all duration-200 shrink-0',
        sidebarCollapsed ? 'w-[52px]' : 'w-[240px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-cu-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-cu-accent flex items-center justify-center text-white text-xs font-bold">
              IN
            </div>
            <span className="text-sm font-semibold truncate">INNOCEAN</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-cu-hover text-cu-muted hover:text-cu-text transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-4">
        <div className="space-y-0.5">
          <NavLink to="/" end className={navItemClass}>
            <Home className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Home</span>}
          </NavLink>
          <NavLink to="/global" className={navItemClass}>
            <Globe className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Global Workload</span>}
          </NavLink>
          <NavLink to="/timesheets" className={navItemClass}>
            <Clock className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Timesheets</span>}
          </NavLink>
          <NavLink to="/team" className={navItemClass}>
            <Users className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Team</span>}
          </NavLink>
          {isAdmin(profile) && (
            <NavLink to="/admin" className={navItemClass}>
              <Shield className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Administration</span>}
            </NavLink>
          )}
        </div>

        {/* Spaces / Projects */}
        {!sidebarCollapsed && (
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cu-muted">
                Spaces
              </span>
              <button
                onClick={openCreateBoard}
                className="p-0.5 rounded hover:bg-cu-hover text-cu-muted hover:text-cu-text"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {sortedBoards.map((board) => (
                <NavLink
                  key={board.id}
                  to={`/board/${board.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors group',
                      isActive || selectedBoard?.id === board.id
                        ? 'bg-cu-hover text-cu-text font-medium'
                        : 'text-cu-muted hover:bg-cu-hover/60 hover:text-cu-text'
                    )
                  }
                >
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{board.name}</span>
                  {board.my_pending > 0 && (
                    <span className="text-[10px] bg-cu-accent/30 text-violet-300 rounded-full px-1.5 py-0.5">
                      {board.my_pending}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-cu-border p-2 space-y-1">
        {!sidebarCollapsed && invitations.length > 0 && (
          <button
            onClick={openInvitesModal}
            className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-sm text-cu-muted hover:bg-cu-hover hover:text-cu-text"
          >
            <Mail className="h-4 w-4" />
            <span>Invitations</span>
            <span className="ml-auto text-[10px] bg-cu-accent text-white rounded-full px-1.5">
              {invitations.length}
            </span>
          </button>
        )}

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 hover:bg-cu-hover transition-colors">
              <UserAvatar username={username} src={profile?.avatar} size="sm" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm truncate flex-1 text-left">{username}</span>
                  {unreadCount > 0 && (
                    <span className="h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>
          }
        >
          <DropdownItem onClick={() => navigate('/notifications')}>
            <Bell className="h-3.5 w-3.5" /> Notifications
            {unreadCount > 0 && ` (${unreadCount})`}
          </DropdownItem>
          <DropdownItem onClick={openSettings}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onClick={handleLogout} destructive>
            <LogOut className="h-3.5 w-3.5" /> Log out
          </DropdownItem>
        </Dropdown>
      </div>
    </aside>
  );
}
