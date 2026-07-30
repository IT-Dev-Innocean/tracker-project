import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Code2,
  Database,
  FileText,
  GanttChart,
  Layers3,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';

const featureViews = [
  { id: 'kanban', title: 'Kanban Board', icon: ClipboardList, desc: 'Drag-and-drop cards across customizable columns for fast visual project delivery.' },
  { id: 'list', title: 'Table List', icon: Layers3, desc: 'A compact spreadsheet-like view for quick scanning, filtering, and management.' },
  { id: 'timeline', title: 'Gantt Timeline', icon: GanttChart, desc: 'Map project schedules and understand dependencies, durations, and team capacity.' },
  { id: 'calendar', title: 'Smart Calendar', icon: CalendarDays, desc: 'Track deadlines with accurate planning around weekends and national holidays.' },
  { id: 'analytics', title: 'Analytics', icon: TrendingUp, desc: 'Monitor project health, workload distribution, and executive summaries in real time.' },
];

export function LandingAISection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveStep((step) => (step + 1) % 3), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const steps = [
    { icon: MessageCircle, title: 'Tell the AI what you need', desc: 'Write your request naturally without filling a long form.' },
    { icon: Brain, title: 'AI extracts the details', desc: 'Assignees, deadlines, categories, and checklists are structured automatically.' },
    { icon: Rocket, title: 'Tasks appear on your board', desc: 'Review the draft and send organized work directly into your workflow.' },
  ];

  return (
    <>
      <section id="ai-section" className="relative z-10 border-t border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-neutral-950 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="reveal-on-scroll">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" /> Powered by Dual AI Engine
            </div>
            <h2 className="mb-6 text-4xl font-black uppercase leading-[1.05] text-slate-900 dark:text-white md:text-5xl">
              Work smarter, not harder with{' '}
              <span className="bg-gradient-to-r from-slate-600 to-black bg-clip-text text-transparent dark:from-slate-300 dark:to-white">
                AI Assistance.
              </span>
            </h2>
            <p className="mb-8 text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              A context-aware assistant powered by Gemini and GPT-OSS handles repetitive planning so your team can focus on meaningful work.
            </p>
            <div className="space-y-6">
              {[
                [Bot, 'Proactive Task Drafting', 'Transform rough ideas into structured briefs, subtasks, and time estimates.'],
                [FileText, 'Live Meeting Extraction', 'Capture action items from meeting notes and assign work automatically.'],
                [Brain, 'Context-Aware Co-Pilot', 'Get accurate answers based on project briefs, checklists, and discussions.'],
              ].map(([Icon, title, desc], index) => (
                <div key={title} className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                    index === 0 ? 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      : index === 1 ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div><h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-on-scroll relative">
            <div className="relative flex min-h-[540px] items-center justify-center overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-tr from-slate-100 to-slate-50 p-6 shadow-2xl dark:border-slate-800/50 dark:from-slate-800/30 dark:to-slate-900/30 lg:min-h-[650px] lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] opacity-50 [background-size:20px_20px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />
              <div className="absolute h-64 w-64 animate-pulse rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-600/20" />
              <div className="relative w-full max-w-sm space-y-5 rounded-3xl border border-white/50 bg-white/90 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:scale-105 dark:border-slate-700/50 dark:bg-[#0e1116]/90">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black"><Sparkles className="h-4 w-4" /></div>
                  <div><h4 className="text-sm font-bold text-slate-800 dark:text-white">Smart Assistant</h4><span className="text-[10px] font-medium text-indigo-500">Online</span></div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="w-3/4 rounded-2xl rounded-bl-sm bg-slate-100 p-3 text-xs font-medium leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Can you process my meeting notes and create the tasks?
                  </div>
                </div>
                <div className="flex flex-row-reverse items-end gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black"><Sparkles className="h-3 w-3" /></div>
                  <div className="w-[85%] rounded-2xl rounded-br-sm border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-900 dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-200">
                    <div className="mb-3 flex items-center gap-2 font-bold"><Bot className="h-4 w-4" /> Found 3 action items:</div>
                    <div className="mb-4 space-y-2">
                      {['Design new landing page', 'Review copy draft', 'Prepare launch report'].map((task) => (
                        <div key={task} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /><span>{task}</span></div>
                      ))}
                    </div>
                    <button className="flex w-full items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700"><Zap className="h-3.5 w-3.5" /> Create All Tasks</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SectionNext target="how-it-works-section" />
      </section>

      <section id="how-it-works-section" className="relative z-10 overflow-hidden border-t border-slate-200 bg-slate-50 pb-32 pt-20 dark:border-slate-800 dark:bg-black">
        <SectionHeading title="See how it works" description="From a simple thought to an organized workflow in seconds." />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="space-y-3 reveal-on-scroll">
            {steps.map(({ icon: Icon, title, desc }, index) => (
              <button key={title} onClick={() => setActiveStep(index)} className={`w-full rounded-2xl border p-5 text-left transition-all ${
                activeStep === index ? 'scale-[1.02] border-slate-900 bg-white shadow-xl dark:border-slate-100 dark:bg-[#0e1116]' : 'border-transparent opacity-60 hover:bg-neutral-100 hover:opacity-100 dark:hover:bg-neutral-900'
              }`}>
                <h3 className="mb-1.5 flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-white"><Icon className="h-5 w-5" /> {index + 1}. {title}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </button>
            ))}
          </div>
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0e1116] reveal-on-scroll">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/20 dark:to-slate-900/20" />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-neutral-900">
              {activeStep === 0 && <><div className="mb-4 flex items-center gap-3"><Sparkles className="h-5 w-5 text-indigo-500" /><span className="font-bold">Smart Assistant</span></div><p className="text-sm leading-7 text-slate-600 dark:text-slate-300">Extract tasks from today&apos;s meeting, assign the homepage to @johndoe by next Friday and mark the API bug high priority.<span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-indigo-500" /></p></>}
              {activeStep === 1 && <><div className="mb-4 flex items-center gap-2 font-bold"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /> Extracting 3 tasks...</div>{['Redesign Homepage', 'Fix login API bug', 'Update documentation'].map((task, i) => <div key={task} className="mb-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"><p className="text-sm font-bold">{i + 1}. {task}</p><span className="mt-1 inline-block rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">{i === 0 ? '@johndoe' : i === 1 ? '@jane' : 'Unassigned'}</span></div>)}</>}
              {activeStep === 2 && <div className="grid grid-cols-2 gap-3">{['TO DO', 'IN PROGRESS'].map((column, i) => <div key={column} className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800/50"><p className="mb-3 text-[10px] font-bold text-slate-500">{column}</p>{Array.from({ length: i ? 1 : 3 }).map((_, j) => <div key={j} className="mb-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-neutral-950"><div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-700" /><div className="mt-2 h-1.5 w-1/2 rounded bg-slate-200 dark:bg-slate-800" /></div>)}</div>)}</div>}
            </div>
          </div>
        </div>
        <SectionNext target="features-section" />
      </section>
    </>
  );
}

