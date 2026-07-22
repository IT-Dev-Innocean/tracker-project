import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ChatMessage from './ChatMessage';
import { LoadingSpinner } from './Utils';
import SmartAssistantLanding from './components/SmartAssistant/SmartAssistantLanding';
import SmartAssistantQuickTodo from './components/SmartAssistant/SmartAssistantQuickTodo';
import SmartAssistantPlanner from './components/SmartAssistant/SmartAssistantPlanner';
import SmartAssistantChat from './components/SmartAssistant/SmartAssistantChat';

export default function SmartAssistant({
  currentUser,
  selectedBoard,
  teamMembers,
  categories,
  fetchTasks,
  fetchLeaves,
  showNotification,
  accountStatus,
  isDarkMode,
  setIsDarkMode,
  setIsLeaveModalOpen,
  setIsExportModalOpen,
  setIsFeedbackOpen,
  setIsDocsOpen,
  setGlobalSearchQuery,
  setIsGlobalSearchOpen,
  tasks,
  setSelectedTask,
  setIsEditing,
  setIsDeleteConfirmOpen,
  openTeamModal,
  isOpen,
  closeDrawer,
  startDriverTour,
  boards,
  setSelectedBoard,
  language,
  avatarsMap,
  userDirectory,
  formatDateMMM,
  chatBg,
  setIsMomNotepadOpen,
}) {
  const [messages, setMessages] = useState([]);
  const [assistantMode, setAssistantMode] = useState('landing'); // 'landing', 'chat', 'quick_todo', 'planner'
  const [quickTasks, setQuickTasks] = useState([]);
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [isSavingQuickTasks, setIsSavingQuickTasks] = useState(false);
  const [quickTargetBoardId, setQuickTargetBoardId] = useState('');

  // States for In-Drawer Proactive AI Planner
  const [plannerPrompt, setPlannerPrompt] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedTasks, setPlannedTasks] = useState([]);
  const [isSavingPlanned, setIsSavingPlanned] = useState(false);
  const [plannerTargetBoardId, setPlannerTargetBoardId] = useState('');
  const [discardConfirmAction, setDiscardConfirmAction] = useState(null);

  const [step, setStep] = useState('init');
  const [taskData, setTaskData] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [aiProvider, setAiProvider] = useState('Smart Assistant');
  const [selectedModel, setSelectedModel] = useState('auto');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const plannerEndRef = useRef(null);
  const prevBoardRef = useRef(selectedBoard?.id);
  const [noteSuggestions, setNoteSuggestions] = useState([]);

  const globalMentionOptions =
    userDirectory && userDirectory.length > 0
      ? userDirectory
          .filter((u) => u.is_connected)
          .map((u) => u.username)
          .filter((u) => u !== 'admin')
      : teamMembers;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Auto-submit planner when redirected from chat with a pre-filled prompt
    if (assistantMode === 'planner' && plannerPrompt.trim() && !isPlanning && plannedTasks.length === 0) {
      // Small delay to let the planner UI render first
      const timer = setTimeout(() => handlePlannerSubmit(null), 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantMode]);

  useEffect(() => {
    if (assistantMode === 'planner' && plannedTasks.length > 0) {
      plannerEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [plannedTasks]);


  // Mencegah user me-refresh halaman saat memiliki keranjang To-do cepat atau Draf Planner
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (quickTasks.length > 0 || plannedTasks.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quickTasks.length, plannedTasks.length]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      if (messages.length === 0 || localStorage.getItem('innocean_ai_offer_docs') === 'true') {
        if (localStorage.getItem('innocean_ai_offer_docs') === 'true') {
          setAssistantMode('chat');
          startConversation();
        } else {
          setAssistantMode('landing');
        }
      } else {
        setAssistantMode('chat');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 600;
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && selectedBoard?.id !== prevBoardRef.current) {
      const newBoardName = !selectedBoard || selectedBoard.id === 'global' ? 'Global Workspace' : selectedBoard.name;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          sender: 'system',
          text: `<span class="text-[9px] text-neutral-500 font-bold uppercase tracking-widest border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-full bg-white dark:bg-black shadow-sm flex items-center gap-1.5"><span>📂</span> ${
            language === 'id' ? 'Beralih ke' : 'Switched to'
          } ${escapeHtml(newBoardName)}</span>`,
        },
      ]);
      prevBoardRef.current = selectedBoard?.id;
      setStep('idle');
    }
  }, [selectedBoard, language]);

  const getLocalTimestamp = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
      now.getMinutes()
    )}:${pad(now.getSeconds())}`;
  };

  const addBotMessage = (text, options = null, isDate = false) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), sender: 'bot', text, options, isDate, timestamp: getLocalTimestamp() },
    ]);
  };

  const clearPlanner = () => {
    setPlannerPrompt('');
    setPlannedTasks([]);
    setIsPlanning(false);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), sender: 'user', text, timestamp: getLocalTimestamp() },
    ]);
  };

  const escapeHtml = (unsafe) => {
    return String(unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
      2,
      '0'
    )}`;
  };

  const tMsg = (en, id) => (language === 'id' ? id : en);
  const optCreate = tMsg('Create Task', 'Tugas Baru');
  const optAnalysis = tMsg('Analysis', 'Analisis');
  const optSearch = tMsg('Search', 'Cari');
  const optMore = tMsg('More Options', 'Opsi Lainnya');
  const optTeam = tMsg('Manage Team', 'Kelola Tim');
  const optTimeOff = tMsg('Time Off', 'Cuti & Libur');
  const optDocs = tMsg('Documentation', 'Dokumentasi');
  const optFeedback = tMsg('Submit Feedback', 'Kirim Masukan');
  const optTicket = tMsg('Create Ticket', 'Buat Tiket');
  const optStartOver = tMsg('Start Over', 'Mulai Ulang');
  const optClose = tMsg('Close', 'Tutup');
  const optDraftYes = tMsg('✨ Yes, Draft with AI', '✨ Ya, Draf dengan AI');
  const optConfirmYes = tMsg('Yes, Create Task', 'Ya, Buat Tugas');
  const optDraftNo = tMsg('No, keep it blank', 'Tidak, biarkan kosong');
  const optCancel = tMsg('Cancel', 'Batal');
  const optMeeting = tMsg('Meeting Notes', 'Catatan Rapat');
  const optAutoTasks = tMsg('✨ Auto-Create Tasks', '✨ Buat Tugas Otomatis');
  const optConfirmBulkYes = tMsg('Yes, Create All', 'Ya, Buat Semua');
  const optNewProject = tMsg('➕ New Project', '➕ Proyek Baru');
  const optTour = tMsg('Start Workspace Tour', 'Mulai Tur Ruang Kerja');
  const optExplore = tMsg('Explore on my own', 'Eksplorasi Sendiri');

  const optProceed = tMsg('✅ Proceed', '✅ Lanjut');
  const optChangeProj = tMsg('📂 Change Project', '📂 Ubah Proyek');
  const optChangeCat = tMsg('🏷️ Change Category', '🏷️ Ubah Kategori');

  const startConversation = () => {
    setAssistantMode('chat');
    setMessages([]);
    setTaskData({});
    setStep('idle');
    const isGlobal = !selectedBoard || selectedBoard.id === 'global';
    const workspaceName = isGlobal ? 'Global Workspace' : selectedBoard?.name;

    if (localStorage.getItem('innocean_ai_offer_docs') === 'true') {
      localStorage.removeItem('innocean_ai_offer_docs');
      addBotMessage(
        tMsg(
          `I've successfully created your "To-do List" tasks! 🎉\n\nWould you like a quick **Workspace Tour** to learn how to manage these tasks, or would you prefer to explore on your own?`,
          `Saya telah berhasil membuat tugas "To-do List" Anda! 🎉\n\nApakah Anda ingin **Tur Ruang Kerja** singkat untuk mempelajari cara mengelola tugas ini, atau ingin bereksplorasi sendiri?`
        ),
        [optTour, optExplore]
      );
      return;
    }

    addBotMessage(
      tMsg(
        `Hi **@${currentUser}**! I'm your Smart Assistant.\n\nYou are currently in **${workspaceName}**. What would you like to do?\n\n*💡 Tip: Type **"options"** to see what else I can do.*`,
        `Hai **@${currentUser}**! Saya Asisten Pintar Anda.\n\nAnda saat ini berada di **${workspaceName}**. Apa yang ingin Anda lakukan?\n\n*💡 Tip: Ketik **"opsi"** untuk melihat menu bantuan.*`
      ),
      [optCreate, optAnalysis, optMeeting, optMore]
    );
  };

  const startQuickNote = (isFromChat = false) => {
    setIsMomNotepadOpen(true);
    closeDrawer();
  };

  const handleUserReply = (text) => {
    if (!text.trim()) return;
    addUserMessage(text);
    setInputValue('');
    setIsMentioning(false);

    const nextStep = (currentStep, data) => {
      const textLower = data.toLowerCase();
      const isGlobal = !selectedBoard || selectedBoard.id === 'global';

      // Global Commands (Always intercept these first)
      if (['start over', 'mulai ulang'].includes(textLower)) {
        startConversation();
        return;
      }
      if (['start workspace tour', 'mulai tur ruang kerja'].includes(textLower) || data === optTour) {
        closeDrawer();
        setTimeout(() => {
          if (startDriverTour) startDriverTour();
        }, 400);
        setStep('end');
        return;
      }
      if (['explore on my own', 'eksplorasi sendiri'].includes(textLower) || data === optExplore) {
        addBotMessage(
          tMsg(
            'Alright! I will be right here if you need any help. Just click the ✨ button.',
            'Baiklah! Saya akan ada di sini jika Anda butuh bantuan. Cukup klik tombol ✨.'
          )
        );
        localStorage.setItem(`innocean_board_tour_done_v2_${currentUser}`, 'true');
        setStep('end');
        return;
      }
      if (['close', 'tutup'].includes(textLower)) {
        closeDrawer();
        return;
      }

      // Helper function for MoM Extraction
      const triggerMoMExtraction = (targetBoardId, targetBoardName) => {
        setStep('extracting_mom');
        addBotMessage(tMsg('Extracting action items into tasks... ⏳', 'Mengekstrak action items menjadi tugas... ⏳'));
        const todayStr = getLocalToday();
        const contextStr = taskData.meeting_context ? `\nContext/Participants: ${taskData.meeting_context}\n` : '';
        const prompt = `Extract ALL actionable items from the following meeting notes and return them as a JSON array of objects. 
Return ONLY the raw valid JSON array. DO NOT wrap in markdown \`\`\`json ... \`\`\`. 
IMPORTANT RULES:
1. Extract EVERY single task you can find. Do not group them into one. Preserve the full context of the task in the description.
2. If the notes say "I", "me", "my", "aku", "saya", "gue", or imply the person writing the notes, map the assignee to "@${currentUser}".
3. Meeting Date: ${taskData.meeting_date || todayStr}, Time: ${
          taskData.meeting_time || ''
        }. Use this to calculate relative deadlines (like "tomorrow" or "next friday").
${contextStr}

Use this exact array format:
[
  {
    "project_name": "Clear task title",
    "requester": "Extracted assignee or '@${currentUser}' if none",
    "category": "Choose one: Development, Design, Marketing, Research, Maintenance, Consulting, Other",
    "deadline": "YYYY-MM-DD (Estimate based on notes, or use ${todayStr})",
    "description": "Detailed and comprehensive brief from the notes, preserving all important context and specific requirements"
  },
  {
    "project_name": "Another task title",
    "requester": "...",
    "category": "...",
    "deadline": "...",
    "description": "..."
  }
]

Meeting Notes:
${Array.isArray(taskData.raw_notes) ? taskData.raw_notes.join('\n\n') : taskData.raw_notes}`;

        axios
          .post('/api/ai/generate', { prompt, provider: selectedModel })
          .then((res) => {
            if (res.data.provider) setAiProvider(res.data.provider);
            setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
            try {
              let jsonStr = res.data.text.trim();
              // Antisipasi AI menyelipkan format markdown JSON
              jsonStr = jsonStr
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
                addBotMessage(
                  tMsg(
                    "I couldn't find any actionable tasks in the notes.",
                    'Saya tidak menemukan tugas yang bisa ditindaklanjuti di catatan tersebut.'
                  ),
                  [optStartOver, optClose]
                );
                setStep('end');
                return;
              }

              setTaskData((prev) => ({ ...prev, extracted_tasks: extractedTasks, target_board_id: targetBoardId }));
              setStep('ask_bulk_create');

              let summaryHtml = tMsg(
                `I found **${extractedTasks.length} tasks**. Should I create them in **${targetBoardName}**?\n\n`,
                `Saya menemukan **${extractedTasks.length} tugas**. Haruskah saya membuatnya di **${targetBoardName}**?\n\n`
              );

              extractedTasks.forEach((t, i) => {
                summaryHtml += `**${i + 1}. ${t.project_name}**\n*👤 ${t.requester} | 📂 ${t.category} | 📅 ${
                  t.deadline
                }*\n\n`;
              });

              summaryHtml += tMsg(
                `*💡 Tip: Click 'Yes, Create All' below, or type specific numbers (e.g., "1, 3") to select.*`,
                `*💡 Tip: Klik 'Ya, Buat Semua' di bawah, atau ketik angka (misal: "1, 3") untuk memilih tugas tertentu saja.*`
              );

              addBotMessage(summaryHtml, [optConfirmBulkYes, optCancel]);
            } catch (e) {
              addBotMessage(
                tMsg(
                  `⚠️ Failed to parse extracted tasks: Make sure the AI returns valid JSON.`,
                  `⚠️ Gagal memproses data tugas: Pastikan AI mengembalikan JSON yang valid.`
                ),
                [optStartOver, optClose]
              );
              setStep('end');
            }
          })
          .catch((err) => {
            setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
            addBotMessage(tMsg(`⚠️ AI Error: ${err.message}`, `⚠️ Error AI: ${err.message}`), [optStartOver, optClose]);
            setStep('end');
          });
      };

      if (currentStep === 'ask_board_for_bulk') {
        if (
          data === optNewProject ||
          textLower === 'new project' ||
          textLower === 'proyek baru' ||
          textLower === '➕ new project' ||
          textLower === '➕ proyek baru'
        ) {
          setStep('ask_new_board_name_for_bulk');
          addBotMessage(tMsg('What should be the name of the new project?', 'Apa nama untuk proyek baru ini?'));
          return;
        }

        const foundBoard = (boards || []).find(
          (b) => b.name.toLowerCase() === textLower || b.id.toString() === textLower
        );
        if (foundBoard) {
          triggerMoMExtraction(foundBoard.id, foundBoard.name);
        } else {
          const boardOptions = (boards || []).map((b) => b.name).slice(0, 4);
          boardOptions.push(optNewProject);
          addBotMessage(
            tMsg(
              `I couldn't find a project named "${data}". Please try again or select from the options.`,
              `Saya tidak dapat menemukan proyek bernama "${data}". Silakan coba lagi atau pilih opsi yang ada.`
            ),
            boardOptions
          );
        }
        return;
      }

      if (currentStep === 'ask_new_board_name_for_bulk') {
        if (!data.trim()) {
          addBotMessage(
            tMsg(
              'Project name cannot be empty. Please provide a valid name.',
              'Nama proyek tidak boleh kosong. Silakan berikan nama yang valid.'
            )
          );
          return;
        }
        addBotMessage(tMsg(`Creating project **${data}**... ⏳`, `Membuat proyek **${data}**... ⏳`));
        axios
          .post('/api/boards', { name: data.trim() })
          .then((res) => {
            setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
            triggerMoMExtraction(res.data.board_id, res.data.board_name);
          })
          .catch((err) => {
            setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
            addBotMessage(err.response?.data?.detail || tMsg('Failed to create project.', 'Gagal membuat proyek.'), [
              optStartOver,
              optClose,
            ]);
            setStep('end');
          });
        return;
      }

      if (currentStep === 'end_mom' && data === optAutoTasks) {
        setStep('ask_board_for_bulk');
        const boardOptions = (boards || []).map((b) => b.name).slice(0, 4);
        boardOptions.push(optNewProject);
        addBotMessage(
          tMsg(`Which project should these tasks be added to?`, `Ke proyek mana tugas-tugas ini harus ditambahkan?`),
          boardOptions
        );
        return;
      }

      // Intent Recognition Engine
      if (currentStep === 'idle' || currentStep === 'end' || currentStep === 'end_mom') {
        if (['create task', 'new task', 'add task', 'tugas baru', 'buat tugas'].includes(textLower)) {
          if (isGlobal) {
            setStep('ask_board_for_create');
            addBotMessage(
              tMsg(
                `You are in the Global Workspace. Which project should this task be created in?`,
                `Anda berada di Ruang Kerja Global. Di proyek mana tugas ini akan dibuat?`
              ),
              (boards || []).map((b) => b.name).slice(0, 5)
            );
          } else {
            setStep('ask_project');
            addBotMessage(
              tMsg(
                `Let's draft a new request in **${selectedBoard.name}**. What is the title of this task or request?`,
                `Mari buat permintaan baru di **${selectedBoard.name}**. Apa judul tugas ini?`
              )
            );
          }
          return;
        }
        if (['manage team', 'team', 'kelola tim', 'tim'].includes(textLower)) {
          if (isGlobal) {
            setStep('ask_board_for_team');
            addBotMessage(
              tMsg(
                `You are in the Global Workspace. Which project's team would you like to manage?`,
                `Anda berada di Ruang Kerja Global. Tim proyek mana yang ingin Anda kelola?`
              ),
              (boards || []).map((b) => b.name).slice(0, 5)
            );
            return;
          }
          addBotMessage(tMsg(`Opening Team Management panel... 🤝`, `Membuka panel Kelola Tim... 🤝`));
          setTimeout(() => {
            openTeamModal();
            closeDrawer();
          }, 1500);
          return;
        }
        if (['search', 'find', 'cari', 'pencarian'].includes(textLower)) {
          setStep('ask_search');
          addBotMessage(
            tMsg(
              `What are you looking for? Type a keyword, project name, or assignee.`,
              `Apa yang Anda cari? Ketik kata kunci, nama proyek, atau pekerja.`
            )
          );
          return;
        }
        if (['time off', 'leave', 'cuti', 'cuti & libur'].includes(textLower)) {
          setStep('ask_leave_action');
          addBotMessage(
            tMsg(
              `Would you like to add a new personal leave or open the Time Off panel?`,
              `Apakah Anda ingin menambahkan cuti pribadi baru atau membuka panel Cuti?`
            ),
            [tMsg('Add Leave', 'Tambah Cuti'), tMsg('Open Panel', 'Buka Panel')]
          );
          return;
        }
        if (['documentation', 'docs', 'help', 'dokumentasi', 'bantuan'].includes(textLower)) {
          setStep('ask_doc');
          addBotMessage(
            tMsg(`Sure! Which topic would you like to learn about?`, `Tentu! Topik apa yang ingin Anda pelajari?`),
            [
              'Workspace',
              'Tasks',
              'Views',
              'Analytics',
              'Filters',
              'Collab',
              'Deadlines',
              'Account',
              'Assistant',
              'Tickets',
              'Security',
            ]
          );
          return;
        }
        if (['submit feedback', 'feedback', 'masukan', 'ide', 'kirim masukan'].includes(textLower)) {
          setStep('ask_feedback');
          addBotMessage(
            tMsg(
              `I'm listening! 💡 Please type your feedback or idea below, and I'll send it to the Admin queue.`,
              `Saya mendengarkan! 💡 Silakan ketik masukan atau ide Anda di bawah ini, dan saya akan mengirimkannya ke antrean Admin.`
            )
          );
          return;
        }
        if (
          ['contact support', 'support', 'lapor bug', 'bantuan it', 'create ticket', 'buat tiket', 'tiket'].includes(
            textLower
          ) ||
          textLower === optTicket.toLowerCase()
        ) {
          setStep('ask_support');
          addBotMessage(
            tMsg(
              `I'm here to help! 🎧 Please describe your IT issue or bug below, and I'll create a Support Ticket for you.`,
              `Saya siap membantu! 🎧 Silakan jelaskan masalah IT atau bug Anda di bawah ini, dan saya akan membuatkan Tiket Dukungan untuk Anda.`
            )
          );
          return;
        }
        if (
          [
            'meeting notes',
            'mom',
            'meeting summary',
            'catatan rapat',
            'notulensi',
            'rapat',
            'take notes',
            'meeting',
          ].includes(textLower) ||
          textLower === optMeeting.toLowerCase()
        ) {
          startQuickNote(true);
          return;
        }
        if (['analysis', 'summary', 'report', 'analisis', 'analitik', 'ringkasan'].includes(textLower)) {
          const doAnalysis = async (userTasks) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            cutoffDate.setHours(0, 0, 0, 0);

            const analyticsTasks = userTasks.filter((t) => {
              const createdDate = new Date(t.timestamp.replace(/-/g, '/').split(' ')[0]);
              const completedDate = t.completed_time
                ? new Date(t.completed_time.replace(/-/g, '/').split(' ')[0])
                : null;
              return (
                createdDate >= cutoffDate ||
                (completedDate && completedDate >= cutoffDate) ||
                (t.status !== 'Done' && t.status !== 'Rejected')
              );
            });

            const total = analyticsTasks.length;
            const totalEtc = analyticsTasks.reduce((sum, t) => sum + (t.etc || 2), 0);
            const done = analyticsTasks.filter((t) => t.status === 'Done').length;
            const doneEtc = analyticsTasks.filter((t) => t.status === 'Done').reduce((sum, t) => sum + (t.etc || 2), 0);
            const active = analyticsTasks.filter((t) => t.status === 'In Progress').length;
            const activeEtc = analyticsTasks
              .filter((t) => t.status === 'In Progress')
              .reduce((sum, t) => sum + (t.etc || 2), 0);
            const critical = analyticsTasks.filter(
              (t) => t.priority_lvl === 'critical' && t.status !== 'Done' && t.status !== 'Rejected'
            ).length;
            const criticalEtc = analyticsTasks
              .filter((t) => t.priority_lvl === 'critical' && t.status !== 'Done' && t.status !== 'Rejected')
              .reduce((sum, t) => sum + (t.etc || 2), 0);

            const today = new Date();
            const bottleneckTasks = analyticsTasks.filter((t) => {
              if (t.status === 'Done' || t.status === 'Rejected') return false;
              const start = new Date((t.start_date || t.timestamp).replace(/-/g, '/'));
              return Math.round((today - start) / (1000 * 60 * 60 * 24)) > 5;
            }).length;

            const totalSubtasks = analyticsTasks.reduce((sum, t) => sum + (t.subtask_total || 0), 0);
            const doneSubtasks = analyticsTasks.reduce((sum, t) => sum + (t.subtask_done || 0), 0);
            const subtaskCompletionPct = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

            const activeHealthTasks = analyticsTasks.filter(
              (t) => t.status !== 'Done' && t.status !== 'Rejected'
            ).length;
            const activeHealthEtc = analyticsTasks
              .filter((t) => t.status !== 'Done' && t.status !== 'Rejected')
              .reduce((sum, t) => sum + (t.etc || 2), 0);

            let projectHealth = 100;
            if (totalEtc > 0) {
              const doneScore = (doneEtc / totalEtc) * 100;
              const wipScore = (activeHealthEtc / totalEtc) * subtaskCompletionPct;
              const overduePenalty = (criticalEtc / totalEtc) * 50; // Penalti berat untuk task critical
              projectHealth = Math.max(0, Math.min(100, Math.round(doneScore + wipScore - overduePenalty)));
            }

            let healthColor = 'text-emerald-500';
            if (projectHealth < 50) healthColor = 'text-red-500';
            else if (projectHealth < 80) healthColor = 'text-amber-500';

            const memberDetailedStats = {};
            analyticsTasks.forEach((t) => {
              const mainResponsible = new Set();
              if (t.owner_username) mainResponsible.add(t.owner_username);
              if (t.requester) {
                const matches = t.requester.match(/@([\w.-]+)/g);
                if (matches) matches.forEach((m) => mainResponsible.add(m.substring(1)));
              }
              mainResponsible.forEach((person) => {
                if (!person || person.toLowerCase() === 'unassigned') return;
                if (!memberDetailedStats[person])
                  memberDetailedStats[person] = {
                    total: 0,
                    total_etc: 0,
                    done: 0,
                    done_etc: 0,
                    active: 0,
                    active_etc: 0,
                    critical: 0,
                  };
                memberDetailedStats[person].total += 1;
                memberDetailedStats[person].total_etc += t.etc || 2;
                if (t.status === 'Done') {
                  memberDetailedStats[person].done += 1;
                  memberDetailedStats[person].done_etc += t.etc || 2;
                } else if (t.status !== 'Rejected') {
                  if (t.status === 'In Progress') {
                    memberDetailedStats[person].active += 1;
                    memberDetailedStats[person].active_etc += t.etc || 2;
                  }
                  if (t.priority_lvl === 'critical') memberDetailedStats[person].critical += 1;
                }
              });
              if (t.subtask_details) {
                const lines = t.subtask_details.split('\n');
                lines.forEach((line) => {
                  if (!line.trim()) return;
                  const isDone = line.startsWith('[x]') || t.status === 'Done';
                  const match = line.match(/\(@([\w.-]+)\)$/);
                  if (match) {
                    const assignee = match[1];
                    if (assignee && assignee.toLowerCase() !== 'unassigned') {
                      if (!memberDetailedStats[assignee])
                        memberDetailedStats[assignee] = { total: 0, done: 0, active: 0, critical: 0 };
                      memberDetailedStats[assignee].total += 1;
                      if (isDone) memberDetailedStats[assignee].done += 1;
                      else if (t.status !== 'Rejected') {
                        if (t.status === 'In Progress') memberDetailedStats[assignee].active += 1;
                        if (t.priority_lvl === 'critical') memberDetailedStats[assignee].critical += 1;
                      }
                    }
                  }
                });
              }
            });

            let maxActiveEtc = 0;
            let maxCritical = 0;
            Object.entries(memberDetailedStats).forEach(([member, stats]) => {
              const pendingEtc = stats.total_etc - stats.done_etc;
              if (pendingEtc > maxActiveEtc) maxActiveEtc = pendingEtc;
              if (stats.critical > maxCritical) maxCritical = stats.critical;
            });

            const etcThreshold = maxActiveEtc >= 40 ? 40 : maxActiveEtc >= 32 ? 32 : Infinity;
            const criticalThreshold = 1;
            let topMembers = [];
            let topCriticalMembers = [];
            Object.entries(memberDetailedStats).forEach(([member, stats]) => {
              const pendingEtc = stats.total_etc - stats.done_etc;
              if (pendingEtc >= etcThreshold && etcThreshold <= maxActiveEtc) topMembers.push(member);
              if (stats.critical >= criticalThreshold) topCriticalMembers.push(member);
            });

            const formatNames = (names) => {
              if (names.length === 1) return `@${names[0]}`;
              if (names.length === 2) return `@${names[0]} and @${names[1]}`;
              return (
                names
                  .map((n) => `@${n}`)
                  .slice(0, -1)
                  .join(', ') + `, and @${names[names.length - 1]}`
              );
            };
            const getTaskRangeStr = (membersArr, isCritical = false) => {
              if (membersArr.length === 0) return '0';
              if (isCritical) {
                const counts = membersArr.map((m) => memberDetailedStats[m].critical);
                const minC = Math.min(...counts);
                const maxC = Math.max(...counts);
                return minC === maxC ? `${maxC}` : `${minC}-${maxC}`;
              } else {
                const counts = membersArr.map(
                  (m) => memberDetailedStats[m].total_etc - memberDetailedStats[m].done_etc
                );
                const minC = Math.min(...counts);
                const maxC = Math.max(...counts);
                return minC === maxC ? `${maxC}h` : `${minC}h-${maxC}h`;
              }
            };

            let insight = isGlobal
              ? tMsg('The overall workspace is looking great! ✨', 'Ruang kerja secara keseluruhan terlihat bagus! ✨')
              : tMsg(
                  'Your team is doing great! Keep it up. ✨',
                  'Tim Anda bekerja dengan sangat baik! Pertahankan. ✨'
                );
            const topMembersStr = formatNames(topMembers);
            const topCriticalStr = formatNames(topCriticalMembers);
            const isSamePeople = JSON.stringify(topMembers.sort()) === JSON.stringify(topCriticalMembers.sort());
            const taskRangeStr = getTaskRangeStr(topMembers, false);
            const criticalRangeStr = getTaskRangeStr(topCriticalMembers, true);

            if (maxActiveEtc >= 40 && maxCritical > 0) {
              if (isSamePeople) {
                const allAreCriticalOnly =
                  topMembers.length > 0 && topMembers.every((m) => memberDetailedStats[m].critical > 0);
                insight = allAreCriticalOnly
                  ? tMsg(
                      `⚠️ **Critical Alert!** ${topMembersStr} ${
                        topMembers.length > 1 ? 'are' : 'is'
                      } severely overloaded with ${taskRangeStr} active tasks, and ALL of them are critical deadlines! They need immediate backup right now!`,
                      `⚠️ **Peringatan Kritis!** ${topMembersStr} sangat kewalahan dengan ${taskRangeStr} tugas aktif, dan SEMUANYA memiliki tenggat waktu kritis! Mereka butuh bantuan segera!`
                    )
                  : tMsg(
                      `⚠️ **Critical Alert!** ${topMembersStr} ${
                        topMembers.length > 1 ? 'are' : 'is'
                      } severely overloaded with ${taskRangeStr} active tasks, including ${criticalRangeStr} critical deadline(s). They need immediate backup!`,
                      `⚠️ **Peringatan Kritis!** ${topMembersStr} sangat kewalahan dengan ${taskRangeStr} tugas aktif, termasuk ${criticalRangeStr} tenggat waktu kritis. Mereka butuh bantuan segera!`
                    );
              } else {
                insight = tMsg(
                  `⚠️ **Team Alert!** ${topMembersStr} ${
                    topMembers.length > 1 ? 'are' : 'is'
                  } overwhelmed with ${taskRangeStr} active tasks, while ${topCriticalStr} ${
                    topCriticalMembers.length > 1 ? 'are' : 'is'
                  } facing ${criticalRangeStr} critical deadline(s). Immediate workload redistribution is highly recommended!`,
                  `⚠️ **Peringatan Tim!** ${topMembersStr} kewalahan dengan ${taskRangeStr} tugas aktif, sementara ${topCriticalStr} menghadapi ${criticalRangeStr} tenggat waktu kritis. Redistribusi beban kerja sangat disarankan segera!`
                );
              }
            } else if (maxCritical > 0) {
              insight = tMsg(
                `⚠️ **Attention!** ${topCriticalStr} ${
                  topCriticalMembers.length > 1 ? 'have' : 'has'
                } ${criticalRangeStr} critical/overdue task(s). They might need immediate backup to clear the bottleneck.`,
                `⚠️ **Perhatian!** ${topCriticalStr} memiliki ${criticalRangeStr} tugas kritis/terlambat. Mereka mungkin butuh bantuan segera untuk memperlancar pekerjaan.`
              );
            } else if (maxActiveEtc >= 24) {
              insight = tMsg(
                `💡 **Workload Notice:** It looks like ${topMembersStr} ${
                  topMembers.length > 1 ? 'are' : 'is'
                } currently carrying a heavy load with ${taskRangeStr} active requests. Consider checking in or redistributing some tasks to support them!`,
                `💡 **Pemberitahuan Beban Kerja:** Sepertinya ${topMembersStr} saat ini memikul beban berat dengan ${taskRangeStr} tugas aktif. Pertimbangkan untuk memeriksa atau membagikan ulang beberapa tugas untuk mendukung mereka!`
              );
            }

            const workspaceName = isGlobal ? 'Global Workspace' : selectedBoard?.name;

            const lblHealth = tMsg('Project Health', 'Kesehatan Proyek');
            const lblTotal = tMsg('Total Tasks', 'Total Tugas');
            const lblActive = tMsg('Active/WIP', 'Aktif/Dikerjakan');
            const lblCompleted = tMsg('Completed', 'Selesai');
            const lblCritical = tMsg('Critical/Overdue', 'Kritis/Terlambat');
            const lblBottleneck = tMsg('Bottlenecks (>5 days)', 'Tersendat (>5 hari)');
            const lblSubtasks = tMsg('Sub-task Completion', 'Penyelesaian Sub-tugas');
            const lblQuickAnalysis = tMsg('Quick Analysis (Last 30 Days):', 'Analisis Cepat (30 Hari Terakhir):');
            const lblInsight = tMsg('Insight', 'Wawasan');

            try {
              const statsForAI = {
                projectHealth,
                total,
                totalEtc,
                done,
                doneEtc,
                active,
                activeEtc,
                critical,
                bottleneckTasks,
                topPerformers: topMembers,
              };
              const prompt = `You are a conversational Project Manager AI for INNOCEAN Tracker. Analyze these workspace stats: ${JSON.stringify(
                statsForAI
              )}. Write a 3 sentence professional and insightful summary directly addressing the user "@${currentUser}". You can use markdown bold. Include emojis. Please respond strictly in ${
                language === 'id' ? 'Indonesian' : 'English'
              }.`;
              const res = await axios.post('/api/ai/generate', { prompt, provider: selectedModel });
              const providerName = res.data.provider || 'AI';

              addBotMessage(
                `📊 **${workspaceName} ${lblQuickAnalysis}**\n\n` +
                  `• ${lblHealth}: **${projectHealth}%**\n` +
                  `• ${lblTotal}: **${total} (${totalEtc}h)**\n` +
                  `• ${lblActive}: **${active} (${activeEtc}h)**\n` +
                  `• ${lblCompleted}: **${done} (${doneEtc}h)**\n` +
                  `• ${lblCritical}: **${critical}**\n` +
                  `• ${lblBottleneck}: **${bottleneckTasks}**\n\n` +
                  `✨ **${providerName} ${lblInsight}:**\n${res.data.text}`,
                [optStartOver, optClose]
              );
              setStep('end');
            } catch (err) {
              // Fallback to Rule-Based if Gemini API is not configured
              const errorDetail = err.response?.data?.detail || 'Gemini AI is currently unavailable';
              addBotMessage(
                `📊 **${workspaceName} ${lblQuickAnalysis}**\n\n` +
                  `• ${lblHealth}: **${projectHealth}%**\n` +
                  `• ${lblTotal}: **${total} (${totalEtc}h)**\n` +
                  `• ${lblActive}: **${active} (${activeEtc}h)**\n` +
                  `• ${lblCompleted}: **${done} (${doneEtc}h)**\n` +
                  `• ${lblCritical}: **${critical}**\n` +
                  `• ${lblBottleneck}: **${bottleneckTasks}**\n` +
                  `• ${lblSubtasks}: **${subtaskCompletionPct}%**\n\n` +
                  `> *Note: ${errorDetail}. ${tMsg(
                    'Displaying rule-based insight',
                    'Menampilkan wawasan berbasis aturan'
                  )}.*\n\n` +
                  `${insight}`,
                [optStartOver, optClose]
              );
              setStep('end');
            }
          };

          if (isGlobal && !selectedBoard) {
            addBotMessage(tMsg('Analyzing global workspace... ⏳', 'Menganalisis ruang kerja global... ⏳'));
            axios
              .get('/api/tasks/all')
              .then((res) => doAnalysis(res.data.tasks || []))
              .catch((err) => {
                addBotMessage(tMsg('Failed to fetch global analysis.', 'Gagal memuat analisis global.'), [
                  optStartOver,
                  optClose,
                ]);
                setStep('end');
              });
            return;
          } else {
            doAnalysis(tasks);
            return;
          }
        }
        if (['dark mode', 'light mode', 'theme', 'tema'].includes(textLower)) {
          setIsDarkMode(!isDarkMode);
          addBotMessage(tMsg(`Theme toggled successfully! 🎨`, `Tema berhasil diubah! 🎨`), [optStartOver, optClose]);
          setStep('end');
          return;
        }
        if (['more options', 'options', 'option', 'opsi lainnya', 'opsi'].includes(textLower)) {
          addBotMessage(
            tMsg(`Here are some things I can do for you:`, `Berikut beberapa hal yang bisa saya lakukan:`),
            [optCreate, optAnalysis, optMeeting, optSearch, optTeam, optTimeOff, optDocs, optFeedback, optTicket]
          );
          return;
        }

        // --- Bulk Task / Task Planner Intent Detection ---
        // Detects if user wants to create/extract MULTIPLE tasks and redirects to AI Task Planner.
        const bulkTaskKeywordsEN = [
          'create tasks', 'make tasks', 'add tasks', 'generate tasks', 'build tasks',
          'extract tasks', 'list of tasks', 'multiple tasks', 'several tasks', 'bunch of tasks',
          'task list', 'task plan', 'project plan', 'plan for', 'plan a project',
          'buatkan tasks', 'buat tasks', 'buat beberapa', 'buatkan beberapa',
          'buatkan task-task', 'bikin tasks', 'bikin beberapa task',
          'ekstrak task', 'ekstraksi task', 'buatkan rencana', 'buat rencana',
          'buat task untuk', 'buatkan task untuk', 'bikin task untuk',
          'task-task', 'tugas-tugas', 'beberapa tugas', 'sejumlah tugas',
          'create multiple', 'add multiple', 'generate multiple', 'plan project',
          'breakdown task', 'break down task', 'break down the', 'break it down',
          'pecah task', 'pecah tugas', 'rincikan task', 'rincikan tugas',
        ];
        const isBulkTaskKeyword = bulkTaskKeywordsEN.some((kw) => textLower.includes(kw));

        // Pattern: user mentions 2+ @mentions in one message (e.g. "buat task @catyak report, @batman research")
        const atMentionMatches = (data.match(/@[\w.]+/g) || []);
        const hasMultipleMentions = atMentionMatches.length >= 2;

        // Pattern: message contains 2+ comma-separated items that look like task descriptions
        // e.g. "monthly report seo, keywords research, marketing plan"
        const commaSegments = data.split(',').map(s => s.trim()).filter(s => s.length > 2);
        const hasMultipleCommaItems = commaSegments.length >= 3;

        // Pattern: message contains numbered or bulleted list items
        const hasListPattern = /[\n,;]\s*(?:\d+[.)\s]|[-•*]\s)/.test(data);

        const isBulkTaskIntent = isBulkTaskKeyword || hasMultipleMentions || hasMultipleCommaItems || hasListPattern;

        if (isBulkTaskIntent) {
          // Pre-fill the planner prompt with the user's message and redirect
          setPlannerPrompt(data);
          setAssistantMode('planner');
          return;
        }

        // --- General AI Conversation & Command Executor Fallback ---
        addBotMessage(tMsg('Thinking... 🤔', 'Berpikir... 🤔'));
        const todayStr = getLocalToday();

        const recentHistory = messages
          .filter(
            (m) => m.sender === 'user' || (m.sender === 'bot' && !m.text.includes('🤔') && !m.text.includes('⏳'))
          )
          .slice(-6)
          .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text.replace(/<[^>]*>?/gm, '')}`)
          .join('\n');

        const prompt = `You are 'Smart Assistant', the AI Assistant inside INNOCEAN Tracker. Today is ${todayStr}. User @${currentUser} says: "${data}".

