import React, { useState, useEffect } from 'react';
import { IconPerson } from './SharedUI';
import { getTaskAssignee } from './useAppLogic';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function TimelineView({
  filteredTasks,
  leaves,
  currentUser,
  isUserAssigned,
  timelineDrag,
  setTimelineDrag,
  setSelectedTask,
  DAY_WIDTH,
  accountStatus,
  selectedBoard,
  isSuperAdmin,
  groupBy,
  hoveredTimelineRow,
  setHoveredTimelineRow,
  isTrashHovered,
  isDarkMode,
  language,
}) {
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('innocean_timeline_sidebar');
      return saved ? Number(saved) : 320;
    }
    return 320;
  });
  const activeSidebarWidth = isMobile ? 120 : sidebarWidth;
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    if (!showExportMenu) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#timeline-export-dropdown')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showExportMenu]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingSidebar) return;
      const container = document.getElementById('timeline-scroll-wrapper');
      if (container) {
        const rect = container.getBoundingClientRect();
        const newWidth = Math.max(150, Math.min(800, e.clientX - rect.left));
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      if (isResizingSidebar) {
        setIsResizingSidebar(false);
        localStorage.setItem('innocean_timeline_sidebar', sidebarWidth);
      }
    };
    if (isResizingSidebar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  const handleExport = (type = 'pdf') => {
    setIsExporting(true);

    const input = document.getElementById('timeline-export-container');

    if (!input) {
      setIsExporting(false);
      return;
    }

    // 1. ISOLASI DOM: Buat clone yang tidak terikat oleh overflow-hidden dari React parent
    // Ini menjamin html2canvas dapat membaca seluruh koordinat kotak tugas tanpa terpotong batas layar
    const cloneWrapper = document.createElement('div');
    cloneWrapper.style.position = 'absolute';
    cloneWrapper.style.top = '0';
    cloneWrapper.style.left = '0';
    cloneWrapper.style.width = `${input.scrollWidth}px`;
    cloneWrapper.style.height = 'max-content';
    cloneWrapper.style.zIndex = '-9999'; // Sembunyikan di belakang layar
    cloneWrapper.style.overflow = 'visible';
    cloneWrapper.style.backgroundColor = isDarkMode ? '#1e293b' : '#ffffff';
    cloneWrapper.style.color = isDarkMode ? '#f8fafc' : '#0f172a';

    const clone = input.cloneNode(true);
    clone.style.width = `${input.scrollWidth}px`;
    clone.style.height = 'max-content';
    clone.style.overflow = 'visible';

    // 2. PERBAIKI STICKY: Ubah posisi sticky menjadi relative pada clone agar titik kordinatnya tidak rusak dan menutupi task awal
    const stickies = clone.querySelectorAll('.sticky');
    stickies.forEach((el) => {
      el.classList.remove('sticky');
      el.style.position = 'relative';
      el.style.transform = 'none';
      if (el.classList.contains('left-0')) {
        el.style.left = 'auto';
        el.style.zIndex = '50';
      }
      if (el.classList.contains('top-0')) {
        el.style.top = 'auto';
        el.style.zIndex = '40';
      }
    });

    // Sembunyikan tombol ekspor di dalam hasil cetakan
    const exportBtn = clone.querySelector('#timeline-export-dropdown');
    if (exportBtn) exportBtn.style.display = 'none';

    // Sembunyikan drag handles agar chart terlihat bersih pada hasil ekspor
    const resizeHandles = clone.querySelectorAll('.resize-handle');
    resizeHandles.forEach((el) => {
      el.style.display = 'none';
    });

    // Hilangkan repeating-linear-gradient karena html2canvas sering merendernya dengan sangat kasar/rusak
    const offSegments = clone.querySelectorAll('.timeline-off-segment');
    offSegments.forEach((el) => {
      el.style.backgroundImage = 'none';
    });

    // 3. Sesuaikan tinggi baris agar lebih tinggi dan lega
    const rows = clone.querySelectorAll('.h-14');
    rows.forEach((el) => {
      el.classList.remove('h-14');
      el.style.height = '72px';
    });

    // 4. Modifikasi teks: Buka penuh 1 baris & cegah potongan bawah (html2canvas descender bug)
    const truncates = clone.querySelectorAll('.truncate');
    truncates.forEach((el) => {
      el.classList.remove('truncate');
      el.style.maxWidth = 'none';
      el.style.whiteSpace = 'nowrap';
      el.style.lineHeight = '1.5';
      el.style.paddingBottom = '4px'; // Memberi ruang aman untuk ujung bawah huruf
    });

    // 5. Perbaiki spasi teks yang rapat agar tidak terpotong
    const tightTexts = clone.querySelectorAll('.leading-tight');
    tightTexts.forEach((el) => {
      el.classList.remove('leading-tight');
      el.style.lineHeight = '1.5';
    });
    
    // 6. Lebarkan sidebar di PDF secara dinamis agar muat seluruh teks
    const sidebar = clone.children[0];
    if (sidebar) {
      sidebar.style.setProperty('width', 'max-content', 'important');
      sidebar.style.setProperty('min-width', `${sidebarWidth}px`, 'important');
      sidebar.style.setProperty('padding-right', '20px', 'important');
    }

    // 7. Perbaiki badge antrian & category agar teksnya terlihat sempurna dan tidak terpotong
    const microBadges = clone.querySelectorAll('.bg-amber-100, .bg-slate-100');
    microBadges.forEach((el) => {
      if (el.classList.contains('px-1.5')) {
        el.classList.remove('max-w-[50px]', 'md:max-w-[80px]', 'truncate');
        el.style.fontSize = '10px';
        el.style.padding = '4px 6px';
        el.style.lineHeight = '1';
        el.style.maxWidth = 'none';
        el.style.display = 'inline-block';
        el.style.whiteSpace = 'nowrap';
      }
    });

    cloneWrapper.appendChild(clone);
    document.body.appendChild(cloneWrapper);

    setTimeout(() => {
      // Konversi Class Tailwind menjadi Hex Color untuk html2canvas
      function getColorFallback(el, propName, isDark) {
        const cls = typeof el?.className === 'string' ? el.className : '';
        if (propName.includes('background')) {
          if (cls.includes('bg-emerald-500')) return '#10b981';
          if (cls.includes('bg-emerald-600')) return '#059669';
          if (cls.includes('bg-slate-400')) return '#94a3b8';
          if (cls.includes('bg-blue-500')) return '#3b82f6';
          if (cls.includes('bg-red-500')) return '#ef4444';
          if (cls.includes('bg-amber-500')) return '#f59e0b';
          if (cls.includes('bg-amber-100')) return isDark ? 'rgba(120, 53, 15, 0.4)' : '#fef3c7';
          if (cls.includes('bg-blue-50')) return isDark ? 'rgba(30, 58, 138, 0.3)' : '#eff6ff';
          if (cls.includes('bg-red-100')) return isDark ? 'rgba(127, 29, 29, 0.3)' : 'rgba(254, 226, 226, 0.8)';
          if (cls.includes('bg-slate-200/70')) return isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(226, 232, 240, 0.7)';
          if (cls.includes('bg-slate-900/60')) return 'rgba(15, 23, 42, 0.6)';
          if (cls.includes('bg-slate-200/50') || cls.includes('bg-slate-200/20'))
            return isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)';
          if (cls.includes('bg-slate-700/50')) return 'rgba(51, 65, 85, 0.5)';
          if (cls.includes('bg-slate-50')) return isDark ? '#1e293b' : '#f8fafc';
          if (cls.includes('bg-slate-100')) return isDark ? '#334155' : '#f1f5f9';
          if (cls.includes('bg-slate-800')) return '#1e293b';
          return isDark ? '#1e293b' : '#ffffff';
        }
        if (propName.includes('border')) {
          if (cls.includes('border-amber-200') || cls.includes('border-amber-800'))
            return isDark ? 'rgba(146, 64, 14, 0.5)' : '#fde68a';
          if (cls.includes('border-slate-100')) return isDark ? '#334155' : '#f1f5f9';
          if (cls.includes('border-slate-200')) return isDark ? '#334155' : '#e2e8f0';
          if (cls.includes('border-slate-700')) return '#334155';
          return isDark ? '#334155' : '#e2e8f0';
        }
        if (propName.includes('color')) {
          if (cls.includes('text-white')) return '#ffffff';
          if (cls.includes('text-amber-700') || cls.includes('text-amber-400')) return isDark ? '#fbbf24' : '#b45309';
          if (cls.includes('text-blue-500') || cls.includes('text-blue-600')) return '#3b82f6';
          if (cls.includes('text-red-500') || cls.includes('text-red-600')) return '#ef4444';
          if (cls.includes('text-emerald-500') || cls.includes('text-emerald-700')) return '#10b981';
          if (cls.includes('text-slate-800') || cls.includes('text-black')) return isDark ? '#f8fafc' : '#1e293b';
          if (cls.includes('text-slate-500') || cls.includes('text-slate-400')) return isDark ? '#94a3b8' : '#64748b';
          return isDark ? '#f8fafc' : '#0f172a';
        }
        return 'transparent';
      }

      // Temporary fix for html2canvas "unsupported color function oklch/oklab" error
      const origGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function (el, pseudo) {
        const style = origGetComputedStyle.call(window, el, pseudo);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function (propName) {
                const pVal = target.getPropertyValue(propName);
                if (typeof pVal === 'string' && (pVal.includes('oklch') || pVal.includes('oklab'))) {
                  return getColorFallback(el, propName, isDarkMode);
                }
                return pVal;
              };
            }
            const val = target[prop];
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              const pName = String(prop)
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase();
              return getColorFallback(el, pName, isDarkMode);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          },
        });
      };

      html2canvas(cloneWrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: cloneWrapper.scrollWidth,
        height: cloneWrapper.scrollHeight,
        windowWidth: cloneWrapper.scrollWidth,
        windowHeight: cloneWrapper.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        onclone: (clonedDoc) => {
          if (isDarkMode) {
            clonedDoc.documentElement.classList.add('dark');
            clonedDoc.body.style.backgroundColor = '#1e293b';
            clonedDoc.body.style.color = '#f8fafc';
          } else {
            clonedDoc.documentElement.classList.remove('dark');
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#0f172a';
          }
        },
      })
        .then((canvas) => {
          window.getComputedStyle = origGetComputedStyle; // Restore
          if (document.body.contains(cloneWrapper)) document.body.removeChild(cloneWrapper);

          const imgData = canvas.toDataURL('image/png');
          const fileName = `timeline-${(selectedBoard?.name || 'export').toLowerCase().replace(/\s+/g, '-')}-${
            new Date().toISOString().split('T')[0]
          }`;

          if (type === 'pdf') {
            const pdfWidth = canvas.width / 2;
            const pdfHeight = canvas.height / 2;

            const pdf = new jsPDF({
              orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
              unit: 'px',
              format: [pdfWidth, pdfHeight],
            });
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fileName}.pdf`);
          } else {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${fileName}.png`;
            link.click();
          }

          setIsExporting(false);
        })
        .catch((err) => {
          window.getComputedStyle = origGetComputedStyle; // Restore
          if (document.body.contains(cloneWrapper)) document.body.removeChild(cloneWrapper);
          console.error('Export failed:', err);
          setIsExporting(false);
        });
    }, 500); // Berikan jeda untuk DOM clone render dengan utuh di memori
  };

  const parseDate = (d) => {
    if (!d) return new Date();
    const p = new Date(d.replace(/-/g, '/'));
    if (isNaN(p)) return new Date();
    p.setHours(0, 0, 0, 0);
    return p;
  };

  let minD = new Date('2100-01-01');
  let maxD = new Date('1970-01-01');
  let hasActiveTasks = false;

  const parsedTasks = filteredTasks.map((t) => {
    let start = parseDate(t.start_date || t.timestamp.split(' ')[0]);

    // Visual Snap: Mulai render balok dari hari kerja pertama (menghindari balok nyangkut/tak terlihat di hari libur)
    while (true) {
      const dStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
        start.getDate()
      ).padStart(2, '0')}`;
      const isWeekend = start.getDay() === 0 || start.getDay() === 6;
      const isHoliday = leaves.some(
        (l) => l.leave_date === dStr && (l.leave_type !== 'personal' || isUserAssigned(t, l.username))
      );
      if (isWeekend || isHoliday) {
        start.setDate(start.getDate() + 1);
      } else {
        break;
      }
    }

    let end = parseDate(
      (t.status === 'Done' || t.status === 'Rejected') && t.completed_time ? t.completed_time : t.deadline
    );
    if (end < start) end = new Date(start.getTime());

    if (timelineDrag && timelineDrag.task && timelineDrag.task.id === t.id) {
      if (timelineDrag.mode === 'end') {
        end.setDate(end.getDate() + timelineDrag.startOffsetDays);
        if (end < start) end = new Date(start.getTime());
      } else if (timelineDrag.mode === 'start') {
        start.setDate(start.getDate() + timelineDrag.startOffsetDays);
        if (start > end) start = new Date(end.getTime());
      } else if (timelineDrag.mode === 'both') {
        start.setDate(start.getDate() + timelineDrag.startOffsetDays);
        end.setDate(end.getDate() + timelineDrag.startOffsetDays);
      }
    }

    if (t.status !== 'Done' && t.status !== 'Rejected') {
      if (start < minD) minD = new Date(start);
      if (end > maxD) maxD = new Date(end);
      hasActiveTasks = true;
    }

    return { ...t, start, end };
  });

  if (!hasActiveTasks) {
    parsedTasks.forEach((t) => {
      if (t.start < minD) minD = new Date(t.start);
      if (t.end > maxD) maxD = new Date(t.end);
    });
  }
  if (minD.getFullYear() === 2100) {
    minD = new Date();
    maxD = new Date();
  }

  if (parsedTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
        No tasks available for timeline view.
      </div>
    );
  }

  minD.setDate(minD.getDate() - 2);
  maxD.setDate(maxD.getDate() + 7);

  const days = [];
  for (let d = new Date(minD); d <= maxD; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const months = [];
  let currentMonth = null;
  let currentMonthCount = 0;
  days.forEach((d) => {
    const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (mStr !== currentMonth) {
      if (currentMonth) months.push({ label: currentMonth, count: currentMonthCount });
      currentMonth = mStr;
      currentMonthCount = 1;
    } else {
      currentMonthCount++;
    }
  });
  if (currentMonth) months.push({ label: currentMonth, count: currentMonthCount });

  const grouped = parsedTasks.reduce((acc, t) => {
    let key, title, icon;
    if (groupBy === 'Assignee') {
      key = getTaskAssignee(t);
      title = key;
      icon = '👤';
    } else if (groupBy === 'Category') {
      key = t.category || 'Uncategorized';
      title = key;
      icon = '📂';
    } else if (groupBy === 'Status') {
      key = t.status || 'Unknown';
      title = key;
      icon = '📌';
    } else {
      key = t.board_id || 'unknown';
      title = t.board_name || 'Unknown Project';
      icon = '📁';
    }

    if (!acc[key]) acc[key] = { title, icon, tasks: [] };
    acc[key].tasks.push(t);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort((a, b) => a[1].title.localeCompare(b[1].title));



  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-125">
      <div id="timeline-scroll-wrapper" className="overflow-auto flex-1 relative">
        <div id="timeline-export-container" className="flex w-max min-w-full relative bg-white dark:bg-slate-800">
          {/* Left Sidebar for Labels */}
          <div 
             className={`shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group/sidebar ${isResizingSidebar ? '' : 'transition-[width] duration-75'}`}
             style={{ width: `${activeSidebarWidth}px` }}
          >
            {/* Handle Resize */}
            {!isMobile && (
              <div
                className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors hidden md:block"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizingSidebar(true);
                }}
              ></div>
            )}
            <div className="h-20 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-2 md:px-4 sticky top-0 bg-slate-50 dark:bg-slate-800 z-30 gap-1">
              <span className="font-extrabold text-[9px] md:text-xs text-slate-500 dark:text-slate-400 tracking-wider truncate">
                {isMobile ? 'TASKS' : 'PROJECT & TASK'}
              </span>
              <div id="timeline-export-dropdown" className="relative z-50">
                <button
                  disabled={isExporting}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 md:px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isExporting ? '⏳' : '💾'} {!isMobile && (isExporting ? ' Exporting...' : ' Export')} {!isMobile && <span className="text-[8px] opacity-70">▼</span>}
                </button>
                {showExportMenu && !isExporting && (
                  <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl overflow-hidden z-50">
                    <button
                      onClick={() => {
                        handleExport('pdf');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      📄 {tMsg('Export PDF', 'Ekspor PDF')}
                    </button>
                    <button
                      onClick={() => {
                        handleExport('png');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      🖼️ {tMsg('Export High-Res Image', 'Ekspor Gambar High-Res')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {sortedGroups.map(([key, group]) => {
              const isHoveredTarget = timelineDrag && timelineDrag.mode === 'both' && hoveredTimelineRow === key;
              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredTimelineRow(key)}
                  onMouseLeave={() => setHoveredTimelineRow(null)}
                  className={`transition-colors relative ${
                    isHoveredTarget ? 'bg-indigo-50/70 dark:bg-indigo-900/30' : ''
                  }`}
                >
                  <div
                    className="h-12 bg-slate-200/50 dark:bg-slate-700/50 flex flex-col justify-center px-2 md:px-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors relative group"
                    onClick={() => toggleGroup(key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate leading-tight pr-2 md:pr-4">
                        {group.icon} {group.title}
                      </span>
                      <span
                        className="text-slate-500 dark:text-slate-400 text-[10px] shrink-0 transition-transform duration-200"
                        style={{ transform: collapsedGroups[key] ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                  {!collapsedGroups[key] &&
                    group.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="h-14 border-b border-slate-100 dark:border-slate-700/50 flex flex-col justify-center px-2 md:px-4 bg-white dark:bg-slate-800 relative group cursor-pointer"
                        onClick={() => setSelectedTask(t)}
                      >
                        <div
                          className="text-[10px] md:text-xs font-bold text-slate-800 dark:text-slate-200 w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight flex items-center gap-1.5"
                          title={t.project_name}
                        >
                          {(() => {
                            const isGlobal = !selectedBoard || selectedBoard.id === 'global';
                            const qPos = isGlobal ? t.queue_global_number : t.queue_project_number;
                            const qTot = isGlobal ? t.total_global_queue : t.total_project_queue;
                            const qType = isGlobal ? 'overall' : tMsg('project', 'proyek');
                            if (qPos && qTot && t.status !== 'Done' && t.status !== 'Rejected') {
                              return (
                                <span
                                  className="text-[8px] md:text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded shadow-sm border border-amber-200 dark:border-amber-800/50 shrink-0"
                                  title={tMsg(
                                    `Queue #${qPos} of ${qTot} in ${t.main_assignee || 'their'}'s ${qType} queue.`,
                                    `Antrean #${qPos} dari ${qTot} di antrean ${qType} ${t.main_assignee || 'mereka'}.`
                                  )}
                                >
                                  {qPos}/{qTot}
                                </span>
                              );
                            }
                            return null;
                          })()}
                          <span className="truncate">{t.project_name || 'Untitled Task'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                          <span
                            className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 truncate max-w-12.5 md:max-w-20"
                            title={t.category}
                          >
                            {t.category}
                          </span>
                          <span className="truncate flex items-center gap-0.5" title={t.requester}>
                            <IconPerson className="w-3 h-3 inline-block" /> {t.requester}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>

          {/* Timeline Grid */}
          <div className="flex-1 relative bg-white dark:bg-slate-800">
            <div className="h-20 border-b border-slate-200 dark:border-slate-700 flex flex-col sticky top-0 bg-white dark:bg-slate-800 z-30">
              <div className="flex border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 shrink-0 h-6 items-center">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="text-center text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/50 truncate px-2"
                    style={{ width: m.count * DAY_WIDTH }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-1">
                {days.map((d, i) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                    d.getDate()
                  ).padStart(2, '0')}`;
                  const hasHoliday = leaves.some(
                    (l) => l.leave_date === dStr && (l.leave_type !== 'personal' || l.username === currentUser)
                  );

                  let cellBg = '';
                  if (isToday) cellBg = 'bg-blue-50 dark:bg-blue-900/30';
                  else if (hasHoliday) cellBg = 'bg-red-100/80 dark:bg-red-900/30';
                  else if (d.getDay() === 0 || d.getDay() === 6) cellBg = 'bg-slate-200/70 dark:bg-slate-900/60';
                  return (
                    <div
                      key={i}
                      className={`shrink-0 border-r border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-[10px] ${cellBg}`}
                      style={{ width: DAY_WIDTH }}
                      title={
                        hasHoliday
                          ? leaves.find(
                              (l) =>
                                l.leave_date === dStr && (l.leave_type !== 'personal' || l.username === currentUser)
                            )?.description
                          : ''
                      }
                    >
                      <span
                        className={`text-[8px] uppercase font-bold tracking-widest mb-0.5 ${
                          isToday
                            ? 'text-blue-500 dark:text-blue-400'
                            : hasHoliday
                            ? 'text-red-500 dark:text-red-400'
                            : d.getDay() === 0 || d.getDay() === 6
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span
                        className={`font-bold ${
                          isToday
                            ? 'text-blue-600 dark:text-blue-400 text-sm leading-none'
                            : hasHoliday
                            ? 'text-red-700 dark:text-red-300 text-xs leading-none'
                            : d.getDay() === 0 || d.getDay() === 6
                            ? 'text-slate-700 dark:text-slate-300 text-xs leading-none'
                            : 'text-slate-600 dark:text-slate-400 text-xs leading-none'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      <span
                        className={`${
                          isToday
                            ? 'text-blue-500 dark:text-blue-400 font-bold text-[8px] leading-none mt-0.5'
                            : hasHoliday
                            ? 'text-red-600 dark:text-red-400 text-[8px] leading-none mt-0.5'
                            : d.getDay() === 0 || d.getDay() === 6
                            ? 'text-slate-600 dark:text-slate-400 text-[8px] leading-none mt-0.5'
                            : 'text-slate-400 dark:text-slate-500 text-[8px] leading-none mt-0.5'
                        }`}
                      >
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute top-20 bottom-0 left-0 right-0 flex pointer-events-none z-0">
              {days.map((d, i) => {
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                  d.getDate()
                ).padStart(2, '0')}`;
                const hasHoliday = leaves.some(
                  (l) => l.leave_date === dStr && (l.leave_type !== 'personal' || l.username === currentUser)
                );

                let cellBg = '';
                if (hasHoliday) cellBg = 'bg-red-100/80 dark:bg-red-900/30';
                else if (d.getDay() === 0 || d.getDay() === 6) cellBg = 'bg-slate-200/70 dark:bg-slate-900/60';
                return (
                  <div
                    key={i}
                    className={`shrink-0 border-r border-slate-100 dark:border-slate-700/50 h-full ${cellBg}`}
                    style={{ width: DAY_WIDTH }}
                  ></div>
                );
              })}
            </div>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (today >= minD && today <= maxD) {
                const offset = Math.round((today - minD) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    className="absolute top-20 bottom-0 w-0.5 bg-blue-400 dark:bg-blue-500 z-10 pointer-events-none"
                    style={{ left: `${offset * DAY_WIDTH + DAY_WIDTH / 2}px` }}
                  ></div>
                );
              }
            })()}
            <div className="relative z-10">
              {sortedGroups.map(([key, group]) => {
                const isHoveredTarget = timelineDrag && timelineDrag.mode === 'both' && hoveredTimelineRow === key;
                return (
                  <div
                    key={key}
                    onMouseEnter={() => setHoveredTimelineRow(key)}
                    onMouseLeave={() => setHoveredTimelineRow(null)}
                    className={`transition-colors relative ${
                      isHoveredTarget ? 'bg-indigo-50/70 dark:bg-indigo-900/30 ring-2 ring-indigo-500/50 z-20' : 'z-10'
                    }`}
                  >
                    <div className="h-12 border-b border-slate-200 dark:border-slate-700 bg-slate-200/20 dark:bg-slate-700/20"></div>
                    {!collapsedGroups[key] &&
                      group.tasks.map((t) => {
                        const segments = [];
                        const offSegments = [];
                        let currentSegment = null;
                        let currentOffSegment = null;
                        for (let d = new Date(t.start); d <= t.end; d.setDate(d.getDate() + 1)) {
                          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                            d.getDate()
                          ).padStart(2, '0')}`;
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          const holiday = leaves.find(
                            (l) =>
                              l.leave_date === dStr && (l.leave_type !== 'personal' || isUserAssigned(t, l.username))
                          );
                          const isOffDay = isWeekend || holiday;
                          if (!isOffDay) {
                            if (currentOffSegment) {
                              offSegments.push(currentOffSegment);
                              currentOffSegment = null;
                            }
                            if (!currentSegment) currentSegment = { start: new Date(d), end: new Date(d) };
                            else currentSegment.end = new Date(d);
                          } else {
                            if (currentSegment) {
                              segments.push(currentSegment);
                              currentSegment = null;
                            }
                            const desc = holiday
                              ? holiday.leave_type === 'personal'
                                ? `🌴 @${holiday.username} Leave`
                                : `🎌 ${holiday.description}`
                              : 'Weekend';
                            if (!currentOffSegment)
                              currentOffSegment = { start: new Date(d), end: new Date(d), desc, isLeave: !!holiday };
                            else {
                              currentOffSegment.end = new Date(d);
                              if (holiday) currentOffSegment.isLeave = true;
                              if (holiday && !currentOffSegment.desc.includes(desc))
                                currentOffSegment.desc += ` | ${desc}`;
                            }
                          }
                        }
                        if (currentSegment) segments.push(currentSegment);
                        if (currentOffSegment) offSegments.push(currentOffSegment);
                        if (segments.length === 0 && offSegments.length === 0)
                          segments.push({ start: new Date(t.start), end: new Date(t.end) });

                        let bgColor = 'bg-emerald-500';
                        if (t.status === 'Done') bgColor = 'bg-emerald-600';
                        else if (t.status === 'Rejected') bgColor = 'bg-slate-400';
                        else if (t.status === 'In Progress') bgColor = 'bg-blue-500';
                        else if (t.priority_lvl === 'critical') bgColor = 'bg-red-500';
                        else if (t.priority_lvl === 'warning') bgColor = 'bg-amber-500';

                        const isTaskAdmin =
                          isSuperAdmin ||
                          t.owner_username === currentUser ||
                          (selectedBoard && selectedBoard.owner_username === currentUser) ||
                          (t.requester &&
                            new RegExp(`@${currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i').test(
                              t.requester
                            ));
                        const isDraggable =
                          t.status !== 'Done' &&
                          t.status !== 'Rejected' &&
                          accountStatus !== 'suspended' &&
                          isTaskAdmin;
                        const isDraggingThis = timelineDrag?.task?.id === t.id;
                        const dragClass = isDraggingThis
                          ? isTrashHovered
                            ? 'cursor-grabbing z-[60] !opacity-0 !bg-transparent !shadow-none !border-transparent !text-transparent transition-opacity duration-150'
                            : 'shadow-2xl -rotate-1 cursor-grabbing z-[60] ring-4 ring-indigo-500/40 scale-105 opacity-95 transition-[box-shadow,border-color,opacity,background-color] duration-200'
                          : 'transition-all duration-300 z-10 hover:-translate-y-0.5 hover:shadow-md';

                        return (
                          <div
                            key={t.id}
                            className="h-14 border-b border-slate-100 dark:border-slate-700/50 flex items-center relative group hover:bg-slate-50/50 dark:hover:bg-slate-700/30"
                          >
                            {offSegments.map((seg, sIdx) => {
                              const offsetDays = Math.round((seg.start - minD) / (1000 * 60 * 60 * 24));
                              const durationDays = Math.round((seg.end - seg.start) / (1000 * 60 * 60 * 24)) + 1;
                              const isLeave = seg.isLeave;
                              return (
                                <div
                                  key={`off-${sIdx}`}
                                  className={`timeline-off-segment absolute h-8 flex items-center justify-center text-[9px] font-bold overflow-hidden px-1 ${
                                    isLeave ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                  style={{
                                    left: `${offsetDays * DAY_WIDTH + 4}px`,
                                    width: `${Math.max(durationDays * DAY_WIDTH - 8, 24)}px`,
                                    backgroundColor: isLeave ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                    backgroundImage: isLeave
                                      ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239, 68, 68, 0.05) 5px, rgba(239, 68, 68, 0.1) 10px)'
                                      : 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(148, 163, 184, 0.05) 5px, rgba(148, 163, 184, 0.1) 10px)',
                                    borderTop: `1px dashed ${isLeave ? '#ef4444' : '#94a3b8'}`,
                                    borderBottom: `1px dashed ${isLeave ? '#ef4444' : '#94a3b8'}`,
                                    zIndex: 5,
                                  }}
                                  title={seg.desc}
                                >
                                  {isLeave && durationDays * DAY_WIDTH > 50 && (
                                    <span className="truncate bg-white/60 dark:bg-black/60 px-1.5 rounded backdrop-blur-sm">
                                      {seg.desc}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {segments.map((seg, sIdx) => {
                              const offsetDays = Math.round((seg.start - minD) / (1000 * 60 * 60 * 24));
                              const durationDays = Math.round((seg.end - seg.start) / (1000 * 60 * 60 * 24)) + 1;
                              const isFirst = sIdx === 0;
                              const isLast = sIdx === segments.length - 1;
                              return (
                                <div
                                  key={sIdx}
                                  className={`absolute h-8 shadow-sm flex items-stretch px-0 text-[10px] text-white font-bold whitespace-nowrap overflow-hidden ${bgColor} ${
                                    isFirst ? 'rounded-l-full' : ''
                                  } ${isLast ? 'rounded-r-full' : ''} ${dragClass}`}
                                  style={{
                                    left: `${offsetDays * DAY_WIDTH + 4}px`,
                                    width: `${Math.max(durationDays * DAY_WIDTH - 8, 24)}px`,
                                  }}
                                  onClick={(e) => {
                                    if (!timelineDrag || timelineDrag.startOffsetDays === 0) setSelectedTask(t);
                                  }}
                                  title={`${t.project_name} - ${t.status}`}
                                >
                                  {isFirst && isDraggable && (
                                    <div
                                      className="resize-handle w-2 sm:w-3 bg-black/10 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/30 cursor-ew-resize shrink-0 z-20 transition-colors"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setTimelineDrag({
                                          task: t,
                                          startX: e.pageX,
                                          startOffsetDays: 0,
                                          mode: 'start',
                                        });
                                      }}
                                    />
                                  )}
                                  <div
                                    className={`flex-1 flex items-center px-2 min-w-0 ${
                                      isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                                    } z-10`}
                                    onMouseDown={(e) => {
                                      if (isDraggable) {
                                        e.stopPropagation();
                                        setTimelineDrag({ task: t, startX: e.pageX, startOffsetDays: 0, mode: 'both' });
                                      }
                                    }}
                                  >
                                    {isFirst && durationDays * DAY_WIDTH > 60 ? (
                                      <span className="truncate">{t.status}</span>
                                    ) : (
                                      ''
                                    )}
                                  </div>
                                  {isLast && isDraggable && (
                                    <div
                                      className="resize-handle w-2 sm:w-3 bg-black/10 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/30 cursor-ew-resize shrink-0 z-20 transition-colors"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setTimelineDrag({ task: t, startX: e.pageX, startOffsetDays: 0, mode: 'end' });
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
