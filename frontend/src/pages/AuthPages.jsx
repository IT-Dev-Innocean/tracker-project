import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api';
import LandingPageContent from '@/components/landing/LandingPageContent';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Database,
  GitBranch,
  LayoutGrid,
  LockKeyhole,
  MessageSquare,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export function LandingPage() {
  return <LandingPageContent />;
}

function LandingPagePrevious() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const capabilities = [
    {
      icon: GitBranch,
      color: 'text-blue-400',
      title: 'Visual Project Boards',
      desc: 'Plan every initiative in flexible kanban boards built for fast-moving teams.',
    },
    {
      icon: Users,
      color: 'text-violet-400',
      title: 'Team Collaboration',
      desc: 'Assign ownership, discuss work, and keep every stakeholder in sync.',
    },
    {
      icon: Bot,
      color: 'text-emerald-400',
      title: 'AI-Powered Assistance',
      desc: 'Turn ideas into action items and prioritize the work that matters most.',
    },
    {
      icon: Clock3,
      color: 'text-amber-400',
      title: 'Timesheet Control',
      desc: 'Log working hours and move approvals through one transparent workflow.',
    },
    {
      icon: BarChart3,
      color: 'text-cyan-400',
      title: 'Real-Time Analytics',
      desc: 'Understand progress, workload, and delivery risk without manual reporting.',
    },
    {
      icon: ShieldCheck,
      color: 'text-rose-400',
      title: 'Secure Access',
      desc: 'Private workspaces, role-aware access, and protected company data.',
    },
  ];

  const faqs = [
    ['What is INNOCEAN Tracker?', 'A unified workspace for planning projects, assigning tasks, tracking time, and collaborating across teams.'],
    ['Can I manage multiple projects?', 'Yes. Create separate spaces for every project and use Global Workload to see everything together.'],
    ['Does it support team collaboration?', 'Yes. Invite members, assign tasks, leave comments, and follow project notifications in real time.'],
    ['Can managers review timesheets?', 'Yes. Timesheets follow a clear Draft, Pending, Approved, or Rejected workflow.'],
    ['Is our project data secure?', 'Access is authenticated and every private project follows its membership and ownership rules.'],
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-violet-500/30">
      <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:48px_48px]" />

      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white text-xs font-black text-black">IN</div>
          <div>
            <span className="block text-xs font-bold tracking-[.2em]">INNOCEAN</span>
            <span className="block text-[8px] tracking-[.24em] text-zinc-500">TRACKER</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" className="text-zinc-300">Sign in</Button></Link>
          <Link to="/register">
            <Button className="rounded-full bg-white px-4 text-black hover:bg-zinc-200">Get started</Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[720px] max-w-6xl items-center gap-16 px-5 py-20 lg:grid-cols-[.86fr_1.14fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-300">
              <Sparkles className="h-3 w-3" /> Built for high-performing teams
            </div>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-[.91] tracking-[-.055em] sm:text-6xl lg:text-7xl">
              Orchestrate
              <br />teams with
              <br /><span className="text-transparent [-webkit-text-stroke:1px_#7c3aed]">absolute</span>
              <br />precision
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-zinc-400">
              One command center for projects, people, and progress. Move from strategy to execution without losing context.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="h-11 rounded-full bg-white px-6 text-black hover:bg-zinc-200">
                  Start building <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#workflow">
                <Button variant="outline" className="h-11 rounded-full border-white/15 bg-white/[.03] px-6 hover:bg-white/10">
                  Explore platform
                </Button>
              </a>
            </div>
            <div className="mt-8 flex gap-6 text-[10px] uppercase tracking-[.16em] text-zinc-600">
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Secure by design</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Built for scale</span>
            </div>
          </div>

          <HeroProductMockup />
        </section>

        <section className="border-y border-white/[.07] bg-black/60">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-28 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">The workspace, reimagined</span>
              <h2 className="mt-5 max-w-md text-4xl font-black uppercase leading-[.98] tracking-[-.04em] sm:text-5xl">
                Work smarter,<br />not harder with<br />AI assistance.
              </h2>
              <p className="mt-6 max-w-md leading-7 text-zinc-400">
                Remove repetitive planning from your day. Our intelligent workspace helps shape briefs, prioritize tasks, and keep teams moving.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  ['Context-aware planning', 'AI understands your project and transforms ideas into structured work.'],
                  ['Intelligent prioritization', 'Know what requires attention before delivery starts to slip.'],
                  ['Instant project clarity', 'Summarize progress and blockers without chasing status updates.'],
                ].map(([title, desc], i) => (
                  <div key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-300">0{i + 1}</span>
                    <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute h-72 w-72 rounded-full bg-violet-600/15 blur-[100px]" />
              <div className="relative w-full max-w-md rotate-2 rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl shadow-violet-950/40">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold"><Bot className="h-4 w-4 text-violet-400" /> AI Workspace</div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-zinc-300">
                  Build a launch plan for our Q4 campaign.
                </div>
                <div className="ml-8 mt-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <p className="text-xs text-violet-200">I created 4 milestones and 12 actionable tasks.</p>
                  <div className="mt-4 space-y-2">
                    {['Creative concept', 'Media planning', 'Asset production'].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 rounded-md bg-black/30 px-3 py-2 text-[11px] text-zinc-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-violet-400' : 'bg-zinc-600'}`} />{item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-6xl px-5 py-28 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">A simple operating system</span>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-.04em]">See how it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-500">From idea to impact in three clear steps. No unnecessary complexity.</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              {[
                ['01', 'Create your workspace', 'Set up a project and define the workflow your team already understands.'],
                ['02', 'Structure the work', 'Break goals into tasks, assign ownership, priorities, and deadlines.'],
                ['03', 'Execute and improve', 'Collaborate, track delivery, and learn from live performance data.'],
              ].map(([n, title, desc], i) => (
                <div key={n} className={`rounded-xl border p-5 transition ${i === 0 ? 'border-white/30 bg-white/[.06]' : 'border-white/[.07]'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-bold text-violet-400">{n}</span>
                    <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-white/[.07] bg-[#09090d] p-6">
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111118] p-4">
                <div className="mb-5 flex items-center gap-2 text-xs font-semibold"><LayoutGrid className="h-4 w-4 text-violet-400" /> Campaign launch</div>
                <div className="grid grid-cols-3 gap-2">
                  {['TO DO', 'IN PROGRESS', 'COMPLETE'].map((column, i) => (
                    <div key={column}>
                      <div className="mb-2 text-[8px] font-bold tracking-widest text-zinc-500">{column}</div>
                      {Array.from({ length: i === 1 ? 3 : 2 }).map((_, j) => (
                        <div key={j} className="mb-2 rounded-md border border-white/[.08] bg-white/[.035] p-2">
                          <div className="h-1.5 rounded bg-zinc-700" />
                          <div className="mt-2 h-1 w-2/3 rounded bg-zinc-800" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[.07] bg-[#08080b]">
          <div className="mx-auto max-w-6xl px-5 py-28 lg:px-8">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">One platform, every team</span>
              <h2 className="mt-4 text-4xl font-black uppercase tracking-[-.04em]">Built for every workflow</h2>
            </div>
            <div className="mt-16 grid gap-12 lg:grid-cols-2">
              <div className="space-y-7">
                {[
                  ['Agile project delivery', 'Shape flexible boards around the way your team actually operates.'],
                  ['Cross-functional alignment', 'Connect creative, strategy, technology, and operations in one shared system.'],
                  ['Leadership visibility', 'Give decision-makers a clear view without adding more status meetings.'],
                ].map(([title, desc], i) => (
                  <div key={title} className="flex gap-4">
                    <span className="font-mono text-xs text-violet-400">0{i + 1}</span>
                    <div><h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101018] p-5 shadow-2xl">
                <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold">Portfolio overview</span><span className="text-[9px] text-zinc-500">THIS QUARTER</span></div>
                <div className="space-y-2">
                  {[
                    ['Brand Campaign', '72%', 'bg-violet-500'],
                    ['Product Launch', '45%', 'bg-blue-500'],
                    ['Website Revamp', '89%', 'bg-emerald-500'],
                    ['Research Sprint', '31%', 'bg-amber-500'],
                  ].map(([name, progress, color]) => (
                    <div key={name} className="grid grid-cols-[1fr_2fr_35px] items-center gap-3 rounded-lg border border-white/[.07] bg-black/20 p-3 text-[10px]">
                      <span>{name}</span><div className="h-1 overflow-hidden rounded bg-white/10"><div className={`h-full ${color}`} style={{ width: progress }} /></div><span className="text-zinc-500">{progress}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-28 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">Designed to perform</span>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-.04em]">Enterprise-grade architecture</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-500">A modern foundation designed for reliability, security, and scale.</p>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[['React', Code2], ['Fast API', Zap], ['PostgreSQL', Database], ['JWT Auth', LockKeyhole], ['AI Ready', Bot], ['Cloud', Network]].map(([name, Icon]) => (
              <div key={name} className="flex flex-col items-center rounded-xl border border-white/[.07] bg-white/[.02] p-4">
                <Icon className="h-5 w-5 text-zinc-300" /><span className="mt-2 text-[9px] uppercase tracking-wider text-zinc-500">{name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="group rounded-xl border border-white/[.07] bg-gradient-to-br from-white/[.04] to-transparent p-5 transition hover:border-violet-500/30">
                <Icon className={`h-5 w-5 ${color}`} />
                <h3 className="mt-8 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/[.07] bg-white/[.025]">
          <div className="mx-auto max-w-6xl px-5 py-28 lg:px-8">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">Clarity at every level</span>
              <h2 className="mt-4 text-4xl font-black uppercase tracking-[-.04em]">Why INNOCEAN Tracker?</h2>
            </div>
            <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-[#f7f7f8] p-4 text-zinc-900 shadow-2xl">
              <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-md bg-violet-600" /><span className="text-xs font-bold">Portfolio workspace</span></div><span className="text-[9px] text-zinc-400">UPDATED JUST NOW</span></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-[10px]">
                  <thead className="border-b border-zinc-200 text-zinc-400"><tr><th className="p-3">Project</th><th>Owner</th><th>Status</th><th>Progress</th><th>Deadline</th></tr></thead>
                  <tbody>
                    {[
                      ['Retail Experience', 'Creative Team', 'On track', '82%', 'Aug 24'],
                      ['Always-on Social', 'Content Team', 'In progress', '64%', 'Sep 02'],
                      ['Product Innovation', 'Strategy Team', 'At risk', '38%', 'Sep 18'],
                      ['Digital Platform', 'Technology', 'Complete', '100%', 'Jul 28'],
                    ].map((row, i) => (
                      <tr key={row[0]} className="border-b border-zinc-100 last:border-0"><td className="p-3 font-semibold">{row[0]}</td><td className="text-zinc-500">{row[1]}</td><td><span className={`rounded-full px-2 py-1 ${i === 2 ? 'bg-rose-50 text-rose-600' : i === 3 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{row[2]}</span></td><td>{row[3]}</td><td className="text-zinc-500">{row[4]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-28">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">Everything you need to know</span>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-.04em]">Frequently asked questions</h2>
          </div>
          <div className="mt-12 divide-y divide-white/[.07] border-y border-white/[.07]">
            {faqs.map(([question, answer], i) => (
              <button key={question} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full py-5 text-left">
                <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium">{question}</span><ChevronDown className={`h-4 w-4 text-zinc-500 transition ${openFaq === i ? 'rotate-180' : ''}`} /></div>
                {openFaq === i && <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-zinc-500">{answer}</p>}
              </button>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden bg-white px-5 py-24 text-center text-black">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#bbb_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative">
            <span className="text-[10px] font-bold uppercase tracking-[.25em] text-violet-600">Your workspace is ready</span>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black uppercase leading-[.95] tracking-[-.05em] sm:text-5xl">Ready to elevate your team's productivity?</h2>
            <p className="mx-auto mt-5 max-w-xl text-sm text-zinc-500">Bring projects, people, and performance together in one focused workspace.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/register"><Button className="h-11 rounded-full bg-black px-6 text-white hover:bg-zinc-800">Create your workspace <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/login"><Button className="h-11 rounded-full border border-zinc-300 bg-white px-6 text-black hover:bg-zinc-100">Sign in</Button></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex flex-col items-center justify-between gap-4 border-t border-white/[.07] px-6 py-7 text-[10px] uppercase tracking-[.18em] text-zinc-600 sm:flex-row">
        <span>© 2026 INNOCEAN Indonesia</span>
        <div className="flex gap-5"><Link to="/login" className="hover:text-white">Sign in</Link><span>Privacy</span><span>Terms</span></div>
      </footer>
    </div>
  );
}

function HeroProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-10 rounded-full bg-violet-700/15 blur-[100px]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] shadow-2xl shadow-black">
        <div className="flex h-9 items-center gap-1.5 border-b border-white/[.07] px-4">
          <span className="h-2 w-2 rounded-full bg-zinc-700" /><span className="h-2 w-2 rounded-full bg-zinc-700" /><span className="h-2 w-2 rounded-full bg-zinc-700" />
          <div className="mx-auto h-4 w-40 rounded bg-white/[.04]" />
        </div>
        <div className="flex h-[390px]">
          <div className="hidden w-36 border-r border-white/[.07] bg-black/30 p-3 sm:block">
            <div className="mb-5 flex items-center gap-2"><div className="h-5 w-5 rounded bg-violet-600" /><div className="h-1.5 w-16 rounded bg-zinc-700" /></div>
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className={`mb-3 h-2 rounded ${i === 2 ? 'w-full bg-violet-500/30' : 'w-4/5 bg-white/[.06]'}`} />)}
          </div>
          <div className="min-w-0 flex-1 p-5">
            <div className="mb-6 flex items-center justify-between"><div><div className="h-2 w-28 rounded bg-zinc-500" /><div className="mt-2 h-1.5 w-20 rounded bg-zinc-800" /></div><div className="h-7 w-16 rounded-md bg-violet-600" /></div>
            <div className="grid h-[285px] grid-cols-3 gap-3">
              {['TO DO', 'IN PROGRESS', 'COMPLETE'].map((column, i) => (
                <div key={column}>
                  <div className="mb-3 flex items-center gap-2 text-[8px] font-bold tracking-wider text-zinc-500"><span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-zinc-500' : i === 1 ? 'bg-blue-500' : 'bg-emerald-500'}`} />{column}</div>
                  {Array.from({ length: i === 0 ? 3 : 2 }).map((_, j) => (
                    <div key={j} className="mb-2 rounded-lg border border-white/[.08] bg-white/[.035] p-3">
                      <div className="h-1.5 w-4/5 rounded bg-zinc-600" /><div className="mt-2 h-1 w-1/2 rounded bg-zinc-800" />
                      <div className="mt-4 flex items-center justify-between"><span className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-400 to-blue-500" /><span className="h-1 w-6 rounded bg-zinc-800" /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-7 -left-5 hidden w-48 rounded-xl border border-white/10 bg-[#121219]/95 p-3 shadow-xl backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-[9px] text-zinc-400"><Zap className="h-3 w-3 text-amber-400" /> Automation complete</div>
        <div className="mt-2 h-1 rounded bg-emerald-500/50" />
      </div>
      <div className="absolute -right-5 -top-7 hidden rounded-xl border border-white/10 bg-[#121219]/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-[9px] text-zinc-400"><MessageSquare className="h-3 w-3 text-violet-400" /> 12 updates today</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, googleLogin, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const verify = searchParams.get('verify');
    if (verify) {
      authApi.verifyEmail(verify).then(() => {
        navigate('/login?verified=1', { replace: true });
      });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await login(username, password);
    if (ok) navigate('/', { replace: true });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your workspace">
      {searchParams.get('verified') && (
        <div className="mb-4 rounded-md bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-400">
          Email verified! You can now log in.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></div>
        <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="mt-4">
          <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cu-border" /></div><div className="relative flex justify-center text-xs"><span className="bg-cu-surface px-2 text-cu-muted">or</span></div></div>
          <GoogleSignInButton
            googleLogin={googleLogin}
            clearError={clearError}
            navigate={navigate}
            isLoading={isLoading}
          />
        </div>
      )}

      <p className="mt-4 text-center text-sm text-cu-muted">
        Don't have an account? <Link to="/register" className="text-cu-accent hover:underline">Register</Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/forgot-password" className="text-cu-muted hover:text-cu-text">Forgot password?</Link>
      </p>
    </AuthLayout>
  );
}

function GoogleSignInButton({ googleLogin, clearError, navigate, isLoading }) {
  const startGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      clearError();
      const ok = await googleLogin(tokenResponse.access_token);
      if (ok) navigate('/', { replace: true });
    },
    onError: () => {
      useAuthStore.setState({ error: 'Google login was cancelled or failed.' });
    },
  });

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={isLoading}
      onClick={() => startGoogleLogin()}
    >
      Continue with Google
    </Button>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await register(form);
    if (ok) setSuccess(true);
  };

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a verification link to your inbox">
        <div className="text-center space-y-4">
          <p className="text-sm text-cu-muted">Please verify your email before logging in.</p>
          <Link to="/login"><Button>Go to Login</Button></Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Join the INNOCEAN workspace">
      {error && <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><Label>Email (@innocean.co.id)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
        <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-cu-muted">
        Already have an account? <Link to="/login" className="text-cu-accent hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset email');
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email to receive a reset link">
      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-cu-muted">If an account exists, a reset link has been sent.</p>
          <Link to="/login"><Button>Back to Login</Button></Link>
        </div>
      ) : (
        <>
          {error && <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" className="w-full">Send Reset Link</Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = searchParams.get('token');
    try {
      await authApi.resetPassword(token, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  return (
    <AuthLayout title="Set new password" subtitle="Enter your new password">
      {error && <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>New Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full">Reset Password</Button>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cu-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 rounded-lg bg-cu-accent items-center justify-center text-white font-bold mb-3">IN</div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-cu-muted mt-1">{subtitle}</p>
        </div>
        <div className="rounded-lg border border-cu-border bg-cu-surface p-6">{children}</div>
      </div>
    </div>
  );
}