Recent Conversation History:
${recentHistory}

Please respond in the same language that the user used in their message.

CRITICAL RULE: You must stay strictly within the context of INNOCEAN Tracker, project/task management, office work, scheduling, or developer/work collaboration. If the user's message is unrelated to these topics (e.g., cooking recipes, general chit-chat about hobbies, movies, trivia, sports, personal life, etc.), you must politely decline to answer, explaining in the user's language that your role is strictly to assist with project management, tasks, and productivity in INNOCEAN Tracker. Do not provide information or perform tasks for out-of-context topics under any circumstances.

If the user wants to CREATE/ADD A TASK (e.g. "bikin task", "buatkan task", "create task"), extract the details and reply ONLY with this valid JSON format (do not wrap in markdown quotes, just the raw JSON object):
{"action": "create_task", "project_name": "extracted title", "requester": "Assignee (with '@') OR Requester name (without '@') OR @${currentUser}", "category": "extracted or 'Other'", "deadline": "YYYY-MM-DD (format strictly like this)", "etc": "Estimate the time consumption in hours (integer) based on task complexity. If user specifies a time (e.g., 'this will take 4 hours'), use that. Default to 2 if unsure.", "description": "detailed description if provided, else empty", "subtasks": ["extracted subtask 1", "extracted subtask 2"]}

