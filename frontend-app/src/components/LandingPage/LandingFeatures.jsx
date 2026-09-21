import React, { useState, useEffect } from 'react';
import { Icon } from '../icons/Icon';

export default function LandingFeatures({ showAuthForm, tMsg = (en) => en }) {
  const [activeFeatureTab, setActiveFeatureTab] = useState('kanban');

  const features = [
    {
      id: 'kanban',
      title: tMsg('Board', 'Papan'),
      icon: 'clipboard-list',
      desc: tMsg(
        'Move cards across columns — To Do, In Progress, Done — so the team can see progress at a glance.',
        'Geser kartu antar kolom — To Do, Dikerjakan, Selesai — supaya tim melihat progres sekilas.'
      ),
    },
    {
      id: 'list',
      title: tMsg('List', 'Daftar'),
      icon: 'layers',
      desc: tMsg(
        'A compact table when you need to scan many tasks, people, and due dates at once.',
        'Tabel ringkas saat kamu perlu melihat banyak tugas, orang, dan tenggat sekaligus.'
      ),
    },
    {
      id: 'timeline',
      title: tMsg('Timeline', 'Lini masa'),
      icon: 'gantt-chart',
      desc: tMsg(
        'See the project schedule as a timeline. Drag the edges of a task to adjust dates.',
        'Lihat jadwal proyek sebagai lini masa. Geser tepi tugas untuk mengubah tanggal.'
      ),
    },
    {
      id: 'calendar',
      title: tMsg('Calendar', 'Kalender'),
      icon: 'calendar',
      desc: tMsg(
        'See deadlines on a calendar. Weekends and Indonesian public holidays are already counted.',
        'Lihat deadline di kalender. Akhir pekan dan libur nasional Indonesia sudah dihitung.'
      ),
    },
    {
      id: 'analytics',
      title: tMsg('Project summary', 'Ringkasan proyek'),
      icon: 'trending-up',
      desc: tMsg(
        'Completion and workload at a glance. This view is for managers and project owners, not Staff.',
        'Penyelesaian dan beban kerja sekilas. Tampilan ini untuk manager dan project owner, bukan Staff.'
      ),
    },
  ];

  useEffect(() => {
    if (showAuthForm) return undefined;
    const featureIds = ['kanban', 'list', 'timeline', 'calendar', 'analytics'];
    const timer = setInterval(() => {
      setActiveFeatureTab((prev) => {
        const idx = featureIds.indexOf(prev);
        return featureIds[(idx + 1) % featureIds.length];
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [showAuthForm]);

  const renderFeatureMockup = () => {
    switch (activeFeatureTab) {
      case 'kanban':
        return (
          <div className="flex gap-3 h-full p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
            {[
              tMsg('To Do', 'To Do'),
              tMsg('In Progress', 'Dikerjakan'),
              tMsg('Done', 'Selesai'),
            ].map((title, i) => (
              <div
                key={title}
                className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
              >
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">{title}</div>
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-sm text-[10px] font-medium text-slate-600 dark:text-slate-200">
                  {i === 0
                    ? tMsg('Draft key visual', 'Draft key visual')
                    : i === 1
                      ? tMsg('Edit TVC cutdown', 'Edit cutdown TVC')
                      : tMsg('Kickoff deck', 'Deck kickoff')}
                </div>
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
              <div className="w-1/4">{tMsg('Task', 'Tugas')}</div>
              <div className="w-1/4">{tMsg('Assignee', 'PIC')}</div>
              <div className="w-1/4">{tMsg('Status', 'Status')}</div>
              <div className="w-1/4">{tMsg('Due', 'Tenggat')}</div>
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
                <div className="w-1/4 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
                  {role}
                </div>
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
            <div className="w-1/3 aspect-square rounded-full border-8 sm:border-12 border-indigo-100 dark:border-indigo-900/40 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-8 sm:border-12 border-indigo-500 border-r-transparent border-b-transparent rotate-45"></div>
              <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">76%</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 sm:gap-4">
              {[
                { label: tMsg('Done', 'Selesai'), color: 'bg-emerald-500', width: 'w-[76%]' },
                { label: tMsg('In Progress', 'Dikerjakan'), color: 'bg-blue-500', width: 'w-[15%]' },
                { label: tMsg('To Do', 'To Do'), color: 'bg-amber-500', width: 'w-[9%]' },
              ].map((stat) => (
                <div key={stat.label}>
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
    <section
      id="features-section"
      className="py-24 md:py-32 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-[1.15]">
            {tMsg('See your work the way you need', 'Lihat pekerjaan sesuai caramu')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            {tMsg(
              'Switch between board, list, timeline, and calendar on the same project — without reloading.',
              'Ganti antara papan, daftar, lini masa, dan kalender di proyek yang sama — tanpa reload.'
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
                  <Icon name={feature.icon} className="w-5 h-5 shrink-0" /> {feature.title}
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

          <div className="relative h-96 sm:h-[450px] lg:h-[500px] w-full rounded-4xl bg-white dark:bg-[#0e1116] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/20 dark:to-slate-900/20 backdrop-blur-md"></div>
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
  );
}
