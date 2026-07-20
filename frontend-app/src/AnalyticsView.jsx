import React, { useState, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { Avatar } from './SharedUI';

export default function AnalyticsView({
  filteredTasks,
  columns,
  avatarsMap,
  teamMembers,
  currentUser,
  setSelectedTask,
  language,
}) {
  const getISODate = (date) => date.toISOString().split('T')[0];
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);

  const [timeFilter, setTimeFilter] = useState('30'); // 7, 30, 90, all, custom
  const [customStartDate, setCustomStartDate] = useState(getISODate(oneMonthAgo));
  const [customEndDate, setCustomEndDate] = useState(getISODate(today));
  const [activeLines, setActiveLines] = useState({ created: true, progress: false, done: true });
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProvider, setAiProvider] = useState('');

  const analyticsTasks = useMemo(() => {
    if (timeFilter === 'all') return filteredTasks;

    if (timeFilter === 'custom') {
      if (!customStartDate || !customEndDate) return []; // Return empty if range is incomplete
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);

      return filteredTasks.filter((t) => {
        const createdDate = new Date(t.timestamp.replace(/-/g, '/'));
        const completedDate = t.completed_time ? new Date(t.completed_time.replace(/-/g, '/')) : null;
        const relevantStart = createdDate <= end;
        const relevantEnd = !completedDate || completedDate >= start;
        return relevantStart && relevantEnd;
      });
    }

    const days = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);

    return filteredTasks.filter((t) => {
      const createdDate = new Date(t.timestamp.replace(/-/g, '/').split(' ')[0]);
      const completedDate = t.completed_time ? new Date(t.completed_time.replace(/-/g, '/').split(' ')[0]) : null;
      return createdDate >= cutoffDate || (completedDate && completedDate >= cutoffDate) || (t.status !== 'Done' && t.status !== 'Rejected');
    });
  }, [filteredTasks, timeFilter, customStartDate, customEndDate]);

  const tasksWithLivePriority = useMemo(() => {
    const getPriorityLevel = (task) => {
      if (!task.deadline || task.status === 'Done' || task.status === 'Rejected') {
        return task.priority_lvl || 'normal';
      }
      const now = new Date();
      const deadlineDate = new Date(task.deadline.replace(/-/g, '/'));
      const diffHours = (deadlineDate - now) / (1000 * 60 * 60);

      if (diffHours <= 24) {
        return 'critical';
      }
      if (diffHours <= 72) {
        return 'warning';
      }
      return 'normal';
    };

    return analyticsTasks.map((task) => ({
      ...task,
      priority_lvl: getPriorityLevel(task),
    }));
  }, [analyticsTasks]);

  // Advanced Calculations
  const completedTasks = tasksWithLivePriority.filter((t) => {
    if (t.status !== 'Done' || !t.completed_time || !t.timestamp) return false;
    if (timeFilter === 'custom') {
      if (!customStartDate || !customEndDate) return false;
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      const compDate = new Date(t.completed_time.replace(/-/g, '/'));
      return compDate >= start && compDate <= end;
    }
    return true;
  });
  let avgCycleTime = 0;
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce((sum, t) => {
      const start = new Date(t.timestamp.replace(/-/g, '/'));
      const end = new Date(t.completed_time.replace(/-/g, '/'));
      return sum + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    avgCycleTime = Math.round((totalDays / completedTasks.length) * 10) / 10;
  }

  const totalSubtasks = tasksWithLivePriority.reduce((sum, t) => sum + (t.subtask_total || 0), 0);
  const doneSubtasks = tasksWithLivePriority.reduce((sum, t) => sum + (t.subtask_done || 0), 0);
  const subtaskCompletionPct = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

  // Project Health Score Calculation
  // Memfilter tugas yang ditolak agar tidak memengaruhi skor kesehatan
  const healthAnalyticsTasks = tasksWithLivePriority.filter((t) => t.status !== 'Rejected');
  const totalHealthEtc = healthAnalyticsTasks.reduce((sum, t) => sum + (t.etc || 2), 0);
  const doneHealthEtc = healthAnalyticsTasks
    .filter((t) => t.status === 'Done')
    .reduce((sum, t) => sum + (t.etc || 2), 0);
  const activeHealthEtc = healthAnalyticsTasks
    .filter((t) => t.status !== 'Done')
    .reduce((sum, t) => sum + (t.etc || 2), 0);
  const overdueHealthEtc = healthAnalyticsTasks
    .filter((t) => t.priority_lvl === 'critical' && t.status !== 'Done')
    .reduce((sum, t) => sum + (t.etc || 2), 0);

  let projectHealth = 100;
  if (totalHealthEtc > 0) {
    const doneScore = (doneHealthEtc / totalHealthEtc) * 100;
    const wipScore = (activeHealthEtc / totalHealthEtc) * subtaskCompletionPct;
    const overduePenalty = (overdueHealthEtc / totalHealthEtc) * 50; // Penalti berat untuk task critical
    projectHealth = Math.max(0, Math.min(100, Math.round(doneScore + wipScore - overduePenalty)));
  }

  let healthColor = 'text-emerald-500';
  if (projectHealth < 50) healthColor = 'text-red-500';
  else if (projectHealth < 80) healthColor = 'text-amber-500';

  // Dynamic Trend Chart Data
  const { daysCount, trendDays } = useMemo(() => {
    if (timeFilter === 'custom') {
      if (!customStartDate || !customEndDate) return { daysCount: 0, trendDays: [] };
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end - start);
      const count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (count > 365 || count < 2) {
        return { daysCount: 0, trendDays: [] };
      }

      const days = Array.from({ length: count }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      });
      return { daysCount: count, trendDays: days };
    }

    const count = timeFilter === 'all' ? 30 : parseInt(timeFilter);
    const days = Array.from({ length: count }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (count - 1 - i));
      return d;
    });
    return { daysCount: count, trendDays: days };
  }, [timeFilter, customStartDate, customEndDate]);

  const trendData = trendDays.map((d) => {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
      2,
      '0'
    )}`;
    const displayDay =
      daysCount <= 14
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const displayFullDate = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const created = tasksWithLivePriority.filter((t) => t.timestamp && t.timestamp.startsWith(dateStr)).length;
    const done = tasksWithLivePriority.filter((t) => t.completed_time && t.completed_time.startsWith(dateStr)).length;
    const progress = tasksWithLivePriority.filter((t) => {
      const cDate = t.timestamp.split(' ')[0];
      const dDate = t.completed_time ? t.completed_time.split(' ')[0] : '9999-12-31';
      return cDate <= dateStr && dDate > dateStr && t.status !== 'Rejected';
    }).length;

    return { dateStr, displayDay, displayFullDate, created, progress, done };
  });

  const maxTrendVal = Math.max(
    ...trendData.map((d) =>
      Math.max(
        activeLines.created ? d.created : 0,
        activeLines.progress ? d.progress : 0,
        activeLines.done ? d.done : 0
      )
    ),
    4
  );
  const getX = (index) => index * (100 / (daysCount - 1 || 1));
  const getYPct = (val) => 85 - (val / maxTrendVal) * 70;

  // Smart Workload & Insight Logic (Empathy / Workload Support POV)
  const memberDetailedStats = {};
  // Buat lookup set yang case-insensitive untuk performa dan akurasi
  // Gunakan `teamMembers` yang spesifik untuk proyek ini, bukan `avatarsMap` global
  const currentMembersLookup = new Set((teamMembers || []).map((m) => m.toLowerCase()));

  tasksWithLivePriority.forEach((t) => {
    if (t.status === 'Rejected') return; // Abaikan tugas yang ditolak secara keseluruhan untuk analisis beban kerja

    const involvedUsers = new Set();

    if (t.owner_username) involvedUsers.add(t.owner_username);

    if (t.requester) {
      const matches = t.requester.match(/@([\w.-]+)/g);
      if (matches) {
        matches.forEach((m) => involvedUsers.add(m.substring(1)));
      }
    }

    if (t.subtask_details) {
      const lines = t.subtask_details.split('\n');
      lines.forEach((line) => {
        const match = line.match(/\(@([\w.-]+)\)$/);
        if (match) involvedUsers.add(match[1]);
      });
    }

    // DISTRIBUSI BEBAN KERJA: Membagi rata total ETC tugas ke semua orang yang terlibat
    const validUsers = Array.from(involvedUsers).filter(
      (p) => p && p.toLowerCase() !== 'unassigned' && currentMembersLookup.has(p.toLowerCase())
    );
    const divisor = validUsers.length > 0 ? validUsers.length : 1;
    const splitEtc = (t.etc || 2) / divisor;

    validUsers.forEach((person) => {
      if (!memberDetailedStats[person]) {
        memberDetailedStats[person] = {
          total: 0,
          total_etc: 0,
          done: 0,
          done_etc: 0,
          active: 0,
          active_etc: 0,
          critical: 0,
        };
      }

      memberDetailedStats[person].total += 1;
      memberDetailedStats[person].total_etc += splitEtc;

      if (t.status === 'Done') {
        memberDetailedStats[person].done += 1;
        memberDetailedStats[person].done_etc += splitEtc;
      } else {
        if (t.status !== 'Pending') {
          memberDetailedStats[person].active += 1;
          memberDetailedStats[person].active_etc += splitEtc;
        }
        if (t.priority_lvl === 'critical') memberDetailedStats[person].critical += 1;
      }
    });
  });

  let maxActiveEtc = 0;
  let maxCritical = 0;

  // 1. Cari nilai absolut tertinggi untuk menentukan tingkat bahaya (Threshold)
  Object.entries(memberDetailedStats).forEach(([member, stats]) => {
    const pendingEtc = stats.total_etc - stats.done_etc; // Active + Pending Work in Hours
    if (pendingEtc > maxActiveEtc) maxActiveEtc = pendingEtc;
    if (stats.critical > maxCritical) maxCritical = stats.critical;
  });

  // 2. Kumpulkan SEMUA orang yang melebihi batas bahaya (Threshold Based)
  // Standard work week is 40 hours. If pending ETC is >= 32 (4 days), consider heavily loaded.
  const etcThreshold = maxActiveEtc >= 40 ? 40 : maxActiveEtc >= 32 ? 32 : maxActiveEtc >= 24 ? 24 : Infinity;
  const criticalThreshold = 1; // Siapapun yang punya >= 1 Critical Task akan diangkat

  let topMembers = [];
  let topCriticalMembers = [];

  Object.entries(memberDetailedStats).forEach(([member, stats]) => {
    const pendingEtc = stats.total_etc - stats.done_etc;
    if (pendingEtc >= etcThreshold && etcThreshold <= maxActiveEtc) topMembers.push(member);
    if (stats.critical >= criticalThreshold) topCriticalMembers.push(member);
  });

  // --- NEW ADVANCED INSIGHTS CALCULATIONS (1-4) ---

  // 1. On-Time Delivery Rate (SLA)
  let onTimeCount = 0;
  completedTasks.forEach((t) => {
    if (t.deadline) {
      const doneDate = new Date(t.completed_time.replace(/-/g, '/')).getTime();
      const deadlineDate = new Date(t.deadline.replace(/-/g, '/')).getTime();
      if (doneDate <= deadlineDate) onTimeCount++;
    } else {
      onTimeCount++; // If no deadline, technically on time
    }
  });
  const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeCount / completedTasks.length) * 100) : 0;
  let onTimeColor = 'text-emerald-500';
  if (onTimeRate < 60) onTimeColor = 'text-red-500';
  else if (onTimeRate < 85) onTimeColor = 'text-amber-500';

  // 2. Cycle Time Breakdown by Category
  const ctByCat = {};
  completedTasks.forEach((t) => {
    const cat = t.category || 'Uncategorized';
    const s = new Date(t.timestamp.replace(/-/g, '/'));
    const e = new Date(t.completed_time.replace(/-/g, '/'));
    const days = (e - s) / (1000 * 60 * 60 * 24);
    if (!ctByCat[cat]) ctByCat[cat] = { sum: 0, count: 0 };
    ctByCat[cat].sum += days;
    ctByCat[cat].count += 1;
  });
  const cycleTimeData = Object.entries(ctByCat)
    .map(([cat, data]) => ({ category: cat, avgDays: Math.round((data.sum / data.count) * 10) / 10 }))
    .sort((a, b) => b.avgDays - a.avgDays);
  const maxCycleTime = cycleTimeData.length > 0 ? cycleTimeData[0].avgDays : 1;

  // 3. Velocity Leaderboard (Top Performers)
  const velocityLeaderboard = Object.entries(memberDetailedStats)
    .map(([member, stats]) => ({ member, done: stats.done_etc }))
    .filter((m) => m.done > 0)
    .sort((a, b) => b.done - a.done)
    .slice(0, 5);

  // 4. Bottleneck Radar (Stalled Tasks)
  const activeTasksForRadar = tasksWithLivePriority.filter((t) => t.status !== 'Done' && t.status !== 'Rejected');
  const bottleneckThreshold = Math.max(avgCycleTime * 1.5, 5); // At least 5 days, or 1.5x average cycle time
  const stalledTasks = activeTasksForRadar
    .map((t) => {
      const start = new Date((t.start_date || t.timestamp).replace(/-/g, '/'));
      const daysOpen = Math.round((today - start) / (1000 * 60 * 60 * 24));
      return { ...t, daysOpen };
    })
    .filter((t) => t.daysOpen > bottleneckThreshold)
    .sort((a, b) => b.daysOpen - a.daysOpen)
    .slice(0, 5);

  // Fungsi pembuat kalimat dinamis (contoh: "@alice, @bob, and @charlie")
  const formatNames = (names) => {
    if (!names || names.length === 0) return '';
    if (names.length === 1) return `@${names[0]}`;
    if (names.length === 2) return `@${names[0]} and @${names[1]}`;
    return (
      names
        .map((n) => `@${n}`)
        .slice(0, -1)
        .join(', ') + `, and @${names[names.length - 1]}`
    );
  };

  // Fungsi untuk menampilkan rentang angka (misal: "4-7" atau "5")
  const getTaskRangeStr = (membersArr, isCritical = false) => {
    if (membersArr.length === 0) return '0';
    if (isCritical) {
      const counts = membersArr.map((m) => memberDetailedStats[m].critical);
      const minC = Math.min(...counts);
      const maxC = Math.max(...counts);
      return minC === maxC ? `${maxC}` : language === 'id' ? `hingga ${maxC}` : `up to ${maxC}`;
    } else {
      const counts = membersArr.map((m) => memberDetailedStats[m].total_etc - memberDetailedStats[m].done_etc);
      const minC = Math.round(Math.min(...counts) * 10) / 10;
      const maxC = Math.round(Math.max(...counts) * 10) / 10;
      return minC === maxC ? `${maxC}h` : language === 'id' ? `hingga ${maxC}h` : `up to ${maxC}h`;
    }
  };

  let insightMsg =
    language === 'id'
      ? 'Beban kerja tim Anda terlihat sangat seimbang. Semua orang bekerja dengan kecepatan yang sehat!'
      : "Your team's workload looks nicely balanced. Everyone is operating at a healthy pace!";
  let insightIcon = '✨';
  let insightColor =
    'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-200 border-emerald-200/70 dark:border-emerald-800/50';

  const topMembersStr = formatNames(topMembers);
  const topCriticalStr = formatNames(topCriticalMembers);
  const isSamePeople = JSON.stringify(topMembers.sort()) === JSON.stringify(topCriticalMembers.sort());
  const taskRangeStr = getTaskRangeStr(topMembers, false);
  const criticalRangeStr = getTaskRangeStr(topCriticalMembers, true);

  if (maxActiveEtc >= 40 && maxCritical > 0) {
    insightIcon = '🚨';
    insightColor =
      'bg-red-50/50 dark:bg-red-900/10 text-red-900 dark:text-red-200 border-red-200/70 dark:border-red-800/50';
    if (isSamePeople) {
      const allAreCriticalOnly = topMembers.length > 0 && topMembers.every((m) => memberDetailedStats[m].critical > 0);
      if (allAreCriticalOnly) {
        insightMsg =
          language === 'id'
            ? `Peringatan Kritis! ${topMembersStr} sangat kewalahan dengan ${taskRangeStr} tugas aktif, dan SEMUANYA memiliki tenggat waktu kritis! Mereka butuh bantuan segera!`
            : `Critical Alert! ${topMembersStr} ${
                topMembers.length > 1 ? 'are' : 'is'
              } severely overloaded with ${taskRangeStr} active tasks, and ALL of them are critical deadlines! They need immediate backup right now!`;
      } else {
        insightMsg =
          language === 'id'
            ? `Peringatan Kritis! ${topMembersStr} sangat kewalahan dengan ${taskRangeStr} tugas aktif, termasuk ${criticalRangeStr} tenggat waktu kritis. Mereka butuh bantuan segera!`
            : `Critical Alert! ${topMembersStr} ${
                topMembers.length > 1 ? 'are' : 'is'
              } severely overloaded with ${taskRangeStr} active tasks, including ${criticalRangeStr} critical deadline(s). They need immediate backup!`;
      }
    } else {
      insightMsg =
        language === 'id'
          ? `Peringatan Tim! ${topMembersStr} kewalahan dengan ${taskRangeStr} tugas aktif, sementara ${topCriticalStr} menghadapi ${criticalRangeStr} tenggat waktu kritis. Redistribusi beban kerja sangat disarankan segera!`
          : `Team Alert! ${topMembersStr} ${
              topMembers.length > 1 ? 'are' : 'is'
            } overwhelmed with ${taskRangeStr} active tasks, while ${topCriticalStr} ${
              topCriticalMembers.length > 1 ? 'are' : 'is'
            } facing ${criticalRangeStr} critical deadline(s). Immediate workload redistribution is highly recommended!`;
    }
  } else if (maxCritical > 0) {
    insightMsg =
      language === 'id'
        ? `Perhatian! ${topCriticalStr} memiliki ${criticalRangeStr} tugas kritis/terlambat. Mereka mungkin butuh bantuan segera untuk memperlancar pekerjaan.`
        : `Attention! ${topCriticalStr} ${
            topCriticalMembers.length > 1 ? 'have' : 'has'
          } ${criticalRangeStr} critical/overdue task(s). They might need immediate backup to clear the bottleneck.`;
    insightIcon = '🚨';
    insightColor =
      'bg-red-50/50 dark:bg-red-900/10 text-red-900 dark:text-red-200 border-red-200/70 dark:border-red-800/50';
  } else if (maxActiveEtc >= 24) {
    insightMsg =
      language === 'id'
        ? `Sepertinya ${topMembersStr} saat ini memikul beban berat dengan ${taskRangeStr} tugas aktif. Pertimbangkan untuk memeriksa atau membagikan ulang beberapa tugas untuk mendukung mereka!`
        : `It looks like ${topMembersStr} ${
            topMembers.length > 1 ? 'are' : 'is'
          } currently carrying a heavy load with ${taskRangeStr} active requests. Consider checking in or redistributing some tasks to support them!`;
    insightIcon = '🤝';
    insightColor =
      'bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-900 dark:text-indigo-200 border-indigo-200/70 dark:border-indigo-800/50';
  }

  const handleGenerateGeminiInsight = async () => {
    setIsGeneratingAi(true);

    const completionRate = totalHealthEtc > 0 ? Math.round((doneHealthEtc / totalHealthEtc) * 100) : 0;

    const taskByStatus = columns.reduce((acc, status) => {
      acc[status] = tasksWithLivePriority.filter((t) => t.status === status).length;
      return acc;
    }, {});

    const taskByCategory = tasksWithLivePriority.reduce((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const activeTaskPriority = activeTasksForRadar.reduce(
      (acc, t) => {
        const prio = t.priority_lvl || 'normal';
        acc[prio] = (acc[prio] || 0) + 1;
        return acc;
      },
      { critical: 0, warning: 0, normal: 0 }
    );

    const statsForAI = {
      projectHealth: `${projectHealth}%`,
      systemAlert: insightMsg,
      totalTasks: tasksWithLivePriority.length,
      totalHoursETC: totalHealthEtc,
      completedHoursETC: doneHealthEtc,
      activeHoursETC: activeHealthEtc,
      completedTasks: tasksWithLivePriority.filter((t) => t.status === 'Done').length,
      activeTasks: tasksWithLivePriority.filter((t) => t.status !== 'Done' && t.status !== 'Rejected').length,
      overdueTasks: tasksWithLivePriority.filter(
        (t) => t.priority_lvl === 'critical' && t.status !== 'Done' && t.status !== 'Rejected'
      ).length,
      completionRate: `${completionRate}%`,
      onTimeSLA: `${onTimeRate}%`,
      avgCycleTime: `${avgCycleTime} days`,
      subtaskCompletion: `${subtaskCompletionPct}%`,
      topPerformers: topMembers,
      bottleneckTasks: stalledTasks.length,
      taskByStatus,
      taskByCategory,
      activeTaskPriority,
      cycleByCategory: cycleTimeData.reduce((acc, c) => {
        acc[c.category] = `${c.avgDays} days`;
        return acc;
      }, {}),
      teamWorkload: Object.entries(memberDetailedStats).reduce((acc, [member, stats]) => {
        acc[member] = {
          total: stats.total_etc,
          done: stats.done_etc,
          active: stats.active_etc,
          critical: stats.critical,
        };
        return acc;
      }, {}),
    };
    const prompt = `You are a professional Project Manager AI Assistant for INNOCEAN Tracker. Analyze these workspace stats for the last ${timeFilter} days: ${JSON.stringify(
      statsForAI
    )}. Write a 2 to 3 sentence insightful, encouraging, and analytical summary for the team that uncovers hidden trends from the data. Do NOT just paraphrase the systemAlert. Focus on cycle times, completion rates, or bottlenecks. Keep it professional but modern. You can use markdown like bold text. Please respond strictly in ${
      language === 'id' ? 'Indonesian' : 'English'
    }.`;

    try {
      const res = await axios.post('/api/ai/generate', { prompt });
      setAiInsight(res.data.text);
      setAiProvider(res.data.provider || 'AI');
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      setAiInsight(
        errorDetail
          ? `⚠️ AI Error: ${errorDetail}`
          : '⚠️ Failed to reach Gemini AI. Please ensure your Admin has configured the GEMINI_API_KEY in the server.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* 1. Rule-Based System Insight */}
        <div
          className={`summary-card p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all ${insightColor}`}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl leading-none">{insightIcon}</div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">
              {language === 'id' ? 'Peringatan Kesehatan Sistem' : 'System Health Alert'}
            </h4>
          </div>
          <p className="text-sm font-medium leading-relaxed">{insightMsg}</p>
        </div>

        {/* 2. Gemini AI Executive Summary */}
        <div className="summary-card p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-900 dark:text-indigo-200 border-indigo-200/70 dark:border-indigo-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-2xl leading-none">✨</div>
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {language === 'id' ? 'Ringkasan Eksekutif AI' : 'Executive AI Summary'}{' '}
                {aiProvider && `• ${aiProvider}`}
              </h4>
            </div>
            {!aiInsight && (
              <button
                onClick={handleGenerateGeminiInsight}
                disabled={isGeneratingAi}
                className="text-xs font-bold bg-indigo-600 text-white px-5 py-2 rounded-full shadow-sm hover:bg-indigo-700 transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isGeneratingAi
                  ? language === 'id'
                    ? 'Membuat...'
                    : 'Generating...'
                  : language === 'id'
                  ? '✨ Buat Ringkasan AI'
                  : '✨ Generate Insight'}
              </button>
            )}
          </div>
          {isGeneratingAi ? (
            <div className="animate-pulse flex flex-col gap-2 mt-1">
              <div className="h-3 bg-indigo-200 dark:bg-indigo-800/50 rounded w-full"></div>
              <div className="h-3 bg-indigo-200 dark:bg-indigo-800/50 rounded w-4/5"></div>
            </div>
          ) : aiInsight ? (
            <p
              className="text-sm font-medium leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: String(aiInsight).replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>'),
              }}
            ></p>
          ) : (
            <p className="text-sm font-medium opacity-70 italic mt-1">
              {language === 'id'
                ? 'Klik buat untuk mendapatkan analisis AI mendalam tentang beban kerja Anda saat ini.'
                : 'Click generate to get a deep-dive AI analysis of your current workload.'}
            </p>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h2 className="overview-title text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tighter">
          Performance Overview
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="timeframe-label text-xs font-bold text-slate-500 uppercase tracking-widest">Timeframe:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold uppercase tracking-widest py-2 px-4 rounded-xl shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all [&>option]:bg-white dark:[&>option]:bg-slate-800 w-full sm:w-auto"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full"
              />
              <span className="text-xs font-bold text-slate-500">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Project Health</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-0 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Overall workspace health score combining global completion and micro-progress, weighted by Estimated
                  Time Consumption (ETC).
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  (Done ETC% + WIP ETC%) - Overdue Penalty
                </p>
                <div className="absolute bottom-full left-2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-extrabold ${healthColor}`}>{projectHealth}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Total Tasks</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Total number of tasks matching the current workspace and timeframe filters.
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  Count(Filtered Tasks)
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
            {tasksWithLivePriority.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Active / WIP</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Tasks that are active and currently being worked on.
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  Count(Status ∉ ['Done', 'Rejected', 'Pending'])
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {
              tasksWithLivePriority.filter(
                (t) => t.status !== 'Done' && t.status !== 'Rejected' && t.status !== 'Pending'
              ).length
            }
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Completed</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Tasks that have been successfully finished.
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  Count(Status == 'Done')
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {tasksWithLivePriority.filter((t) => t.status === 'Done').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Overdue</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Active tasks that are critically approaching deadline or overdue.
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  Count(Status != 'Done' & Priority == 'Critical')
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-500">
            {
              tasksWithLivePriority.filter(
                (t) => t.priority_lvl === 'critical' && t.status !== 'Done' && t.status !== 'Rejected'
              ).length
            }
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Completion Rate</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Percentage of successfully finished tasks based on total Estimated Time Consumption (ETC).
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  (Completed ETC / Total ETC) × 100%
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">
            {totalHealthEtc > 0 ? Math.round((doneHealthEtc / totalHealthEtc) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Avg Cycle Time</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Average number of days taken to complete a task from creation to done.
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  Σ(Done Date - Start Date) / Completed Tasks
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-500">
            {avgCycleTime} <span className="text-xs sm:text-sm font-bold text-slate-400">days</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Sub-task Comp.</p>
            <div className="relative group/tooltip flex items-center">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full right-0 mt-3 w-56 sm:w-64 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium mb-2 pb-2 border-b border-slate-700/50 dark:border-slate-200/50 leading-relaxed">
                  Percentage of completed checklists across all tasks.
                </p>
                <p className="font-bold text-[8px] opacity-50 uppercase tracking-widest mb-1">Logic / Method</p>
                <p className="font-mono text-[9px] bg-black/20 dark:bg-black/5 p-1.5 rounded wrap-break-word">
                  (Total Done Subtasks / Total Subtasks) × 100%
                </p>
                <div className="absolute bottom-full right-2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-500">{subtaskCompletionPct}%</p>
        </div>
      </div>

      {/* TREND LINE CHART (Full Width) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:z-50 transition-all duration-300 lg:col-span-full">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Activity Trend{' '}
                  {timeFilter === 'all' ? '(Last 30 Days)' : timeFilter !== 'custom' ? `(Last ${timeFilter} Days)` : ''}
                </h3>
                <div className="relative group/tooltip flex items-center">
                  <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                    🛈
                  </span>
                  <div className="hidden sm:block absolute top-full left-0 mt-3 w-56 sm:w-64 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                    <p className="font-medium leading-relaxed">
                      Shows task volumes over time. Click the metric buttons to toggle visibility on the chart.
                    </p>
                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <button
                onClick={() => setActiveLines((prev) => ({ ...prev, created: !prev.created }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 select-none ${
                  activeLines.created
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 grayscale opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Created
              </button>
              <button
                onClick={() => setActiveLines((prev) => ({ ...prev, progress: !prev.progress }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 select-none ${
                  activeLines.progress
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 grayscale opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Active / WIP
              </button>
              <button
                onClick={() => setActiveLines((prev) => ({ ...prev, done: !prev.done }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 select-none ${
                  activeLines.done
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 grayscale opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed
              </button>
            </div>
          </div>

          {daysCount === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500 font-bold">
                {language === 'id'
                  ? 'Rentang tanggal tidak valid atau terlalu besar (maks 365 hari).'
                  : 'Invalid date range or range is too large (max 365 days).'}
              </p>
            </div>
          )}
          {daysCount > 0 && <div className="w-full relative mt-4 overflow-x-auto custom-scrollbar pb-4 -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-175 xl:min-w-full w-full relative pt-2">
              {hoveredIdx !== null && (
                <div
                  className={`absolute z-50 pointer-events-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-3.5 text-xs min-w-37.5 transform ${
                    hoveredIdx < 3
                      ? 'translate-x-0'
                      : hoveredIdx > daysCount - 4
                      ? '-translate-x-full'
                      : '-translate-x-1/2'
                  } transition-all duration-75 ease-out`}
                  style={{
                    left: hoveredIdx < 3 ? '0%' : hoveredIdx > daysCount - 4 ? '100%' : `${getX(hoveredIdx)}%`,
                    top: '0px',
                  }}
                >
                  <div className="font-bold text-slate-800 dark:text-white mb-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    {trendData[hoveredIdx].displayFullDate}
                  </div>
                  <div className="space-y-2.5">
                    {activeLines.created && (
                      <div className="flex justify-between items-center gap-4">
                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Created
                        </span>
                        <span className="font-black text-slate-800 dark:text-white">
                          {trendData[hoveredIdx].created}
                        </span>
                      </div>
                    )}
                    {activeLines.progress && (
                      <div className="flex justify-between items-center gap-4">
                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div> Active
                        </span>
                        <span className="font-black text-slate-800 dark:text-white">
                          {trendData[hoveredIdx].progress}
                        </span>
                      </div>
                    )}
                    {activeLines.done && (
                      <div className="flex justify-between items-center gap-4">
                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed
                        </span>
                        <span className="font-black text-slate-800 dark:text-white">{trendData[hoveredIdx].done}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <svg className="w-full h-64 overflow-visible" onMouseLeave={() => setHoveredIdx(null)}>
                <line
                  x1="0%"
                  y1={`${getYPct(maxTrendVal)}%`}
                  x2="100%"
                  y2={`${getYPct(maxTrendVal)}%`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-700"
                  strokeDasharray="4 4"
                />
                <line
                  x1="0%"
                  y1={`${getYPct(maxTrendVal / 2)}%`}
                  x2="100%"
                  y2={`${getYPct(maxTrendVal / 2)}%`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-700"
                  strokeDasharray="4 4"
                />
                <line
                  x1="0%"
                  y1={`${getYPct(0)}%`}
                  x2="100%"
                  y2={`${getYPct(0)}%`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-700"
                />

                <text
                  x="0%"
                  y={`${getYPct(maxTrendVal)}%`}
                  dy="-6"
                  fontSize="11"
                  fill="currentColor"
                  className="text-slate-400 font-bold"
                  textAnchor="start"
                >
                  {maxTrendVal}
                </text>
                <text
                  x="0%"
                  y={`${getYPct(maxTrendVal / 2)}%`}
                  dy="-6"
                  fontSize="11"
                  fill="currentColor"
                  className="text-slate-400 font-bold"
                  textAnchor="start"
                >
                  {Math.round(maxTrendVal / 2)}
                </text>
                <text
                  x="0%"
                  y={`${getYPct(0)}%`}
                  dy="-6"
                  fontSize="11"
                  fill="currentColor"
                  className="text-slate-400 font-bold"
                  textAnchor="start"
                >
                  0
                </text>

                {hoveredIdx !== null && (
                  <line
                    x1={`${getX(hoveredIdx)}%`}
                    y1="5%"
                    x2={`${getX(hoveredIdx)}%`}
                    y2="95%"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-300 dark:text-slate-600"
                    strokeDasharray="4 4"
                    pointerEvents="none"
                  />
                )}

                {activeLines.created &&
                  trendData
                    .slice(0, -1)
                    .map((d, i) => (
                      <line
                        key={`c-${i}`}
                        x1={`${getX(i)}%`}
                        y1={`${getYPct(d.created)}%`}
                        x2={`${getX(i + 1)}%`}
                        y2={`${getYPct(trendData[i + 1].created)}%`}
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                        pointerEvents="none"
                      />
                    ))}
                {activeLines.progress &&
                  trendData
                    .slice(0, -1)
                    .map((d, i) => (
                      <line
                        key={`p-${i}`}
                        x1={`${getX(i)}%`}
                        y1={`${getYPct(d.progress)}%`}
                        x2={`${getX(i + 1)}%`}
                        y2={`${getYPct(trendData[i + 1].progress)}%`}
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        pointerEvents="none"
                      />
                    ))}
                {activeLines.done &&
                  trendData
                    .slice(0, -1)
                    .map((d, i) => (
                      <line
                        key={`d-${i}`}
                        x1={`${getX(i)}%`}
                        y1={`${getYPct(d.done)}%`}
                        x2={`${getX(i + 1)}%`}
                        y2={`${getYPct(trendData[i + 1].done)}%`}
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        pointerEvents="none"
                      />
                    ))}

                {trendData.map((d, i) => {
                  const showText = daysCount <= 14 || i % Math.ceil(daysCount / 7) === 0 || i === daysCount - 1;
                  const isHovered = hoveredIdx === i;
                  return (
                    <g key={i}>
                      {activeLines.created && (
                        <circle
                          cx={`${getX(i)}%`}
                          cy={`${getYPct(d.created)}%`}
                          r={isHovered ? '6' : '4'}
                          className="fill-white dark:fill-slate-800 transition-all pointer-events-none"
                          stroke="#6366f1"
                          strokeWidth="2"
                        />
                      )}
                      {activeLines.progress && (
                        <circle
                          cx={`${getX(i)}%`}
                          cy={`${getYPct(d.progress)}%`}
                          r={isHovered ? '6' : '4'}
                          className="fill-white dark:fill-slate-800 transition-all pointer-events-none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                      )}
                      {activeLines.done && (
                        <circle
                          cx={`${getX(i)}%`}
                          cy={`${getYPct(d.done)}%`}
                          r={isHovered ? '6' : '4'}
                          className="fill-white dark:fill-slate-800 transition-all pointer-events-none"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                      )}

                      {showText && (
                        <text
                          x={`${getX(i)}%`}
                          y="100%"
                          fontSize="11"
                          fill="currentColor"
                          textAnchor={i === 0 ? 'start' : i === daysCount - 1 ? 'end' : 'middle'}
                          className={`font-bold tracking-widest transition-colors pointer-events-none ${
                            isHovered ? 'text-black dark:text-white' : 'text-slate-500'
                          }`}
                        >
                          {d.displayDay.toUpperCase()}
                        </text>
                      )}

                      <rect
                        x={`${getX(i) - 100 / (daysCount - 1 || 1) / 2}%`}
                        y="0%"
                        width={`${100 / (daysCount - 1 || 1)}%`}
                        height="100%"
                        fill="transparent"
                        className="cursor-crosshair outline-none"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onClick={() => setHoveredIdx(i)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>}
        </div>
      </div>

      {/* ADVANCED INSIGHTS ROW (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        {/* 1. On-Time Delivery Rate (SLA) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">On-Time SLA</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-0 mt-3 w-56 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  Percentage of tasks delivered before or strictly on their target deadline date.
                </p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <p className={`text-6xl font-black tracking-tighter ${onTimeColor}`}>{onTimeRate}%</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4 text-center">
              <span className="text-slate-800 dark:text-white">{onTimeCount}</span> of {completedTasks.length} Delivered
              On Schedule
            </p>
          </div>
        </div>

        {/* 2. Velocity Leaderboard */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top Performers</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-0 mt-3 w-56 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  The most productive members based on total Estimated Time Consumption (ETC) delivered.
                </p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {velocityLeaderboard.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm italic text-center py-4">
                No completed tasks yet.
              </p>
            ) : (
              velocityLeaderboard.map((u, i) => (
                <div
                  key={u.member}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-lg">
                      {i === 0 ? (
                        '🥇'
                      ) : i === 1 ? (
                        '🥈'
                      ) : i === 2 ? (
                        '🥉'
                      ) : (
                        <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                      )}
                    </div>
                    <Avatar
                      name={u.member}
                      url={avatarsMap[u.member.replace('@', '').trim()]}
                      size="w-8 h-8"
                      textClass="text-[10px]"
                    />
                    <span
                      className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-25"
                      title={u.member}
                    >
                      {u.member}
                    </span>
                  </div>
                  <span className="text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2 py-1 rounded-md">
                    {u.done.toFixed(1)}h <span className="opacity-50 font-medium">Delivered</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Cycle Time Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cycle by Category</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-0 mt-3 w-56 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  Breakdown of average days taken to complete a task, grouped by category type.
                </p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {cycleTimeData.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm italic text-center py-4">No data available.</p>
            ) : (
              cycleTimeData.map((c) => {
                const pct = (c.avgDays / maxCycleTime) * 100;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-35">{c.category}</span>
                      <span className="text-slate-500 dark:text-slate-400">{c.avgDays} days</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Bottleneck Radar */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bottleneck Radar</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full right-0 mt-3 w-56 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  Identifies active tasks that have been open abnormally longer than the average cycle time (
                  {Math.round(bottleneckThreshold)} days limit).
                </p>
                <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {stalledTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 opacity-70">
                <span className="text-4xl mb-2">✨</span>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest text-center">
                  Zero Bottlenecks.
                  <br />
                  Tasks flowing smoothly!
                </p>
              </div>
            ) : (
              stalledTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask && setSelectedTask(t)}
                  className="p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all"
                >
                  <p
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-1"
                    title={t.project_name}
                  >
                    {t.project_name}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-25">{t.requester}</span>
                    <span className="text-[9px] font-black bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                      Open {t.daysOpen} Days
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visual Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Task by Status</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  Shows the distribution of tasks across different workflow columns to track overall project progress.
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            {columns.map((status) => {
              const count = tasksWithLivePriority.filter((t) => t.status === status).length;
              const pct = tasksWithLivePriority.length > 0 ? (count / tasksWithLivePriority.length) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">{status}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        status === 'Done'
                          ? 'bg-emerald-500'
                          : status === 'Rejected'
                          ? 'bg-slate-400'
                          : status === 'Pending'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Task by Category</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  Breaks down tasks by category. Helps identify which type of work consumes the most resources.
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="space-y-5 max-h-64 overflow-y-auto pr-2">
            {Object.entries(
              tasksWithLivePriority.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const pct = tasksWithLivePriority.length > 0 ? (count / tasksWithLivePriority.length) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="text-slate-500 dark:text-slate-400">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-indigo-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            {tasksWithLivePriority.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500 text-sm italic">No data available.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Active Task Priority</h3>
            <div className="relative group/tooltip flex items-center z-50">
              <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                🛈
              </span>
              <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 sm:w-64 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                <p className="font-medium leading-relaxed">
                  Displays the urgency of active tasks. Critical tasks are due within 24h, Warning within 3 days.
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
              </div>
            </div>
          </div>
          <div className="space-y-5 max-h-64 overflow-y-auto pr-2">
            {(() => {
              const activeTasks = tasksWithLivePriority.filter((t) => t.status !== 'Done' && t.status !== 'Rejected');
              const prioCounts = { critical: 0, warning: 0, normal: 0 };
              activeTasks.forEach((t) => {
                if (t.priority_lvl) prioCounts[t.priority_lvl] = (prioCounts[t.priority_lvl] || 0) + 1;
                else prioCounts.normal += 1;
              });

              return [
                { label: '🔴 Critical', count: prioCounts.critical, color: 'bg-red-500' },
                { label: '🟡 Warning', count: prioCounts.warning, color: 'bg-amber-500' },
                { label: '🟢 Normal', count: prioCounts.normal, color: 'bg-emerald-500' },
              ].map((prio) => {
                const pct = activeTasks.length > 0 ? (prio.count / activeTasks.length) * 100 : 0;
                return (
                  <div key={prio.label}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">{prio.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {prio.count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`${prio.color} h-3 rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              });
            })()}
            {tasksWithLivePriority.filter((t) => t.status !== 'Done' && t.status !== 'Rejected').length === 0 && (
              <p className="text-slate-400 dark:text-slate-500 text-sm italic">No active tasks available.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Team Workload</h3>
              <div className="relative group/tooltip flex items-center z-50">
                <span className="cursor-help text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors">
                  🛈
                </span>
                <div className="hidden sm:block absolute top-full left-0 mt-3 w-72 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-100 text-left pointer-events-none whitespace-normal border border-slate-700 dark:border-slate-200">
                  <p className="font-medium leading-relaxed">
                    Tracks each member's work volume. It flags them as overloaded (⚠️) if their CURRENT active backlog
                    exceeds a 40-hour work week, or if their TOTAL assigned work in the selected period exceeds a
                    160-hour monthly capacity.
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900 dark:border-b-white"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Active
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Wait
              </span>
            </div>
          </div>
          <div className="space-y-5 max-h-64 overflow-y-auto pr-2">
            {(() => {
              return Object.entries(memberDetailedStats)
                .sort((a, b) => {
                  // Urutkan berdasarkan beban aktif terberat di atas untuk mencari bottleneck
                  const activeA = a[1].total_etc - a[1].done_etc;
                  const activeB = b[1].total_etc - b[1].done_etc;
                  return activeB - activeA;
                })
                .map(([assignee, stats]) => {
                  const donePct = (stats.done_etc / stats.total_etc) * 100;
                  const activePct = (stats.active_etc / stats.total_etc) * 100;
                  const pendingPct = ((stats.total_etc - stats.done_etc - stats.active_etc) / stats.total_etc) * 100;

                  const activeLoad = stats.total_etc - stats.done_etc;
                  const totalLoad = stats.total_etc;
                  const isOverloaded = activeLoad > 40;
                  const isTotalOverloaded = totalLoad > 160;
                  return (
                    <div key={assignee}>
                      <div className="flex justify-between items-center text-sm font-bold mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={assignee}
                            url={avatarsMap[assignee.replace('@', '').trim()]}
                            size="w-5 h-5"
                            textClass="text-[8px]"
                          />
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-30" title={assignee}>
                            {assignee}
                          </span>
                        </div>
                        <div className="flex flex-col items-end leading-none">
                          <span
                            className={`font-black ${
                              isOverloaded ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'
                            }`}
                            title={`Current Active Backlog: ${Math.round(activeLoad * 10) / 10}h`}
                          >
                            {Math.round(activeLoad * 10) / 10}h{' '}
                            <span className="text-[9px] uppercase opacity-70 tracking-widest">
                              Active {isOverloaded && '⚠️'}
                              {' / week'}
                            </span>
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                              isTotalOverloaded ? 'text-red-500' : 'text-slate-400'
                            }`}
                            title={`Total load in this period: ${Math.round(totalLoad * 10) / 10}h`}
                          >
                            {Math.round(totalLoad * 10) / 10}h Total {isTotalOverloaded && '⚠️'}
                            {' / month'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 flex overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-1000"
                          style={{ width: `${donePct}%` }}
                          title={`Done: ${stats.done_etc}h`}
                        ></div>
                        <div
                          className="bg-blue-500 h-full transition-all duration-1000"
                          style={{ width: `${activePct}%` }}
                          title={`In Progress: ${stats.active_etc}h`}
                        ></div>
                        <div
                          className="bg-amber-500 h-full transition-all duration-1000"
                          style={{ width: `${pendingPct}%` }}
                          title={`Pending/Others: ${stats.total_etc - stats.done_etc - stats.active_etc}h`}
                        ></div>
                      </div>
                    </div>
                  );
                });
            })()}
            {tasksWithLivePriority.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500 text-sm italic">No data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
