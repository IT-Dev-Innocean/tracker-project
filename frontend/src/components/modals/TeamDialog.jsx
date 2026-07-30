import { useCallback, useState, useEffect } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge, Input, Label, Select } from '@/components/ui/Input';
import { UserAvatar } from '@/components/ui/Avatar';
import { useUIStore } from '@/stores/uiStore';
import { useBoardStore } from '@/stores/boardStore';
import { boardApi } from '@/api';
import { Crown, UserRoundPlus, X } from 'lucide-react';
import { getRoleBadgeVariant } from '@/lib/access';

export default function TeamDialog() {
  const { isTeamModalOpen, closeTeamModal, showToast } = useUIStore();
  const { selectedBoard, fetchBoards } = useBoardStore();
  const [team, setTeam] = useState([]);
  const [ownerUsername, setOwnerUsername] = useState('');
  const [permissions, setPermissions] = useState({});
  const [inviteInput, setInviteInput] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const { data } = await boardApi.getTeam(selectedBoard.id);
      setTeam(data.team || []);
      setOwnerUsername(data.owner_username || data.owner?.username || selectedBoard.owner_username || '');
      setPermissions(data.permissions || {});
    } catch {
      showToast('Failed to load team', 'error');
    }
  }, [selectedBoard, showToast]);

  useEffect(() => {
    if (isTeamModalOpen && selectedBoard) loadTeam();
  }, [isTeamModalOpen, loadTeam, selectedBoard]);

  const handleInvite = async () => {
    if (!inviteInput.trim()) return;
    setLoading(true);
    try {
      await boardApi.invite(selectedBoard.id, inviteInput.trim());
      showToast('Invitation sent!', 'success');
      setInviteInput('');
      await loadTeam();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (memberId) => {
    try {
      await boardApi.revokeMember(selectedBoard.id, memberId);
      showToast('Member removed', 'success');
      await loadTeam();
    } catch {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleTransfer = async () => {
    if (!newOwner || !window.confirm(`Transfer project ownership to ${newOwner}?`)) return;
    setLoading(true);
    try {
      await boardApi.transferOwnership(selectedBoard.id, newOwner);
      showToast('Project ownership transferred', 'success');
      setNewOwner('');
      await Promise.all([loadTeam(), fetchBoards()]);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to transfer ownership', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBoard) return null;

  const isBoardOwner = selectedBoard.role === 'owner';
  const canInvite = permissions.can_invite ?? isBoardOwner;
  const canRevoke = permissions.can_revoke ?? isBoardOwner;
  const canTransfer = permissions.can_transfer_ownership ?? isBoardOwner;
  const acceptedMembers = team.filter(
    (member) => member.status === 'accepted' && member.username !== ownerUsername
  );

  return (
    <DialogRoot open={isTeamModalOpen} onOpenChange={(o) => !o && closeTeamModal()}>
      <DialogContent
        title={`Project team — ${selectedBoard.name}`}
        description="Project roles are scoped to this board and do not change system access."
        className="max-w-lg"
      >
        <div className="space-y-4 mt-2">
          <div className="rounded-md border border-cu-border bg-cu-bg p-3">
            <div className="flex items-center gap-2">
              <UserAvatar username={ownerUsername || 'Owner'} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{ownerUsername || 'Unknown owner'}</div>
                <div className="text-xs text-cu-muted">Project owner</div>
              </div>
              <Badge variant="purple"><Crown className="mr-1 h-3 w-3" /> Owner</Badge>
            </div>
          </div>

          {canInvite && (
            <div>
              <Label>Invite to this project</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="Username or email..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <Button onClick={handleInvite} disabled={loading}>
                  <UserRoundPlus className="h-3.5 w-3.5" /> Invite
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-2 py-1.5">
                <UserAvatar username={member.username} src={member.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{member.username}</div>
                  {member.email && <div className="truncate text-xs text-cu-muted">{member.email}</div>}
                </div>
                <Badge variant={getRoleBadgeVariant(member.board_role || member.role || 'member')}>
                  {member.username === ownerUsername ? 'owner' : member.board_role || member.role || 'member'}
                </Badge>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${member.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {member.status}
                </span>
                {canRevoke && member.username !== ownerUsername && (
                  <button onClick={() => handleRevoke(member.id)} title={member.status === 'accepted' ? 'Remove member' : 'Revoke invitation'} className="p-1 hover:bg-cu-hover rounded">
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
              </div>
            ))}
            {!team.length && <div className="py-6 text-center text-sm text-cu-muted">No project members yet.</div>}
          </div>

          {canTransfer && (
            <div className="border-t border-cu-border pt-4">
              <Label>Transfer project ownership</Label>
              <div className="mt-1 flex gap-2">
                <Select value={newOwner} onChange={(event) => setNewOwner(event.target.value)}>
                  <option value="">Select an accepted member</option>
                  {acceptedMembers.map((member) => <option key={member.id} value={member.username}>{member.username}</option>)}
                </Select>
                <Button variant="secondary" onClick={handleTransfer} disabled={!newOwner || loading}>Transfer</Button>
              </div>
              <p className="mt-1.5 text-xs text-cu-muted">You will lose owner-only controls after transfer.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
