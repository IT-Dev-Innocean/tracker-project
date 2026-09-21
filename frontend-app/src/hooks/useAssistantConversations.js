import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const ACTIVE_KEY = 'innocean_assistant_active_conversation';

export function useAssistantConversations({ enabled = true } = {}) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveIdState] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ACTIVE_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const skipSaveRef = useRef(false);
  const searchTimerRef = useRef(null);

  const setActiveId = useCallback((id) => {
    setActiveIdState(id);
    if (typeof window === 'undefined') return;
    if (id) localStorage.setItem(ACTIVE_KEY, String(id));
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const fetchConversations = useCallback(async (q = '') => {
    setIsLoadingList(true);
    try {
      const res = await axios.get('/api/ai/conversations', {
        params: q ? { q } : undefined,
      });
      setConversations(res.data.conversations || []);
      return res.data.conversations || [];
    } catch {
      return [];
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchConversations(searchQuery.trim());
    }, searchQuery ? 250 : 0);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [enabled, searchQuery, fetchConversations]);

  const loadConversation = useCallback(async (id) => {
    if (!id) return null;
    try {
      const res = await axios.get(`/api/ai/conversations/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const saveConversation = useCallback(
    async ({ id, title, messages, state }) => {
      const payload = { title, messages, state };
      if (id) {
        const res = await axios.patch(`/api/ai/conversations/${id}`, payload);
        return res.data;
      }
      const res = await axios.post('/api/ai/conversations', payload);
      return res.data;
    },
    []
  );

  const deleteConversation = useCallback(
    async (id) => {
      await axios.delete(`/api/ai/conversations/${id}`);
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId, setActiveId]
  );

  const beginSkipSave = useCallback(() => {
    skipSaveRef.current = true;
  }, []);

  const endSkipSave = useCallback(() => {
    window.setTimeout(() => {
      skipSaveRef.current = false;
    }, 0);
  }, []);

  return {
    conversations,
    activeId,
    setActiveId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    isLoadingList,
    skipSaveRef,
    fetchConversations,
    loadConversation,
    saveConversation,
    deleteConversation,
    beginSkipSave,
    endSkipSave,
  };
}
