import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCloseAnimation, LoadingSpinner } from './Utils';
import { Avatar } from './SharedUI';

export default function ProactiveAIModal({
  setIsProactiveAIOpen,
  boards,
  fetchBoards,
  setSelectedBoard,
  currentUser,
  language,
  setIsProjectChatOpen,
  setDrawerTab,
  setViewMode,
  fetchTasks,
  showNotification,
  userDirectory,
  formatDateMMM,
  avatarsMap,
}) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [inboxTasks, setInboxTasks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [targetBoard, setTargetBoard] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [privateWarningOpen, setPrivateWarningOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const [isBoardMentioning, setIsBoardMentioning] = useState(false);
  const [boardMentionQuery, setBoardMentionQuery] = useState('');
  const [boardMentionIndex, setBoardMentionIndex] = useState(0);

  const tasksEndRef = React.useRef(null);

  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [isClosing, close] = useCloseAnimation(() => setIsProactiveAIOpen(false), 200);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Mencegah user tidak sengaja me-refresh halaman (F5) saat memiliki keranjang/draf yang belum tersimpan
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (inboxTasks.length > 0 || generatedTasks.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [inboxTasks.length, generatedTasks.length]);

  useEffect(() => {
    if (isProcessing && generatedTasks.length > 0) {
      const timer = setTimeout(() => {
        tasksEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [generatedTasks, isProcessing, loadingText]);

  const initBoardRef = React.useRef(false);

  useEffect(() => {
    const initBoard = async () => {
      if (initBoardRef.current) return;
      initBoardRef.current = true;
      try {
        let board = boards.find((b) => b.name.toLowerCase() === 'to-do list');
        if (!board) {
          const resBoards = await axios.get('/api/boards');
          const currentBoards = resBoards.data.boards || [];
          board = currentBoards.find((b) => b.name.toLowerCase() === 'to-do list');
          if (!board) {
            const res = await axios.post('/api/boards', { name: 'To-do List', is_private: 1 });
            board = { id: res.data.board_id, name: res.data.board_name, is_private: 1 };
            if (fetchBoards) fetchBoards();
          }
        }
        if (board) setTargetBoard(board);
      } catch (e) {
        console.error(e);
      }
    };
    if (!targetBoard) initBoard();
  }, [boards, targetBoard, fetchBoards]);

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
      2,
      '0'
    )}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setGeneratedTasks([]);
    setLoadingText(tMsg('Analyzing your request...', 'Menganalisis permintaan Anda...'));

    try {
      setLoadingText(tMsg('Structuring tasks...', 'Menyusun tugas-tugas...'));
      const currentYear = new Date().getFullYear();
      const aiPrompt = `Act as an Expert Project Manager. Your objective is to parse the user's request and output a strictly valid JSON array of tasks.

DOMAIN KNOWLEDGE: You possess deep contextual understanding of the field mentioned in the request. Use this to accurately estimate time and break down complex workflows into clear, actionable, professional-grade steps.

INSTRUCTIONS:
1. Read and analyze carefully the request from the user.
2. Delimiters: The user's request is enclosed in triple quotes (""").
3. Task Breakdown (Specific vs Generic):
   - BROAD / GENERIC GOAL: If the user's request is generic or broad (e.g., "Paid search", "SEO", "marketing campaign", "website redesign") and does NOT explicitly mention a specific assignee (@name), a specific deadline/due date, a specific project name (#ProjectName), or any highly specific single action, you MUST logically break it down into multiple actionable tasks (minimum 3 tasks), regardless of how few words the user prompt is.
   - SPECIFIC TASK: If it is a single specific action, explicitly assigns work (@name), or specifies a distinct project (#ProjectName), generate EXACTLY ONE task per each action.
4. Naming Convention (project_name):
   - Language: MUST ALWAYS be in English for task titles, regardless of the prompt's language.
   - Format: "[Context/Brand] Task Title". Extract the unique context prefix (e.g., brand, activity, or game title).
   - Numbering: When generating multiple tasks from a breakdown, you MUST prepend step numbers (e.g. "[Part 1] Task Title" or "1. Task Title") so the sequence and order of execution are clear.
5. Language Constraint: The "description" and "subtasks" fields MUST match the EXACT language used in the user's prompt. Make the explanation simple enough for a layperson.
6. Extract URLs: If there are any URLs or links (e.g. http://, https://) mentioned in the user's prompt, extract them into the "supporting_access" field (separated by newlines). DO NOT include or repeat these URLs inside the "description" field.
7. Output Format: Return ONLY a valid JSON array. DO NOT use markdown formatting blocks (\`\`\`json).

JSON SCHEMA:
[
  {
    "project_name": "[Context] Actionable Title in ENGLISH ONLY",
    "suggested_project": "Extract project name identified by '#' (e.g., '#WebsiteRedesign'). Leave empty if none.",
    "requester": "If assigning TO someone, use '@username' (e.g., '@budi'). If requested BY someone else, use their name without '@' (e.g., 'Mr. Smith'). Default to '@${currentUser}' if unspecified.",
    "category": "Identify the best category (e.g. Development, Design, Marketing). If none fit, create a short new category name in English.",
    "impact": "High, Medium, or Low",
    "deadline": "YYYY-MM-DD. Ensure year is ${currentYear} or later. Must be >= ${getLocalToday()}. Extract ONLY if explicitly mentioned, otherwise leave empty.",
    "auto_nudge": "Boolean. Return true ONLY if the user explicitly asks to be reminded or notified about this task. Otherwise false.",
    "etc": "Estimate the REALISTIC time consumption in hours (e.g. 0.5, 1, 1.5, 2.5, 3.0, 4.0, 8.0, 12.0). DO NOT default to 2. Base this heavily on the complexity of the task.",
    "description": "Highly detailed and comprehensive brief expanding on the user's request. Provide full context, background, and specific requirements in markdown format. DO NOT include @ or # routing tags here. DO NOT include any URLs or links here.",
    "supporting_access": "URLs/links found in the prompt (separated by newline). Leave empty if none.",
    "subtasks": ["Break down the task into 3-5 actionable sub-tasks as an array of strings. If not applicable, return an empty array []."]
  }
]

USER REQUEST:
"""${prompt}"""`;
      const resAi = await axios.post('/api/ai/generate', { prompt: aiPrompt, provider: 'auto' });
      let jsonStr = resAi.data.text
        .trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const startIdx = jsonStr.indexOf('[');
      const endIdx = jsonStr.lastIndexOf(']') + 1;
      if (startIdx >= 0 && endIdx > startIdx) {
        jsonStr = jsonStr.substring(startIdx, endIdx);
      }
      const extractedTasks = JSON.parse(jsonStr);

      if (!Array.isArray(extractedTasks) || extractedTasks.length === 0) {
        throw new Error('No tasks generated');
      }

      setPrompt('');

      for (let i = 0; i < extractedTasks.length; i++) {
        setLoadingText(
          tMsg(
            `Drafting task ${i + 1} of ${extractedTasks.length}...`,
            `Menyusun tugas ${i + 1} dari ${extractedTasks.length}...`
          )
        );
        const delay = 1200 + Math.random() * 1000; // Jeda acak 1.2s - 2.2s agar terkesan diproses AI sungguhan
        await new Promise((res) => setTimeout(res, delay));

        let matchedBoardId = targetBoard?.id || '';
        if (extractedTasks[i].suggested_project) {
          const sp = extractedTasks[i].suggested_project.replace('#', '').toLowerCase().trim();
          // Prioritize exact match first, then inclusion, to avoid "test" matching "test 2"
          let matched = boards.find((b) => b.name.toLowerCase() === sp);
          if (!matched) {
            matched = boards.find((b) => b.name.toLowerCase().includes(sp));
          }
          if (matched && matched.id !== 'global') {
            matchedBoardId = matched.id;
          }
        }

        setGeneratedTasks((prev) => [
          ...prev,
          {
            ...extractedTasks[i],
            id: Math.random().toString(),
            deadline: extractedTasks[i].deadline && extractedTasks[i].deadline !== '' ? extractedTasks[i].deadline : '',
            auto_nudge: extractedTasks[i].auto_nudge === true || extractedTasks[i].auto_nudge === 'true',
            selected: true,
            target_board_id: matchedBoardId,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      alert(tMsg('Failed to process request. Please try again.', 'Gagal memproses permintaan. Silakan coba lagi.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSelected = async () => {
    if (isSaving) return;
    const selected = generatedTasks.filter((t) => t.selected);
    if (selected.length === 0) return;

    setIsSaving(true);

    // Cek masing-masing tugas, apakah target board-nya private tapi di-assign ke orang lain
    const invalidTask = selected.find((t) => {
      const bId = t.target_board_id || targetBoard?.id;
      const b = boards.find((x) => String(x.id) === String(bId));
      const isPriv = b?.is_private === 1 || b?.name?.toLowerCase() === 'to-do list';
      const req = t.requester || '';
      // Only consider it an assignment to others if it starts with '@' and is not the current user.
      const isAssignedToOther =
        req.startsWith('@') && req.replace('@', '').toLowerCase().trim() !== currentUser.toLowerCase();
      return isPriv && isAssignedToOther;
    });

    if (invalidTask) {
      setPrivateWarningOpen(true);
      setIsSaving(false);
      return;
    }

    const todayStr = getLocalToday();

    const newItems = selected.map((t) => {
      const bId = t.target_board_id || targetBoard?.id;
      const bObj = boards.find((x) => String(x.id) === String(bId));
      const isTodo = bObj?.name?.toLowerCase() === 'to-do list';
      const target_board_name = bObj?.name || 'Unknown Project';

      let dl = t.deadline || '';
      if (!dl && !isTodo) {
        dl = todayStr;
      }
      if (dl && new Date(dl) < new Date(todayStr)) {
        dl = todayStr; // Programmatic Fallback: Paksa hari ini jika AI mengembalikan masa lalu
      }
      const finalDeadline = dl ? `${dl} 17:00:00` : '';

      const reqString = t.requester || '';
      let autoInviteMsg = null;
      if (reqString.startsWith('@')) {
        const reqUsername = reqString.replace('@', '').toLowerCase().trim();
        if (reqUsername && reqUsername !== currentUser.toLowerCase() && bObj) {
          const isAlreadyMember = (bObj.team_preview || []).some(
            (memberUsername) => memberUsername.toLowerCase() === reqUsername
          );
          if (!isAlreadyMember) autoInviteMsg = `@${reqUsername}`;
        }
      }

      return { ...t, target_board_id: bId, target_board_name, finalDeadline, autoInviteMsg };
    });

    if (!isCartVisible) {
      setIsCartVisible(true);
      await new Promise((res) => setTimeout(res, 500)); // Tunggu animasi drawer dari samping selesai
    }

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      setProcessingId(item.id);
      await new Promise((res) => setTimeout(res, 600)); // Jeda lebih lama agar animasi CSS selesai dulu

      setInboxTasks((prev) => [...prev, item]); // Masukkan ke urutan paling bawah
      setGeneratedTasks((prev) => prev.filter((task) => task.id !== item.id));
    }

    setProcessingId(null);
    setIsSaving(false);
  };

  const handleDeleteFromCart = async (taskToRemove) => {
    setInboxTasks((prev) => {
      const updated = prev.filter((item) => item.id !== taskToRemove.id);
      if (updated.length === 0) setIsCartVisible(false);
      return updated;
    });
  };

  const handleSkipOrCancel = () => {
    if (isCartVisible || inboxTasks.length > 0 || generatedTasks.length > 0) {
      setCancelConfirmOpen(true);
    } else {
      close();
    }
  };

  const confirmSkipOrCancel = () => {
    setIsCancelling(true);
    setInboxTasks([]);
    setGeneratedTasks([]);
    setIsCartVisible(false);
    setIsCancelling(false);
    setCancelConfirmOpen(false);
    close();
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    if (inboxTasks.length === 0) {
      finishAndClose();
      return;
    }

    setIsFinishing(true);
    const error_messages = new Set();
    const todayStr = getLocalToday();
    let successCount = 0;

    for (let i = 0; i < inboxTasks.length; i++) {
      const t = inboxTasks[i];
      const bId = t.target_board_id || targetBoard?.id;

      const formattedData = {
        project_name: t.project_name,
        requester: t.requester || `@${currentUser}`,
        category: t.category || 'Other',
        deadline: t.finalDeadline,
        description: t.description + '\n\n*✨ Auto-generated by Smart Assistant*',
        supporting_access: t.supporting_access || '',
        start_date: todayStr,
        impact: t.impact || 'Medium',
        etc: t.etc || 2,
        auto_nudge: t.auto_nudge === true || t.auto_nudge === 'true',
        subtasks: Array.isArray(t.subtasks)
          ? t.subtasks.map(st => typeof st === 'string' ? { task_name: st, assignee: null } : st)
          : [],
      };

      try {
        await axios.post(`/api/boards/${bId}/tasks`, formattedData);
        successCount++;
      } catch (e) {
        console.error(e);
        const errorMsg =
          e.response?.data?.detail || `${tMsg('Failed to create task', 'Gagal membuat tugas')}: ${t.project_name}`;
        error_messages.add(errorMsg);
      }
    }

    setIsFinishing(false);

    if (error_messages.size > 0) {
      error_messages.forEach((msg) => {
        if (showNotification) showNotification(msg, 'error');
        else alert(msg);
      });
    }

    if (successCount > 0 && showNotification) {
      showNotification(
        tMsg(`Successfully created ${successCount} tasks!`, `Berhasil membuat ${successCount} tugas!`),
        'success'
      );
    }

    finishAndClose();
  };

  const finishAndClose = () => {
    if (targetBoard && inboxTasks.length > 0) {
      setSelectedBoard(targetBoard);
      if (setViewMode) setViewMode('list');
      if (fetchTasks) fetchTasks();
    }
    localStorage.setItem('innocean_ai_offer_docs', 'true');
    close();
    setTimeout(() => {
      if (setIsProjectChatOpen) setIsProjectChatOpen(true);
      if (setDrawerTab) setDrawerTab('assistant');
    }, 350);
  };

  const insertMention = (username) => {
    const newVal = prompt.replace(/(?:^|\s)@([\w.-]*)$/, ` @${username} `);
    setPrompt(newVal);
    setIsMentioning(false);
  };

  const insertBoardMention = (boardName) => {
    const newVal = prompt.replace(/(?:^|\s)#([\w\s.-]*)$/, ` #${boardName} `);
    setPrompt(newVal);
    setIsBoardMentioning(false);
  };

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-neutral-950 z-[200] overflow-y-auto lg:overflow-hidden font-sans ${isClosing ? 'mac-exit' : ''
        }`}
    >
      <div
        className={`flex flex-col min-h-full lg:h-full p-4 sm:p-6 lg:p-8 relative ${isClosing ? '' : 'mac-animate'}`}
      >
        <button
          onClick={handleSkipOrCancel}
          disabled={isCancelling}
          className="absolute top-4 right-4 lg:top-8 lg:right-8 text-neutral-500 hover:text-red-500 font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-widest transition-colors z-50 disabled:opacity-50 bg-neutral-100 dark:bg-neutral-900 lg:bg-transparent px-3 py-2 lg:p-0 rounded-lg lg:rounded-none shadow-sm lg:shadow-none"
        >
          {isCancelling
            ? tMsg('Cancelling...', 'Membatalkan...')
            : isCartVisible || inboxTasks.length > 0
              ? tMsg('Cancel', 'Batal') + ' ✖'
              : tMsg('Skip', 'Lewati') + ' ✖'}
        </button>

        <style>{`
        @keyframes elegant-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-elegant {
          animation: elegant-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slide-in-right {
          0% { opacity: 0; transform: translateX(100px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch flex-1 lg:min-h-0 pt-14 lg:pt-6">
          {/* Left/Center: Input & AI Generation */}
          <div
            className={`flex-1 flex flex-col transition-all duration-500 lg:min-h-0 pb-4 pr-1 sm:pr-2 ${isCartVisible || inboxTasks.length > 0 || generatedTasks.length > 0
              ? 'lg:pr-8 lg:border-r border-neutral-200 dark:border-neutral-800'
              : ''
              }`}
          >
            <div
              className="hidden lg:block transition-all duration-700 ease-in-out shrink-0"
              style={{ height: isCartVisible || inboxTasks.length > 0 || generatedTasks.length > 0 ? '0vh' : '22vh' }}
            />
            <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 lg:min-h-0 transition-all duration-500">
              <div className="shrink-0">
                <div className="mb-6 lg:mb-8 animate-elegant">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter leading-tight mb-2 sm:mb-4">
                    {tMsg('What do you want to achieve today?', 'Apa yang ingin Anda capai hari ini?')}
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-lg font-medium leading-relaxed">
                    {tMsg(
                      'Tell me your goals or delegate tasks (e.g. "Assign design to @budi in #Marketing"). I will structure them into actionable items.',
                      'Ceritakan tujuan Anda atau delegasikan tugas (contoh: "Tugaskan desain ke @budi di #Marketing"). Saya akan menyusunnya menjadi tugas terstruktur.'
                    )}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="w-full relative z-20 animate-elegant"
                  style={{ animationDelay: '100ms' }}
                >
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrompt(val);
                      const mentionMatch = val.match(/(?:^|\s)@([\w.-]*)$/);
                      const boardMatch = val.match(/(?:^|\s)#([\w\s.-]*)$/);

                      if (mentionMatch) {
                        setMentionQuery(mentionMatch[1].toLowerCase());
                        setIsMentioning(true);
                        setMentionIndex(0);
                        setIsBoardMentioning(false);
                      } else if (boardMatch) {
                        const query = boardMatch[1].toLowerCase();
                        const boardOptions = boards.filter((b) => b.id !== 'global').map((b) => b.name.toLowerCase());
                        const hasPartialMatch = boardOptions.some((b) => b.includes(query));

                        if (hasPartialMatch || query === '') {
                          setBoardMentionQuery(query);
                          setIsBoardMentioning(true);
                          setBoardMentionIndex(0);
                          setIsMentioning(false);
                        } else {
                          setIsBoardMentioning(false);
                        }
                      } else {
                        setIsMentioning(false);
                        setIsBoardMentioning(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (isMentioning) {
                        const mentionOptions = (userDirectory || [])
                          .filter((u) => u.is_connected && u.username !== 'admin')
                          .map((u) => u.username);
                        const filtered = mentionOptions.filter((m) => m.toLowerCase().includes(mentionQuery));
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setMentionIndex((prev) => (prev + 1) % (filtered.length || 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setMentionIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          if (filtered.length > 0) {
                            e.preventDefault();
                            insertMention(filtered[mentionIndex] || filtered[0]);
                          } else {
                            setIsMentioning(false);
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsMentioning(false);
                        }
                      } else if (isBoardMentioning) {
                        const boardOptions = boards.filter((b) => b.id !== 'global').map((b) => b.name);
                        const filtered = boardOptions.filter((m) => m.toLowerCase().includes(boardMentionQuery));
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setBoardMentionIndex((prev) => {
                            const nextIdx = (prev + 1) % (filtered.length || 1);
                            setTimeout(
                              () =>
                                document.getElementById(`board-item-${nextIdx}`)?.scrollIntoView({ block: 'nearest' }),
                              0
                            );
                            return nextIdx;
                          });
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setBoardMentionIndex((prev) => {
                            const nextIdx = (prev - 1 + filtered.length) % (filtered.length || 1);
                            setTimeout(
                              () =>
                                document.getElementById(`board-item-${nextIdx}`)?.scrollIntoView({ block: 'nearest' }),
                              0
                            );
                            return nextIdx;
                          });
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          if (filtered.length > 0) {
                            e.preventDefault();
                            insertBoardMention(filtered[boardMentionIndex] || filtered[0]);
                          } else {
                            setIsBoardMentioning(false);
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsBoardMentioning(false);
                        }
                      } else if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder={tMsg(
                      'Example: I need to prepare a marketing presentation for next week...',
                      'Contoh: Saya perlu menyiapkan presentasi pemasaran untuk minggu depan...'
                    )}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-2xl lg:rounded-3xl p-4 sm:p-6 text-sm sm:text-lg text-black dark:text-white outline-none resize-none shadow-sm transition-all h-28 sm:h-32 custom-scrollbar"
                    autoFocus
                    disabled={isProcessing}
                  />
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={!prompt.trim() || isProcessing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          ></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  {isMentioning && (
                    <div className="absolute left-0 top-full mt-2 w-full min-w-[200px] bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2 mac-animate">
                      {(() => {
                        const mentionOptions = (userDirectory || [])
                          .filter((u) => u.is_connected && u.username !== 'admin')
                          .map((u) => u.username);
                        const filtered = mentionOptions.filter((m) => m.toLowerCase().includes(mentionQuery));
                        if (filtered.length > 0) {
                          return filtered.map((m, idx) => (
                            <div
                              key={m}
                              className={`px-4 py-2.5 cursor-pointer text-sm text-black dark:text-white font-medium border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${mentionIndex === idx
                                ? 'bg-neutral-100 dark:bg-neutral-800'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              onClick={() => insertMention(m)}
                            >
                              <span>@{m}</span>
                            </div>
                          ));
                        }
                        return <div className="px-4 py-3 text-sm text-neutral-500 italic">No members found</div>;
                      })()}
                    </div>
                  )}
                  {isBoardMentioning && (
                    <div className="absolute left-0 top-full mt-2 w-full min-w-[200px] bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2 mac-animate">
                      {(() => {
                        const boardOptions = boards.filter((b) => b.id !== 'global').map((b) => b.name);
                        const filtered = boardOptions.filter((m) => m.toLowerCase().includes(boardMentionQuery));
                        if (filtered.length > 0) {
                          return filtered.map((m, idx) => (
                            <div
                              key={m}
                              id={`board-item-${idx}`}
                              className={`px-4 py-2.5 cursor-pointer text-sm text-black dark:text-white font-medium border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${boardMentionIndex === idx
                                ? 'bg-neutral-100 dark:bg-neutral-800'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              onClick={() => insertBoardMention(m)}
                            >
                              <span>#{m}</span>
                            </div>
                          ));
                        }
                        return (
                          <div className="px-4 py-3 text-sm text-neutral-500 italic">
                            {tMsg('No projects found', 'Tidak ada proyek ditemukan')}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </form>
              </div>

              {/* Generated Tasks Result */}
              {isProcessing && generatedTasks.length === 0 && (
                <div className="mt-8 flex flex-col items-center justify-center py-10 opacity-70 animate-elegant shrink-0">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold uppercase tracking-widest text-indigo-500 animate-pulse">
                    {loadingText}
                  </p>
                </div>
              )}

              {generatedTasks.length > 0 && (
                <div
                  className="mt-6 md:mt-8 flex-1 flex flex-col lg:min-h-0 animate-elegant"
                  style={{ animationDelay: '200ms' }}
                >
                  <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                    <h3 className="font-bold text-base sm:text-lg text-black dark:text-white">
                      {tMsg('Generated Tasks', 'Tugas Dihasilkan')}
                    </h3>
                    <button
                      onClick={() => {
                        const allSelected = generatedTasks.every((t) => t.selected);
                        setGeneratedTasks(generatedTasks.map((t) => ({ ...t, selected: !allSelected })));
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {generatedTasks.every((t) => t.selected)
                        ? tMsg('Deselect All', 'Batal Pilih Semua')
                        : tMsg('Select All', 'Pilih Semua')}
                    </button>
                  </div>
                  <div className="lg:flex-1 lg:overflow-y-auto px-1 pr-2 lg:custom-scrollbar space-y-3 lg:min-h-0">
                    <div className="mb-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-sm">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                        {tMsg('Target Project', 'Target Proyek')}
                      </label>
                      <select
                        value={targetBoard?.id || ''}
                        onChange={(e) => {
                          const b = boards.find((x) => String(x.id) === e.target.value);
                          if (b) setTargetBoard(b);
                          setGeneratedTasks(generatedTasks.map((item) => ({ ...item, target_board_id: b.id })));
                        }}
                        className="w-full bg-neutral-100 dark:bg-neutral-950 border border-transparent rounded-xl p-2.5 text-xs font-bold text-black dark:text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {boards
                          .filter((b) => b.id !== 'global')
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} {b.is_private ? '(Private)' : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    {generatedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() =>
                          setGeneratedTasks(
                            generatedTasks.map((item) =>
                              item.id === t.id ? { ...item, selected: !item.selected } : item
                            )
                          )
                        }
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 animate-slide-up ${t.selected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={t.selected}
                          readOnly
                          disabled={isSaving}
                          className="mt-1 w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-black dark:text-white text-sm mb-1">{t.project_name}</h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[9px] font-bold bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400 inline-block uppercase tracking-wider">
                              {t.category}
                            </span>
                            <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400 inline-block uppercase tracking-wider">
                              {t.requester || `@${currentUser}`}
                            </span>
                            {t.deadline && (
                              <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded text-rose-700 dark:text-rose-400 inline-block uppercase tracking-wider">
                                📅 {formatDateMMM(t.deadline)}
                              </span>
                            )}
                            {t.auto_nudge && (
                              <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-400 inline-block uppercase tracking-wider">
                                🔔 Auto Nudge ON
                              </span>
                            )}
                            <select
                              value={t.target_board_id || targetBoard?.id || ''}
                              onChange={(e) => {
                                const newId = e.target.value;
                                setGeneratedTasks((prev) =>
                                  prev.map((item) => (item.id === t.id ? { ...item, target_board_id: newId } : item))
                                );
                              }}
                              className="text-[9px] font-bold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400 inline-block uppercase tracking-wider outline-none cursor-pointer max-w-[140px] truncate [&>option]:bg-white dark:[&>option]:bg-neutral-900 [&>option]:text-black dark:[&>option]:text-white"
                            >
                              {boards
                                .filter((b) => b.id !== 'global')
                                .map((b) => (
                                  <option key={b.id} value={b.id}>
                                    📁 {b.name} {b.is_private ? '(Private)' : ''}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                            {t.description}
                          </p>
                        </div>
                        {processingId === t.id && (
                          <div className="shrink-0 mt-1">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {!isSaving && processingId !== t.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGeneratedTasks((prev) => prev.filter((item) => item.id !== t.id));
                            }}
                            className="shrink-0 ml-2 text-neutral-400 hover:text-red-500 transition-colors p-1"
                            title={tMsg('Remove task', 'Hapus tugas')}
                          >
                            ✖
                          </button>
                        )}
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="p-4 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center gap-4 animate-pulse">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                          {loadingText}
                        </span>
                      </div>
                    )}
                    <div ref={tasksEndRef} className="h-4 shrink-0" />
                  </div>
                  <div className="sticky bottom-0 mt-4 pt-4 pb-4 lg:pb-0 flex justify-end shrink-0 px-1 z-20 pointer-events-none">
                    <button
                      onClick={handleSaveSelected}
                      disabled={isSaving || isProcessing || !generatedTasks.some((t) => t.selected)}
                      className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 pointer-events-auto"
                    >
                      {isSaving ? <LoadingSpinner /> : '🚀'}
                      {isSaving
                        ? tMsg('Processing...', 'Memproses...')
                        : tMsg('Add to Inbox', 'Tambahkan ke Kotak Masuk')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Inbox (To-do List) */}
          {(isCartVisible || inboxTasks.length > 0) && (
            <div className="w-full lg:w-80 flex flex-col shrink-0 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl p-4 md:p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm animate-slide-in-right lg:h-full lg:overflow-hidden mt-4 lg:mt-0 mb-8 lg:mb-0">
              <div className="flex items-center gap-3 mb-4 md:mb-6 shrink-0">
                <span className="text-2xl">🛒</span>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-black dark:text-white uppercase tracking-tight">
                    {tMsg('Inbox', 'Kotak Masuk')}
                  </h2>
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                    {tMsg('Ready to dispatch', 'Siap untuk dikirim')}
                  </p>
                </div>
              </div>

              <div className="lg:flex-1 lg:overflow-y-auto pr-2 lg:custom-scrollbar space-y-3 lg:min-h-0">
                {inboxTasks.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className={`bg-white dark:bg-neutral-950 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative group transition-opacity mb-2.5 ${deletingId === t.id ? 'opacity-50' : 'animate-slide-up'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-2.5 pb-1 pr-6">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md truncate max-w-[100px] border border-indigo-100 dark:border-indigo-800/50">
                          📁 {t.target_board_name || 'Project'}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700 font-bold text-[10px]">/</span>
                        <span className="text-[9px] font-bold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-2 py-1 rounded-md truncate max-w-[80px] border border-neutral-200 dark:border-neutral-700">
                          {t.category || 'Other'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="font-bold text-sm text-black dark:text-white break-words uppercase tracking-wider leading-snug line-clamp-2">
                        {t.project_name}
                      </div>
                      {t.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed line-clamp-2 font-medium">
                          {t.description.replace(/<[^>]*>?/gm, '')}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm ${t.impact === 'High'
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : t.impact === 'Low'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            }`}
                        >
                          {t.impact === 'High' ? '🔥 High' : t.impact === 'Low' ? '🧊 Low' : '⚡ Med'}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          ⏳ {t.etc || 2}h
                        </span>
                        {t.auto_nudge && (
                          <span className="text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            🔔 Auto Nudge ON
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/50 text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                      <div className="flex justify-between items-center">
                        <span title="Created At">✨ AI Draft</span>
                        <span className="text-black dark:text-white">
                          {t.finalDeadline ? `⏳ ${formatDateMMM(t.finalDeadline)}` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span title={tMsg('Assignee / Requester', 'Pekerja / Peminta')}>
                          {t.requester?.includes('@') ? '👉 Assignee' : '👤 Requester'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={t.requester || currentUser}
                            url={avatarsMap[(t.requester || currentUser).replace('@', '').trim()]}
                            size="w-4 h-4"
                            textClass="text-[8px]"
                          />
                          <span className="text-black dark:text-white font-bold">
                            {t.requester || `@${currentUser}`}
                          </span>
                        </div>
                      </div>
                      {t.autoInviteMsg && (
                        <div className="flex justify-between items-center">
                          <span title="Auto-Invite">🤝 Auto-Invite</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.autoInviteMsg}</span>
                        </div>
                      )}
                    </div>
                    {deletingId === t.id ? (
                      <div className="absolute top-3 right-3 w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <button
                        onClick={() => handleDeleteFromCart(t)}
                        className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-neutral-950 rounded-lg"
                        title={tMsg('Cancel task', 'Batal tugas')}
                      >
                        ✖
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 mt-4 md:mt-6 pt-4 md:pt-6 pb-4 md:pb-5 shrink-0 z-20 pointer-events-none">
                <button
                  onClick={handleFinish}
                  disabled={isFinishing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-md transition-colors pointer-events-auto flex items-center justify-center gap-2"
                >
                  {isFinishing ? <LoadingSpinner /> : null}
                  {isFinishing
                    ? tMsg('Saving...', 'Menyimpan...')
                    : tMsg('Finish & Go to Project', 'Selesai & Buka Proyek')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {cancelConfirmOpen && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[300] p-4">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center mac-animate">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-red-200 dark:border-red-800/50">
              🗑️
            </div>
            <h3 className="text-xl font-black text-black dark:text-white mb-4 uppercase tracking-tighter">
              {tMsg('Discard Drafts?', 'Buang Draf?')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
              {tMsg(
                'You have unsaved tasks in your cart or drafts. Are you sure you want to discard them? This action cannot be undone.',
                'Anda memiliki tugas yang belum disimpan di keranjang atau draf. Yakin ingin membuangnya? Tindakan ini tidak dapat dibatalkan.'
              )}
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setCancelConfirmOpen(false)}
                className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
              >
                {tMsg('No, Keep', 'Tidak')}
              </button>
              <button
                onClick={confirmSkipOrCancel}
                className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
              >
                {tMsg('Yes, Discard', 'Ya, Buang')}
              </button>
            </div>
          </div>
        </div>
      )}

      {privateWarningOpen && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[300] p-4">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center mac-animate">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-amber-200 dark:border-amber-800/50">
              ⚠️
            </div>
            <h3 className="text-xl font-black text-black dark:text-white mb-4 uppercase tracking-tighter">
              {tMsg('Private Workspace Alert', 'Peringatan Ruang Kerja')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
              {tMsg(
                'You assigned a task to someone else, but selected a Private Workspace. Please select a shared project from the dropdown.',
                'Anda menugaskan tugas ke orang lain, tetapi memilih Ruang Kerja Pribadi. Silakan pilih proyek bersama dari dropdown.'
              )}
            </p>
            <button
              onClick={() => setPrivateWarningOpen(false)}
              className="w-full px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
            >
              {tMsg('Understood', 'Mengerti')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
