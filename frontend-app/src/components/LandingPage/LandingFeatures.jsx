import React, { useState, useEffect } from 'react';

export default function LandingFeatures({ showAuthForm }) {
  const [activeFeatureTab, setActiveFeatureTab] = useState('kanban');

  useEffect(() => {
    if (!showAuthForm) {
      const featureIds = ['kanban', 'list', 'timeline', 'calendar', 'analytics'];
      const timer = setInterval(() => {
        setActiveFeatureTab((prev) => {
          const idx = featureIds.indexOf(prev);
          return featureIds[(idx + 1) % featureIds.length];
        });
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [showAuthForm]);


  const features = [
    {
      id: 'kanban',
      title: 'Kanban Board',
      icon: '📋',
      desc: 'Drag-and-drop cards across customizable columns. Perfect for agile workflows and visualizing daily progress.',
    },
    {
      id: 'list',
      title: 'Table List',
      icon: '🗂️',
      desc: 'A compact, spreadsheet-like view for managing tasks. Ideal for bulk actions and quick data entry.',
    },
    {
      id: 'timeline',
      title: 'Gantt Timeline',
      icon: '🛤️',
      desc: 'Map out complex project schedules. Drag task edges to adjust durations and balance team workloads visually.',
    },
    {
      id: 'calendar',
      title: 'Smart Calendar',
      icon: '📅',
      desc: 'Track deadlines effortlessly. Automatically skips weekends and national holidays for accurate planning.',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: '📊',
      desc: 'Real-time project health scores, ETC workload distribution, and AI-generated executive summaries.',
    },
  ];



  const renderFeatureMockup = () => {
    switch (activeFeatureTab) {
      case 'kanban':
        return (
          <div className="flex gap-3 h-full p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
            {['Pending', 'In Progress', 'Done'].map((title, i) => (
              <div
                key={title}
                className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
              >
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">{title}</div>
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 shadow-sm h-12 sm:h-16"></div>
                {i !== 2 && (
                  <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 shadow-sm h-16 sm:h-20"></div>
                )}
                {i === 0 && (
                  <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 shadow-sm h-12 sm:h-14"></div>
                )}
              </div>
            ))}
          </div>
        );
      case 'list':
        return (
          <div className="flex flex-col h-full p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 px-2">
              <div className="w-1/4">TASK NAME</div>
              <div className="w-1/4">ASSIGNEE</div>
              <div className="w-1/4">STATUS</div>
              <div className="w-1/4">DEADLINE</div>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 shadow-sm"
              >
                <div className="w-1/4 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-1/4 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-1/4 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-1/4 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        );
      case 'timeline':
        return (
          <div className="flex flex-col h-full p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 gap-1">
            <div className="flex gap-2 mb-4">
              <div className="w-1/4"></div>
              <div className="flex-1 flex justify-between px-2 text-[8px] font-bold text-slate-400">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
              </div>
            </div>
            {['Design', 'Frontend', 'Backend', 'Testing'].map((role, i) => (
              <div key={role} className="flex gap-2 items-center mb-3">
                <div className="w-1/4 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">{role}</div>
                <div className="flex-1 relative h-6 sm:h-8 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div
                    className={`absolute top-1 bottom-1 rounded-md shadow-sm ${
                      i === 0
                        ? 'left-[10%] w-[30%] bg-indigo-500'
                        : i === 1
                        ? 'left-[30%] w-[40%] bg-emerald-500'
                        : i === 2
                        ? 'left-[40%] w-[35%] bg-amber-500'
                        : 'left-[70%] w-[25%] bg-blue-500'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'calendar':
        return (
          <div className="h-full p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-slate-400">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-md sm:rounded-lg border ${
                    [12, 13, 18, 22].includes(i)
                      ? 'bg-indigo-100 border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800/50'
                      : [5, 6, 19, 20].includes(i)
                      ? 'bg-slate-200/50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                      : 'bg-white border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/50'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex gap-4 sm:gap-6 h-full p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 items-center justify-center">
            <div className="w-1/3 aspect-square rounded-full border-[8px] sm:border-[12px] border-indigo-100 dark:border-indigo-900/40 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[12px] border-indigo-500 border-r-transparent border-b-transparent rotate-45"></div>
              <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">76%</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 sm:gap-4">
              {[
                { label: 'Completed', color: 'bg-emerald-500', width: 'w-[76%]' },
                { label: 'In Progress', color: 'bg-blue-500', width: 'w-[15%]' },
                { label: 'Pending', color: 'bg-amber-500', width: 'w-[9%]' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 mb-1">{stat.label}</div>
                  <div className="h-1.5 sm:h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color} ${stat.width}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };



  return (
    <>
        {/* Feature Highlight Section */}
        <section
          id="features-section"
          className="py-24 md:py-32 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800 relative z-10"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16 reveal-on-scroll">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">
                Built for every workflow
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                Switch seamlessly between multiple views to manage your work exactly how you want. No reloads required.
              </p>
            </div>

            <div
              className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center reveal-on-scroll"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex flex-col gap-4">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeatureTab(feature.id)}
                    className={`text-left p-6 rounded-2xl border transition-all ${
                      activeFeatureTab === feature.id
                        ? 'bg-white dark:bg-[#0e1116] border-slate-900 dark:border-slate-100 shadow-xl scale-[1.02]'
                        : 'bg-transparent border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
                    }`}
                  >
                    <h3
                      className={`text-xl font-bold mb-2 flex items-center gap-3 ${
                        activeFeatureTab === feature.id
                          ? 'text-black dark:text-white'
                          : 'text-slate-500 dark:text-slate-300'
                      }`}
                    >
                      <span>{feature.icon}</span> {feature.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed font-medium ${
                        activeFeatureTab === feature.id
                          ? 'text-slate-600 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {feature.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="relative h-[400px] sm:h-[450px] lg:h-[500px] w-full rounded-[2rem] bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/20 dark:to-slate-900/20"></div>
                <div className="absolute inset-x-0 top-0 h-12 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50 flex items-center px-4 gap-2 z-10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                </div>
                <div className="absolute inset-x-0 top-12 bottom-0">{renderFeatureMockup()}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Spesifikasi / Enterprise Architecture Section */}
        <section
          id="specs-section"
          className="py-24 md:py-32 bg-slate-50 dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800 relative z-10"
        >
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 reveal-on-scroll">
              <span className="text-neutral-500 font-bold tracking-widest uppercase text-xs mb-3 block">
                Global Infrastructure
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">
                Enterprise-Grade Architecture
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                More than just a to-do list. Built on robust standards to securely automate your team's daily
                operations.
              </p>
            </div>

            <div className="mb-20 reveal-on-scroll" style={{ animationDelay: '100ms' }}>
              <h3 className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-8">
                Powered by Industry-Leading Technologies
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all hover:border-indigo-500">
                  <span className="text-3xl mb-3">⚛️</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                    React 18
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-1">Tailwind • Vite</span>
                </div>
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all hover:border-emerald-500">
                  <span className="text-3xl mb-3">🐍</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    FastAPI
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-1">Python • SQLAlchemy</span>
                </div>
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-500">
                  <span className="text-3xl mb-3">🐘</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    PostgreSQL
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-1">Neon Serverless</span>
                </div>
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all hover:border-amber-500">
                  <span className="text-3xl mb-3">🧠</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Dual AI
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-1">Gemini • GPT-OSS</span>
                </div>
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all hover:border-sky-500">
                  <span className="text-3xl mb-3">☁️</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Cloud Native
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-1">Vercel • Render</span>
                </div>
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all hover:border-red-500">
                  <span className="text-3xl mb-3">🛡️</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Zero-Trust
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-1">JWT • Bcrypt • RBAC</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Specs Cards */}
              <div
                className="bg-white dark:bg-[#111827] p-8 border border-slate-200 dark:border-slate-800 rounded-3xl hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl reveal-on-scroll relative overflow-hidden group"
                style={{ animationDelay: '100ms' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-colors"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-colors"></div>
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                  🔐
                </div>
                <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg mb-2">
                  Zero-Trust Security
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Industry-standard security with stateless JWT, Bcrypt hashing, and strict Role-Based Access Control.
                  Automated CI/CD pipelines protect against OWASP Top 10 vulnerabilities.
                </p>
              </div>
              <div
                className="bg-white dark:bg-[#111827] p-8 border border-slate-200 dark:border-slate-800 rounded-3xl hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl reveal-on-scroll relative overflow-hidden group"
                style={{ animationDelay: '200ms' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors"></div>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl mb-6 shadow-sm border border-blue-100 dark:border-blue-800/50">
                  ⏳
                </div>
                <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg mb-2">
                  Intelligent Workflows
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Automated project scheduling that intelligently bypasses weekends and national holidays. A dynamic
                  hybrid queue system tracks precise workload bottlenecks.
                </p>
              </div>
              <div
                className="bg-white dark:bg-[#111827] p-8 border border-slate-200 dark:border-slate-800 rounded-3xl hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl reveal-on-scroll relative overflow-hidden group"
                style={{ animationDelay: '300ms' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                  🤖
                </div>
                <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg mb-2">
                  Multi-AI Co-Pilot
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Dual-engine AI architecture (Google Gemini & GPT-OSS 120B) for proactive task drafting, live meeting
                  extractions, and context-aware chat assistance.
                </p>
              </div>
              <div
                className="bg-white dark:bg-[#111827] p-8 border border-slate-200 dark:border-slate-800 rounded-3xl hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl reveal-on-scroll relative overflow-hidden group"
                style={{ animationDelay: '100ms' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-sky-500/10 dark:group-hover:bg-sky-500/20 transition-colors"></div>
                <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center text-xl mb-6 shadow-sm border border-sky-100 dark:border-sky-800/50">
                  💬
                </div>
                <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg mb-2">
                  Unified Collaboration
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Secure team workspaces with real-time chat, Direct Messages, 1-click Google Meets, and safe read-only
                  guest previews for external sharing.
                </p>
              </div>
              <div
                className="bg-white dark:bg-[#111827] p-8 border border-slate-200 dark:border-slate-800 rounded-3xl hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl reveal-on-scroll relative overflow-hidden group"
                style={{ animationDelay: '200ms' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20 transition-colors"></div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl mb-6 shadow-sm border border-amber-100 dark:border-amber-800/50">
                  📊
                </div>
                <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg mb-2">
                  Actionable Analytics
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Instantly generate executive reports, monitor project health, and balance team workloads visually
                  using Estimated Time Consumption (ETC) metrics.
                </p>
              </div>
              <div
                className="bg-white dark:bg-[#111827] p-8 border border-slate-200 dark:border-slate-800 rounded-3xl hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl reveal-on-scroll relative overflow-hidden group"
                style={{ animationDelay: '300ms' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 dark:bg-slate-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-slate-500/10 dark:group-hover:bg-slate-500/20 transition-colors"></div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center text-xl mb-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                  ⚡
                </div>
                <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg mb-2">
                  High-Performance Engine
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Built on React 18, Vite, and FastAPI. Features an optimistic UI for zero-latency interactions and a
                  self-cleaning database for perpetual speed.
                </p>
              </div>
            </div>
          </div>
          {/* Scroll Down to Comparison */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-30">
            <button
              onClick={() => document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' })}
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

        {/* Comparison Section */}
        <section
          id="comparison-section"
          className="py-24 md:py-32 bg-white dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800 relative z-10 overflow-hidden"
        >
          {/* Stripe-like Background Mesh */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-500/5 via-transparent to-black/5 dark:from-white/5 dark:to-transparent"></div>
            <div className="absolute top-0 right-0 -z-10 transform-gpu blur-3xl opacity-30" aria-hidden="true">
              <div
                className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-tr from-neutral-300 to-neutral-500 opacity-20 dark:from-neutral-700 dark:to-neutral-900 dark:opacity-40"
                style={{
                  clipPath:
                    'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
                }}
              ></div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16 reveal-on-scroll">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">
                Why INNOCEAN Tracker?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                Stop adapting to generic tools. Experience a platform built specifically for your team's unique
                workflow.
              </p>
            </div>

            <div
              className="overflow-auto custom-scrollbar reveal-on-scroll max-h-[600px] border border-neutral-200 rounded-3xl shadow-inner bg-white relative"
              style={{ animationDelay: '200ms' }}
            >
              <table className="w-full text-left border-separate border-spacing-0 min-w-[600px]">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-20 bg-white p-4 md:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-200 w-1/4">
                      Capability
                    </th>
                    <th className="sticky top-0 z-30 bg-indigo-50 p-4 md:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-700 border-b-2 border-indigo-200 w-1/4 text-center rounded-t-3xl relative border-x border-t-4 border-t-indigo-500 border-x-indigo-100 shadow-[0_-15px_30px_rgba(99,102,241,0.15)]">
                      INNOCEAN Tracker
                    </th>
                    <th className="sticky top-0 z-20 bg-white p-4 md:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-200 w-1/4 text-center">
                      Spreadsheets / Excel
                    </th>
                    <th className="sticky top-0 z-20 bg-white p-4 md:p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-200 w-1/4 text-center">
                      Generic SaaS Apps
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-medium">
                  {/* Group 0: 🚀 Deployment & Cost */}
                  <tr>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 font-black uppercase tracking-widest text-indigo-600 text-xs sm:text-sm border-b-2 border-neutral-200">
                      🚀 Deployment & Cost
                    </td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200 bg-neutral-50"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">Cost Per User</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        No per-seat pricing. Fully open-source and deployable on free-tier cloud infrastructure.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center font-black text-emerald-600 uppercase tracking-widest text-[10px] sm:text-xs">
                      FREE TIER
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        INFRASTRUCTURE LIMITS APPLY
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-slate-500 uppercase tracking-widest text-[10px] sm:text-xs">
                      Free
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-red-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                      $10 - $30 / Month
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Zero-Touch Employee Onboarding
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Employees login via Google SSO and instantly access their dashboard without manual HR
                        provisioning.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        AUTO-PROVISIONING
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        MANUAL INVITES
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ENTERPRISE ADD-ON
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">Project Board Limits</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Create as many isolated project workspaces as your team needs without paywalls.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center font-black text-emerald-600 uppercase tracking-widest text-[10px] sm:text-xs">
                      UNLIMITED
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center font-bold text-slate-500 uppercase tracking-widest text-[10px] sm:text-xs">
                      UNLIMITED
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        LIMITED ON FREE TIER
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Zero-Setup Instant Deployment
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Runs immediately on modern cloud providers (Vercel/Render) without complex server
                        configurations.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        WEEKS OF CONFIG
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Optimistic UI (Zero-Latency)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        The interface updates instantly before the server responds, ensuring a lag-free experience.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NETWORK DEPENDENT
                      </span>
                    </td>
                  </tr>

                  {/* Group 1: 🤖 AI & Smart Assistant */}
                  <tr>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 font-black uppercase tracking-widest text-indigo-600 text-xs sm:text-sm border-b-2 border-neutral-200">
                      🤖 AI & Smart Assistant
                    </td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200 bg-neutral-50"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">Multi-AI Integration</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Powered by GPT-OSS 120B and Google Gemini with automatic failover to prevent downtime.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        SEPARATE SUBSCRIPTION
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        AI Task Drafting & Extraction
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Type naturally and let AI extract details to automatically fill out task creation forms.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NATURAL PROMPT TO FORM
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        PREMIUM ONLY
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Context-Aware Role Parsing
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        AI automatically distinguishes between task assignees (workers) and requesters from chat
                        context.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ASSIGNEE VS REQUESTER
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NEEDS MANUAL TAGGING
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Context-Aware Smart Nudges
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        AI drafts intelligent, contextual follow-up messages to remind assignees about their tasks.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        AI-DRAFTED & AUTO-SCHEDULED
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        EXTERNAL AUTOMATION
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-slate-800 font-bold uppercase tracking-wider">
                      Context-Aware Task Co-Pilot
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Get highly relevant answers from an AI that reads your task brief and comment history.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        READS BRIEFS & COMMENTS
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        LACKS FULL CONTEXT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Meeting Notes (MoM) Extraction
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Paste raw meeting notes and let AI bulk-create actionable tasks and assign them automatically.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        BULK CREATE TASKS
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NEEDS ZAPIER / MAKE
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        AI Code & Flowchart Rendering
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Ask AI to generate conceptual workflows or architectures rendered in interactive ASCII blocks.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ASCII TERMINAL UI
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Live Notepad & AI Suggestions
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Real-time meeting scratchpad with AI generating contextual follow-up questions as you type.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        INTERACTIVE PILLS
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        STATIC NOTEPADS
                      </span>
                    </td>
                  </tr>

                  {/* Group 2: 📊 Workload & Analytics */}
                  <tr>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 font-black uppercase tracking-widest text-indigo-600 text-xs sm:text-sm border-b-2 border-neutral-200">
                      📊 Workload & Analytics
                    </td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200 bg-neutral-50"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">Smart Kanban Archive</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Terminal columns automatically hide old completed tasks to keep your board fast and
                        clutter-free.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        KEEPS UI FAST
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        MANUAL ARCHIVE
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        ETC-Based Workload Balancing
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Workloads are calculated using Estimated Time Consumption (Hours) instead of inaccurate task
                        counts.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        40-HOUR CAPACITY ENGINE
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        TASK-COUNT ONLY
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Automated Workload Insights
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        AI reads your dashboard and generates natural language executive summaries of your team's
                        health.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        WITH AI SUMMARY
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        EXPENSIVE ADD-ON
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Visual Resource Workload Balancing
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Drag and drop tasks vertically between team members on the Gantt chart to instantly reassign
                        work.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        PREMIUM DASHBOARDS
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Real-time Dashboard Analytics
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Live charts tracking project velocity, completion rates, and individual workload distribution.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        MANUAL PIVOT
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        PAID TIER LIMITS
                      </span>
                    </td>
                  </tr>

                  {/* Group 3: ⏳ Time & Deadlines */}
                  <tr>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 font-black uppercase tracking-widest text-indigo-600 text-xs sm:text-sm border-b-2 border-neutral-200">
                      ⏳ Time & Deadlines
                    </td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200 bg-neutral-50"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Automated Project Health Scoring
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Calculates health scores based on completion rates, WIP limits, and overdue task penalties.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      🟢
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      🔴
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        MANUAL CONFIG
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Indonesian Public Holidays
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Automatically bypasses weekends and national red dates when calculating project timelines.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Interactive Calendar & Timeline
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Drag the edges of a task directly on the Gantt or Calendar view to adjust its duration.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        PREMIUM FEATURE
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Automated Deadline Engine
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Pushes deadlines forward automatically if they land on a weekend or a registered public holiday.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      🟢
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      🔴
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        REQUIRES PLUGINS
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Automated Recurring Tasks
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Set tasks to repeat daily, weekly, or monthly. A new cycle spawns automatically when completed.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        AUTO-SPAWN ON DONE
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        REQUIRES EXTERNAL BOT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Built-in Team Leave Tracking
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Log personal vacations. The timeline visually blocks out days when team members are away.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        IN-APP FEATURE
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NEEDS HR SOFTWARE
                      </span>
                    </td>
                  </tr>

                  {/* Group 4: 💬 Collaboration & Workspace */}
                  <tr>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 font-black uppercase tracking-widest text-indigo-600 text-xs sm:text-sm border-b-2 border-neutral-200">
                      💬 Collaboration & Workspace
                    </td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200 bg-neutral-50"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Private Workspaces (Solo Mode)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Create personal to-do lists locked exclusively to you. Team chats and invites are disabled.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        HARD-DISABLED COLLAB
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        OFTEN MIXED SPACES
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Built in Workspace Chat
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Dedicated channels for every project, specific task threads, and 1-on-1 direct messages.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NEEDS EXTERNAL CHAT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Cross-Project Dashboard
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Monitor all your assigned tasks across multiple workspaces from a single unified view.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        MANUAL SEARCH
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Delegated Sub-task Management
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Break down main tasks into checklists and assign specific items to different team members.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Smart Auto-Email Mentions
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Tag colleagues using @username to instantly send them an email and in-app notification.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        1-Click Google Meet Integration
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Instantly generate project-specific Google Meet rooms directly from the task chat.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        AUTO-URL GENERATOR
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        NEEDS PLUGIN
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Internal Deep Linking
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Share specific tasks via secure URLs that teleport authenticated users directly to the card.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        1-CLICK TELEPORT
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                  </tr>

                  {/* Group 5: 🛡️ Platform & Security */}
                  <tr>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 font-black uppercase tracking-widest text-indigo-600 text-xs sm:text-sm border-b-2 border-neutral-200">
                      🛡️ Platform & Security
                    </td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200 bg-neutral-50"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                    <td className="px-4 py-6 md:px-6 md:pt-10 md:pb-4 border-b-2 border-neutral-200"></td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Corporate Single Sign-On (Google Auth)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Strictly allows logins only from whitelisted corporate domains.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ENTERPRISE TIER ONLY
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        12 Automated Penetration Tests (OWASP)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        CI/CD pipelines automatically test against vulnerabilities before deployment.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        CI/CD VALIDATED
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Activity Log (Audit Trail)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Silently tracks and records every status change, edit, and reassignment for complete
                        transparency.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        IMMUTABLE TRACKING
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        CAN BE OVERWRITTEN
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl">✅</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Granular Role-Based Access (RBAC)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Strict permission levels for Super Admins, Project Owners, and regular Team Members.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ALL OR NOTHING
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ADVANCED TIERS
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Self-Cleaning Database (Auto-Purge)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Automatically deletes 6-month-old completed tasks and 1-year-old chats to prevent server bloat.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        ENTERPRISE TIER ONLY
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Quick To-Do Cart (Bulk Entry)
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Queue multiple tasks in a local cart and dispatch them to the server simultaneously.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        INTERACTIVE CART UI
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        MANUAL ROWS
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        SLOW FORMS
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Multi-Word Unordered Search
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Google-like search engine that matches keywords regardless of their sequence.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        GOOGLE-LIKE ENGINE
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        EXACT MATCH ONLY
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        BASIC SUBSTRING
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 border-b border-neutral-100">
                      <div className="text-slate-800 font-bold uppercase tracking-wider mb-1">
                        Data Privacy & Sovereignty
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-relaxed normal-case tracking-normal">
                        Your data stays in your database. No AI training retention and no third-party tracking.
                      </div>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50 text-center text-xl sm:text-2xl">
                      ✅{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        100% DATA OWNERSHIP
                      </span>
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-70">
                      🟡
                    </td>
                    <td className="p-4 md:p-6 border-b border-neutral-100 text-center text-xl sm:text-2xl opacity-30 grayscale">
                      ❌{' '}
                      <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        3RD PARTY SERVERS
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Scroll Down to FAQ */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-30">
            <button
              onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all animate-bounce"
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

        {/* Feature Highlight Section */}
        {/* FAQ Section */}

    </>
  );
}
