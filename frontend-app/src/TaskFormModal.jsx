import React, { useState } from 'react';
import axios from 'axios';
import { IconPlus } from './SharedUI';
import { useCloseAnimation, LoadingSpinner } from './Utils';

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
}) {
  const [isClosing, close] = useCloseAnimation(() => setIsFormOpen(false));
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [formMode, setFormMode] = useState('ai'); // 'ai' atau 'manual'
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const handleGenerateDesc = async () => {
    if (!formData.project_name) {
      alert(
        language === 'id' ? 'Silakan masukkan nama/judul tugas terlebih dahulu.' : 'Please enter a task name first.'
      );
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const baseDesc = formData.description ? `\n\nUser's initial brief/draft:\n${formData.description}` : '';
      const prompt = `Write a professional, structured task description (brief) in markdown format. The task title is "${formData.project_name}", category is "${formData.category}". Please respond in the same language as the task title.${baseDesc}`;
      const res = await axios.post('/api/ai/generate', { prompt });
      setFormData({ ...formData, description: res.data.text });
    } catch (err) {
      alert(language === 'id' ? 'Gagal membuat deskripsi dengan AI.' : 'Failed to generate description with AI.');
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
2. "project_name" MUST ALWAYS be in English. "description" MUST be in the SAME LANGUAGE the user used (e.g., if the prompt is in Indonesian, write the description and notes in Indonesian).
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
  "project_name": "[Brand/Context] Short, clear task title",
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
      const res = await axios.post('/api/ai/generate', { prompt: promptStr, provider: 'auto' });
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
        project_name: parsed.project_name || '',
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

      if (parsed.subtasks && Array.isArray(parsed.subtasks) && setFormSubtasks) {
        setFormSubtasks(parsed.subtasks.map((name) => ({ task_name: name, assignee: null })));
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
    if (!formData.project_name) {
      alert(language === 'id' ? 'Silakan masukkan judul tugas terlebih dahulu.' : 'Please enter a task name first.');
      return;
    }
    setIsEstimatingEtc(true);
    try {
      const prompt = `Estimate the time consumption in hours to complete this task based on its title and description. Task Title: "${
        formData.project_name
      }". Description: "${
        formData.description || ''
      }". Return ONLY a number (e.g. 2.5, 4, 10). Do not include any other text.`;
      const res = await axios.post('/api/ai/generate', { prompt, provider: 'auto' });
      const match = res.data.text.match(/[\d.]+/);
      const val = match ? parseFloat(match[0]) : NaN;
      if (!isNaN(val)) {
        setFormData({ ...formData, etc: val });
      }
    } catch (err) {
      console.error(err);
      alert(language === 'id' ? 'Gagal mengestimasi ETC.' : 'Failed to estimate ETC.');
    } finally {
      setIsEstimatingEtc(false);
    }
  };

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
      2,
      '0'
    )}`;
  };

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      project_name: '',
      requester: '',
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
    setFormSubtasks([]);
    setFormSubtaskInput('');
    setFormSubtaskAssignee('');
    close();
  };

  const globalMentionOptions = selectedBoard?.is_private
    ? [currentUser]
    : userDirectory && userDirectory.length > 0
    ? userDirectory
        .filter((u) => u.is_connected)
        .map((u) => u.username)
        .filter((u) => u !== 'admin')
    : teamMembers;

  return (
    <div
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-white dark:bg-neutral-950 shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden ${
          isClosing ? 'mac-exit' : 'mac-animate'
        }`}
      >
        <div className="flex justify-between items-center p-5 sm:p-8 md:px-12 md:py-8 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl z-20">
          <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white uppercase tracking-tight flex items-center gap-2 sm:gap-3">
            {formMode === 'ai' ? '✨' : <IconPlus className="w-6 h-6 sm:w-8 sm:h-8" />}
            {formMode === 'ai' ? tMsg('Smart Assistant', 'Asisten Pintar') : tMsg('Add Task', 'Tugas Baru')}
          </h2>
          <button
            onClick={handleCancel}
            className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {formMode === 'ai' ? (
          <div
            className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 flex flex-col items-center text-center custom-scrollbar"
            style={{ animation: 'elegant-fade-up 0.6s ease forwards' }}
          >
            <h3 className="text-2xl sm:text-4xl font-black text-black dark:text-white mb-3 tracking-tight">
              {tMsg('Describe your request', 'Ceritakan tugas yang ingin dibuat')}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-lg text-sm font-medium">
              {tMsg(
                'Type your task description freely. The Smart Assistant will structure the details, deadlines, and checklists for you.',
                'Ketik deskripsi tugas Anda secara bebas. Asisten Pintar akan menyusun detail, tenggat waktu, dan daftar periksanya.'
              )}
            </p>

            <div className="w-full relative max-w-2xl tour-form-ai-input">
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
                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-black rounded-3xl p-6 text-sm font-medium outline-none resize-none shadow-inner transition-all h-40 custom-scrollbar text-black dark:text-white"
                placeholder={tMsg(
                  'e.g. Prepare social media campaign for next Friday...',
                  'Contoh: Siapkan kampanye sosial media untuk Jumat depan...'
                )}
                autoFocus
              />
              {isGeneratingTask && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
                  <LoadingSpinner />
                  <span className="text-xs font-bold text-indigo-600 mt-3 uppercase tracking-widest animate-pulse">
                    {tMsg('Drafting Task...', 'Menyusun Tugas...')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-2xl">
              <button
                type="button"
                onClick={() => {
                  setFormMode('manual');
                  if (handleManualFormClick) handleManualFormClick();
                }}
                disabled={isGeneratingTask}
                className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold py-4 rounded-full uppercase tracking-widest text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors shadow-sm disabled:opacity-50 tour-form-manual-btn"
              >
                {tMsg('Just Fill Manually', 'Isi Manual Saja')}
              </button>
              <button
                type="button"
                onClick={handleAiSubmit}
                disabled={!aiPrompt.trim() || isGeneratingTask}
                className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-full uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✨ {tMsg('Draft with AI', 'Buat dengan AI')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 animate-elegant">
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:px-12 md:py-8 custom-scrollbar">
              <div className="mb-8">
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full text-lg font-extrabold bg-transparent border-0 border-b-2 border-neutral-200 dark:border-neutral-800 focus:border-black dark:focus:border-white focus:ring-0 px-0 py-3 text-black dark:text-white placeholder-neutral-300 dark:placeholder-neutral-700 transition-colors outline-none tour-form-project"
                  placeholder={tMsg('Enter task name...', 'Masukkan judul tugas...')}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6 mb-6 relative z-50">
                  <div className="sm:col-span-2 group tour-form-requester relative z-50">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="text-base">👤</span> {tMsg('Assignee / Requester', 'Pekerja / Peminta')}
                    </label>
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center relative h-[46px] sm:h-[50px]">
                      <input
                        type="text"
                        value={formData.requester}
                        onChange={(e) => handleRequesterChange(e.target.value, setFormData, formData)}
                        onKeyDown={(e) => {
                          if (isMentioning) {
                            const filtered = globalMentionOptions.filter((m) => m.toLowerCase().includes(mentionQuery));
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setMentionIndex((prev) => (prev + 1) % (filtered.length || 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setMentionIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
                            } else if (e.key === 'Enter' || e.key === 'Tab') {
                              if (filtered.length > 0) {
                                e.preventDefault();
                                insertMention(filtered[mentionIndex] || filtered[0], setFormData, formData);
                              } else {
                                setIsMentioning(false);
                              }
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setIsMentioning(false);
                            }
                          }
                        }}
                        className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white outline-none placeholder-neutral-400 placeholder:text-[9px] sm:placeholder:text-[10px] h-full"
                        placeholder={tMsg(
                          'Requester name (or type @ to assign someone)',
                          'Nama peminta (atau ketik @ untuk menugaskan)'
                        )}
                        required
                        autoComplete="off"
                      />

                      {isMentioning && (
                        <div className="absolute left-0 top-full mt-2 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2 mac-animate">
                          {globalMentionOptions.filter((m) => m.toLowerCase().includes(mentionQuery)).length > 0 ? (
                            globalMentionOptions
                              .filter((m) => m.toLowerCase().includes(mentionQuery))
                              .map((m, idx) => (
                                <div
                                  key={m}
                                  className={`px-4 py-3 cursor-pointer text-xs text-black dark:text-white font-bold border-b border-neutral-200 dark:border-neutral-800 last:border-0 flex items-center gap-2 ${
                                    mentionIndex === idx
                                      ? 'bg-neutral-200 dark:bg-neutral-800'
                                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                  }`}
                                  onClick={() => insertMention(m, setFormData, formData)}
                                >
                                  <span>@{m}</span>
                                  {!teamMembers.includes(m) && (
                                    <span className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ml-auto">
                                      + Auto-Invite
                                    </span>
                                  )}
                                </div>
                              ))
                          ) : (
                            <div className="px-4 py-3 text-xs text-neutral-400 uppercase tracking-widest font-bold">
                              {tMsg('NO MEMBERS FOUND', 'TIDAK ADA ANGGOTA DITEMUKAN')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 group">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="text-base">📂</span> {tMsg('Category', 'Kategori')}
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center min-w-0 h-[46px] sm:h-[50px]">
                        <select
                          value={formData.category || categories[0] || ''}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full h-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          {formData.category &&
                            !categories.some((c) => c.toLowerCase() === formData.category.toLowerCase()) && (
                              <option value={formData.category}>{formData.category} ✨</option>
                            )}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddBoard('Category')}
                        className="bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 px-3 sm:px-4 rounded-2xl transition-colors text-sm font-bold flex items-center justify-center shrink-0 shadow-sm h-[46px] sm:h-[50px]"
                        title={tMsg('Add New Category', 'Tambah Kategori Baru')}
                      >
                        ➕
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-1 group">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2 min-h-[16px]">
                      <span className="text-base">💥</span> {tMsg('Impact', 'Dampak')}
                    </label>
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-[46px] sm:h-[50px]">
                      <select
                        value={formData.impact || 'Medium'}
                        onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                        className="w-full h-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider [&>option]:bg-white dark:[&>option]:bg-neutral-950"
                      >
                        <option value="High">🔥 High</option>
                        <option value="Medium">⚡ Medium</option>
                        <option value="Low">🧊 Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2 min-h-[16px]">
                      <span className="text-base">🗓️</span> {tMsg('Start Date', 'Tanggal Mulai')}
                    </label>
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-[46px] sm:h-[50px]">
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider h-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="group tour-form-deadline">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2 min-h-[16px]">
                      <span className="text-base">📅</span> {tMsg('Deadline', 'Tenggat Waktu')}
                    </label>
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-[46px] sm:h-[50px]">
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider h-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2 min-h-[16px]">
                      <span className="text-base">🔁</span> {tMsg('Recurring', 'Berulang')}
                    </label>
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center h-[46px] sm:h-[50px]">
                      <select
                        value={formData.recurring || 'none'}
                        onChange={(e) => setFormData({ ...formData, recurring: e.target.value })}
                        className="w-full h-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider [&>option]:bg-white dark:[&>option]:bg-neutral-950"
                      >
                        <option value="none">{tMsg('None', 'Tidak')}</option>
                        <option value="daily">{tMsg('Daily', 'Harian')}</option>
                        <option value="weekly">{tMsg('Weekly', 'Mingguan')}</option>
                        <option value="monthly">{tMsg('Monthly', 'Bulanan')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2 min-h-[16px]">
                      <span className="text-base">⏳</span> {tMsg('ETC (Hrs)', 'ETC (Jam)')}
                    </label>
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center p-1.5 h-[46px] sm:h-[50px]">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, etc: Math.max(0, (parseFloat(formData.etc) || 0) - 0.5) })
                        }
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl font-bold transition-colors shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.etc}
                        onChange={(e) => setFormData({ ...formData, etc: e.target.value })}
                        className="w-full min-w-0 text-center bg-transparent border-0 focus:ring-0 p-0 text-xs font-bold text-black dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, etc: (parseFloat(formData.etc) || 0) + 0.5 })}
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl font-bold transition-colors shrink-0"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={handleEstimateEtc}
                        disabled={isEstimatingEtc}
                        className="w-7 h-7 ml-1 flex items-center justify-center text-indigo-500 hover:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl font-bold transition-colors shrink-0 disabled:opacity-50"
                        title="AI Estimate"
                      >
                        {isEstimatingEtc ? '⏳' : '✨'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="group pt-2">
                  <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-base">📝</span> {tMsg('Description', 'Deskripsi')}
                  </label>
                  <div className="bg-neutral-100 dark:bg-neutral-900 rounded-3xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all p-2">
                    <div className="flex gap-2 mb-2 px-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, description: formData.description + '**bold text**' })
                        }
                        className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, description: formData.description + '*italic text*' })
                        }
                        className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, description: formData.description + '__underline__' })
                        }
                        className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 underline"
                      >
                        U
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, description: formData.description + '\n- list item' })
                        }
                        className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateDesc}
                        disabled={isGeneratingDesc}
                        className="ml-auto text-[10px] font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md shadow-sm border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 flex items-center gap-1 transition-colors"
                      >
                        {isGeneratingDesc ? '⏳...' : '✨ Auto Generate'}
                      </button>
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-sm font-medium text-black dark:text-white min-h-[100px] resize-y outline-none placeholder-neutral-400 leading-relaxed"
                      placeholder={tMsg('Add details or notes...', 'Tambahkan detail atau catatan...')}
                    ></textarea>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 ml-4 font-medium italic">
                    {tMsg(
                      'Rich text supported: **bold**, *italic*, __underline__, and new lines starting with "- " for bullets.',
                      'Dukungan teks kaya: **tebal**, *miring*, __garis bawah__, dan baris baru dengan "- " untuk poin.'
                    )}
                  </p>
                </div>

                <div className="group pt-2">
                  <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-base">🔗</span>{' '}
                    {tMsg('External Links / Supporting Access', 'Tautan Eksternal / Akses Pendukung')}
                  </label>
                  <div className="flex flex-col gap-2 w-full min-w-0">
                    {(formData.supporting_access ? formData.supporting_access.split('\n') : ['']).map(
                      (link, idx, arr) => (
                        <div key={idx} className="flex items-center gap-2 w-full min-w-0">
                          <div className="flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center">
                            <input
                              type="url"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...arr];
                                newLinks[idx] = e.target.value;
                                setFormData({ ...formData, supporting_access: newLinks.join('\n') });
                              }}
                              className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-sm font-medium text-black dark:text-white outline-none placeholder-neutral-400"
                              placeholder={tMsg('Paste URL (<https://...)>', 'Tempel URL (<https://...)>')}
                            />
                          </div>
                          {arr.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = arr.filter((_, i) => i !== idx);
                                setFormData({ ...formData, supporting_access: newLinks.join('\n') });
                              }}
                              className="text-neutral-400 hover:text-red-500 font-bold p-2 transition-colors"
                              title="Remove Link"
                            >
                              ✖
                            </button>
                          )}
                        </div>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const arr = formData.supporting_access ? formData.supporting_access.split('\n') : [''];
                        setFormData({ ...formData, supporting_access: [...arr, ''].join('\n') });
                      }}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 self-start mt-1 flex items-center gap-1.5 uppercase tracking-widest transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                    >
                      <span>➕</span> {tMsg('Add Another Link', 'Tambah Tautan Lainnya')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="group pt-8 mt-8 border-t border-neutral-200 dark:border-neutral-800 tour-form-checklist">
                <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-base">📋</span> {tMsg('Sub-task Checklist', 'Daftar Periksa Sub-tugas')}
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="text"
                    value={formSubtaskInput}
                    onChange={(e) => setFormSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFormSubtask(e);
                      }
                    }}
                    className="flex-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-transparent p-3.5 text-sm font-medium text-black dark:text-white outline-none placeholder-neutral-400 focus:bg-white dark:focus:bg-black focus:border-neutral-300 dark:focus:border-neutral-700 transition-all"
                    placeholder={tMsg('Add checklist item...', 'Tambah item daftar periksa...')}
                  />
                  <select
                    value={formSubtaskAssignee}
                    onChange={(e) => setFormSubtaskAssignee(e.target.value)}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-transparent p-3.5 text-sm font-medium text-black dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-neutral-300 dark:focus:border-neutral-700 transition-all normal-case tracking-normal [&>option]:bg-white dark:[&>option]:bg-neutral-950 [&>option]:text-black dark:[&>option]:text-white"
                  >
                    <option value="">{tMsg('Unassigned', 'Belum Ditugaskan')}</option>
                    {teamMembers.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddFormSubtask}
                    className="bg-black dark:bg-white text-white dark:text-black hover:opacity-80 px-6 py-3.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest shadow-md hover:-translate-y-0.5"
                  >
                    {tMsg('ADD', 'TAMBAH')}
                  </button>
                </div>

                {formSubtasks.length > 0 && (
                  <div className="space-y-3 mt-4 max-h-40 overflow-y-auto pr-2">
                    {formSubtasks.map((st, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 px-5 py-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 group/item transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 break-words">
                          <span className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-black shrink-0"></span>
                          <span className="text-sm font-medium text-black dark:text-white">{st.task_name}</span>
                          {st.assignee && (
                            <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                              @{st.assignee}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormSubtask(i)}
                          className="text-neutral-400 hover:text-red-500 font-bold opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-opacity px-2 md:px-0"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 sm:p-8 md:px-12 md:py-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 z-10">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-10 py-4 rounded-full font-bold text-white transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-black dark:border-white ${
                  isSubmitting
                    ? 'bg-neutral-600 dark:bg-neutral-400 dark:text-neutral-900 border-neutral-600 dark:border-neutral-400'
                    : 'bg-black dark:bg-white dark:text-black hover:opacity-80 hover:-translate-y-0.5 tour-form-submit'
                }`}
              >
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
