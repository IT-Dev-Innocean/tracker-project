import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Database,
  FolderKanban,
  HardDrive,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge, Input, Label, Select } from '@/components/ui/Input';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { UserAvatar } from '@/components/ui/Avatar';
import { useAdminStore } from '@/stores/adminStore';
import { useUIStore } from '@/stores/uiStore';
import { getRoleBadgeVariant } from '@/lib/access';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users & Roles' },
  { id: 'teams', label: 'Teams' },
  { id: 'projects', label: 'Projects' },
  { id: 'aiCredits', label: 'AI Credits' },
  { id: 'storage', label: 'Storage' },
];

const emptyDialog = { type: null, item: null };
const itemName = (item) => item.display_name || item.full_name || item.name || item.username || 'Unknown';
const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

function LoadingState({ loading, error, children }) {
  if (loading) return <div className="py-14 text-center text-sm text-cu-muted">Loading…</div>;
  if (error) return <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>;
  return children;
}

function TableFrame({ headers, children, empty, colSpan }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-cu-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-cu-border bg-cu-surface text-left text-xs text-cu-muted">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-2.5 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody>
          {children}
          {empty && <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-cu-muted">No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-lg border border-cu-border bg-cu-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-cu-muted">{label}</span>
        <Icon className="h-4 w-4 text-violet-400" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value ?? 0}</div>
      {detail && <div className="mt-1 text-xs text-cu-muted">{detail}</div>}
    </div>
  );
}

