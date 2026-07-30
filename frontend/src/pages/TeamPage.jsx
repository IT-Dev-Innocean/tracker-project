import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { UserAvatar } from '@/components/ui/Avatar';
import { Badge, Input, Label, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useAuthStore } from '@/stores/authStore';
import { useTeamStore } from '@/stores/teamStore';
import { useUIStore } from '@/stores/uiStore';
import {
  canManageTeams,
  getEffectiveSystemRole,
  getRoleBadgeVariant,
  isManager,
} from '@/lib/access';

const memberName = (member) => member.display_name || member.full_name || member.username || member.email;
const memberProjects = (member) => member.assigned_projects || member.projects || [];

export default function TeamPage() {
  const profile = useAuthStore((state) => state.profile);
  const showToast = useUIStore((state) => state.showToast);
  const { teams, members, isLoading, error, fetchDirectory, addMember, updateMember, removeMember } =
    useTeamStore();
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({ team_id: '', username: '', team_role: 'staff' });
  const manageable = canManageTeams(profile);
  const manager = isManager(profile);
  const managerTeamId =
    profile?.managed_team_id ||
    profile?.team_id ||
    teams.find((team) =>
      team.manager_username === profile?.username ||
      team.managers?.includes(profile?.username)
    )?.id;
  const availableTeams = manager
    ? teams.filter((team) => team.managers?.includes(profile?.username))
    : teams;

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const teamId = member.team_id ?? member.team?.id;
      const role = member.team_role || member.role || 'staff';
      const status = member.status || 'active';
      return (
        (!normalizedQuery ||
          [memberName(member), member.email, member.username]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery))) &&
        (teamFilter === 'all' || String(teamId) === teamFilter) &&
        (roleFilter === 'all' || role === roleFilter) &&
        (statusFilter === 'all' || status === statusFilter)
      );
    });
  }, [members, query, roleFilter, statusFilter, teamFilter]);

  const openCreate = () => {
    setEditingMember(null);
    setForm({
      team_id: manager && managerTeamId ? String(managerTeamId) : '',
      username: '',
      team_role: 'staff',
    });
    setDialogOpen(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setForm({
      team_id: String(member.team_id ?? member.team?.id ?? ''),
      username: member.username || member.email || '',
      team_role: member.team_role || member.role || 'staff',
    });
    setDialogOpen(true);
  };

  const submitMember = async (event) => {
    event.preventDefault();
    try {
      if (editingMember) {
        await updateMember(form.team_id, editingMember.username, {
          username: editingMember.username,
          membership_role: form.team_role,
        });
      } else {
        await addMember(form.team_id, {
          username: form.username.trim(),
          membership_role: form.team_role,
        });
      }
      setDialogOpen(false);
      showToast(editingMember ? 'Member role updated' : 'Member added', 'success');
    } catch (requestError) {
      showToast(requestError.response?.data?.detail || 'Failed to save member', 'error');
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${memberName(member)} from this team?`)) return;
    try {
      await removeMember(member.team_id ?? member.team?.id, member.username);
      showToast('Member removed', 'success');
    } catch (requestError) {
      showToast(requestError.response?.data?.detail || 'Failed to remove member', 'error');
    }
  };

  return (
    <>
      <TopBar title="Team" showViews={false} showAddTask={false} />
      <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-thin">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Member directory</h2>
              </div>
              <p className="mt-1 text-sm text-cu-muted">
                {manager
                  ? 'People and projects in your assigned team.'
                  : 'People, roles, and project assignments across your workspace.'}
              </p>
            </div>
            {manageable && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add member
              </Button>
            )}
          </div>

          <div className="grid gap-2 rounded-lg border border-cu-border bg-cu-surface p-3 sm:grid-cols-4">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cu-muted" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people…" className="pl-8" />
            </div>
            {!manager && (
              <Select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
                <option value="all">All teams</option>
                {availableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </Select>
            )}
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          <div className="overflow-x-auto rounded-lg border border-cu-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-cu-border bg-cu-surface text-left text-xs text-cu-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Member</th>
                  <th className="px-4 py-2.5 font-medium">Team</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Assigned projects</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {manageable && <th className="w-12 px-3 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((member) => {
                  const role = member.team_role || member.role || 'staff';
                  const projects = memberProjects(member);
                  return (
                    <tr key={`${member.team_id || member.team?.id}-${member.id}`} className="border-b border-cu-border/60 hover:bg-cu-hover/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar username={member.username || memberName(member)} src={member.avatar} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{memberName(member)}</div>
                            <div className="truncate text-xs text-cu-muted">{member.email || `@${member.username}`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{member.team_name || member.team?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={getRoleBadgeVariant(role)}>{role}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-sm flex-wrap gap-1">
                          {projects.slice(0, 3).map((project) => (
                            <Badge key={project.id || project.name || project} variant="default">
                              {project.name || project}
                            </Badge>
                          ))}
                          {projects.length > 3 && <Badge>+{projects.length - 3}</Badge>}
                          {!projects.length && <span className="text-cu-muted">No projects</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(member.status || 'active') === 'active' ? 'green' : 'yellow'}>
                          {member.status || 'active'}
                        </Badge>
                      </td>
                      {manageable && (
                        <td className="px-3 py-3">
                          <Dropdown trigger={<button className="rounded p-1.5 text-cu-muted hover:bg-cu-hover hover:text-cu-text"><MoreHorizontal className="h-4 w-4" /></button>}>
                            <DropdownItem onClick={() => openEdit(member)}>Change team role</DropdownItem>
                            {member.team_id && <DropdownItem destructive onClick={() => handleRemove(member)}>Remove from team</DropdownItem>}
                          </Dropdown>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {!isLoading && !visibleMembers.length && (
                  <tr><td colSpan={manageable ? 6 : 5} className="px-4 py-12 text-center text-cu-muted">No members match these filters.</td></tr>
                )}
                {isLoading && <tr><td colSpan={6} className="px-4 py-12 text-center text-cu-muted">Loading directory…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editingMember ? 'Update team role' : 'Add team member'}
          description={manager ? 'You can only manage your assigned team.' : 'Assign a workspace user to a team.'}
        >
          <form onSubmit={submitMember} className="mt-4 space-y-4">
            <div>
              <Label>Team</Label>
              <Select value={form.team_id} onChange={(event) => setForm({ ...form, team_id: event.target.value })} disabled={manager && availableTeams.length === 1} required>
                <option value="">Select team</option>
                {availableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </Select>
            </div>
            {!editingMember && (
              <div>
                <Label>Username or email</Label>
                <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="name@company.com" required />
              </div>
            )}
            <div>
              <Label>Team role</Label>
              <Select value={form.team_role} onChange={(event) => setForm({ ...form, team_role: event.target.value })}>
                {!manager && <option value="manager">Manager</option>}
                <option value="staff">Staff</option>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-cu-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                Signed in as {getEffectiveSystemRole(profile)}
              </div>
              <Button type="submit">{editingMember ? 'Save role' : 'Add member'}</Button>
            </div>
          </form>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
