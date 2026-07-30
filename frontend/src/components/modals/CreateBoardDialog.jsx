import { useState } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useBoardStore } from '@/stores/boardStore';
import { useNavigate } from 'react-router-dom';

export default function CreateBoardDialog() {
  const { isCreateBoardOpen, closeCreateBoard, showToast } = useUIStore();
  const createBoard = useBoardStore((s) => s.createBoard);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await createBoard(name.trim(), isPrivate ? 1 : 0);
      showToast('Project created!', 'success');
      closeCreateBoard();
      setName('');
      navigate(`/board/${data.board_id}`);
    } catch {
      showToast('Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogRoot open={isCreateBoardOpen} onOpenChange={(o) => !o && closeCreateBoard()}>
      <DialogContent title="Create New Project" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Project Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Campaign"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-cu-muted cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-cu-border"
            />
            Private project
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeCreateBoard}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
