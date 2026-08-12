import { useState, useCallback } from 'react';
import axios from 'axios';

export function useBoard({ isAuthenticated, currentUser, showNotification, setIsLoading }) {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('innocean_selected_board');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [isBoardsLoading, setIsBoardsLoading] = useState(false);
  const [myTeam, setMyTeam] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberToRevoke, setMemberToRevoke] = useState(null);

  const fetchBoards = useCallback(() => {
    if (!isAuthenticated) return;
    setIsBoardsLoading(true);
    axios
      .get('/api/boards')
      .then((res) => setBoards(res.data.boards || []))
      .catch((err) => {
        if (err.response?.status !== 401) console.error(err);
      })
      .finally(() => setIsBoardsLoading(false));
  }, [isAuthenticated]);

  const handleCreateBoard = (boardName, onSuccess) => {
    if (!boardName.trim()) {
      showNotification('Project name is required!', 'error');
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newBoardName = boardName.trim();
    const tempBoard = {
      id: tempId,
      name: newBoardName,
      created_at: new Date().toISOString(),
      owner_username: currentUser?.username || '',
    };

    setBoards((prev) => [...prev, tempBoard]);
    if (onSuccess) onSuccess(tempId);

    axios
      .post('/api/boards', { name: newBoardName })
      .then((res) => {
        showNotification(res.data.message || 'Project created successfully.', 'success');
        fetchBoards();
      })
      .catch((err) => {
        setBoards((prev) => prev.filter((b) => b.id !== tempId));
        showNotification(err.response?.data?.detail || 'Failed to create project.', 'error');
      });
  };

  const handleUpdateBoard = (boardId, boardName, onSuccess) => {
    if (!boardName.trim()) return;
    const newName = boardName.trim();
    const previousBoards = boards;
    const previousSelectedBoard = selectedBoard;

    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name: newName } : b))
    );
    if (selectedBoard?.id === boardId) {
      setSelectedBoard((prev) => ({ ...prev, name: newName }));
    }
    if (onSuccess) onSuccess();

    axios
      .put(`/api/boards/${boardId}`, { name: newName })
      .then(() => {
        showNotification('Project updated successfully.', 'success');
      })
      .catch((err) => {
        setBoards(previousBoards);
        if (previousSelectedBoard?.id === boardId) {
          setSelectedBoard(previousSelectedBoard);
        }
        showNotification(err.response?.data?.detail || 'Failed to update project.', 'error');
      });
  };

  const handleDeleteBoard = (boardId, onSuccess) => {
    const previousBoards = boards;
    const previousSelectedBoard = selectedBoard;

    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    if (selectedBoard?.id === boardId) {
      setSelectedBoard(null);
      localStorage.removeItem('innocean_selected_board');
    }
    if (onSuccess) onSuccess();

    axios
      .delete(`/api/boards/${boardId}`)
      .then(() => {
        showNotification('Project deleted successfully.', 'success');
      })
      .catch((err) => {
        setBoards(previousBoards);
        if (previousSelectedBoard?.id === boardId) {
          setSelectedBoard(previousSelectedBoard);
        }
        showNotification(err.response?.data?.detail || 'Failed to delete project.', 'error');
      });
  };

  const fetchMyTeam = useCallback((bId = null) => {
    if (!isAuthenticated) return;
    const targetBoardId = bId || (selectedBoard ? selectedBoard.id : null);
    if (!targetBoardId || targetBoardId === 'global') return;
    
    axios
      .get(`/api/boards/${targetBoardId}/members`)
      .then((res) => setMyTeam(res.data.members || []))
      .catch((err) => console.error('Error fetching team members:', err));
  }, [isAuthenticated, selectedBoard]);

  return {
    boards, setBoards,
    selectedBoard, setSelectedBoard,
    isBoardsLoading, setIsBoardsLoading,
    myTeam, setMyTeam,
    teamMembers, setTeamMembers,
    memberToRevoke, setMemberToRevoke,
    fetchBoards,
    handleCreateBoard,
    handleUpdateBoard,
    handleDeleteBoard,
    fetchMyTeam,
  };
}
