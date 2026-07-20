import { useEffect, useRef } from 'react';

export function useDeepLinks({ isAuthenticated, boards, setSelectedBoard, currentUser, showNotification, handleNotificationTaskClick, tMsg }) {
  const deepLinkProcessedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !deepLinkProcessedRef.current && boards.length > 0) {
      deepLinkProcessedRef.current = true;
      const params = new URLSearchParams(window.location.search);
      let taskIdParam = params.get('task');
      let boardIdParam = params.get('board');
      const path = window.location.pathname;

      if (path.startsWith('/task/')) {
        taskIdParam = path.replace('/task/', '');
      } else if (path.startsWith('/project/')) {
        boardIdParam = path.replace('/project/', '');
      }

      if (taskIdParam) {
        const taskId = parseInt(taskIdParam.split('-')[0], 10);
        if (!isNaN(taskId) && handleNotificationTaskClick) handleNotificationTaskClick(taskId);
        const url = new URL(window.location);
        url.searchParams.delete('task');
        url.pathname = '/';
        window.history.pushState({}, '', url);
      } else if (boardIdParam) {
        if (boardIdParam.startsWith('global')) {
          setSelectedBoard({
            id: 'global',
            name: `🌍 ${tMsg ? tMsg('Global Workload', 'Global Workload') : 'Global Workload'}`,
            owner_username: currentUser,
            role: 'owner',
            isVirtual: true,
          });
        } else {
          const boardId = parseInt(boardIdParam.split('-')[0], 10);
          const targetBoard = boards.find((b) => b.id === boardId);
          if (targetBoard) {
            setSelectedBoard(targetBoard);
          } else {
            if (showNotification) {
              showNotification(
                tMsg ? tMsg('Project not found or access denied.', 'Proyek tidak ditemukan atau akses ditolak.') : 'Project not found or access denied.',
                'error'
              );
            }
          }
        }
        const url = new URL(window.location);
        url.searchParams.delete('board');
        url.pathname = '/';
        window.history.pushState({}, '', url);
      }
    }
  }, [isAuthenticated, boards, setSelectedBoard, currentUser, showNotification, handleNotificationTaskClick, tMsg]);
}
