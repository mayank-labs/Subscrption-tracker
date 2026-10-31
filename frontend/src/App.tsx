import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import * as api from './api'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'

type Page = 'Dashboard' | 'Subscriptions' | 'Analytics' | 'Settings'
type Subscription = {
  id: string
  name: string
  category: string
  price: number
  renewal: string
  color: string
  initials: string
  cycle: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  billingCycle: api.ApiSubscription['billingCycle']
  startDate: string
}

type Brand = { slug: string; color: string }

const brands: Record<string, Brand> = {
  netflix: { slug: 'netflix', color: '#e50914' },
  prime: { slug: 'amazonprime', color: '#00a8e1' },
  'amazon prime': { slug: 'amazonprime', color: '#00a8e1' },
  spotify: { slug: 'spotify', color: '#1ed760' },
  youtube: { slug: 'youtube', color: '#ff0033' },
  'youtube premium': { slug: 'youtube', color: '#ff0033' },
  apple: { slug: 'apple', color: '#f5f5f7' },
  'apple music': { slug: 'applemusic', color: '#fa2d48' },
  disney: { slug: 'disneyplus', color: '#113ccf' },
  'disney+': { slug: 'disneyplus', color: '#113ccf' },
  adobe: { slug: 'adobe', color: '#ff0000' },
  figma: { slug: 'figma', color: '#f24e1e' },
  notion: { slug: 'notion', color: '#f5f5f5' },
  github: { slug: 'github', color: '#f0f6fc' },
  slack: { slug: 'slack', color: '#36c5f0' },
  dropbox: { slug: 'dropbox', color: '#3984ff' },
  canva: { slug: 'canva', color: '#00c4cc' },
  chatgpt: { slug: 'openai', color: '#74aa9c' },
}

const getBrand = (name: string) => {
  const normalized = name.trim().toLowerCase()
  return brands[normalized] ?? Object.entries(brands).find(([key]) => normalized.includes(key))?.[1]
}

const cycleLabels: Record<api.ApiSubscription['billingCycle'], Subscription['cycle']> = {
  DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly',
}
const colors = ['bg-neutral-300', 'bg-neutral-400', 'bg-neutral-500', 'bg-neutral-600', 'bg-neutral-700']
const toSubscription = (item: api.ApiSubscription, index: number): Subscription => ({
  id: item.id, name: item.name, category: item.category, price: Number(item.price),
  renewal: new Date(item.renewalDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }),
  color: colors[index % colors.length], initials: item.name.slice(0, 2).toUpperCase(),
  cycle: cycleLabels[item.billingCycle], billingCycle: item.billingCycle, startDate: item.startDate,
})

function ServiceLogo({ name }: { name: string }) {
  const brand = getBrand(name)
  const [failed, setFailed] = useState(false)
  return (
    <div
      className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border text-xs font-bold"
      style={{ backgroundColor: brand ? `${brand.color}18` : 'rgba(255,255,255,0.07)', borderColor: brand ? `${brand.color}55` : 'rgba(255,255,255,0.1)', color: brand?.color ?? '#d4d4d8' }}
      title={name}
    >
      {brand && !failed ? <img className="size-6 object-contain" src={`/brands/${brand.slug}.svg`} alt="" style={{ filter: 'invert(1)' }} onError={() => setFailed(true)} /> : name.slice(0, 2).toUpperCase()}
    </div>
  )
}

const nav: { label: Page; icon: LucideIcon }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Subscriptions', icon: WalletCards },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
]

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-lg border border-white bg-white">
        <Zap className="size-5 fill-black text-black" />
      </div>
      <div className="text-xl font-semibold tracking-tight text-white">SubDub</div>
    </div>
  )
}

