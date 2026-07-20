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
    setIsLoading(true);
    axios
      .post('/api/boards', { name: boardName.trim() })
      .then((res) => {
        setIsLoading(false);
        showNotification(res.data.message, 'success');
        fetchBoards();
        if (onSuccess) onSuccess(res.data.board_id);
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to create project.', 'error');
      });
  };

  const handleUpdateBoard = (boardId, boardName, onSuccess) => {
    if (!boardName.trim()) return;
    setIsLoading(true);
    axios
      .put(`/api/boards/${boardId}`, { name: boardName.trim() })
      .then(() => {
        setIsLoading(false);
        showNotification('Project updated successfully.', 'success');
        fetchBoards();
        if (selectedBoard?.id === boardId) {
          setSelectedBoard(prev => ({ ...prev, name: boardName.trim() }));
        }
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to update project.', 'error');
      });
  };

  const handleDeleteBoard = (boardId, onSuccess) => {
    setIsLoading(true);
    axios
      .delete(`/api/boards/${boardId}`)
      .then(() => {
        setIsLoading(false);
        showNotification('Project deleted successfully.', 'success');
        if (selectedBoard?.id === boardId) {
          setSelectedBoard(null);
          localStorage.removeItem('innocean_selected_board');
        }
        fetchBoards();
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setIsLoading(false);
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
