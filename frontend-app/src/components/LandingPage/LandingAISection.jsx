import React, { useState, useEffect } from 'react';

export default function LandingAISection({ showAuthForm }) {
  const [simStep, setSimStep] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (!showAuthForm) {
      const timer = setInterval(() => {
        setSimStep((prev) => (prev + 1) % 5);
      }, 6500);
      return () => clearInterval(timer);
    }
  }, [showAuthForm]);

  const fullText =
    'Extract tasks: 1. Redesign homepage by next Friday (@johndoe). 2. Fix login API bug (@jane). 3. Update documentation.';
  useEffect(() => {
    if (simStep === 0) {
      let i = 0;
      setTypedText('');
      const timer = setInterval(() => {
        i++;
        setTypedText(fullText.slice(0, i));
        if (i > fullText.length) clearInterval(timer);
      }, 40);
      return () => clearInterval(timer);
    } else {
      setTypedText(fullText);
    }
  }, [simStep]);
  return (
    <>
        {/* AI Integration Hero Section */}
        <section
          id="ai-section"
          className="py-24 md:py-32 bg-white dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800 relative z-10"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="reveal-on-scroll">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-6 border border-indigo-100 dark:border-indigo-800/50">
                  <span className="text-base leading-none">✨</span>
                  Powered by Dual AI Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[1.1] uppercase">
                  Work smarter, not harder with <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-black dark:from-slate-300 dark:to-white">
                    AI Assistance.
                  </span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                  Experience seamless productivity with our context-aware Smart Assistant. Driven by the cutting-edge
                  intelligence of Google Gemini and GPT-OSS 120B, the AI handles the busywork so your team can focus on
                  what matters.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-2xl shadow-sm">
                      🤖
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight mb-1">
                        Proactive Task Drafting
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Simply type a rough idea, and the AI instantly generates structured briefs, sub-tasks, and
                        estimates the time required.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50 text-2xl shadow-sm">
                      📝
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight mb-1">
                        Live Meeting Extraction
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Use the live notepad during meetings. The AI will capture action items, assign them correctly,
                        and bulk-create tasks automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50 text-2xl shadow-sm">
                      🧠
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight mb-1">
                        Context-Aware Co-Pilot
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Tag the AI Assistant inside any task thread. It instantly reads your project descriptions,
                        checklists, and comment history to provide highly accurate answers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative reveal-on-scroll" style={{ animationDelay: '200ms' }}>
                <div className="relative w-full aspect-square lg:aspect-auto lg:h-[650px] bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-slate-800/30 dark:to-slate-900/30 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden flex items-center justify-center p-6 lg:p-10">
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
                  <div className="w-full h-full relative flex items-center justify-center z-10">
                    <div className="absolute w-64 h-64 bg-slate-300/40 dark:bg-slate-600/20 rounded-full blur-3xl animate-pulse"></div>
                    <div
                      className="absolute w-48 h-48 bg-neutral-300/40 dark:bg-neutral-600/20 rounded-full blur-3xl animate-pulse"
                      style={{ animationDelay: '1s' }}
                    ></div>
                    <div className="relative w-full max-w-sm bg-white/90 dark:bg-[#0e1116]/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl rounded-3xl p-5 space-y-5 transform-gpu hover:scale-105 transition-transform duration-500">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
                          ✨
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-none">
                            Smart Assistant
                          </h4>
                          <span className="text-[10px] text-indigo-500 font-medium">Online</span>
                        </div>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-sm text-xs font-medium text-slate-600 dark:text-slate-300 w-3/4 leading-relaxed">
                          Can you process my meeting notes and create the tasks?
                        </div>
                      </div>
                      <div className="flex gap-3 items-end flex-row-reverse">
                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] shadow-md flex-shrink-0">
                          ✨
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-2xl rounded-br-sm text-xs text-indigo-900 dark:text-indigo-200 w-[85%]">
                          <div className="font-bold mb-3 flex items-center gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">🤖</span> Found 2 action items:
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" readOnly checked className="rounded text-indigo-600" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                Design new landing page
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" readOnly checked className="rounded text-indigo-600" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">Review copy draft</span>
                            </div>
                          </div>
                          <button className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-3 py-2 rounded-xl text-[11px] font-bold shadow-sm flex items-center justify-center gap-1">
                            ⚡ Create All Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Scroll Down to How It Works */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-30">
            <button
              onClick={() => document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all animate-bounce"
              title="Next Section"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
            </button>
          </div>
        </section>

        {/* See how it works Section */}
        <section
          id="how-it-works-section"
          className="pt-16 pb-24 md:pt-20 md:pb-32 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800 relative z-10 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 reveal-on-scroll">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">
                See how it works
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                From a simple thought to an organized workflow in seconds. Experience the magic of AI-driven project
                management.
              </p>
            </div>

            <div
              className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center reveal-on-scroll"
              style={{ animationDelay: '100ms' }}
            >
              {/* Left Side: Steps */}
              <div className="flex flex-col gap-3 lg:gap-4">
                {[
                  {
                    id: 0,
                    title: '1. Tell the AI what you need',
                    desc: 'Just type your request naturally. No need to fill out complex forms or select multiple dropdowns.',
                    icon: '💬',
                  },
                  {
                    id: 1,
                    title: '2. AI extracts the details',
                    desc: 'The Smart Assistant instantly pulls out the task title, assignees, deadlines, and generates a structured checklist.',
                    icon: '🧠',
                  },
                  {
                    id: 2,
                    title: '3. Task appears on your board',
                    desc: 'Boom! Your task is perfectly categorized, prioritized, and placed on your Kanban board ready for action.',
                    icon: '🚀',
                  },
                  {
                    id: 3,
                    title: '4. Collaborate Instantly',
                    desc: 'Team members get notified. Start discussions, share files, and track progress in one place without switching apps.',
                    icon: '💬',
                  },
                  {
                    id: 4,
                    title: '5. Automated Insights',
                    desc: 'Generate executive summaries and workload analytics instantly with the click of a button.',
                    icon: '📊',
                  },
                ].map((step) => (
                  <div
                    key={step.id}
                    onClick={() => !showAuthForm && setSimStep(step.id)}
                    className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                      simStep === step.id
                        ? 'bg-white dark:bg-[#0e1116] border-slate-900 dark:border-slate-100 shadow-xl scale-[1.02]'
                        : 'bg-transparent border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <h3
                      className={`text-base sm:text-lg font-bold mb-1.5 flex items-center gap-3 ${
                        simStep === step.id ? 'text-black dark:text-white' : 'text-slate-500 dark:text-slate-300'
                      }`}
                    >
                      <span>{step.icon}</span> {step.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed font-medium ${
                        simStep === step.id
                          ? 'text-slate-600 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Side: Interactive Simulation */}
              <div className="relative h-[350px] sm:h-[450px] w-full rounded-[2rem] bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden group flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/20 dark:to-slate-900/20"></div>

                {/* Step 0: Typing */}
                <div
                  className={`absolute inset-0 p-8 flex flex-col justify-center transition-all duration-700 ${
                    simStep === 0 ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-8 z-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-full text-lg">
                        ✨
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm">Smart Assistant</div>
                        <div className="text-[10px] text-indigo-500">Ready to help</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {typedText}
                      <span className="inline-block w-[2px] h-4 bg-indigo-500 animate-pulse ml-1 align-middle"></span>
                    </div>
                  </div>
                </div>

                {/* Step 1: AI Processing */}
                <div
                  className={`absolute inset-0 p-8 flex flex-col justify-center transition-all duration-700 ${
                    simStep === 1 ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-8 z-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 shadow-xl ring-4 ring-indigo-500/10 flex flex-col h-full max-h-full">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full inline-block"></span>
                        Extracting 3 tasks...
                      </div>
                    </div>
                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 pb-1">
                      {/* Task 1 */}
                      <div
                        className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 animate-fade-up"
                        style={{ animationDelay: '300ms' }}
                      >
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                          1. Redesign Homepage
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2 py-0.5 rounded">
                            @johndoe
                          </span>
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded">
                            Next Friday
                          </span>
                        </div>
                      </div>
                      {/* Task 2 */}
                      <div
                        className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 animate-fade-up"
                        style={{ animationDelay: '900ms' }}
                      >
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                          2. Fix login API bug
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2 py-0.5 rounded">
                            @jane
                          </span>
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded">
                            High Prio
                          </span>
                        </div>
                      </div>
                      {/* Task 3 */}
                      <div
                        className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 animate-fade-up"
                        style={{ animationDelay: '1500ms' }}
                      >
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                          3. Update docs
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                            Unassigned
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Kanban Board */}
                <div
                  className={`absolute inset-0 p-6 flex flex-col justify-center transition-all duration-700 ${
                    simStep === 2 ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-8 z-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 h-full border border-slate-200 dark:border-slate-800 flex gap-4 overflow-hidden">
                    <div className="flex-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar relative">
                      <div className="text-xs font-bold text-slate-500 sticky top-0 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shadow-sm z-10 w-max">
                        To Do (3)
                      </div>

                      <div
                        className="bg-white dark:bg-neutral-950 border border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] rounded-lg p-3 transform scale-[1.02] transition-all animate-fade-up shrink-0"
                        style={{ animationDelay: '200ms' }}
                      >
                        <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded w-max mb-2">
                          Design
                        </div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white mb-2">Redesign Homepage</div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="font-medium">@johndoe</span>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                            Queue #1 of 3
                          </span>
                        </div>
                      </div>

                      <div
                        className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 animate-fade-up shrink-0"
                        style={{ animationDelay: '600ms' }}
                      >
                        <div className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-900/40 px-2 py-0.5 rounded w-max mb-1.5">
                          Bug
                        </div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white mb-1.5">Fix login API bug</div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="font-medium">@jane</span>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                            Queue #2 of 3
                          </span>
                        </div>
                      </div>

                      <div
                        className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 animate-fade-up shrink-0"
                        style={{ animationDelay: '1000ms' }}
                      >
                        <div className="text-[9px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-max mb-1.5">
                          Docs
                        </div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white mb-1.5">
                          Update documentation
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="font-medium">Unassigned</span>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                            Queue #3 of 3
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col gap-3 opacity-50 hidden sm:flex">
                      <div className="text-xs font-bold text-slate-500">In Progress</div>
                      <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Collaboration */}
                <div
                  className={`absolute inset-0 p-4 sm:p-6 flex flex-col justify-center transition-all duration-700 ${
                    simStep === 3 ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-8 z-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden relative shadow-lg">
                    <div className="bg-white dark:bg-neutral-950 border-b border-slate-200 dark:border-slate-800 p-3 shrink-0 flex items-center gap-3">
                      <span className="text-xl">💬</span>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                          Fix login API bug
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Task Chat</div>
                      </div>
                    </div>
                    <div className="flex-1 p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar">
                      <div className="flex gap-2 animate-fade-up" style={{ animationDelay: '300ms' }}>
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          JD
                        </div>
                        <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl rounded-tl-sm border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-sm max-w-[85%]">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">@johndoe</span>I
                          think the bug is in the auth middleware. Can you check, @jane?
                        </div>
                      </div>
                      <div className="flex gap-2 flex-row-reverse animate-fade-up" style={{ animationDelay: '1200ms' }}>
                        <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          JN
                        </div>
                        <div className="bg-indigo-600 text-white p-2.5 rounded-xl rounded-tr-sm shadow-sm text-xs max-w-[85%]">
                          Good catch! I've patched the middleware and deployed the fix.
                        </div>
                      </div>
                      <div className="flex gap-2 animate-fade-up" style={{ animationDelay: '2000ms' }}>
                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] shadow-md shrink-0">
                          ✨
                        </div>
                        <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl rounded-tl-sm border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-sm border-l-2 border-l-indigo-500 max-w-[85%]">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                            Smart Assistant
                          </span>
                          Awesome work! I've automatically marked this task as{' '}
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1 rounded font-bold">
                            Done
                          </span>
                          .
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Analytics */}
                <div
                  className={`absolute inset-0 p-4 sm:p-8 flex flex-col justify-center transition-all duration-700 ${
                    simStep === 4 ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-8 z-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-xl text-lg">
                        📊
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm">Project Health</div>
                        <div className="text-[10px] text-slate-500">Live Analytics</div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-6">
                      <div className="flex items-center justify-center gap-6">
                        <div
                          className="relative w-24 h-24 shrink-0 animate-fade-up"
                          style={{ animationDelay: '300ms' }}
                        >
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-100 dark:text-slate-800"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-emerald-500"
                              strokeDasharray="85, 100"
                              strokeWidth="3"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-xl font-black text-slate-800 dark:text-white">85%</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div
                            className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full w-full animate-fade-up"
                            style={{ animationDelay: '500ms' }}
                          >
                            <div className="h-full bg-blue-500 rounded-full w-[60%]"></div>
                          </div>
                          <div
                            className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full w-full animate-fade-up"
                            style={{ animationDelay: '700ms' }}
                          >
                            <div className="h-full bg-amber-500 rounded-full w-[30%]"></div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-xl animate-fade-up"
                        style={{ animationDelay: '1000ms' }}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                          <span className="animate-pulse">✨</span> AI Executive Summary
                        </span>
                        <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
                          The team's velocity is strong. 85% of tasks are completed on time. No critical bottlenecks
                          detected in the current sprint.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Scroll Down to Features */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-30">
            <button
              onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all animate-bounce"
              title="Next Section"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
            </button>
          </div>
        </section>


    </>
  );
}