export default function AdminPage() {
  const { data, loadingSections, errors, fetchSection, updateUser, createTeam, updateTeam, deleteTeam, updateProject, updateCredits } =
    useAdminStore();
  const showToast = useUIStore((state) => state.showToast);
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(emptyDialog);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSection(activeTab);
  }, [activeTab, fetchSection]);

  const filtered = useMemo(() => {
    const list = data[activeTab];
    if (!Array.isArray(list) || !query.trim()) return list;
    const needle = query.toLowerCase();
    return list.filter((item) =>
      [itemName(item), item.email, item.owner_username, item.manager_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [activeTab, data, query]);

  const openDialog = (type, item = null) => {
    setDialog({ type, item });
    if (type === 'user') {
      setForm({ system_role: item.system_role || (item.is_superadmin ? 'admin' : 'staff'), status: item.account_status || 'active' });
    } else if (type === 'team') {
      setForm({
        name: item?.name || '',
        description: item?.description || '',
        manager_username: item?.manager_username || '',
        existing_managers: item?.managers || [],
      });
    } else if (type === 'project') {
      setForm({ team_id: item.team_id || '', owner_username: item.owner_username || '' });
    } else if (type === 'credits') {
      setForm({ monthly_token_allowance: item.allowance ?? 0 });
    }
  };

  const saveDialog = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { type, item } = dialog;
      if (type === 'user') {
        const roleChanged = form.system_role !== (item.system_role || (item.is_superadmin ? 'admin' : 'staff'));
        const statusChanged = form.status !== (item.account_status || 'active');
        if (roleChanged) await updateUser(item.id || item.username, { system_role: form.system_role });
        if (statusChanged) await updateUser(item.id || item.username, { status: form.status });
      } else if (type === 'team') {
        if (item) await updateTeam(item.id, form);
        else await createTeam(form);
      } else if (type === 'project') {
        await updateProject(item.id, {
          owner_username: form.owner_username,
          team_id: form.team_id === '' ? null : Number(form.team_id),
        });
      } else if (type === 'credits') {
        await updateCredits(item.username, {
          monthly_token_allowance: Number(form.monthly_token_allowance),
        });
      }
      setDialog(emptyDialog);
      showToast('Changes saved', 'success');
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async (team) => {
    if (!window.confirm(`Delete team "${team.name}"? Members will need reassignment.`)) return;
    try {
      await deleteTeam(team.id);
      showToast('Team deleted', 'success');
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete team', 'error');
    }
  };

  const overview = data.overview || {};
  const userRows = activeTab === 'users' ? filtered || [] : [];
  const teamRows = activeTab === 'teams' ? filtered || [] : [];
  const projectRows = activeTab === 'projects' ? filtered || [] : [];
  const creditRows = activeTab === 'aiCredits' ? filtered || [] : [];
  const storageRows = activeTab === 'storage' ? filtered || [] : [];

  return (
    <>
      <TopBar title="Administration" showViews={false} showAddTask={false} />
      <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-thin">
        <div className="mx-auto max-w-7xl space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-semibold">Workspace administration</h2>
            </div>
            <p className="mt-1 text-sm text-cu-muted">Manage access, teams, projects, and workspace resources.</p>
          </div>

          <TabsRoot value={activeTab} onValueChange={(value) => { setActiveTab(value); setQuery(''); }}>
            <div className="overflow-x-auto">
              <TabsList className="min-w-max">
                {sections.map((section) => <TabsTrigger key={section.id} value={section.id}>{section.label}</TabsTrigger>)}
              </TabsList>
            </div>

            <TabsContent value="overview" className="pt-5">
              <LoadingState loading={loadingSections.overview} error={errors.overview}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard icon={Users} label="Users" value={overview.users?.total ?? 0} detail={`${overview.users?.by_role?.admin ?? 0} admins · ${overview.users?.by_role?.manager ?? 0} managers`} />
                  <MetricCard icon={Database} label="Teams" value={overview.total_teams ?? overview.teams} detail="Workspace teams" />
                  <MetricCard icon={FolderKanban} label="Projects" value={overview.projects ?? 0} detail={`${overview.tasks?.active ?? 0} active tasks`} />
                  <MetricCard icon={Bot} label="Groq tokens used" value={overview.groq?.tokens_used ?? 0} detail={overview.groq?.period || 'Current month'} />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-cu-border bg-cu-surface p-4">
                    <h3 className="text-sm font-semibold">Workspace health</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-cu-muted">Pending invitations</span><span>{overview.pending_invitations ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-cu-muted">Unassigned users</span><span>{overview.unassigned_users ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-cu-muted">Projects without owner</span><span>{overview.projects_without_owner ?? 0}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-cu-border bg-cu-surface p-4">
                    <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Storage</h3><HardDrive className="h-4 w-4 text-cu-muted" /></div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-cu-hover">
                      <div className="h-full rounded-full bg-cu-accent" style={{ width: `${Math.min(100, overview.storage_percent || 0)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-cu-muted">{formatBytes(overview.storage?.database_accounted_bytes)} accounted in database</p>
                  </div>
                </div>
              </LoadingState>
            </TabsContent>

            {activeTab !== 'overview' && (
              <div className="mb-3 mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cu-muted" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${sections.find((item) => item.id === activeTab)?.label.toLowerCase()}…`} className="pl-8" />
                </div>
                {activeTab === 'teams' && <Button size="sm" onClick={() => openDialog('team')}><Plus className="h-3.5 w-3.5" /> New team</Button>}
              </div>
            )}

            <TabsContent value="users">
              <LoadingState loading={loadingSections.users} error={errors.users}>
                <TableFrame headers={['User', 'System role', 'Team', 'Status', '']} empty={!userRows.length} colSpan={5}>
                  {userRows.map((user) => (
                    <tr key={user.id || user.username} className="border-b border-cu-border/60 hover:bg-cu-hover/30">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><UserAvatar username={user.username} src={user.avatar} size="sm" /><div><div className="font-medium">{itemName(user)}</div><div className="text-xs text-cu-muted">{user.email || `@${user.username}`}</div></div></div></td>
                      <td className="px-4 py-3"><Badge variant={getRoleBadgeVariant(user.is_superadmin ? 'admin' : user.system_role)}>{user.is_superadmin ? 'admin' : user.system_role || 'staff'}</Badge></td>
                      <td className="px-4 py-3">{user.team_name || 'Unassigned'}</td>
                      <td className="px-4 py-3"><Badge variant={(user.account_status || 'active') === 'active' ? 'green' : 'yellow'}>{user.account_status || 'active'}</Badge></td>
                      <td className="px-3 py-3"><button onClick={() => openDialog('user', user)} className="rounded p-1.5 text-cu-muted hover:bg-cu-hover"><MoreHorizontal className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </TableFrame>
              </LoadingState>
            </TabsContent>

            <TabsContent value="teams">
              <LoadingState loading={loadingSections.teams} error={errors.teams}>
                <TableFrame headers={['Team', 'Manager', 'Members', 'Projects', '']} empty={!teamRows.length} colSpan={5}>
                  {teamRows.map((team) => (
                    <tr key={team.id} className="border-b border-cu-border/60 hover:bg-cu-hover/30">
                      <td className="px-4 py-3 font-medium">{team.name}</td><td className="px-4 py-3">{team.manager_name || team.manager_username || 'Unassigned'}</td>
                      <td className="px-4 py-3">{team.member_count ?? team.members?.length ?? 0}</td><td className="px-4 py-3">{team.project_count ?? team.projects?.length ?? 0}</td>
                      <td className="px-3 py-3"><Dropdown trigger={<button className="rounded p-1.5 text-cu-muted hover:bg-cu-hover"><MoreHorizontal className="h-4 w-4" /></button>}><DropdownItem onClick={() => openDialog('team', team)}>Edit team</DropdownItem><DropdownItem destructive onClick={() => removeTeam(team)}>Delete team</DropdownItem></Dropdown></td>
                    </tr>
                  ))}
                </TableFrame>
              </LoadingState>
            </TabsContent>

            <TabsContent value="projects">
              <LoadingState loading={loadingSections.projects} error={errors.projects}>
                <TableFrame headers={['Project', 'Owner', 'Team', 'Members', 'Status', '']} empty={!projectRows.length} colSpan={6}>
                  {projectRows.map((project) => (
                    <tr key={project.id} className="border-b border-cu-border/60 hover:bg-cu-hover/30">
                      <td className="px-4 py-3 font-medium">{project.name}</td><td className="px-4 py-3">{project.owner_name || project.owner_username || 'Unassigned'}</td>
                      <td className="px-4 py-3">{project.team_name || 'Unassigned'}</td><td className="px-4 py-3">{project.member_count ?? 0}</td>
                      <td className="px-4 py-3"><Badge variant={(project.status || 'active') === 'active' ? 'green' : 'default'}>{project.status || 'active'}</Badge></td>
                      <td className="px-3 py-3"><button onClick={() => openDialog('project', project)} className="rounded p-1.5 text-cu-muted hover:bg-cu-hover"><MoreHorizontal className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </TableFrame>
              </LoadingState>
            </TabsContent>

            <TabsContent value="aiCredits">
              <LoadingState loading={loadingSections.aiCredits} error={errors.aiCredits}>
                <TableFrame headers={['User', 'Remaining tokens', 'Monthly allowance', 'Used this month', '']} empty={!creditRows.length} colSpan={5}>
                  {creditRows.map((credit) => (
                    <tr key={credit.username} className="border-b border-cu-border/60 hover:bg-cu-hover/30">
                      <td className="px-4 py-3 font-medium">{credit.username}</td><td className="px-4 py-3">{credit.remaining ?? 0}</td>
                      <td className="px-4 py-3">{credit.allowance ?? 0}</td><td className="px-4 py-3">{credit.total_tokens ?? 0}</td>
                      <td className="px-3 py-3"><button onClick={() => openDialog('credits', credit)} className="rounded p-1.5 text-cu-muted hover:bg-cu-hover"><MoreHorizontal className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </TableFrame>
              </LoadingState>
            </TabsContent>

            <TabsContent value="storage">
              <LoadingState loading={loadingSections.storage} error={errors.storage}>
                <TableFrame headers={['Resource', 'Owner', 'Type', 'Size', 'Updated']} empty={!storageRows.length} colSpan={5}>
                  {storageRows.map((resource) => (
                    <tr key={resource.id || resource.path} className="border-b border-cu-border/60 hover:bg-cu-hover/30">
                      <td className="px-4 py-3 font-medium">{resource.name || resource.path}</td><td className="px-4 py-3">{resource.owner_name || resource.owner_username || 'Workspace'}</td>
                      <td className="px-4 py-3"><Badge>{resource.type || 'file'}</Badge></td><td className="px-4 py-3">{formatBytes(resource.size_bytes ?? resource.size)}</td>
                      <td className="px-4 py-3 text-cu-muted">{resource.updated_at ? new Date(resource.updated_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </TableFrame>
              </LoadingState>
            </TabsContent>
          </TabsRoot>
        </div>
      </div>

      <DialogRoot open={Boolean(dialog.type)} onOpenChange={(open) => !open && setDialog(emptyDialog)}>
        <DialogContent title={dialog.item ? `Edit ${dialog.type}` : 'Create team'}>
          <form onSubmit={saveDialog} className="mt-4 space-y-4">
            {dialog.type === 'user' && <>
              <div><Label>System role</Label><Select value={form.system_role || 'staff'} onChange={(event) => setForm({ ...form, system_role: event.target.value })}><option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option></Select></div>
              <div><Label>Account status</Label><Select value={form.status || 'active'} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></Select></div>
            </>}
            {dialog.type === 'team' && <>
              <div><Label>Team name</Label><Input value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
              <div><Label>Description</Label><Input value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Optional" /></div>
              <div><Label>Manager username</Label><Input value={form.manager_username || ''} onChange={(event) => setForm({ ...form, manager_username: event.target.value })} placeholder="Optional; user must have Manager role" /></div>
            </>}
            {dialog.type === 'project' && <>
              <div><Label>Team ID</Label><Input value={form.team_id || ''} onChange={(event) => setForm({ ...form, team_id: event.target.value })} placeholder="Unassigned" /></div>
              <div><Label>Owner username</Label><Input value={form.owner_username || ''} onChange={(event) => setForm({ ...form, owner_username: event.target.value })} required /></div>
            </>}
            {dialog.type === 'credits' && <>
              <div><Label>Monthly Groq token allowance</Label><Input type="number" min="0" value={form.monthly_token_allowance ?? 0} onChange={(event) => setForm({ ...form, monthly_token_allowance: event.target.value })} required /></div>
            </>}
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setDialog(emptyDialog)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </form>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