function AuthScreen({ onDone }: { onDone: (name: string, email: string, password: string, signup: boolean) => Promise<void> }) {
  const [signup, setSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    try { await onDone(String(form.get('name') ?? ''), String(form.get('email')), String(form.get('password')), signup) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to authenticate') }
    finally { setBusy(false) }
  }
  return (
    <main className="auth-shell">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex justify-center"><Brand /></div>
        <Card className="p-7 sm:p-9">
          <div className="mb-7 text-center">
            <div className="text-2xl font-semibold tracking-tight text-white">{signup ? 'Create your account' : 'Welcome back'}</div>
            <p className="mt-2 text-sm text-neutral-400">{signup ? 'Start tracking your subscriptions in minutes.' : 'Sign in to continue to your dashboard.'}</p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {signup && <label className="field-label">Full name<Input name="name" placeholder="Alex Morgan" required /></label>}
            <label className="field-label">Email address<Input name="email" type="email" placeholder="you@company.com" required /></label>
            <label className="field-label">
              Password
              <div className="relative">
                <Input name="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" required />
                <button type="button" className="absolute right-3 top-3 text-neutral-500 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            {error && <p className="text-sm text-neutral-300">{error}</p>}
            <Button disabled={busy} className="mt-2 w-full justify-center py-3">{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-neutral-500">
            {signup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="font-medium text-white underline underline-offset-4 hover:text-neutral-300" onClick={() => setSignup(!signup)}>{signup ? 'Sign in' : 'Create one'}</button>
          </p>
        </Card>
        <p className="mt-6 text-center text-xs text-neutral-600">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </main>
  )
}

function Sidebar({ page, setPage, open, close, onLogout, user }: { page: Page; setPage: (p: Page) => void; open: boolean; close: () => void; onLogout: () => void; user: api.User | null }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={close} />}
      <aside className={`sidebar ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-20 items-center justify-between px-6">
          <Brand />
          <button className="text-neutral-500 lg:hidden" onClick={close}><X /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3 pt-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">Workspace</p>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? 'nav-active' : ''}`} onClick={() => { setPage(label); close() }}>
              <Icon className="size-[18px]" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="mx-3 mb-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-200"><Sparkles className="size-4 text-neutral-400" /> Workspace</div>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Your subscription overview.</p>
          <div className="mt-3 h-px bg-white/20" />
        </div>
        <button className="mx-3 mb-5 flex items-center gap-3 rounded-xl p-3 text-left hover:bg-white/5" onClick={onLogout}>
          <div className="grid size-9 place-items-center rounded-full border border-white/30 text-xs font-semibold text-white">{user?.name.slice(0, 2).toUpperCase() ?? 'ME'}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-neutral-200">{user?.name ?? 'Account'}</div><div className="truncate text-xs text-neutral-600">{user?.email ?? 'Sign out'}</div></div>
          <LogOut className="size-4 text-neutral-600" />
        </button>
      </aside>
    </>
  )
}

function Header({ page, openMenu, add }: { page: Page; openMenu: () => void; add: () => void }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-4 sm:px-7 lg:px-9">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 lg:hidden" onClick={openMenu}><Menu className="size-5" /></button>
        <div><div className="text-lg font-semibold text-white">{page}</div><p className="hidden text-xs text-neutral-500 sm:block">Track, understand, and optimize your spending.</p></div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative grid size-10 place-items-center rounded-xl border border-white/[0.07] text-neutral-400 hover:bg-white/5">
          <Bell className="size-[18px]" />
        </button>
        <Button onClick={add}><Plus className="size-4" /><span className="hidden sm:inline">Add subscription</span></Button>
      </div>
    </header>
  )
}

function StatCard({ label, value, delta, icon: Icon, trend = 'up' }: { label: string; value: string; delta: string; icon: LucideIcon; trend?: 'up' | 'down' }) {
  return (
    <Card className="stat-card">
      <div className="flex items-start justify-between">
        <div className="grid size-10 place-items-center rounded-lg border border-[#303030] text-neutral-300"><Icon className="size-5" /></div>
        <div className="flex items-center gap-1 text-xs font-medium text-neutral-500">
          {trend === 'down' ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}{delta}
        </div>
      </div>
      <p className="mt-5 text-sm text-neutral-500">{label}</p>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</div>
    </Card>
  )
}

