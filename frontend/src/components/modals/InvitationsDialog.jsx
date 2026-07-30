import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBoardStore } from '@/stores/boardStore';
import { useNavigate } from 'react-router-dom';

export default function InvitationsDialog() {
  const { isInvitesModalOpen, closeInvitesModal, showToast } = useUIStore();
  const { invitations, acceptInvitation, declineInvitation } = useNotificationStore();
  const fetchBoards = useBoardStore((s) => s.fetchBoards);
  const navigate = useNavigate();

  const handleAccept = async (id) => {
    await acceptInvitation(id);
    await fetchBoards();
    showToast('Invitation accepted!', 'success');
  };

  const handleDecline = async (id) => {
    await declineInvitation(id);
    showToast('Invitation declined', 'info');
  };

  return (
    <DialogRoot open={isInvitesModalOpen} onOpenChange={(o) => !o && closeInvitesModal()}>
      <DialogContent title="Project Invitations" className="max-w-md">
        <div className="space-y-3 mt-2">
          {invitations.length === 0 ? (
            <p className="text-sm text-cu-muted text-center py-4">No pending invitations</p>
          ) : (
            invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-cu-border p-3">
                <div>
                  <p className="text-sm font-medium">{inv.board_name}</p>
                  <p className="text-xs text-cu-muted">from {inv.owner_username}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleDecline(inv.id)}>Decline</Button>
                  <Button size="sm" onClick={() => handleAccept(inv.id)}>Accept</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