export function LandingFeatures() {
  const [active, setActive] = useState('kanban');

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => featureViews[(featureViews.findIndex((f) => f.id === current) + 1) % featureViews.length].id), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <section id="features-section" className="relative z-10 border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-black md:py-32">
        <SectionHeading title="Built for every workflow" description="Switch seamlessly between multiple views to manage work exactly how you want." />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="space-y-3 reveal-on-scroll">
            {featureViews.map(({ id, title, icon: Icon, desc }) => (
              <button key={id} onClick={() => setActive(id)} className={`w-full rounded-2xl border p-5 text-left transition-all ${active === id ? 'scale-[1.02] border-slate-900 bg-white shadow-xl dark:border-slate-100 dark:bg-[#0e1116]' : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900/50'}`}>
                <h3 className={`mb-2 flex items-center gap-3 text-xl font-bold ${active === id ? 'text-black dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}><Icon className="h-5 w-5" />{title}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </button>
            ))}
          </div>
          <FeatureMockup active={active} />
        </div>
      </section>

      <section id="specs-section" className="relative z-10 border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-neutral-950 md:py-32">
        <SectionHeading eyebrow="Global Infrastructure" title="Enterprise-Grade Architecture" description="More than a to-do list. Built on robust standards to automate operations securely." />
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 reveal-on-scroll">
            {[
              [Code2, 'React 18', 'Tailwind • Vite'],
              [Zap, 'FastAPI', 'Python • SQLAlchemy'],
              [Database, 'PostgreSQL', 'Neon Serverless'],
              [Brain, 'Dual AI', 'Gemini • GPT-OSS'],
              [Rocket, 'Cloud Native', 'Vercel • Render'],
              [ShieldCheck, 'Zero-Trust', 'JWT • Bcrypt • RBAC'],
            ].map(([Icon, title, detail]) => (
              <div key={title} className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-500 dark:border-neutral-800 dark:bg-black">
                <Icon className="mb-3 h-8 w-8" /><span className="text-xs font-black uppercase tracking-widest">{title}</span><span className="mt-1 text-[10px] font-medium text-neutral-500">{detail}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              [ShieldCheck, 'Zero-Trust Security', 'Stateless JWT, secure hashing, and strict role-based access control.'],
              [Clock3, 'Intelligent Workflows', 'Scheduling that understands weekends, holidays, and workload bottlenecks.'],
              [Bot, 'Multi-AI Co-Pilot', 'Dual-engine assistance for task drafting, meetings, and contextual support.'],
              [Users, 'Unified Collaboration', 'Project workspaces, discussions, and direct team communication.'],
              [BarChart3, 'Actionable Analytics', 'Executive reports, project health, and workload visibility.'],
              [Zap, 'High-Performance Engine', 'Optimistic UI and modern infrastructure for immediate interactions.'],
            ].map(([Icon, title, desc]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-[#111827] reveal-on-scroll">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-400"><Icon className="h-6 w-6" /></div>
                <h3 className="mb-2 text-lg font-black">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <SectionNext target="comparison-section" />
      </section>

      <ComparisonSection />
    </>
  );
}

function FeatureMockup({ active }) {
  return (
    <div className="relative h-[440px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0e1116] reveal-on-scroll">
      <div className="flex h-12 items-center gap-1.5 border-b border-slate-100 bg-white/50 px-4 backdrop-blur dark:border-slate-800/50 dark:bg-black/50"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" /></div>
      <div className="h-[calc(100%_-_3rem)] bg-slate-50/50 p-5 dark:bg-slate-900/50">
        {active === 'kanban' && <div className="grid h-full grid-cols-3 gap-3">{['Pending', 'In Progress', 'Done'].map((title, i) => <div key={title} className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800/50"><p className="mb-3 text-[10px] font-bold text-slate-500">{title}</p>{Array.from({ length: 3 - i }).map((_, j) => <div key={j} className="mb-3 h-16 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-700" />)}</div>)}</div>}
        {active === 'list' && <div className="space-y-2">{['TASK', 'ASSIGNEE', 'STATUS', 'DEADLINE'].map((heading, i) => i === 0 && <div key={heading} className="grid grid-cols-4 gap-3 px-3 text-[9px] font-bold text-slate-400">{['TASK', 'ASSIGNEE', 'STATUS', 'DEADLINE'].map((h) => <span key={h}>{h}</span>)}</div>)}{Array.from({ length: 6 }).map((_, i) => <div key={i} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">{Array.from({ length: 4 }).map((__, j) => <div key={j} className="h-2 rounded bg-slate-200 dark:bg-slate-700" />)}</div>)}</div>}
        {active === 'timeline' && <div className="space-y-5 pt-8">{['Design', 'Frontend', 'Backend', 'Testing'].map((role, i) => <div key={role} className="grid grid-cols-[80px_1fr] items-center gap-3"><span className="text-xs font-bold text-slate-500">{role}</span><div className="relative h-8 rounded-lg bg-slate-100 dark:bg-slate-800"><div className={`absolute bottom-1 top-1 rounded-md ${['left-[5%] w-[35%] bg-indigo-500','left-[25%] w-[45%] bg-emerald-500','left-[40%] w-[35%] bg-amber-500','left-[70%] w-[25%] bg-blue-500'][i]}`} /></div></div>)}</div>}
        {active === 'calendar' && <div className="grid h-full grid-cols-7 gap-1">{Array.from({ length: 35 }).map((_, i) => <div key={i} className={`rounded-lg border ${[10, 11, 17, 24].includes(i) ? 'border-indigo-200 bg-indigo-100 dark:border-indigo-800/50 dark:bg-indigo-900/40' : 'border-slate-100 bg-white dark:border-slate-800/50 dark:bg-slate-800/20'}`} />)}</div>}
        {active === 'analytics' && <div className="flex h-full items-center gap-8 px-8"><div className="relative flex aspect-square w-2/5 items-center justify-center rounded-full border-[14px] border-indigo-100 dark:border-indigo-900/40"><div className="absolute inset-[-14px] rotate-45 rounded-full border-[14px] border-indigo-500 border-b-transparent border-r-transparent" /><span className="text-2xl font-black">76%</span></div><div className="flex-1 space-y-6">{[['Completed','w-[76%] bg-emerald-500'],['In Progress','w-[45%] bg-blue-500'],['Pending','w-[20%] bg-amber-500']].map(([label, style]) => <div key={label}><p className="mb-2 text-xs font-bold text-slate-500">{label}</p><div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className={`h-full rounded-full ${style}`} /></div></div>)}</div></div>}
      </div>
    </div>
  );
}

function ComparisonSection() {
  const rows = [
    ['AI task drafting', true, false, 'Limited'],
    ['Cross-project workload', true, false, true],
    ['Integrated collaboration', true, false, 'Plugin'],
    ['Smart deadline engine', true, false, false],
    ['Role-based access', true, false, 'Paid tier'],
    ['Real-time analytics', true, 'Manual', 'Limited'],
  ];
  return (
    <section id="comparison-section" className="relative z-10 overflow-hidden border-t border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-neutral-950 md:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-40 [background-size:20px_20px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
      <SectionHeading title="Why INNOCEAN Tracker?" description="Stop adapting to generic tools. Use a platform designed around your team's workflow." />
      <div className="mx-auto max-w-5xl overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-xl reveal-on-scroll">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead><tr className="border-b border-neutral-200 text-xs font-black uppercase tracking-widest text-neutral-400"><th className="p-5">Capability</th><th className="bg-indigo-50 p-5 text-center text-indigo-700">INNOCEAN Tracker</th><th className="p-5 text-center">Spreadsheets</th><th className="p-5 text-center">Generic SaaS</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]} className="border-b border-neutral-100 last:border-0"><td className="p-5 font-bold text-slate-800">{row[0]}</td>{row.slice(1).map((value, i) => <td key={i} className={`p-5 text-center ${i === 0 ? 'bg-neutral-50' : ''}`}>{value === true ? <Check className="mx-auto h-5 w-5 text-emerald-500" /> : value === false ? <X className="mx-auto h-5 w-5 text-red-400 opacity-40" /> : <span className="text-xs font-bold uppercase text-amber-500">{value}</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <SectionNext target="faq-section" light />
    </section>
  );
}

export function LandingFAQ() {
  const [active, setActive] = useState(null);
  const faqs = [
    ['Is INNOCEAN Tracker really free forever?', 'The software has no per-user licensing fee. Infrastructure costs depend on the cloud resources used by your organization.'],
    ['How does Google SSO integration work?', 'Employees sign in with their corporate Google account and the system verifies their permitted domain.'],
    ['Do I need to pay for AI features?', 'AI uses your configured Gemini or Groq API key. Provider usage and limits follow your own account.'],
    ['Is corporate data used to train AI?', 'No. Your application data remains private and is not used as foundational model training data.'],
    ['Can I use it on mobile?', 'The responsive interface works on modern mobile browsers and can be installed as a Progressive Web App.'],
    ['Can I manage multiple projects?', 'Yes. Global Workload combines accessible projects into one unified operational view.'],
  ];
  return (
    <section id="faq-section" className="relative z-10 border-t border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-neutral-950 md:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-black uppercase text-slate-900 dark:text-white md:text-5xl reveal-on-scroll">Frequently Asked Questions</h2>
        <div className="space-y-4 reveal-on-scroll">
          {faqs.map(([question, answer], index) => (
            <div key={question} className={`overflow-hidden rounded-2xl border bg-white transition-all dark:bg-[#0e1116] ${active === index ? 'border-indigo-300 shadow-lg ring-2 ring-indigo-500/20 dark:border-indigo-800' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-800'}`}>
              <button onClick={() => setActive(active === index ? null : index)} className="flex w-full items-center justify-between px-6 py-5 text-left font-bold text-slate-800 dark:text-white"><span className="pr-4 text-base sm:text-lg">{question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-indigo-500 transition ${active === index ? 'rotate-180' : ''}`} /></button>
              <div className={`overflow-hidden px-6 transition-all duration-300 ${active === index ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}><p className="font-medium leading-relaxed text-slate-600 dark:text-slate-400">{answer}</p></div>
            </div>
          ))}
        </div>
      </div>
      <SectionNext target="cta-section" />
    </section>
  );
}

export function LandingCTA() {
  return (
    <section id="cta-section" className="relative z-10 overflow-hidden border-t border-slate-200 bg-white py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-50 [background-size:20px_20px]" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center reveal-on-scroll">
        <h2 className="mb-6 text-4xl font-black uppercase text-black md:text-5xl">Ready to elevate your team&apos;s productivity?</h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-neutral-500 md:text-xl">Experience the next generation of enterprise workload management powered by AI.</p>
        <Link to="/register" className="mx-auto flex w-full items-center justify-center gap-2 rounded-full bg-black px-10 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-2xl transition hover:-translate-y-1 hover:opacity-80 sm:w-max sm:text-sm">Request Access Now <Rocket className="h-5 w-5" /></Link>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-neutral-200 bg-white py-8 text-center dark:border-neutral-900 dark:bg-black">
      <div className="mb-4 flex justify-center"><span className="text-sm font-black tracking-[.2em]">INNOCEAN</span></div>
      <div className="mb-4 flex justify-center gap-6"><a href="mailto:support@innocean.co.id" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition hover:text-black dark:hover:text-white">Contact IT Support</a><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Privacy Policy</span><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Terms of Service</span></div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">© {new Date().getFullYear()} INNOCEAN Tracker. Engineered with precision.</p>
    </footer>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-16 max-w-3xl px-6 text-center reveal-on-scroll">
      {eyebrow && <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-neutral-500">{eyebrow}</span>}
      <h2 className="mb-6 text-3xl font-black uppercase text-slate-900 dark:text-white md:text-5xl">{title}</h2>
      <p className="text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function SectionNext({ target, light = false }) {
  return (
    <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
      <button onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })} className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 ${light ? 'border-slate-200 bg-white text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800'}`} title="Next Section"><ChevronDown className="h-5 w-5" /></button>
    </div>
  );
}