function SpendingChart({ trend }: { trend?: api.Trend[] }) {
  const points = '0,126 52,112 104,120 156,76 208,90 260,45 312,66 364,38 416,58 468,22 520,35 572,16'
  return (
    <div className="mt-6">
      <div className="flex h-52 gap-3">
        <div className="flex flex-col justify-between pb-5 text-[10px] text-neutral-600"><span>$200</span><span>$150</span><span>$100</span><span>$50</span><span>$0</span></div>
        <svg viewBox="0 0 572 150" className="h-full min-w-0 flex-1 overflow-visible" preserveAspectRatio="none">
          <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".12" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient></defs>
          {[15, 45, 75, 105, 135].map(y => <line key={y} x1="0" x2="572" y1={y} y2={y} stroke="rgba(255,255,255,.055)" />)}
          <polygon points={`${points} 572,150 0,150`} fill="url(#area)" />
          <polyline points={points} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <circle cx="468" cy="22" r="4" fill="#ffffff" stroke="#0b0b0b" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="ml-10 flex justify-between text-[10px] text-neutral-600">{(trend?.length ? trend.map(item => item.month.slice(5)) : ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']).map(m => <span key={m}>{m}</span>)}</div>
    </div>
  )
}

function CategoryChart({ categories }: { categories?: api.CategoryStat[] }) {
  const values = [...(categories ?? [])].sort((a, b) => b.monthlySpend - a.monthlySpend)
  const total = values.reduce((sum, item) => sum + item.monthlySpend, 0)
  let offset = 0
  const segments = values.map(({ monthlySpend }) => {
    const start = offset
    offset += total ? (monthlySpend / total) * 100 : 0
    return `${['#f5f5f5', '#a3a3a3', '#737373', '#525252', '#262626'][values.findIndex(item => item.monthlySpend === monthlySpend) % 5]} ${start}% ${offset}%`
  })
  return (
    <div className="mt-5 flex items-center gap-7">
      <div className="relative size-32 shrink-0 rounded-full" style={{ background: segments.length ? `conic-gradient(${segments.join(', ')})` : '#262626' }}>
        <div className="absolute inset-0 grid place-items-center rounded-full bg-[#0b0b0b] text-center"><div><div className="text-lg font-semibold text-white">₹{total.toFixed(0)}</div><div className="text-[10px] text-neutral-500">monthly</div></div></div>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {values.length ? values.map(({ category, monthlySpend }, index) => (
          <div className="flex items-center text-xs" key={category}><span className={`mr-2 size-2 rounded-full ${colors[index % colors.length]}`} /><span className="flex-1 truncate text-neutral-400">{category}</span><span className="mr-3 text-neutral-600">₹{monthlySpend.toFixed(0)}</span><span className="font-medium text-neutral-200">{total ? Math.round(monthlySpend / total * 100) : 0}%</span></div>
        )) : (
          <p className="text-xs leading-5 text-neutral-600">Add a subscription to see your spending by category.</p>
        )}
      </div>
    </div>
  )
}

function SubscriptionRow({ item, edit, remove }: { item: Subscription; edit: () => void; remove: () => void }) {
  return (
    <div className="subscription-row">
      <ServiceLogo name={item.name} />
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-neutral-200">{item.name}</div><div className="mt-0.5 text-xs text-neutral-600">{item.category}</div></div>
      <div className="hidden w-28 text-xs text-neutral-500 sm:block"><div className="text-neutral-300">{item.renewal}</div>{item.cycle}</div>
      <div className="w-20 text-right text-sm font-medium text-white">${item.price.toFixed(2)}</div>
      <button className="rounded-lg p-2 text-neutral-600 hover:bg-white/5 hover:text-white" title="Edit subscription" onClick={edit}><Pencil className="size-4" /></button>
      <button className="rounded-lg p-2 text-neutral-600 hover:bg-white/10 hover:text-white" title="Delete subscription" onClick={remove}><Trash2 className="size-4" /></button>
    </div>
  )
}

function Dashboard({ subscriptions, setPage, edit, summary, categories, trend, user }: { subscriptions: Subscription[]; setPage: (p: Page) => void; edit: (s: Subscription) => void; summary: api.Summary | null; categories: api.CategoryStat[]; trend: api.Trend[]; user: api.User | null }) {
  return (
    <div className="page-content">
      <div className="mb-6"><div className="text-2xl font-semibold tracking-tight text-white">Good morning, {user?.name ?? 'there'}</div><p className="mt-1 text-sm text-neutral-500">Here’s what’s happening with your subscriptions.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monthly spend" value={`₹${summary?.monthlySpend.toFixed(2) ?? '0.00'}`} delta="Live" icon={CircleDollarSign} />
        <StatCard label="Yearly projection" value={`₹${summary?.yearlySpend.toFixed(2) ?? '0.00'}`} delta="Live" icon={BarChart3} />
        <StatCard label="Active subscriptions" value={String(summary?.activeSubscriptions ?? 0)} delta="Live" icon={WalletCards} />
        <StatCard label="Renewal date" value={summary?.nextRenewal ? new Date(summary.nextRenewal).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None'} delta="Next" icon={CalendarDays} trend="down" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><div className="section-title">Spending trend</div><p className="section-subtitle">Monthly recurring spend</p></div><button className="select-button">Last 12 months <ChevronDown className="size-3.5" /></button></div>
          <SpendingChart trend={trend} />
        </Card>
        <Card className="p-5 sm:p-6"><div className="section-title">Spend by category</div><p className="section-subtitle">Where your money goes</p><CategoryChart categories={categories} /></Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6"><div><div className="section-title">Upcoming renewals</div><p className="section-subtitle">Your next subscriptions</p></div><button className="text-xs font-medium text-white underline underline-offset-4 hover:text-neutral-300" onClick={() => setPage('Subscriptions')}>View all</button></div>
          <div className="border-t border-white/[0.06]">{subscriptions.slice(0, 4).map(s => <SubscriptionRow key={s.id} item={s} edit={() => edit(s)} remove={() => {}} />)}</div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-lg border border-[#303030] text-neutral-300"><Lightbulb className="size-4" /></div><div className="section-title">Overview</div></div>
          <div className="mt-5 rounded-xl border border-[#242424] bg-white/[0.03] p-4"><p className="text-sm leading-6 text-neutral-300">{summary?.activeSubscriptions ? `You have ${summary.activeSubscriptions} active subscription${summary.activeSubscriptions === 1 ? '' : 's'}.` : 'Add your first subscription to start tracking your spend.'}</p></div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#242424] p-3"><div className="grid size-8 place-items-center rounded-lg border border-[#303030] text-neutral-300"><Check className="size-4" /></div><p className="text-xs leading-5 text-neutral-500"><span className="text-neutral-300">Private by default.</span> Your subscriptions are scoped to your account.</p></div>
        </Card>
      </div>
    </div>
  )
}

function Subscriptions({ items, edit, remove, exportCsv }: { items: Subscription[]; edit: (s: Subscription) => void; remove: (id: string) => void; exportCsv: () => void }) {
  const [query, setQuery] = useState('')
  const filtered = items.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.category.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="page-content">
      <div className="page-heading"><div><div className="text-2xl font-semibold text-white">Your subscriptions</div><p className="mt-1 text-sm text-neutral-500">Manage all recurring payments in one place.</p></div><Button variant="secondary" onClick={exportCsv}><Download className="size-4" /> Export CSV</Button></div>
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-2.5 size-4 text-neutral-600" /><Input className="pl-9" placeholder="Search subscriptions..." value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="text-xs text-neutral-500">{filtered.length} active subscriptions</div>
        </div>
        {filtered.map(s => <SubscriptionRow key={s.id} item={s} edit={() => edit(s)} remove={() => remove(s.id)} />)}
      </Card>
    </div>
  )
}

function Analytics({ categories }: { categories: api.CategoryStat[] }) {
  return (
    <div className="page-content">
      <div className="page-heading"><div><div className="text-2xl font-semibold text-white">Spending analytics</div><p className="mt-1 text-sm text-neutral-500">Understand your recurring expenses and discover savings.</p></div><button className="select-button">This year <ChevronDown className="size-4" /></button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><StatCard label="Average per month" value="$119.82" delta="3.1%" icon={CalendarDays} /><StatCard label="Highest month" value="$148.91" delta="December" icon={ArrowUpRight} /><StatCard label="Potential savings" value="$287.00" delta="18.9%" icon={Sparkles} trend="down" /></div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2"><Card className="p-6"><div className="section-title">Monthly trends</div><p className="section-subtitle">Spend over the last 12 months</p><SpendingChart /></Card><Card className="p-6"><div className="section-title">Category breakdown</div><p className="section-subtitle">Monthly recurring costs</p><CategoryChart categories={categories} /><div className="mt-7 rounded-xl bg-white/[0.025] p-4 text-xs text-neutral-500">{categories.length ? `${categories[0].category} is your largest category at ₹${categories[0].monthlySpend.toFixed(0)} per month.` : 'Add a subscription to see category insights.'}</div></Card></div>
    </div>
  )
}

function SettingsPage() {
  const [saved, setSaved] = useState(false)
  return (
    <div className="page-content max-w-4xl">
      <div className="text-2xl font-semibold text-white">Profile settings</div><p className="mt-1 text-sm text-neutral-500">Manage your account and preferences.</p>
      <Card className="mt-6 p-6">
        <div className="section-title">Personal information</div><p className="section-subtitle">Update your photo and personal details.</p>
        <div className="mt-6 flex items-center gap-4"><div className="grid size-16 place-items-center rounded-full border border-white/30 text-lg font-semibold text-white">ME</div><div><Button variant="secondary">Change photo</Button><p className="mt-2 text-xs text-neutral-600">JPG or PNG. Max 2MB.</p></div></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="field-label">Full name<Input defaultValue="Alex Morgan" /></label><label className="field-label">Email address<Input defaultValue="alex@subdub.app" /></label><label className="field-label">Currency<Input defaultValue="USD — US Dollar" /></label><label className="field-label">Timezone<Input defaultValue="America / New York" /></label></div>
        <div className="mt-7 flex justify-end"><Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }}>{saved ? <><Check className="size-4" /> Saved</> : 'Save changes'}</Button></div>
      </Card>
      <Card className="mt-4 flex items-center justify-between p-6"><div><div className="text-sm font-medium text-neutral-200">Renewal reminders</div><p className="mt-1 text-xs text-neutral-500">Get notified three days before a subscription renews.</p></div><button className="relative h-6 w-11 rounded-full border border-white bg-white"><span className="absolute right-1 top-1 size-4 rounded-full bg-black" /></button></Card>
    </div>
  )
}

function SubscriptionModal({ current, close, save }: { current: Subscription | null; close: () => void; save: (s: { name: string; price: number; category: string; billingCycle: Subscription['billingCycle']; startDate: string }) => Promise<void> }) {
  const [name, setName] = useState(current?.name ?? '')
  const [price, setPrice] = useState(current?.price.toString() ?? '')
  const [category, setCategory] = useState(current?.category ?? 'Productivity')
  const [cycle, setCycle] = useState(current?.billingCycle ?? 'MONTHLY')
  const [startDate, setStartDate] = useState(current?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try { setError(''); await save({ name, price: Number(price), category, billingCycle: cycle, startDate }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save subscription') }
  }
  return (
    <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && close()}>
      <Card className="modal-card">
        <div className="flex items-start justify-between"><div><div className="text-lg font-semibold text-white">{current ? 'Edit subscription' : 'Add subscription'}</div><p className="mt-1 text-xs text-neutral-500">Keep your recurring expenses up to date.</p></div><button className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/5 hover:text-white" onClick={close}><X className="size-5" /></button></div>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="field-label">Service name<Input autoFocus required placeholder="e.g. Netflix" value={name} onChange={e => setName(e.target.value)} /><span className="mt-1 block text-[11px] text-neutral-600">Popular services get their official brand mark automatically.</span></label>
          <div className="grid grid-cols-2 gap-4"><label className="field-label">Price<Input required type="number" min="0" step=".01" placeholder="9.99" value={price} onChange={e => setPrice(e.target.value)} /></label><label className="field-label">Billing cycle<select className="input" value={cycle} onChange={e => setCycle(e.target.value as Subscription['billingCycle'])}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></label></div>
          <label className="field-label">Start date<Input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label className="field-label">Category<select className="input" value={category} onChange={e => setCategory(e.target.value)}><option>Productivity</option><option>Entertainment</option><option>Design</option><option>Cloud storage</option><option>Other</option></select></label>
          {error && <p className="text-sm text-neutral-300">{error}</p>}
          <div className="flex justify-end gap-2 pt-3"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit">{current ? 'Save changes' : 'Add subscription'}</Button></div>
        </form>
      </Card>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [user, setUser] = useState<api.User | null>(null)
  const [page, setPage] = useState<Page>('Dashboard')
  const [menu, setMenu] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [summary, setSummary] = useState<api.Summary | null>(null)
  const [categories, setCategories] = useState<api.CategoryStat[]>([])
  const [trend, setTrend] = useState<api.Trend[]>([])
  const total = useMemo(() => subscriptions.reduce((sum, s) => sum + s.price, 0), [subscriptions])
  void total
  useEffect(() => {
    api.refresh().then((currentUser) => {
      setUser(currentUser)
      setAuthenticated(true)
    }).catch(() => undefined).finally(() => setCheckingSession(false))
  }, [])
  useEffect(() => {
    if (!authenticated) return
    Promise.all([api.getSubscriptions(), api.getSummary(), api.getCategoryStats(), api.getTrend()]).then(([subscriptionResult, summaryResult, categoryResult, trendResult]) => {
      setSubscriptions(subscriptionResult.data.map(toSubscription))
      setSummary(summaryResult.data)
      setCategories(categoryResult.data)
      setTrend(trendResult.data)
    }).catch(() => undefined)
  }, [authenticated])
  if (checkingSession) return <main className="auth-shell"><p className="text-sm text-neutral-400">Loading your workspace…</p></main>
  if (!authenticated) return <AuthScreen onDone={async (name, email, password, signup) => {
    const currentUser = signup ? await api.signUp(name, email, password) : await api.signIn(email, password)
    setUser(currentUser)
    setAuthenticated(true)
  }} />
  const openAdd = () => { setEditing(null); setModal(true) }
  const openEdit = (s: Subscription) => { setEditing(s); setModal(true) }
  const save = async (data: { name: string; price: number; category: string; billingCycle: Subscription['billingCycle']; startDate: string }) => {
    const result = editing
      ? await api.updateSubscription(editing.id, data)
      : await api.createSubscription({ ...data, currency: 'INR', paymentMethod: 'Other' })
    setSubscriptions(list => {
      const next = toSubscription(result.data, editing ? list.findIndex(item => item.id === editing.id) : list.length)
      return editing ? list.map(item => item.id === editing.id ? next : item) : [...list, next]
    })
    setModal(false)
    const refreshed = await api.getSummary()
    setSummary(refreshed.data)
  }
  const remove = async (id: string) => {
    await api.deleteSubscription(id)
    setSubscriptions(list => list.filter(item => item.id !== id))
    const refreshed = await api.getSummary()
    setSummary(refreshed.data)
  }
  const exportCsv = async () => {
    const blob = await api.downloadSubscriptions()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'subdub-subscriptions.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const logout = async () => { await api.signOut(); setUser(null); setAuthenticated(false); setSubscriptions([]) }
  return (
    <div className="min-h-screen text-neutral-200">
      <Sidebar page={page} setPage={setPage} open={menu} close={() => setMenu(false)} onLogout={logout} user={user} />
      <div className="lg:pl-64">
        <Header page={page} openMenu={() => setMenu(true)} add={openAdd} />
        <main>
          {page === 'Dashboard' && <Dashboard subscriptions={subscriptions} setPage={setPage} edit={openEdit} summary={summary} categories={categories} trend={trend} user={user} />}
          {page === 'Subscriptions' && <Subscriptions items={subscriptions} edit={openEdit} remove={remove} exportCsv={exportCsv} />}
          {page === 'Analytics' && <Analytics categories={categories} />}
          {page === 'Settings' && <SettingsPage />}
        </main>
      </div>
      {modal && <SubscriptionModal current={editing} close={() => setModal(false)} save={save} />}
    </div>
  )
}
