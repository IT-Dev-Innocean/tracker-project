import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { IconPlus, Avatar } from './SharedUI';
import { Icon } from './components/icons/Icon';
import MultiUserSelect from './components/MultiUserSelect';
import RoleUsersTrigger from './components/RoleUsersTrigger';
import { useCloseAnimation, LoadingSpinner } from './Utils';
import { useFeatureFlag } from './featureFlags';
import {
  DEFAULT_FORM_TEAM_SUBTASKS,
  SUBTASK_DEPARTMENT_OPTIONS,
  filterEmployeesByDepartment,
} from './utils/formSubtasks';

export default function TaskFormModal({
  setIsFormOpen,
  currentUser,
  handleSubmit,
  formData,
  setFormData,
  handleRequesterChange,
  isMentioning,
  teamMembers,
  mentionQuery,
  insertMention,
  categories,
  handleOpenAddBoard,
  handleOpenRenameBoard,
  handleOpenDeleteBoard,
  formSubtaskInput,
  setFormSubtaskInput,
  handleAddFormSubtask,
  formSubtaskAssignee,
  setFormSubtaskAssignee,
  formSubtasks,
  setFormSubtasks,
  handleRemoveFormSubtask,
  mentionIndex,
  setMentionIndex,
  setIsMentioning,
  language,
  isSubmitting,
  handleManualFormClick,
  selectedBoard,
  userDirectory,
  avatarsMap = {},
}) {
  const TASK_FORM_AI_ASSISTANT_ENABLED = useFeatureFlag('TASK_FORM_AI_ASSISTANT_ENABLED');
  const [isClosing, close] = useCloseAnimation(() => setIsFormOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [formMode, setFormMode] = useState(
    TASK_FORM_AI_ASSISTANT_ENABLED ? 'ai' : 'manual'
  ); // 'ai' atau 'manual'
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const handleGenerateDesc = async () => {
    if (!formData.task_name) {
      alert(
        language === 'id'
          ? 'Silakan masukkan nama/judul tugas terlebih dahulu.'
          : 'Please enter a task name first.'
      );
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const baseDesc = formData.description
        ? `\n\nUser's initial brief/draft:\n${formData.description}`
        : '';
      const prompt = `Write a professional, structured task description (brief) in markdown format. The task title is "${formData.task_name}", category is "${formData.category}". Please respond in the same language as the task title.${baseDesc}`;
      const res = await axios.post('/api/ai/generate', { prompt });
      setFormData({ ...formData, description: res.data.text });
    } catch (err) {
      alert(
        language === 'id'
          ? 'Gagal membuat deskripsi dengan AI.'
          : 'Failed to generate description with AI.'
      );
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleAiSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGeneratingTask(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const promptStr = `You are a helpful project manager AI. Today is ${todayStr}.
The user currently logged in is "@${currentUser}".
The user wants to create a new task: "${aiPrompt}".
1. Extract the details into a JSON object.
2. "task_name" MUST ALWAYS be in English. "description" MUST be in the SAME LANGUAGE the user used (e.g., if the prompt is in Indonesian, write the description and notes in Indonesian).
3. Break down the task into 3-5 actionable "subtasks".
4. Determine the "requester" field. If the task is ASSIGNED TO someone, use an '@' prefix (e.g., "@budi"). If someone else REQUESTED the task for you to do, write their name WITHOUT the '@' prefix (e.g., "Robert"). If the user implies the task is for themselves to do, use "@${currentUser}".
5. Find the closest "category" from: [${categories.join(
      ', '
    )}]. If nothing fits, create a new short relevant category name.
6. Extract any URLs/links from the prompt into "supporting_access" (separated by newline).
7. Calculate "start_date" and "deadline" (YYYY-MM-DD) based on relative time mentioned (e.g., 'tomorrow', 'next week').
8. Determine "impact" (High/Medium/Low) based on urgency, and "recurring" (none/daily/weekly/monthly).
9. Return ONLY valid JSON without any markdown formatting.

Format:
{
  "task_name": "[Brand/Context] Short, clear task title",
  "requester": "Assignee with '@' prefix OR Requester name without '@'",
  "category": "Category name",
  "description": "Well-structured description using markdown",
  "supporting_access": "URLs if any, else empty string",
  "start_date": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "impact": "High/Medium/Low",
  "etc": Estimated time in hours as a number (e.g. 2.5),
  "recurring": "none/daily/weekly/monthly",
  "subtasks": ["Step 1", "Step 2", "Step 3"]
}`;

    try {
      const res = await axios.post('/api/ai/generate', {
        prompt: promptStr,
        provider: 'auto',
      });
      let jsonStr = res.data.text
        .trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}') + 1;
      if (startIdx >= 0 && endIdx > startIdx) {
        jsonStr = jsonStr.substring(startIdx, endIdx);
      }
      const parsed = JSON.parse(jsonStr);

      setFormData({
        ...formData,
        task_name: parsed.task_name || '',
        requester: parsed.requester || formData.requester,
        category: parsed.category || categories[0] || 'Other',
        description: parsed.description || '',
        supporting_access: parsed.supporting_access || '',
        start_date: parsed.start_date || formData.start_date,
        deadline: parsed.deadline || formData.deadline,
        impact: parsed.impact || 'Medium',
        etc: parsed.etc !== undefined ? parseFloat(parsed.etc) : 2.0,
        recurring: parsed.recurring || 'none',
      });

      if (
        parsed.subtasks &&
        Array.isArray(parsed.subtasks) &&
        setFormSubtasks
      ) {
        const aiTeams = parsed.subtasks.map((name) => ({
          task_name: name,
          assignees: [],
        }));
        setFormSubtasks([
          ...DEFAULT_FORM_TEAM_SUBTASKS.map((t) => ({
            task_name: t.task_name,
            assignees: [],
          })),
          ...aiTeams,
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTask(false);
      setFormMode('manual');
    }
  };

  const [isEstimatingEtc, setIsEstimatingEtc] = useState(false);
  const handleEstimateEtc = async () => {
    if (!formData.task_name) {
      alert(
        language === 'id'
          ? 'Silakan masukkan judul tugas terlebih dahulu.'
          : 'Please enter a task name first.'
      );
      return;
    }
    setIsEstimatingEtc(true);
    try {
      const prompt = `Estimate the time consumption in hours to complete this task based on its title and description. Task Title: "${
        formData.task_name
      }". Description: "${
        formData.description || ''
      }". Return ONLY a number (e.g. 2.5, 4, 10). Do not include any other text.`;
      const res = await axios.post('/api/ai/generate', {
        prompt,
        provider: 'auto',
      });
      const match = res.data.text.match(/[\d.]+/);
      const val = match ? parseFloat(match[0]) : NaN;
      if (!isNaN(val)) {
        setFormData({ ...formData, etc: val });
      }
    } catch (err) {
      console.error(err);
      alert(
        language === 'id'
          ? 'Gagal mengestimasi ETC.'
          : 'Failed to estimate ETC.'
      );
    } finally {
      setIsEstimatingEtc(false);
    }
  };

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  };

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      task_name: '',
      requester: [],
      head_of_project: [],
      rc_team: [],
      category: categories[0] || 'Development',
      description: '',
      supporting_access: '',
      start_date: getLocalToday(),
      deadline: getLocalToday(),
      etc: 2,
      impact: 'Medium',
      recurring: 'none',
      auto_nudge: false,
    }));
    setFormSubtasks(
      DEFAULT_FORM_TEAM_SUBTASKS.map((t) => ({
        task_name: t.task_name,
        assignees: [],
      }))
    );
    setFormSubtaskInput('');
    setFormSubtaskAssignee('');
    close();
  };

  const [workspacePeople, setWorkspacePeople] = useState([]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get('/api/users/avatars')
      .then((res) => {
        if (cancelled) return;
        setWorkspacePeople(res.data?.directory || []);
      })
      .catch(() => {
        if (!cancelled) setWorkspacePeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allEmployees = useMemo(() => {
    const source =
      (userDirectory && userDirectory.length > 0 ? userDirectory : null) ||
      (workspacePeople && workspacePeople.length > 0
        ? workspacePeople
        : null) ||
      [];

    if (source.length > 0) {
      return source
        .filter(
          (u) =>
            u?.username &&
            u.username !== 'admin' &&
            (u.account_status == null || u.account_status === 'active')
        )
        .map((u) => ({
          username: u.username,
          full_name: u.full_name || u.name || u.username,
          name: u.name || u.full_name || u.username,
          division_name: u.division_name || '',
        }))
        .sort((a, b) =>
          String(a.full_name || a.username).localeCompare(
            String(b.full_name || b.username)
          )
        );
    }

    return (teamMembers || [])
      .filter((m) => m && m !== 'admin')
      .map((username) => ({
        username,
        full_name: username,
        name: username,
        division_name: '',
      }));
  }, [userDirectory, workspacePeople, teamMembers]);

  const isRcDivision = (div) => {
    const clean = String(div || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return clean === 'rc' || clean === 'resourcescoordination';
  };

  const rcEmployees = useMemo(() => {
    return allEmployees.filter((emp) => isRcDivision(emp.division_name));
  }, [allEmployees]);

  // Default masukkan semua karyawan R&C jika rc_team masih kosong dan data karyawan R&C tersedia
  useEffect(() => {
    if (rcEmployees.length > 0 && (!formData.rc_team || formData.rc_team.length === 0)) {
      const defaultRcUsernames = rcEmployees.map((e) => e.username);
      setFormData((prev) => ({
        ...prev,
        rc_team: defaultRcUsernames,
      }));
    }
  }, [rcEmployees]);

  const requesterUsers = Array.isArray(formData.requester)
    ? formData.requester
    : formData.requester
      ? String(formData.requester)
          .split(',')
          .map((u) => u.replace(/^@/, '').trim())
          .filter(Boolean)
      : [];
  const headOfProject = formData.head_of_project || [];
  const rcTeam = formData.rc_team || [];

  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}>
      <div
        className={`bg-white dark:bg-neutral-950 shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-lg md:rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}>
        <div className='flex justify-between items-center p-5 sm:p-8 md:px-12 md:py-8 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl z-20'>
          <h2 className='text-xl sm:text-2xl font-extrabold text-black dark:text-white uppercase flex items-center gap-2 sm:gap-3'>
            {formMode === 'ai' ? (
              <Icon name='sparkles' className='w-6 h-6 sm:w-8 sm:h-8' />
            ) : (
              <IconPlus className='w-6 h-6 sm:w-8 sm:h-8' />
            )}
            {formMode === 'ai'
              ? tMsg('Smart Assistant', 'Asisten Pintar')
              : tMsg('Add Task', 'Tugas Baru')}
          </h2>
          <button
            onClick={handleCancel}
            className='text-neutral-400 hover:text-black dark:hover:text-white transition-colors'>
            <Icon name='x' className='w-6 h-6' strokeWidth={3} />
          </button>
        </div>

        {TASK_FORM_AI_ASSISTANT_ENABLED && formMode === 'ai' ? (
          <div
            className='flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 flex flex-col items-center text-center custom-scrollbar'
            style={{ animation: 'elegant-fade-up 0.6s ease forwards' }}>
            <h3 className='text-2xl sm:text-4xl font-black text-black dark:text-white mb-3'>
              {tMsg(
                'Describe your request',
                'Ceritakan tugas yang ingin dibuat'
              )}
            </h3>
            <p className='text-neutral-500 dark:text-neutral-400 mb-8 max-w-lg text-sm font-medium'>
              {tMsg(
                'Type your task description freely. The Smart Assistant will structure the details, deadlines, and checklists for you.',
                'Ketik deskripsi tugas Anda secara bebas. Asisten Pintar akan menyusun detail, tenggat waktu, dan daftar periksanya.'
              )}
            </p>

            <div className='w-full relative max-w-2xl tour-form-ai-input'>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSubmit(e);
                  }
                }}
                disabled={isGeneratingTask}
                className='w-full bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-black rounded-3xl p-6 text-sm font-medium outline-none resize-none shadow-inner transition-all h-40 custom-scrollbar text-black dark:text-white'
                placeholder={tMsg(
                  'e.g. Prepare social media campaign for next Friday...',
                  'Contoh: Siapkan kampanye sosial media untuk Jumat depan...'
                )}
                autoFocus
              />
              {isGeneratingTask && (
                <div className='absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center'>
                  <LoadingSpinner />
                  <span className='text-xs font-bold text-indigo-600 mt-3 uppercase tracking-widest animate-pulse'>
                    {tMsg('Drafting Task...', 'Menyusun Tugas...')}
                  </span>
                </div>
              )}
            </div>

            <div className='flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-2xl'>
              <button
                type='button'
                onClick={() => {
                  setFormMode('manual');
                  if (handleManualFormClick) handleManualFormClick();
                }}
                disabled={isGeneratingTask}
                className='flex-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold py-4 rounded-lg uppercase tracking-widest text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors shadow-sm disabled:opacity-50 tour-form-manual-btn'>
                {tMsg('Just Fill Manually', 'Isi Manual Saja')}
              </button>
              <button
                type='button'
                onClick={handleAiSubmit}
                disabled={!aiPrompt.trim() || isGeneratingTask}
                className='flex-1 bg-indigo-600 text-white font-bold py-4 rounded-lg uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'>
                <Icon name='sparkles' className='w-4 h-4 inline mr-1' />{' '}
                {tMsg('Draft with AI', 'Buat dengan AI')}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className='flex flex-col flex-1 min-h-0 animate-elegant'>
            <div className='flex-1 overflow-y-auto p-5 sm:p-8 md:px-12 md:py-8 custom-scrollbar'>
              <div className='mb-8'>
                <input
                  type='text'
                  value={formData.task_name}
                  onChange={(e) =>
                    setFormData({ ...formData, task_name: e.target.value })
                  }
                  className='w-full text-lg md:text-2xl font-bold bg-transparent border-0 border-b-2 border-neutral-200 dark:border-neutral-800 focus:border-black dark:focus:border-white focus:ring-0 px-0 py-3 text-black dark:text-white placeholder-neutral-300 dark:placeholder-neutral-700 transition-colors outline-none tour-form-project'
                  placeholder={tMsg(
                    'Enter task name...',
                    'Masukkan judul tugas...'
                  )}
                  autoFocus
                  required
                />
              </div>

              <div className='space-y-6'>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 relative z-40'>
                  <MultiUserSelect
                    label={tMsg('Project Requester', 'Project Requester')}
                    icon='user'
                    selected={requesterUsers}
                    onChange={(users) =>
                      setFormData({ ...formData, requester: users })
                    }
                    employees={allEmployees}
                    placeholder={tMsg(
                      'Select Project Requester...',
                      'Pilih Project Requester...'
                    )}
                    tMsg={tMsg}
                    teamMembers={teamMembers}
                    renderSelected={(selected, employees) => (
                      <RoleUsersTrigger
                        selected={selected}
                        employees={employees}
                        avatarsMap={avatarsMap}
                        placeholder={tMsg(
                          'Select Project Requester...',
                          'Pilih Project Requester...'
                        )}
                      />
                    )}
                  />
                  <MultiUserSelect
                    label={tMsg('Supervisor', 'Supervisor')}
                    icon='users'
                    selected={headOfProject}
                    onChange={(users) =>
                      setFormData({ ...formData, head_of_project: users })
                    }
                    employees={allEmployees}
                    placeholder={tMsg(
                      'Select Supervisor...',
                      'Select Supervisor..'
                    )}
                    tMsg={tMsg}
                    teamMembers={teamMembers}
                    renderSelected={(selected, employees) => (
                      <RoleUsersTrigger
                        selected={selected}
                        employees={employees}
                        avatarsMap={avatarsMap}
                        placeholder={tMsg(
                          'Select Supervisor...',
                          'Select Supervisor..'
                        )}
                      />
                    )}
                  />

                  <div className='group relative'>
                    <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2'>
                      <Icon name='users' className='w-4 h-4' />{' '}
                      {tMsg('R&C Team', 'Tim R&C')}
                    </label>
                    <div className='w-full bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent transition-all flex items-center h-12 sm:h-14 px-3.5'>
                      <RoleUsersTrigger
                        selected={rcTeam}
                        employees={rcEmployees.length > 0 ? rcEmployees : allEmployees}
                        avatarsMap={avatarsMap}
                        placeholder={tMsg('No R&C members', 'Tidak ada karyawan R&C')}
                      />
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 relative z-40'>
                  <div className='group'>
                    <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2'>
                      <Icon name='folder-open' className='w-4 h-4' />{' '}
                      {tMsg('Job Type', 'Tipe Pekerjaan')}
                    </label>
                    <div className='flex gap-1.5 sm:gap-2'>
                      <div className='flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center min-w-0 h-12 sm:h-14'>
                        <select
                          value={formData.category || categories[0] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className='w-full h-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950'>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          {formData.category &&
                            !categories.some(
                              (c) =>
                                c.toLowerCase() ===
                                formData.category.toLowerCase()
                            ) && (
                              <option value={formData.category}>
                                {formData.category}
                              </option>
                            )}
                        </select>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleOpenAddBoard('Category')}
                        className='bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 px-3 sm:px-4 rounded-2xl transition-colors text-sm font-bold flex items-center justify-center shrink-0 shadow-sm h-12 sm:h-14'
                        title={tMsg(
                          'Add New Job Type',
                          'Tambah Tipe Pekerjaan'
                        )}>
                        <Icon name='plus' className='w-4 h-4' />
                      </button>
                    </div>
                  </div>

                  <div className='group'>
                    <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2 min-h-4'>
                      <Icon name='zap' className='w-4 h-4' />{' '}
                      {tMsg('Priority', 'Prioritas')}
                    </label>
                    <div className='bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-12 sm:h-14'>
                      <select
                        value={formData.impact || 'Medium'}
                        onChange={(e) =>
                          setFormData({ ...formData, impact: e.target.value })
                        }
                        className='w-full h-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider [&>option]:bg-white dark:[&>option]:bg-neutral-950'>
                        <option value='High'>High</option>
                        <option value='Medium'>Medium</option>
                        <option value='Low'>Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                  <div className='group'>
                    <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2 min-h-4'>
                      <Icon name='calendar-days' className='w-4 h-4' />{' '}
                      {tMsg('Start Date', 'Tanggal Mulai')}
                    </label>
                    <div className='bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-12 sm:h-14'>
                      <input
                        type='date'
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        className='w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider h-full'
                        required
                      />
                    </div>
                  </div>
                  <div className='group tour-form-deadline'>
                    <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2 min-h-4'>
                      <Icon name='calendar' className='w-4 h-4' />{' '}
                      {tMsg('Deadline', 'Tenggat Waktu')}
                    </label>
                    <div className='bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-12 sm:h-14'>
                      <input
                        type='date'
                        value={formData.deadline}
                        onChange={(e) =>
                          setFormData({ ...formData, deadline: e.target.value })
                        }
                        className='w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider h-full'
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className='group pt-2'>
                  <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2'>
                    <Icon name='file-text' className='w-4 h-4' />{' '}
                    {tMsg('Description', 'Deskripsi')}
                  </label>
                  <div className='bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all p-2'>
                    <div className='flex gap-2 mb-2 px-2 pb-2 border-b border-neutral-200 dark:border-neutral-800'>
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            description: formData.description + '**bold text**',
                          })
                        }
                        className='text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'>
                        B
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            description: formData.description + '*italic text*',
                          })
                        }
                        className='text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 italic'>
                        I
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            description: formData.description + '__underline__',
                          })
                        }
                        className='text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 underline'>
                        U
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            description: formData.description + '\n- list item',
                          })
                        }
                        className='text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'>
                        • List
                      </button>
                      {TASK_FORM_AI_ASSISTANT_ENABLED && (
                        <button
                          type='button'
                          onClick={handleGenerateDesc}
                          disabled={isGeneratingDesc}
                          className='ml-auto text-[10px] font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md shadow-sm border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 flex items-center gap-1 transition-colors'>
                          {isGeneratingDesc ? (
                            <>
                              <Icon
                                name='clock'
                                className='w-3 h-3 inline animate-pulse'
                              />{' '}
                              ...
                            </>
                          ) : (
                            <>
                              <Icon name='sparkles' className='w-3 h-3 inline' />{' '}
                              Auto Generate
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className='w-full bg-transparent border-0 focus:ring-0 p-3.5 text-sm font-medium text-black dark:text-white min-h-24 resize-y outline-none placeholder-neutral-400 leading-relaxed'
                      placeholder={tMsg(
                        'Add details or notes...',
                        'Tambahkan detail atau catatan...'
                      )}></textarea>
                  </div>
                  <p className='text-[11px] text-neutral-400 mt-2 ml-4 font-normal italic'>
                    {tMsg(
                      'Rich text supported: **bold**, *italic*, __underline__, and new lines starting with "- " for bullets.',
                      'Dukungan teks kaya: **tebal**, *miring*, __garis bawah__, dan baris baru dengan "- " untuk poin.'
                    )}
                  </p>
                </div>

                <div className='group pt-2'>
                  <label className='text-xs font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-normal mb-2 flex items-center gap-2'>
                    <Icon name='link' className='w-4 h-4' />{' '}
                    {tMsg(
                      'External Links / Supporting Access',
                      'Tautan Eksternal / Akses Pendukung'
                    )}
                  </label>
                  <div className='flex flex-col gap-2 w-full min-w-0'>
                    {(formData.supporting_access
                      ? formData.supporting_access.split('\n')
                      : ['']
                    ).map((link, idx, arr) => (
                      <div
                        key={idx}
                        className='flex items-center gap-2 w-full min-w-0'>
                        <div className='flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center'>
                          <input
                            type='url'
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...arr];
                              newLinks[idx] = e.target.value;
                              setFormData({
                                ...formData,
                                supporting_access: newLinks.join('\n'),
                              });
                            }}
                            className='w-full bg-transparent border-0 focus:ring-0 p-3.5 text-sm font-medium text-black dark:text-white outline-none placeholder-neutral-400'
                            placeholder={tMsg(
                              'Paste URL (<https://...)>',
                              'Tempel URL (<https://...)>'
                            )}
                          />
                        </div>
                        {arr.length > 1 && (
                          <button
                            type='button'
                            onClick={() => {
                              const newLinks = arr.filter((_, i) => i !== idx);
                              setFormData({
                                ...formData,
                                supporting_access: newLinks.join('\n'),
                              });
                            }}
                            className='text-neutral-400 hover:text-red-500 font-bold p-2 transition-colors'
                            title='Remove Link'>
                            <Icon name='x' className='w-4 h-4' />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => {
                        const arr = formData.supporting_access
                          ? formData.supporting_access.split('\n')
                          : [''];
                        setFormData({
                          ...formData,
                          supporting_access: [...arr, ''].join('\n'),
                        });
                      }}
                      className='text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 self-start mt-1 flex items-center gap-1.5 uppercase tracking-widest transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg'>
                      <Icon name='plus' className='w-3.5 h-3.5' />{' '}
                      {tMsg('Add Another Link', 'Tambah Tautan Lainnya')}
                    </button>
                  </div>
                </div>
              </div>

              <div className='group pt-8 mt-8 border-t border-neutral-200 dark:border-neutral-800 tour-form-checklist'>
                <p className='text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4'>
                  {tMsg(
                    'Brief assigned to and collaborated with:',
                    'Brief ditugaskan dan dikolaborasikan dengan:'
                  )}
                </p>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                  {(formSubtasks.length > 0
                    ? formSubtasks
                    : DEFAULT_FORM_TEAM_SUBTASKS
                  ).map((st, i) => {
                    const assignees = Array.isArray(st.assignees)
                      ? st.assignees
                      : st.assignee
                        ? [st.assignee]
                        : [];
                    return (
                      <div
                        key={`team-slot-${i}`}
                        className='rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3 flex flex-col gap-2 relative group/team'>
                        <div className='flex items-center gap-2'>
                          <select
                            value={st.task_name || ''}
                            onChange={(e) => {
                              const next = [...formSubtasks];
                              if (!next[i]) {
                                next[i] = {
                                  task_name: e.target.value,
                                  assignees: [],
                                };
                              } else {
                                next[i] = {
                                  ...next[i],
                                  task_name: e.target.value,
                                };
                              }
                              setFormSubtasks(next);
                            }}
                            className='w-full bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 outline-none text-xs font-bold text-black dark:text-white px-0 py-1.5 cursor-pointer'>
                            <option value="" disabled className='dark:bg-neutral-900'>
                              {tMsg('-- Select Department --', '-- Pilih Departemen --')}
                            </option>
                            {SUBTASK_DEPARTMENT_OPTIONS.map((dept) => (
                              <option key={dept} value={dept} className='dark:bg-neutral-900'>
                                {dept}
                              </option>
                            ))}
                            {st.task_name && !SUBTASK_DEPARTMENT_OPTIONS.includes(st.task_name) && (
                              <option value={st.task_name} className='dark:bg-neutral-900'>
                                {st.task_name}
                              </option>
                            )}
                          </select>
                          <button
                            type='button'
                            onClick={() =>
                              setFormSubtasks(
                                formSubtasks.filter((_, idx) => idx !== i)
                              )
                            }
                            className='text-neutral-400 hover:text-red-500 opacity-100 sm:opacity-0 group-hover/team:opacity-100 transition-opacity shrink-0'
                            title={tMsg('Remove team', 'Hapus tim')}>
                            <Icon name='x' className='w-3.5 h-3.5' />
                          </button>
                        </div>

                        <MultiUserSelect
                          hideLabel
                          label={tMsg('Employees', 'Karyawan')}
                          icon='users'
                          selected={assignees}
                          onChange={(users) => {
                            const next = [...formSubtasks];
                            next[i] = {
                              ...next[i],
                              assignees: users,
                              assignee: undefined,
                            };
                            setFormSubtasks(next);
                          }}
                          employees={filterEmployeesByDepartment(
                            allEmployees,
                            st.task_name
                          )}
                          placeholder={tMsg(
                            'Employee Names',
                            'Nama Karyawan'
                          )}
                          tMsg={tMsg}
                          teamMembers={teamMembers}
                          renderSelected={(selected, employees) => {
                            if (!selected.length) {
                              return (
                                <span className='text-xs font-normal text-neutral-400 truncate'>
                                  {tMsg('Employee Names', 'Nama Karyawan')}
                                </span>
                              );
                            }

                            if (selected.length === 1) {
                              const emp = employees.find(
                                (e) => e.username === selected[0]
                              );
                              const fullName =
                                emp?.full_name || emp?.name || selected[0];
                              return (
                                <span className='flex items-center gap-2 min-w-0'>
                                  <Avatar
                                    name={fullName}
                                    url={avatarsMap[selected[0]]}
                                    size='w-7 h-7'
                                    textClass='text-[9px]'
                                    maxInitials={2}
                                    withRing
                                  />
                                  <span className='text-xs font-medium text-black dark:text-white truncate'>
                                    {fullName}
                                  </span>
                                </span>
                              );
                            }

                            return (
                              <span className='flex items-center'>
                                {selected.slice(0, 4).map((username, idx) => {
                                  const emp = employees.find(
                                    (e) => e.username === username
                                  );
                                  const fullName =
                                    emp?.full_name || emp?.name || username;
                                  return (
                                    <span
                                      key={username}
                                      className={idx === 0 ? '' : '-ml-2'}
                                      style={{ zIndex: 10 - idx }}>
                                      <Avatar
                                        name={fullName}
                                        url={avatarsMap[username]}
                                        size='w-7 h-7'
                                        textClass='text-[9px]'
                                        maxInitials={2}
                                        withRing
                                      />
                                    </span>
                                  );
                                })}
                                {selected.length > 4 && (
                                  <span className='-ml-2 w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-[9px] font-bold text-black dark:text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-950'>
                                    +{selected.length - 4}
                                  </span>
                                )}
                              </span>
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <button
                  type='button'
                  onClick={() =>
                    setFormSubtasks([
                      ...formSubtasks,
                      {
                        task_name: tMsg('New Team', 'Tim Baru'),
                        assignees: [],
                      },
                    ])
                  }
                  className='mt-3 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline'>
                  + {tMsg('Add Team', 'Tambah Tim')}
                </button>
              </div>
            </div>
            <div className='p-5 sm:p-8 md:px-12 md:py-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 z-10'>
              <button
                type='button'
                onClick={handleCancel}
                className='w-full sm:w-auto px-8 py-4 rounded-lg font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs'>
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-10 py-4 rounded-lg font-bold text-white transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-black dark:border-white ${
                  isSubmitting
                    ? 'bg-neutral-600 dark:bg-neutral-400 dark:text-neutral-900 border-neutral-600 dark:border-neutral-400'
                    : 'bg-black dark:bg-white dark:text-black hover:opacity-80 hover:-translate-y-0.5 tour-form-submit'
                }`}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner /> {tMsg('Creating...', 'Membuat...')}
                  </>
                ) : (
                  tMsg('Create Task', 'Buat Tugas')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