If the user wants to ADD A LEAVE/TIME OFF (e.g. "bikin cuti", "tambah libur", "add leave"), extract the details and reply ONLY with this valid JSON format (do not wrap in markdown quotes, just the raw JSON object):
{"action": "create_leave", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "description": "extracted reason or 'Personal Leave'"}

If the user wants to SUBMIT A TICKET/FEEDBACK/SUPPORT (e.g. "bikin tiket", "create ticket", "lapor bug", "contact support"), extract the details and reply ONLY with this valid JSON format (do not wrap in markdown quotes, just the raw JSON object):
{"action": "create_ticket", "type": "Support or Feedback", "description": "extracted issue or idea"}

If the user asks to conceptualize a program, workflow, architecture, or flowchart, provide a detailed, readable ASCII-art flowchart wrapped in a \`\`\` code block, and you may ignore the 3-sentence limit to provide a complete answer. Do NOT use leading spaces to center the flowchart; align it to the left edge.

If it's a general question or conversation related to project/task management, office work, or work productivity, reply naturally in text (max 3 sentences) keeping the context of the conversation history.`;

        axios
          .post('/api/ai/generate', { prompt, provider: selectedModel })
          .then((res) => {
            if (res.data.provider) setAiProvider(res.data.provider);
            setMessages((prev) => prev.filter((m) => m.text !== tMsg('Thinking... 🤔', 'Berpikir... 🤔')));
            const replyText = res.data.text.trim();

            try {
              let cleanJson = replyText
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();

              // --- Detect MULTIPLE create_task JSON objects (AI hallucination pattern) ---
              // When AI returns multiple JSON objects instead of redirecting to planner,
              // we catch them here and convert them into planner tasks.
              const multiJsonMatches = cleanJson.match(/\{[^{}]*"action"\s*:\s*"create_task"[^{}]*\}/g);
              if (multiJsonMatches && multiJsonMatches.length >= 2) {
                // Parse all valid JSON objects from the response
                const parsedTasks = [];
                for (const jsonStr of multiJsonMatches) {
                  try {
                    const t = JSON.parse(jsonStr);
                    if (t.action === 'create_task' && t.project_name) {
                      parsedTasks.push(t);
                    }
                  } catch (_) { /* skip malformed */ }
                }

                if (parsedTasks.length >= 2) {
                  // Convert to planner tasks format and redirect
                  const defaultBoardId = !selectedBoard || selectedBoard.id === 'global'
                    ? (boards[0]?.id || '')
                    : selectedBoard.id;

                  const plannerReadyTasks = parsedTasks.map((t) => ({
                    id: Math.random().toString(),
                    project_name: t.project_name,
                    requester: t.requester || `@${currentUser}`,
                    category: t.category || 'Other',
                    deadline: t.deadline || '',
                    etc: Number(t.etc) || 2,
                    impact: t.impact || 'Medium',
                    description: t.description || '',
                    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                    auto_nudge: false,
                    target_board_id: defaultBoardId,
                    selected: true,
                  }));

                  setMessages((prev) => prev.filter((m) => m.text !== tMsg('Thinking... 🤔', 'Berpikir... 🤔')));
                  setPlannerTargetBoardId(defaultBoardId);
                  setPlannedTasks(plannerReadyTasks);
                  setAssistantMode('planner');
                  return;
                }
              }
              // --- End multi-JSON detection ---

              const startIdx = cleanJson.indexOf('{');
              const endIdx = cleanJson.lastIndexOf('}');

              if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                cleanJson = cleanJson.substring(startIdx, endIdx + 1);
                const parsed = JSON.parse(cleanJson);
                if (parsed.action === 'create_task') {
                  const deadlineDate = new Date(parsed.deadline);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const enrichedParsed = {
                    ...parsed,
                    subtasks: Array.isArray(parsed.subtasks)
                      ? parsed.subtasks.map((st) => ({ task_name: st, assignee: null }))
                      : [],
                  };

                  if (deadlineDate < today) {
                    setTaskData(enrichedParsed);
                    setStep('ask_deadline');
                    addBotMessage(
                      tMsg(
                        `⚠️ The deadline for the task cannot be earlier than today. Please provide a valid deadline.`,
                        `⚠️ Tenggat waktu untuk tugas tidak boleh lebih awal dari hari ini. Silakan berikan tenggat waktu yang valid.`
                      ),
                      null,
                      true
                    );
                    return;
                  }

                  if (isGlobal) {
                    setTaskData(enrichedParsed);
                    setStep('ask_board_for_create');
                    addBotMessage(
                      tMsg(
                        `I've prepared the task **"${parsed.project_name}"**. Since you are in the Global Workspace, which project should this belong to?`,
                        `Saya telah menyiapkan tugas **"${parsed.project_name}"**. Karena Anda berada di Ruang Kerja Global, proyek mana yang akan menjadi tempat tugas ini?`
                      ),
                      (boards || []).map((b) => b.name).slice(0, 5)
                    );
                  } else {
                    // Jika tidak global, tetapkan default ke board saat ini, tapi arahkan ke Konfirmasi.
                    const finalData = { ...enrichedParsed, board_id: selectedBoard.id, board_name: selectedBoard.name };
                    setTaskData(finalData);
                    setStep('confirm_project_details');

                    const summary =
                      language === 'id'
                        ? `Saya akan membuat tugas ini di proyek **${finalData.board_name}** dengan kategori **${finalData.category}**.\n\nApakah ini sudah benar, atau Anda ingin mengubahnya?`
                        : `I will create this task in project **${finalData.board_name}** under category **${finalData.category}**.\n\nIs this correct, or do you want to change it?`;

                    addBotMessage(summary, [optProceed, optChangeProj, optChangeCat, optCancel]);
                  }
                  return;
                } else if (parsed.action === 'create_leave') {
                  setTaskData(parsed);
                  setStep('confirm_leave');
                  addBotMessage(
                    tMsg(
                      `I've extracted your leave details:\n\n• **Start:** ${parsed.start_date}\n• **End:** ${parsed.end_date}\n• **Reason:** ${parsed.description}\n\nShould I submit this leave request?`,
                      `Saya telah mengekstrak detail cuti Anda:\n\n• **Mulai:** ${parsed.start_date}\n• **Selesai:** ${parsed.end_date}\n• **Alasan:** ${parsed.description}\n\nHaruskah saya mengirimkan permintaan cuti ini?`
                    ),
                    [tMsg('Yes, Submit', 'Ya, Kirim'), optCancel]
                  );
                  return;
                } else if (parsed.action === 'create_ticket') {
                  setTaskData(parsed);
                  setStep('confirm_ticket');
                  addBotMessage(
                    tMsg(
                      `I've prepared your ticket:\n\n• **Type:** ${parsed.type}\n• **Details:** ${parsed.description}\n\nShould I submit this ticket to the Admins?`,
                      `Saya telah menyiapkan tiket Anda:\n\n• **Tipe:** ${parsed.type}\n• **Detail:** ${parsed.description}\n\nHaruskah saya mengirimkan tiket ini ke Admin?`
                    ),
                    [tMsg('Yes, Submit', 'Ya, Kirim'), optCancel]
                  );
                  return;
                }
              }
            } catch (e) {
              // Fallback to normal text conversation
            }

            addBotMessage(replyText);
          })
          .catch((err) => {
            setMessages((prev) => prev.filter((m) => m.text !== tMsg('Thinking... 🤔', 'Berpikir... 🤔')));
            const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
            addBotMessage(
              tMsg(
                `⚠️ **Smart Assistant Error:** ${errorMsg}\n\nI couldn't process your request. Try choosing an option below:`,
                `⚠️ **Smart Assistant Error:** ${errorMsg}\n\nSaya tidak dapat memproses permintaan Anda. Coba pilih opsi di bawah:`
              ),
              [optCreate, optAnalysis, optSearch, optMore]
            );
          });
        return;
      }

      if (currentStep === 'ask_meeting_context') {
        if (data === optCancel) {
          addBotMessage(tMsg('Action cancelled.', 'Tindakan dibatalkan.'), [optStartOver, optClose]);
          setStep('end');
          return;
        }
        const contextData =
          data === tMsg('Skip this step', 'Lewati langkah ini') ||
          textLower.includes('skip') ||
          textLower.includes('lewati')
            ? ''
            : data;
        setTaskData((prev) => ({ ...prev, meeting_context: contextData, raw_notes: [] }));

        setStep('taking_notes');
        addBotMessage(
          tMsg(
            'Great! You can use this chat as your **live notepad** during the meeting. Just type your notes and send them as we go. I will analyze them and offer helpful follow-up suggestions above the chat box to ensure no detail is missed!\n\nWhen you are done, click the **Process Notes** button floating below.',
            'Bagus! Anda bisa menggunakan obrolan ini sebagai **buku catatan langsung** selama rapat. Ketik catatan Anda dan kirim. Saya akan menganalisisnya dan menawarkan saran lanjutan di atas kotak chat agar tidak ada detail yang terlewat!\n\nJika sudah selesai, klik tombol **Proses Catatan** yang mengambang di bawah.'
          )
        );
        return;
      }

      if (currentStep === 'taking_notes') {
        if (data === optCancel) {
          addBotMessage(tMsg('Action cancelled.', 'Tindakan dibatalkan.'), [optStartOver, optClose]);
          setStep('end');
          return;
        }

        if (
          data === tMsg('Process Notes', 'Proses Catatan') ||
          data.toLowerCase() === 'process notes' ||
          data.toLowerCase() === 'proses catatan'
        ) {
          const combinedNotes = (taskData.raw_notes || []).join('\n\n');
          if (!combinedNotes.trim()) {
            addBotMessage(
              tMsg(
                'Your notes are empty. Please type something first!',
                'Catatan Anda kosong. Silakan ketik sesuatu terlebih dahulu!'
              ),
              [tMsg('Process Notes', 'Proses Catatan'), optCancel]
            );
            return;
          }

          addBotMessage(tMsg('Organizing meeting notes with AI... ⏳', 'Menyusun catatan rapat dengan AI... ⏳'));
          const contextStr = taskData.meeting_context ? `\nContext/Participants: ${taskData.meeting_context}\n` : '';
          const prompt = `You are a professional Project Manager AI. Please organize the following raw meeting notes into a structured Minutes of Meeting (MoM) in the same language as the notes provided. Include these sections: 1. Executive Summary, 2. Key Discussion Points, 3. Action Items (Tasks to be done, clearly bulleted with recommended assignees if mentioned). Use markdown for professional formatting.${contextStr} Here are the raw notes:\n\n"${combinedNotes}"`;

          axios
            .post('/api/ai/generate', { prompt, provider: selectedModel })
            .then((res) => {
              if (res.data.provider) setAiProvider(res.data.provider);
              setMessages((prev) =>
                prev.filter(
                  (m) =>
                    m.text !== tMsg('Organizing meeting notes with AI... ⏳', 'Menyusun catatan rapat dengan AI... ⏳')
                )
              );
              const reply = res.data.text.trim();
              setTaskData((prev) => ({ ...prev, raw_notes: combinedNotes }));
              addBotMessage(
                reply +
                  tMsg(
                    "\n\n*💡 Tip: Click '✨ Auto-Create Tasks' to instantly turn these action items into real tasks!*",
                    "\n\n*💡 Tip: Klik '✨ Buat Tugas Otomatis' untuk mengubah action item ini menjadi tugas nyata secara instan!*"
                  ),
                [optAutoTasks, optCreate, optStartOver, optClose]
              );
              setStep('end_mom');
            })
            .catch((err) => {
              setMessages((prev) =>
                prev.filter(
                  (m) =>
                    m.text !== tMsg('Organizing meeting notes with AI... ⏳', 'Menyusun catatan rapat dengan AI... ⏳')
                )
              );
              const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
              addBotMessage(tMsg(`⚠️ Failed to generate MoM: ${errorMsg}`, `⚠️ Gagal membuat MoM: ${errorMsg}`), [
                optStartOver,
                optClose,
              ]);
              setStep('end');
            });
          return;
        }

        // JIKA USER SEDANG MENGETIK CATATAN (MENGIRIM PESAN BIASA)
        setTaskData((prev) => ({ ...prev, raw_notes: [...(prev.raw_notes || []), data] }));

        setNoteSuggestions([{ id: 'loading', text: tMsg('Generating suggestions...', 'Menyiapkan saran...') }]);

        const prompt = `The user is taking live meeting notes. They just typed: "${data}".
Generate 1 or 2 short follow-up questions the user could ask the participants to capture more details (e.g., who is responsible, deadline, or next steps).
Return ONLY a valid JSON array of strings. Do not use markdown formatting. Example: ["Siapa yang akan mengerjakan ini?", "Kapan tenggat waktunya?"]
Respond strictly in the EXACT SAME LANGUAGE and tone (including slang/informal words) that the user used in their notes.`;

        axios
          .post('/api/ai/generate', { prompt, provider: selectedModel })
          .then((res) => {
            try {
              let jsonStr = res.data.text
                .trim()
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
              const startIdx = jsonStr.indexOf('[');
              const endIdx = jsonStr.lastIndexOf(']') + 1;
              if (startIdx >= 0 && endIdx > startIdx) jsonStr = jsonStr.substring(startIdx, endIdx);
              const parsed = JSON.parse(jsonStr);
              if (Array.isArray(parsed)) {
                setNoteSuggestions(parsed.map((s) => ({ id: Math.random(), text: s })));
              } else {
                setNoteSuggestions([]);
              }
            } catch (err) {
              setNoteSuggestions([]);
            }
          })
          .catch((err) => {
            setNoteSuggestions([]);
          });
        return;
      }

      if (currentStep === 'ask_board_for_team') {
        const foundBoard = (boards || []).find(
          (b) => b.name.toLowerCase() === data.toLowerCase() || b.id.toString() === data
        );
        if (foundBoard) {
          setSelectedBoard(foundBoard);
          addBotMessage(
            tMsg(
              `Selected **${foundBoard.name}**. Opening Team Management panel... 🤝`,
              `Memilih **${foundBoard.name}**. Membuka panel Kelola Tim... 🤝`
            )
          );
          setTimeout(() => {
            openTeamModal(foundBoard.id);
            closeDrawer();
          }, 1500);
          setStep('end');
        } else {
          addBotMessage(
            tMsg(
              `I couldn't find a project named "${data}". Please try again or select from the options.`,
              `Saya tidak dapat menemukan proyek bernama "${data}". Silakan coba lagi atau pilih opsi yang ada.`
            ),
            (boards || []).map((b) => b.name).slice(0, 5)
          );
        }
        return;
      }

      if (currentStep === 'ask_board_for_invite') {
        const foundBoard = (boards || []).find(
          (b) => b.name.toLowerCase() === data.toLowerCase() || b.id.toString() === data
        );
        if (foundBoard) {
          setSelectedBoard(foundBoard);
          setTaskData({ board_id: foundBoard.id, board_name: foundBoard.name });
          setStep('ask_invite');
          addBotMessage(
            tMsg(
              `Selected **${foundBoard.name}**. Who would you like to invite? Please provide their username or email (comma separated).`,
              `Memilih **${foundBoard.name}**. Siapa yang ingin Anda undang? Berikan nama pengguna atau email mereka (dipisahkan koma).`
            )
          );
        } else {
          addBotMessage(
            tMsg(
              `I couldn't find a project named "${data}". Please try again or select from the options.`,
              `Saya tidak dapat menemukan proyek bernama "${data}". Silakan coba lagi atau pilih opsi yang ada.`
            ),
            (boards || []).map((b) => b.name).slice(0, 5)
          );
        }
        return;
      }

      if (currentStep === 'ask_board_for_create') {
        const foundBoard = (boards || []).find(
          (b) => b.name.toLowerCase() === data.toLowerCase() || b.id.toString() === data
        );
        if (foundBoard) {
          if (taskData.action === 'create_task' || taskData.project_name) {
            const finalData = { ...taskData, board_id: foundBoard.id, board_name: foundBoard.name };
            setTaskData(finalData);
            setStep('confirm_project_details');

            let summary =
              language === 'id'
                ? `Saya akan membuat tugas ini di proyek **${finalData.board_name}** dengan kategori **${
                    finalData.category || 'Other'
                  }**.\n\nApakah ini sudah benar, atau Anda ingin mengubahnya?`
                : `I will create this task in project **${finalData.board_name}** under category **${
                    finalData.category || 'Other'
                  }**.\n\nIs this correct, or do you want to change it?`;

            addBotMessage(summary, [optProceed, optChangeProj, optChangeCat, optCancel]);
          } else {
            setTaskData((prev) => ({ ...prev, board_id: foundBoard.id, board_name: foundBoard.name }));
            setStep('ask_project');
            addBotMessage(
              tMsg(
                `Selected **${foundBoard.name}**. What is the title of this task or request?`,
                `Memilih **${foundBoard.name}**. Apa judul tugas ini?`
              )
            );
          }
        } else {
          addBotMessage(
            tMsg(
              `I couldn't find a project named "${data}". Please try again or select from the options.`,
              `Saya tidak dapat menemukan proyek bernama "${data}". Silakan coba lagi atau pilih opsi yang ada.`
            ),
            (boards || []).map((b) => b.name).slice(0, 5)
          );
        }
        return;
      }

      if (currentStep === 'ask_project') {
        setTaskData((prev) => ({ ...prev, project_name: data }));
        setStep('ask_requester');
        addBotMessage(
          tMsg(
            `Awesome! Who is the requester or main assignee?\n\n*💡 Tip: Type @username to assign a team member, or type a regular name (without @) if someone else requested this.*`,
            `Hebat! Siapa peminta atau pekerja utama tugas ini?\n\n*💡 Tips: Ketik @username untuk menugaskan anggota tim, atau ketik nama biasa (tanpa @) jika orang lain yang meminta.*`
          )
        );
      } else if (currentStep === 'ask_requester') {
        // Validasi Typo Mention
        const mentions = data.match(/@([\w.-]+)/g);
        if (mentions) {
          const invalidMentions = mentions.filter((m) => {
            const uname = m.substring(1).toLowerCase();
            return !teamMembers.map((t) => t.toLowerCase()).includes(uname);
          });
          if (invalidMentions.length > 0) {
            addBotMessage(
              tMsg(
                `Hmm, I couldn't find these team members: **${invalidMentions.join(
                  ', '
                )}** in this project.\n\nPlease ensure the @username is correct, or just type a regular name without '@'.`,
                `Hmm, saya tidak menemukan anggota tim ini: **${invalidMentions.join(
                  ', '
                )}** di proyek ini.\n\nPastikan @username-nya benar, atau ketik nama biasa tanpa '@'.`
              )
            );
            return; // Hentikan proses, paksa user mengulang jawaban
          }
        }

        setTaskData((prev) => ({ ...prev, requester: data }));
        setStep('ask_category');
        addBotMessage(
          tMsg(
            `Got it. Which category does this task belong to?`,
            `Mengerti. Kategori apa yang sesuai untuk tugas ini?`
          ),
          [...categories, tMsg('➕ Add New Category', '➕ Tambah Kategori Baru')]
        );
      } else if (currentStep === 'ask_category') {
        if (
          data === tMsg('➕ Add New Category', '➕ Tambah Kategori Baru') ||
          data.toLowerCase() === 'add new category' ||
          data.toLowerCase() === 'tambah kategori baru'
        ) {
          setStep('ask_new_category');
          addBotMessage(tMsg('What should the new category be named?', 'Apa nama untuk kategori baru ini?'));
          return;
        }
        setTaskData((prev) => ({ ...prev, category: data }));
        setStep('ask_deadline');
        addBotMessage(
          tMsg(
            `Almost done! When is the target deadline?`,
            `Hampir selesai! Kapan tenggat waktu (deadline) tugas ini?`
          ),
          null,
          true
        );
      } else if (currentStep === 'ask_new_category') {
        if (!data.trim()) {
          addBotMessage(
            tMsg(
              'Category name cannot be empty. Please provide a valid name.',
              'Nama kategori tidak boleh kosong. Silakan berikan nama yang valid.'
            )
          );
          return;
        }
        setTaskData((prev) => ({ ...prev, category: data.trim() }));

        if (taskData.deadline) {
          setStep('confirm_project_details');
          const targetBoardName = taskData.board_name || selectedBoard?.name || 'Unknown Project';
          addBotMessage(
            tMsg(
              `Updated! I will create this task in project **${targetBoardName}** under category **${data.trim()}**.\n\nProceed?`,
              `Diperbarui! Saya akan membuat tugas ini di proyek **${targetBoardName}** dengan kategori **${data.trim()}**.\n\nLanjutkan?`
            ),
            [optProceed, optChangeProj, optChangeCat, optCancel]
          );
        } else {
          setStep('ask_deadline');
          addBotMessage(
            tMsg(
              `Category **${data.trim()}** will be used. Almost done! When is the target deadline?`,
              `Kategori **${data.trim()}** akan digunakan. Hampir selesai! Kapan tenggat waktu (deadline) tugas ini?`
            ),
            null,
            true
          );
        }
      } else if (currentStep === 'ask_deadline') {
        const deadlineDate = new Date(data);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
          addBotMessage(
            tMsg(
              `⚠️ The deadline cannot be earlier than today. Please provide a valid deadline.`,
              `⚠️ Tenggat waktu tidak boleh lebih awal dari hari ini. Silakan berikan tenggat waktu yang valid.`
            ),
            null,
            true
          );
          return;
        }

        setTaskData((prev) => ({ ...prev, deadline: data }));
        setStep('confirm_project_details');

        const targetBoardName = taskData.board_name || selectedBoard?.name || 'Unknown Project';
        const targetCategory = taskData.category || 'Other';

        addBotMessage(
          tMsg(
            `I will create this task in project **${targetBoardName}** under category **${targetCategory}**.\n\nIs this correct, or do you want to change it?`,
            `Saya akan membuat tugas ini di proyek **${targetBoardName}** dengan kategori **${targetCategory}**.\n\nApakah ini sudah benar, atau Anda ingin mengubahnya?`
          ),
          [optProceed, optChangeProj, optChangeCat, optCancel]
        );
      } else if (currentStep === 'confirm_project_details') {
        if (data === optProceed) {
          // Jika sudah punya deskripsi (misal hasil ekstrak JSON), langsung confirm akhir.
          if (taskData.description && taskData.description.length > 10) {
            setStep('confirm');
            addBotMessage(
              tMsg(
                `Everything is ready. Should I create this task now?`,
                `Semuanya sudah siap. Haruskah saya membuat tugas ini sekarang?`
              ),
              [optConfirmYes, optCancel]
            );
          } else {
            setStep('ask_draft');
            addBotMessage(
              tMsg(
                `Would you like me to automatically draft a professional task description based on your title using AI?`,
                `Apakah Anda ingin saya membuat draf deskripsi tugas profesional secara otomatis menggunakan AI?`
              ),
              [optDraftYes, optDraftNo]
            );
          }
        } else if (data === optChangeProj) {
          setStep('ask_board_for_create');
          addBotMessage(
            tMsg(`Okay, which project should this task belong to?`, `Oke, tugas ini harus dimasukkan ke proyek mana?`),
            (boards || []).map((b) => b.name).slice(0, 5)
          );
        } else if (data === optChangeCat) {
          setStep('ask_category_change');
          addBotMessage(tMsg(`Okay, what category should we use?`, `Oke, kategori apa yang harus kita gunakan?`), [
            ...categories,
            tMsg('➕ Add New Category', '➕ Tambah Kategori Baru'),
          ]);
        } else {
          addBotMessage(tMsg('Task creation cancelled.', 'Pembuatan tugas dibatalkan.'), [optStartOver, optClose]);
          setStep('end');
        }
      } else if (currentStep === 'ask_category_change') {
        if (
          data === tMsg('➕ Add New Category', '➕ Tambah Kategori Baru') ||
          data.toLowerCase() === 'add new category' ||
          data.toLowerCase() === 'tambah kategori baru'
        ) {
          setStep('ask_new_category');
          addBotMessage(tMsg('What should the new category be named?', 'Apa nama untuk kategori baru ini?'));
          return;
        }

        setTaskData((prev) => ({ ...prev, category: data }));
        setStep('confirm_project_details');
        const targetBoardName = taskData.board_name || selectedBoard?.name || 'Unknown Project';
        addBotMessage(
          tMsg(
            `Updated! I will create this task in project **${targetBoardName}** under category **${data}**.\n\nProceed?`,
            `Diperbarui! Saya akan membuat tugas ini di proyek **${targetBoardName}** dengan kategori **${data}**.\n\nLanjutkan?`
          ),
          [optProceed, optChangeProj, optChangeCat, optCancel]
        );
      } else if (currentStep === 'ask_draft') {
        const proceedToConfirm = (descText) => {
          const finalData = { ...taskData, description: descText };
          setTaskData(finalData);
          setStep('confirm');

          const requesterLabel = finalData.requester.startsWith('@')
            ? tMsg('Assignee', 'Pekerja')
            : tMsg('Requester', 'Peminta');

          const summary =
            tMsg(
              `Perfect. Here is the summary of your task:\n\n`,
              `Sempurna. Berikut adalah ringkasan tugas Anda:\n\n`
            ) +
            `• **${tMsg('Project', 'Proyek')}:** ${finalData.board_name || selectedBoard?.name || 'Unknown'}\n` +
            `• **${tMsg('Title', 'Judul')}:** ${finalData.project_name}\n` +
            `• **${requesterLabel}:** ${finalData.requester}\n` +
            `• **${tMsg('Category', 'Kategori')}:** ${finalData.category}\n` +
            `• **${tMsg('Deadline', 'Tenggat Waktu')}:** ${finalData.deadline}\n` +
            `• **${tMsg('Description', 'Deskripsi')}:**\n> ${
              descText === 'Created via Smart Assistant 🤖' ? 'Standard' : descText.replace(/\n/g, '\n> ')
            }\n\n` +
            tMsg(`Should I create this task now?`, `Apakah saya harus membuat tugas ini sekarang?`);

          addBotMessage(summary, [optConfirmYes, optCancel]);
        };

        if (data === optDraftYes) {
          addBotMessage(tMsg('Drafting description with AI... ⏳', 'Membuat deskripsi dengan AI... ⏳'));
          const prompt = `Write a short, professional, and structured task description (brief) for a project. Write it in the same language as the task title ("${taskData.project_name}"). The task title is "${taskData.project_name}", category is "${taskData.category}". Output 2 to 3 concise bullet points outlining expected deliverables or steps. Do not include greetings.`;
          axios
            .post('/api/ai/generate', { prompt, provider: selectedModel })
            .then((res) => {
              if (res.data.provider) setAiProvider(res.data.provider);
              setMessages((prev) =>
                prev.filter(
                  (m) => m.text !== tMsg('Drafting description with AI... ⏳', 'Membuat deskripsi dengan AI... ⏳')
                )
              );
              proceedToConfirm(res.data.text);
            })
            .catch((err) => {
              setMessages((prev) =>
                prev.filter(
                  (m) => m.text !== tMsg('Drafting description with AI... ⏳', 'Membuat deskripsi dengan AI... ⏳')
                )
              );
              const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
              addBotMessage(
                tMsg(`⚠️ Failed to draft description: ${errorMsg}`, `⚠️ Gagal membuat draf deskripsi: ${errorMsg}`)
              );
              proceedToConfirm('Created via Smart Assistant 🤖');
            });
        } else {
          proceedToConfirm('Created via Smart Assistant 🤖');
        }
      } else if (currentStep === 'confirm') {
        if (data === optConfirmYes) submitTask();
        else {
          addBotMessage(
            tMsg(
              'Task creation cancelled. Let me know if you need anything else!',
              'Pembuatan tugas dibatalkan. Beri tahu saya jika Anda butuh yang lain!'
            ),
            [optStartOver, optClose]
          );
          setStep('end');
        }
      } else if (currentStep === 'ask_leave_action') {
        if (data === tMsg('Add Leave', 'Tambah Cuti') || data === 'Add Leave' || data === 'Tambah Cuti') {
          setStep('ask_leave_start');
          addBotMessage(tMsg('When will your leave start?', 'Kapan cuti Anda akan dimulai?'), null, true);
        } else {
          addBotMessage(
            tMsg(`Opening the Time Off & Holidays panel for you...`, `Membuka panel Cuti & Libur untuk Anda...`)
          );
          setTimeout(() => {
            setIsLeaveModalOpen(true);
            closeDrawer();
          }, 1500);
          setStep('end');
        }
      } else if (currentStep === 'ask_leave_start') {
        setTaskData((prev) => ({ ...prev, start_date: data }));
        setStep('ask_leave_end');
        addBotMessage(
          tMsg(
            "When will it end? (If it's just one day, select the same date)",
            'Kapan cuti Anda akan berakhir? (Jika hanya satu hari, pilih tanggal yang sama)'
          ),
          null,
          true
        );
      } else if (currentStep === 'ask_leave_end') {
        const startDateObj = new Date(taskData.start_date);
        const endDateObj = new Date(data);

        if (endDateObj < startDateObj) {
          addBotMessage(
            tMsg(
              '⚠️ The end date cannot be earlier than the start date. Please provide a valid end date.',
              '⚠️ Tanggal selesai tidak boleh lebih awal dari tanggal mulai. Silakan masukkan tanggal selesai yang valid.'
            ),
            null,
            true
          );
          return;
        }

        setTaskData((prev) => ({ ...prev, end_date: data }));
        setStep('ask_leave_desc');
        addBotMessage(
          tMsg('What is the reason or description for this leave?', 'Apa alasan atau deskripsi untuk cuti ini?')
        );
      } else if (currentStep === 'ask_leave_desc') {
        const finalData = { ...taskData, description: data };
        setTaskData(finalData);
        setStep('confirm_leave');
        addBotMessage(
          tMsg(
            `Here is the summary of your leave:\n\n• **Start:** ${finalData.start_date}\n• **End:** ${finalData.end_date}\n• **Reason:** ${finalData.description}\n\nShould I submit this leave request?`,
            `Berikut adalah ringkasan cuti Anda:\n\n• **Mulai:** ${finalData.start_date}\n• **Selesai:** ${finalData.end_date}\n• **Alasan:** ${finalData.description}\n\nHaruskah saya mengirimkan permintaan cuti ini?`
          ),
          [tMsg('Yes, Submit', 'Ya, Kirim'), optCancel]
        );
      } else if (currentStep === 'confirm_leave') {
        if (data === tMsg('Yes, Submit', 'Ya, Kirim') || data === 'Yes, Submit' || data === 'Ya, Kirim') {
          addBotMessage(tMsg('Submitting your leave request... ⏳', 'Mengirimkan permintaan cuti Anda... ⏳'));
          axios
            .post('/api/leaves', {
              start_date: taskData.start_date,
              end_date: taskData.end_date,
              description: taskData.description,
              leave_type: 'personal',
            })
            .then(() => {
              setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
              if (fetchLeaves) fetchLeaves();
              if (fetchTasks) fetchTasks();
              showNotification(tMsg('Leave added successfully!', 'Cuti berhasil ditambahkan!'), 'success');
              addBotMessage(
                tMsg(
                  'Done! 🌴 Your leave has been recorded and project schedules will adjust accordingly.',
                  'Selesai! 🌴 Cuti Anda telah dicatat dan jadwal proyek akan disesuaikan.'
                ),
                [optStartOver, optClose]
              );
              setStep('end');
            })
            .catch((err) => {
              setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
              addBotMessage(
                tMsg('Oops, failed to add leave. Please try again.', 'Ups, gagal menambahkan cuti. Silakan coba lagi.'),
                [optStartOver, optClose]
              );
              setStep('end');
            });
        } else {
          addBotMessage(tMsg('Leave creation cancelled.', 'Pembuatan cuti dibatalkan.'), [optStartOver, optClose]);
          setStep('end');
        }
      } else if (currentStep === 'confirm_ticket') {
        if (data === tMsg('Yes, Submit', 'Ya, Kirim') || data === 'Yes, Submit' || data === 'Ya, Kirim') {
          addBotMessage(tMsg('Submitting your ticket... ⏳', 'Mengirimkan tiket Anda... ⏳'));
          const prefix = taskData.type === 'Support' ? '[SUPPORT TICKET] ' : '';
          axios
            .post('/api/feedback', { text: prefix + taskData.description })
            .then((res) => {
              setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
              showNotification(tMsg('Ticket submitted successfully!', 'Tiket berhasil dikirim!'), 'success');
              addBotMessage(
                tMsg(
                  `Done! 🎫 Your ticket has been submitted. You can track it in the 'My Tickets' panel.`,
                  `Selesai! 🎫 Tiket Anda telah dikirim. Anda dapat melacaknya di panel 'Tiket Saya'.`
                ),
                [optStartOver, optClose]
              );
              setStep('end');
            })
            .catch((err) => {
              setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
              addBotMessage(
                tMsg(
                  'Oops, failed to submit ticket. Please try again.',
                  'Ups, gagal mengirim tiket. Silakan coba lagi.'
                ),
                [optStartOver, optClose]
              );
              setStep('end');
            });
        } else {
          addBotMessage(tMsg('Ticket creation cancelled.', 'Pembuatan tiket dibatalkan.'), [optStartOver, optClose]);
          setStep('end');
        }
      } else if (currentStep === 'ask_bulk_create') {
        let tasksToCreate = [];

        if (data === optConfirmBulkYes || data.toLowerCase() === 'all' || data.toLowerCase() === 'semua') {
          tasksToCreate = taskData.extracted_tasks;
        } else if (data === optCancel || data.toLowerCase() === 'cancel' || data.toLowerCase() === 'batal') {
          addBotMessage(tMsg('Bulk task creation cancelled.', 'Pembuatan tugas massal dibatalkan.'), [
            optStartOver,
            optClose,
          ]);
          setStep('end');
          return;
        } else {
          // Coba mengekstrak angka dari jawaban user (misal: "1", "1, 3", "1 dan 2")
          const selectedIndices = data.match(/\d+/g);
          if (selectedIndices) {
            const indices = [...new Set(selectedIndices.map((n) => parseInt(n) - 1))].filter(
              (n) => n >= 0 && n < taskData.extracted_tasks.length
            );
            if (indices.length > 0) {
              tasksToCreate = indices.map((i) => taskData.extracted_tasks[i]);
            }
          }

          if (tasksToCreate.length === 0) {
            addBotMessage(
              tMsg(
                "I didn't understand the numbers. Please type valid task numbers (e.g., 1, 3) or click Cancel.",
                'Saya tidak mengerti angkanya. Silakan ketik nomor tugas yang valid (misal: 1, 3) atau klik Batal.'
              ),
              [optConfirmBulkYes, optCancel]
            );
            return; // Tetap di step ini
          }
        }

        addBotMessage(
          tMsg(`Creating ${tasksToCreate.length} tasks... ⏳`, `Membuat ${tasksToCreate.length} tugas... ⏳`)
        );

        const targetBoardId = taskData.target_board_id;

        const processTasksSequentially = async () => {
          let successCount = 0;
          for (const t of tasksToCreate) {
            const formattedData = {
              project_name: t.project_name,
              requester: t.requester,
              category: t.category,
              deadline: `${t.deadline} 17:00:00`,
              description: t.description
                ? `${t.description}\n\n*---\n🤖 Auto-extracted from Meeting Notes*`
                : '*🤖 Auto-extracted from Meeting Notes*',
              supporting_access: '',
              start_date: getLocalToday(),
              subtasks: [],
            };
            try {
              await axios.post(`/api/boards/${targetBoardId}/tasks`, formattedData);
              successCount++;
              // Jeda 300ms agar database (PostgreSQL) tidak berebut koneksi
              await new Promise((resolve) => setTimeout(resolve, 300));
            } catch (err) {
              console.error('Task creation failed:', err);
            }
          }
          setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
          fetchTasks();
          showNotification(
            tMsg(`Successfully created ${successCount} tasks!`, `Berhasil membuat ${successCount} tugas!`),
            'success'
          );
          addBotMessage(
            tMsg(
              `Done! 🎉 ${successCount} tasks have been successfully added.`,
              `Selesai! 🎉 ${successCount} tugas telah berhasil ditambahkan.`
            ),
            [optStartOver, optClose]
          );
          setStep('end');
        };

        processTasksSequentially();
      } else if (currentStep === 'ask_invite') {
        addBotMessage(tMsg('Sending invitation... ⏳', 'Mengirim undangan... ⏳'));
        const targetBoardId = taskData.board_id || selectedBoard?.id;
        axios
          .post(`/api/boards/${targetBoardId}/invite`, { members_input: data })
          .then((res) => {
            addBotMessage(res.data.message + ' 🎉', [optStartOver, optClose]);
            setStep('end');
          })
          .catch((err) => {
            addBotMessage(err.response?.data?.detail || tMsg('Failed to invite user.', 'Gagal mengundang pengguna.'), [
              optStartOver,
              optClose,
            ]);
            setStep('end');
          });
      } else if (currentStep === 'ask_search') {
        setGlobalSearchQuery(data);
        setIsGlobalSearchOpen(true);
        addBotMessage(
          tMsg(
            `I've opened the Global Search for **"${data}"**. Check the top of your screen! 🔍`,
            `Saya telah membuka Pencarian Global untuk **"${data}"**. Lihat bagian atas layar Anda! 🔍`
          ),
          [optStartOver, optClose]
        );
        setStep('end');
      } else if (currentStep === 'ask_edit' || currentStep === 'ask_delete') {
        const target = textLower;
        const matchedTasks = tasks.filter(
          (t) => t.id.toString() === target || t.project_name.toLowerCase().includes(target)
        );

        if (matchedTasks.length === 0) {
          addBotMessage(
            tMsg(
              `I couldn't find any task matching **"${data}"**.`,
              `Saya tidak dapat menemukan tugas yang cocok dengan **"${data}"**.`
            ),
            [optStartOver, optClose]
          );
          setStep('end');
        } else if (matchedTasks.length > 1) {
          addBotMessage(
            tMsg(
              `I found multiple tasks matching **"${data}"**. Please be more specific (e.g. provide the exact Task ID).`,
              `Saya menemukan beberapa tugas yang cocok dengan **"${data}"**. Harap lebih spesifik (misal: berikan ID Tugas yang tepat).`
            ),
            [optStartOver, optClose]
          );
          setStep('end');
        } else {
          const t = matchedTasks[0];
          setSelectedTask(t);
          if (currentStep === 'ask_edit') {
            setTimeout(() => setIsEditing(true), 200);
            addBotMessage(
              tMsg(
                `Opening task **#${t.id}: ${t.project_name}** in Edit Mode! ✏️`,
                `Membuka tugas **#${t.id}: ${t.project_name}** dalam Mode Edit! ✏️`
              )
            );
          } else {
            setTimeout(() => setIsDeleteConfirmOpen(true), 200);
            addBotMessage(
              tMsg(
                `Opening delete confirmation for **#${t.id}: ${t.project_name}**. Please confirm on the popup. ⚠️`,
                `Membuka konfirmasi hapus untuk **#${t.id}: ${t.project_name}**. Silakan konfirmasi di popup. ⚠️`
              )
            );
          }
          setTimeout(() => closeDrawer(), 1500);
          setStep('end');
        }
      } else if (currentStep === 'ask_feedback') {
        addBotMessage(tMsg('Submitting your feedback... ⏳', 'Mengirimkan masukan Anda... ⏳'));
        axios
          .post('/api/feedback', { text: data })
          .then((res) => {
            addBotMessage(
              tMsg(
                "Thank you! Your feedback has been successfully placed in the Admin's queue. 💡",
                'Terima kasih! Masukan Anda telah berhasil masuk ke antrean Admin. 💡'
              ),
              [optStartOver, optClose]
            );
            setStep('end');
          })
          .catch((err) => {
            addBotMessage(
              tMsg(
                'Oops, failed to submit feedback. Please try again later.',
                'Ups, gagal mengirim masukan. Silakan coba lagi nanti.'
              ),
              [optStartOver, optClose]
            );
            setStep('end');
          });
      } else if (currentStep === 'ask_support') {
        addBotMessage(tMsg('Submitting your support ticket... ⏳', 'Mengirimkan tiket dukungan Anda... ⏳'));
        axios
          .post('/api/feedback', { text: `[SUPPORT TICKET] ${data}` })
          .then((res) => {
            addBotMessage(
              tMsg(
                'Thank you! Your support ticket has been sent to the IT team. 🎧',
                'Terima kasih! Tiket dukungan Anda telah dikirim ke tim IT. 🎧'
              ),
              [optStartOver, optClose]
            );
            setStep('end');
          })
          .catch((err) => {
            addBotMessage(
              tMsg(
                'Oops, failed to submit ticket. Please try again later.',
                'Ups, gagal mengirim tiket. Silakan coba lagi nanti.'
              ),
              [optStartOver, optClose]
            );
            setStep('end');
          });
      } else if (currentStep === 'ask_doc') {
        let baseContext = '';
        if (data === 'Workspace')
          baseContext =
            "Workspace & Projects: INNOCEAN Tracker is organized into isolated project workspaces. Users can create new projects or invite team members via the Team menu. It's a secure environment.";
        else if (data === 'Tasks')
          baseContext =
            "Tasks: Tasks are the core unit of work. Click 'New Request' to start. Users can use markdown for rich text, add sub-tasks (checklists), and set deadlines.";
        else if (data === 'Views')
          baseContext =
            'Views: Users can view tasks in 5 modes: Kanban Board (agile), Table List (spreadsheet), Timeline (Gantt chart), Monthly Calendar, or Advanced Analytics dashboard.';
        else if (data === 'Analytics')
          baseContext =
            'Analytics: The Analytics Dashboard provides real-time automated insights, Project Health scores (based on completion, WIP, overdue), and interactive charts.';
        else if (data === 'Filters')
          baseContext =
            "Filters: Use the top toolbar to search globally, toggle 'My Tasks' to see only personal assignments, or filter by status, category, and assignee. Also group by or sort by due date.";
        else if (data === 'Collab')
          baseContext =
            'Collaboration: Type @username anywhere (task desc, comments, subtasks) to notify colleagues via in-app and email. Use the Comments tab for discussions and Activity Log for audit trails.';
        else if (data === 'Deadlines')
          baseContext =
            'Deadlines: The smart engine automatically skips weekends and Indonesian public holidays when calculating project schedules. Priorities are set dynamically based on deadline proximity (Critical, Warning, Normal).';
        else if (data === 'Account')
          baseContext =
            'Account: Manage profile, export CSV data globally or per project, toggle Dark Mode, submit feedback, or view system specs from the top right Account menu.';
        else if (data === 'Assistant')
          baseContext =
            'Assistant: Smart Assistant is a Multi-AI helper (Gemini/GPT-OSS) that can draft tasks, summarize notes, answer docs, and extract meeting notes into actionable tasks.';
        else if (data === 'Tickets')
          baseContext =
            "Tickets: Users can submit System Feedback or Contact Support via the Account menu. These auto-generate a ticket ID (e.g. TKT-0001) which can be tracked in the 'My Tickets' panel.";
        else if (data === 'Security')
          baseContext =
            'Security: INNOCEAN Tracker is built on a Zero-Trust Architecture. It protects against OWASP Top 10 vulnerabilities (XSS, DoS, IDOR, BOLA) and has passed 12 automated penetration tests. Users can view the full details in the System Specs menu.';
        else baseContext = `The user is asking about: ${data}.`;

        setTaskData((prev) => ({ ...prev, doc_topic: data, doc_context: baseContext }));
        setStep('ask_doc_lang');
        addBotMessage(
          tMsg(
            'Would you like the explanation in English or Indonesian?',
            'Apakah Anda ingin penjelasannya dalam bahasa Inggris atau Indonesia?'
          ),
          ['English', 'Indonesia']
        );
      } else if (currentStep === 'ask_doc_lang') {
        const targetLang = data.toLowerCase().includes('indonesia') ? 'Indonesian' : 'English';
        setTaskData((prev) => ({ ...prev, doc_lang: targetLang }));

        addBotMessage(tMsg('Reading the documentation... ⏳', 'Membaca dokumentasi... ⏳'));

        const prompt = `You are the official Smart Assistant for INNOCEAN Tracker. The user asked for documentation about "${taskData.doc_topic}". \nHere is the core context about this feature: "${taskData.doc_context}"\nPlease provide a very simple, brief, and beginner-friendly explanation (maximum 2-3 short sentences). Make it easy for a layperson to understand. Use an analogy if helpful. Respond strictly in ${targetLang}.`;

        axios
          .post('/api/ai/generate', { prompt, provider: selectedModel })
          .then((res) => {
            if (res.data.provider) setAiProvider(res.data.provider);
            setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
            const reply = res.data.text.trim();
            addBotMessage(
              reply +
                tMsg(
                  '\n\nWould you like a more detailed explanation?',
                  '\n\nApakah Anda ingin penjelasan yang lebih detail?'
                ),
              [
                tMsg('Detailed Version', 'Versi Detail'),
                tMsg('Read Another', 'Baca Topik Lain'),
                tMsg('Full Docs', 'Dokumen Lengkap'),
                optClose,
              ]
            );
            setStep('doc_continue');
          })
          .catch((err) => {
            setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
            addBotMessage(
              tMsg(
                '⚠️ Failed to load documentation from AI. Please try again.',
                '⚠️ Gagal memuat dokumentasi dari AI. Silakan coba lagi.'
              ) + tMsg('\n\nWould you like to read another topic?', '\n\nIngin membaca topik lain?'),
              [tMsg('Read Another', 'Baca Topik Lain'), tMsg('Full Docs', 'Dokumen Lengkap'), optClose]
            );
            setStep('doc_continue');
          });
      } else if (currentStep === 'doc_continue') {
        const isDetailed =
          data === tMsg('Detailed Version', 'Versi Detail') || data === 'Detailed Version' || data === 'Versi Detail';
        const isAnother =
          data === tMsg('Read Another', 'Baca Topik Lain') || data === 'Read Another' || data === 'Baca Topik Lain';
        const isFull =
          data === tMsg('Full Docs', 'Dokumen Lengkap') || data === 'Full Docs' || data === 'Dokumen Lengkap';

        if (isDetailed) {
          addBotMessage(tMsg('Generating detailed explanation... ⏳', 'Membuat penjelasan detail... ⏳'));
          const prompt = `You are the official Smart Assistant for INNOCEAN Tracker. The user wants a HIGHLY DETAILED explanation about "${
            taskData.doc_topic
          }". \nHere is the core context: "${
            taskData.doc_context
          }"\nPlease expand on this context to provide a comprehensive, professional, and in-depth guide. Use markdown for styling (bold, bullet points, step-by-step if applicable). Respond strictly in ${
            taskData.doc_lang || 'English'
          }.`;
          axios
            .post('/api/ai/generate', { prompt, provider: selectedModel })
            .then((res) => {
              if (res.data.provider) setAiProvider(res.data.provider);
              setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
              const reply = res.data.text.trim();
              addBotMessage(
                reply + tMsg('\n\nWhat would you like to do next?', '\n\nApa yang ingin Anda lakukan selanjutnya?'),
                [tMsg('Read Another', 'Baca Topik Lain'), tMsg('Full Docs', 'Dokumen Lengkap'), optClose]
              );
            })
            .catch((err) => {
              setMessages((prev) => prev.filter((m) => !m.text.includes('⏳')));
              addBotMessage(
                tMsg('⚠️ Failed to load detailed documentation.', '⚠️ Gagal memuat dokumentasi detail.') +
                  tMsg('\n\nWould you like to read another topic?', '\n\nIngin membaca topik lain?'),
                [tMsg('Read Another', 'Baca Topik Lain'), tMsg('Full Docs', 'Dokumen Lengkap'), optClose]
              );
            });
        } else if (isAnother) {
          setStep('ask_doc');
          addBotMessage(tMsg(`Which topic would you like to learn about?`, `Topik apa yang ingin Anda pelajari?`), [
            'Workspace',
            'Tasks',
            'Views',
            'Analytics',
            'Filters',
            'Collab',
            'Deadlines',
            'Account',
            'Assistant',
          ]);
        } else if (isFull) {
          setIsDocsOpen(true);
          closeDrawer();
          setStep('end');
        }
      }
    };

    setTimeout(() => nextStep(step, text), 500); // Simulasi bot "Sedang mengetik..."
  };

  const submitTask = () => {
    addBotMessage(tMsg('Creating task... ⏳', 'Membuat tugas... ⏳'));
    const formattedData = {
      project_name: taskData.project_name,
      requester: taskData.requester,
      category: taskData.category,
      deadline: `${taskData.deadline} 17:00:00`,
      description: taskData.description || 'Created via Smart Assistant 🤖',
      etc: taskData.etc || 2,
      supporting_access: '',
      start_date: getLocalToday(),
      subtasks: taskData.subtasks || [],
    };

    const targetBoardId = taskData.board_id || selectedBoard.id;
    if (!targetBoardId) {
      addBotMessage(
        tMsg(
          "Oops, I lost track of which project this belongs to. Let's start over.",
          'Ups, saya kehilangan jejak proyek ini. Mari kita mulai ulang.'
        ),
        [optStartOver, optClose]
      );
      setStep('end');
      return;
    }
    axios
      .post(`/api/boards/${targetBoardId}/tasks`, formattedData)
      .then(() => {
        fetchTasks();
        showNotification('Task created successfully via Assistant!', 'success');
        addBotMessage(
          tMsg(
            'Done! 🎉 The task has been successfully added to your board.',
            'Selesai! 🎉 Tugas telah berhasil ditambahkan ke papan Anda.'
          ),
          [tMsg('Create Another', 'Buat Lagi'), optClose]
        );
        setStep('end');
      })
      .catch((err) => {
        const errorMsg =
          err.response?.data?.detail ||
          tMsg(
            'Oops, something went wrong while creating the task. Please try again.',
            'Ups, terjadi kesalahan saat membuat tugas. Silakan coba lagi.'
          );
        addBotMessage(errorMsg, [optStartOver, optClose]);
        setStep('end');
      });
  };

  const handleQuickTaskSubmit = (e) => {
    e.preventDefault();
    if (!quickTaskInput.trim()) return;
    setQuickTasks((prev) => [...prev, { id: Date.now() + Math.random(), text: quickTaskInput.trim() }]);
    setQuickTaskInput('');
    setTimeout(() => {
      const el = document.getElementById('quick-tasks-end');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSaveQuickTasks = async () => {
    const targetId = selectedBoard && selectedBoard.id !== 'global' ? selectedBoard.id : quickTargetBoardId;
    if (!targetId) {
      showNotification(tMsg('Please select a project first.', 'Silakan pilih proyek terlebih dahulu.'), 'error');
      return;
    }

    setIsSavingQuickTasks(true);
    const todayStr = getLocalToday();
    let successCount = 0;

    for (const t of quickTasks) {
      const payload = {
        project_name: t.text,
        requester: `@${currentUser}`,
        category: categories[0] || 'Other',
        description: '*⚡ Created via Quick To-Do*',
        supporting_access: '',
        start_date: todayStr,
        deadline: `${todayStr} 17:00:00`,
        impact: 'Medium',
        etc: 2,
        auto_nudge: false,
        recurring: 'none',
        subtasks: [],
      };
      try {
        await axios.post(`/api/boards/${targetId}/tasks`, payload);
        successCount++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error(e);
      }
    }

    setIsSavingQuickTasks(false);
    setQuickTasks([]);
    if (fetchTasks) fetchTasks();
    showNotification(
      tMsg(`Successfully added ${successCount} tasks!`, `Berhasil menambahkan ${successCount} tugas!`),
      'success'
    );
    setAssistantMode('landing');
  };

  const handlePlannerSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!plannerPrompt.trim()) return;
    setIsPlanning(true);
    setPlannedTasks([]);

    try {
      const currentYear = new Date().getFullYear();
      const aiPrompt = `Act as an Expert Project Manager. Parse the user's request into a strictly valid JSON array of tasks.
INSTRUCTIONS:
1. Break down the user's request into specific, actionable tasks.
   - BROAD / GENERIC GOAL: If the user's request is generic or broad (e.g., "Paid search", "SEO", "marketing campaign", "website redesign") and does NOT explicitly mention a specific assignee (@name), a specific deadline/due date, a specific project name (#ProjectName), or any highly specific single action, you MUST logically break it down into multiple actionable tasks (minimum 3 tasks), regardless of how few words the user prompt is.
   - SPECIFIC TASK: If it is a single specific action, explicitly assigns work (@name), or specifies a distinct project (#ProjectName), generate EXACTLY ONE task per each action.
2. "project_name" MUST ALWAYS be in English. When generating multiple tasks from a breakdown, you MUST prepend step numbers (e.g. "[Part 1] Task Title" or "1. Task Title") so the sequence and order of execution are clear.
3. "description" and "subtasks" MUST match the EXACT language used in the user's prompt.
4. Output Format: Return ONLY a valid JSON array. DO NOT use markdown formatting blocks.

JSON SCHEMA:
[
  {
    "project_name": "[Context] Actionable Title in ENGLISH ONLY",
    "suggested_project": "Extract project name identified by '#' (e.g., '#WebsiteRedesign'). Leave empty if none.",
    "requester": "If assigning TO someone, use '@username' (e.g., '@budi'). Default to '@${currentUser}' if unspecified.",
    "category": "Identify the best category (e.g. Development, Design, Marketing).",
    "impact": "High, Medium, or Low",
    "deadline": "YYYY-MM-DD. ONLY provide a deadline if the user explicitly mentions a time or date frame. Otherwise, return an empty string ''. Must be >= ${getLocalToday()}.",
    "auto_nudge": "Boolean. Return true ONLY if the user explicitly asks to be reminded or notified about this task. Otherwise false.",
    "etc": "Estimate the REALISTIC time consumption in hours (e.g. 2.5). Base this heavily on the complexity of the task.",
    "description": "Highly detailed and comprehensive brief expanding on the user's request.",
    "subtasks": ["Break down the task into 3-5 actionable sub-tasks as an array of strings."]
  }
]

USER REQUEST:
"""${plannerPrompt}"""`;

      const resAi = await axios.post('/api/ai/generate', { prompt: aiPrompt, provider: selectedModel });
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

      const defaultBoardId = !selectedBoard || selectedBoard.id === 'global' ? boards[0]?.id || '' : selectedBoard.id;
      setPlannerTargetBoardId(defaultBoardId);

      for (let i = 0; i < extractedTasks.length; i++) {
        const t = extractedTasks[i];

        let matchedBoardId = defaultBoardId;
        if (t.suggested_project) {
          const sp = t.suggested_project.replace('#', '').toLowerCase().trim();
          let matched = boards.find((b) => b.name.toLowerCase() === sp);
          if (!matched) {
            matched = boards.find((b) => b.name.toLowerCase().includes(sp));
          }
          if (matched && matched.id !== 'global') {
            matchedBoardId = matched.id;
          }
        }

        const task = {
          ...t,
          id: Math.random().toString(),
          deadline: t.deadline && t.deadline !== '' ? t.deadline : '',
          impact: t.impact || 'Medium',
          auto_nudge: t.auto_nudge === true || t.auto_nudge === 'true',
          target_board_id: matchedBoardId,
          selected: true,
        };
        // Jeda waktu acak untuk memberikan efek animasi AI sedang memproses satu per satu
        await new Promise((res) => setTimeout(res, 800 + Math.random() * 500));
        setPlannedTasks((prev) => [...prev, task]);
      }

      setPlannerPrompt('');
    } catch (err) {
      console.error(err);
      showNotification(
        tMsg('Failed to process request. Please try again.', 'Gagal memproses permintaan. Silakan coba lagi.'),
        'error'
      );
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSavePlannedTasks = async () => {
    const selected = plannedTasks.filter((t) => t.selected);
    if (selected.length === 0) return;

    if (!plannerTargetBoardId) {
      showNotification(tMsg('Please select a target project.', 'Silakan pilih proyek tujuan.'), 'error');
      return;
    }

    setIsSavingPlanned(true);
    const todayStr = getLocalToday();
    let successCount = 0;

    for (const t of selected) {
      const targetId = t.target_board_id || plannerTargetBoardId;
      if (!targetId) continue;

      const payload = {
        project_name: t.project_name,
        requester: t.requester || `@${currentUser}`,
        category: t.category || categories[0] || 'Other',
        description: (t.description || '') + '\n\n*✨ Auto-generated by Smart Assistant Planner*',
        supporting_access: '',
        start_date: todayStr,
        deadline: t.deadline && t.deadline !== '' ? `${t.deadline} 17:00:00` : '',
        impact: 'Medium',
        etc: t.etc || 2,
        auto_nudge: t.auto_nudge === true || t.auto_nudge === 'true',
        recurring: 'none',
        subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((st) => (typeof st === 'string' ? { task_name: st, assignee: null } : st)) : [],
      };

      try {
        await axios.post(`/api/boards/${targetId}/tasks`, payload);
        successCount++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error(e);
      }
    }

    setIsSavingPlanned(false);
    setPlannedTasks([]);
    if (fetchTasks) fetchTasks();
    showNotification(
      tMsg(
        `Successfully added ${successCount} planned tasks!`,
        `Berhasil menambahkan ${successCount} tugas terencana!`
      ),
      'success'
    );
    setAssistantMode('landing');
  };

  const renderDiscardModal = () => {
    if (!discardConfirmAction) return null;
    return (
      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-100 p-5">
        <div className="bg-white dark:bg-neutral-950 p-6 sm:p-8 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center mac-animate">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-red-200 dark:border-red-800/50">
            🗑️
          </div>
          <h3 className="text-lg font-black text-black dark:text-white mb-2 uppercase">
            {tMsg('Discard Changes?', 'Buang Perubahan?')}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-xs font-medium leading-relaxed">
            {tMsg(
              'You have unsaved items. Are you sure you want to discard them? This action cannot be undone.',
              'Anda memiliki item yang belum disimpan. Yakin ingin membuangnya? Tindakan ini tidak dapat dibatalkan.'
            )}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDiscardConfirmAction(null)}
              className="flex-1 px-4 py-3 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-[10px]"
            >
              {tMsg('No, Keep', 'Tidak')}
            </button>
            <button
              onClick={() => {
                discardConfirmAction();
                setDiscardConfirmAction(null);
              }}
              className="flex-1 px-4 py-3 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all uppercase tracking-widest text-[10px] hover:-translate-y-0.5"
            >
              {tMsg('Yes, Discard', 'Ya, Buang')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (accountStatus === 'suspended') return null;
  const currentBotMessage = messages
    .slice()
    .reverse()
    .find((m) => m.sender === 'bot');

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const match = val.match(/(?:^|\s)@([\w.-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setIsMentioning(true);
      setMentionIndex(0);
    } else {
      setIsMentioning(false);
    }
  };

  const insertMention = (username) => {
    const newVal = inputValue.replace(/(?:^|\s)@([\w.-]*)$/, ` @${username} `);
    setInputValue(newVal);
    setIsMentioning(false);
  };

  if (assistantMode === 'landing') {
    return (
      <SmartAssistantLanding
        currentUser={currentUser}
        tMsg={tMsg}
        setAssistantMode={setAssistantMode}
        startQuickNote={startQuickNote}
        startConversation={startConversation}
        renderDiscardModal={renderDiscardModal}
      />
    );
  }

  if (assistantMode === 'quick_todo') {
    return (
      <SmartAssistantQuickTodo
        selectedBoard={selectedBoard}
        boards={boards}
        quickTargetBoardId={quickTargetBoardId}
        setQuickTargetBoardId={setQuickTargetBoardId}
        tMsg={tMsg}
        quickTasks={quickTasks}
        setQuickTasks={setQuickTasks}
        setDiscardConfirmAction={setDiscardConfirmAction}
        setAssistantMode={setAssistantMode}
        quickTaskInput={quickTaskInput}
        setQuickTaskInput={setQuickTaskInput}
        isSavingQuickTasks={isSavingQuickTasks}
        handleSaveQuickTasks={handleSaveQuickTasks}
        handleQuickTaskSubmit={handleQuickTaskSubmit}
        renderDiscardModal={renderDiscardModal}
      />
    );
  }

  if (assistantMode === 'planner') {
    return (
      <SmartAssistantPlanner
        boards={boards}
        plannerTargetBoardId={plannerTargetBoardId}
        setPlannerTargetBoardId={setPlannerTargetBoardId}
        plannedTasks={plannedTasks}
        setPlannedTasks={setPlannedTasks}
        isPlanning={isPlanning}
        setDiscardConfirmAction={setDiscardConfirmAction}
        clearPlanner={clearPlanner}
        setAssistantMode={setAssistantMode}
        tMsg={tMsg}
        plannerPrompt={plannerPrompt}
        setPlannerPrompt={setPlannerPrompt}
        handlePlannerSubmit={handlePlannerSubmit}
        formatDateMMM={formatDateMMM}
        plannerEndRef={plannerEndRef}
        handleSavePlannedTasks={handleSavePlannedTasks}
        isSavingPlanned={isSavingPlanned}
        renderDiscardModal={renderDiscardModal}
      />
    );
  }

  return (
    <SmartAssistantChat
      messages={messages}
      setDiscardConfirmAction={setDiscardConfirmAction}
      setMessages={setMessages}
      setAssistantMode={setAssistantMode}
      tMsg={tMsg}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      language={language}
      aiProvider={aiProvider}
      startConversation={startConversation}
      chatBg={chatBg}
      scrollContainerRef={scrollContainerRef}
      currentUser={currentUser}
      getLocalTimestamp={getLocalTimestamp}
      avatarsMap={avatarsMap}
      showNotification={showNotification}
      handleUserReply={handleUserReply}
      step={step}
      currentBotMessage={currentBotMessage}
      optCancel={optCancel}
      noteSuggestions={noteSuggestions}
      setInputValue={setInputValue}
      inputValue={inputValue}
      handleInputChange={handleInputChange}
      isMentioning={isMentioning}
      globalMentionOptions={globalMentionOptions}
      mentionQuery={mentionQuery}
      mentionIndex={mentionIndex}
      setMentionIndex={setMentionIndex}
      insertMention={insertMention}
      setIsMentioning={setIsMentioning}
      accountStatus={accountStatus}
      teamMembers={teamMembers}
      messagesEndRef={messagesEndRef}
      renderDiscardModal={renderDiscardModal}
    />
  );
}
