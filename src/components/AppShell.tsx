import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarCollapsed } from "@/features/ui/slice";
import { switchTenant } from "@/components/AppProviders";
import { logout } from "@/features/auth/slice";
import { api } from "@/api/client";
import {
  BarChart3,
  Users,
  Kanban,
  FileText,
  Bell,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Moon,
  Sun,
  Laptop,
  Check,
  Search,
  Activity as ActivityIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NotificationsBell } from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";
import { setTheme, type ThemeMode } from "@/features/ui/slice";
import { useEffect, useMemo, useRef, useState } from "react";

const NAV = [
  { to: "dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "leads", label: "Leads", icon: Users },
  { to: "deals", label: "Deals", icon: Kanban },
  { to: "activity", label: "Activity", icon: ActivityIcon },
  { to: "invoices", label: "Invoices", icon: FileText },
  { to: "notifications", label: "Notifications", icon: Bell },
  { to: "settings", label: "Settings", icon: Settings },
];

function NavList({
  slug,
  collapsed,
  onNavigate,
}: {
  slug: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 space-y-1 px-2 py-3">
      {NAV.map((n) => {
        const to = `/${slug}/${n.to}`;
        const active = pathname === to || pathname.startsWith(to + "/");
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? n.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-2")}>
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold shadow-sm">
        C
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Clearview CRM</div>
          <div className="truncate text-[11px] text-muted-foreground">Revenue OS</div>
        </div>
      )}
    </div>
  );
}

function ThemeMenu() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  const opts: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {opts.map((o) => {
          const Icon = o.icon;
          return (
            <DropdownMenuItem key={o.value} onClick={() => dispatch(setTheme(o.value))}>
              <Icon className="mr-2 h-4 w-4" /> {o.label}
              {theme === o.value && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TenantSwitcher({ slug }: { slug: string }) {
  const tenants = useAppSelector((s) => s.auth.tenants);
  const nav = useNavigate();
  const current = tenants.find((t) => t.slug === slug);
  if (tenants.length <= 1) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: current?.primaryColor || "#4F46E5" }}
          />
          <span className="max-w-[140px] truncate">{current?.name || slug}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => {
              switchTenant(t.slug);
              nav({ to: `/${t.slug}/dashboard` });
            }}
          >
            <div
              className="mr-2 h-3 w-3 rounded"
              style={{ backgroundColor: t.primaryColor }}
            />
            {t.name}
            {t.slug === slug && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm md:inline">{user?.name}</span>
          <span className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground md:inline">
            {user?.role}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{user?.name}</span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            dispatch(logout());
            nav({ to: "/login" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* --------- Global search with debounce --------- */
interface SearchResults {
  leads: { id: string; name: string; company: string }[];
  deals: { id: string; title: string; company: string }[];
  invoices: { id: string; number: string; clientName: string }[];
  contacts: { id: string; name: string; company: string }[];
}

function GlobalSearch({ slug }: { slug: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResults | null>(null);
  const nav = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await api.get<SearchResults>(`/${slug}/search`, {
          params: { q: term },
          signal: ac.signal,
        });
        setData(res.data);
      } catch {
        /* aborted or failed */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [q, slug]);

  const total = useMemo(() => {
    if (!data) return 0;
    return data.leads.length + data.deals.length + data.invoices.length + data.contacts.length;
  }, [data]);

  function go(path: string) {
    setOpen(false);
    setQ("");
    nav({ to: path });
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        placeholder="Search leads, deals, invoices, contacts..."
        className="h-9 pl-9 pr-8"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {loading && (
        <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-y-auto rounded-md border bg-popover p-2 shadow-lg">
          {!data && loading && (
            <div className="p-3 text-sm text-muted-foreground">Searching...</div>
          )}
          {data && total === 0 && !loading && (
            <div className="p-3 text-sm text-muted-foreground">No results.</div>
          )}
          {data && (
            <>
              <Section title="Leads" items={data.leads.map((l) => ({
                id: l.id, primary: l.name, secondary: l.company,
                onClick: () => go(`/${slug}/leads`),
              }))} />
              <Section title="Deals" items={data.deals.map((d) => ({
                id: d.id, primary: d.title, secondary: d.company,
                onClick: () => go(`/${slug}/deals/${d.id}`),
              }))} />
              <Section title="Invoices" items={data.invoices.map((i) => ({
                id: i.id, primary: i.number, secondary: i.clientName,
                onClick: () => go(`/${slug}/invoices/${i.id}`),
              }))} />
              <Section title="Contacts" items={data.contacts.map((c) => ({
                id: c.id, primary: c.name, secondary: c.company,
                onClick: () => go(`/${slug}/activity`),
              }))} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title, items,
}: {
  title: string;
  items: { id: string; primary: string; secondary: string; onClick: () => void }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {items.map((it) => (
        <button
          key={it.id}
          onMouseDown={(e) => { e.preventDefault(); it.onClick(); }}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
        >
          <span className="truncate">{it.primary}</span>
          <span className="ml-3 truncate text-xs text-muted-foreground">{it.secondary}</span>
        </button>
      ))}
    </div>
  );
}

export function AppShell({ tenantSlug }: { tenantSlug: string }) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-background via-background to-muted/60">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r bg-sidebar/80 text-sidebar-foreground backdrop-blur transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <Brand collapsed={collapsed} />
        <NavList slug={tenantSlug} collapsed={collapsed} />
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => dispatch(setSidebarCollapsed(!collapsed))}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="mr-2 h-4 w-4" /> Collapse
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card/70 px-4 backdrop-blur">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Brand collapsed={false} />
              <NavList slug={tenantSlug} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <TenantSwitcher slug={tenantSlug} />

          <div className="ml-2 hidden flex-1 md:block">
            <GlobalSearch slug={tenantSlug} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <NotificationsBell tenantSlug={tenantSlug} />
            <ThemeMenu />
            <UserMenu />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
