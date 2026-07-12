import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { PageHeader, KPISkeleton } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, TrendingUp, AlertTriangle, Users, FileText, CheckCircle2,
  Wallet, Target, ClipboardList, ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/lib/mockDb";

export const Route = createFileRoute("/_app/$tenantSlug/dashboard")({
  ssr: false,
  component: DashboardPage,
});

interface KPIs { openDeals: number; pipelineValue: number; overdueInvoices: number; totalLeads: number }
interface ByStage { stage: string; count: number; value: number }
interface Trend { month: string; revenue: number }
interface Activity { id: string; kind: string; message: string; createdAt: string }
interface DashboardData { kpis: KPIs; byStage: ByStage[]; trend: Trend[]; activity: Activity[] }

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const roleTitle: Record<UserRole, string> = {
  admin: "Admin control center",
  owner: "Company overview",
  manager: "Team pipeline",
  rep: "My workspace",
  finance: "Finance overview",
  customer: "Your account",
};
const roleDesc: Record<UserRole, string> = {
  admin: "System-wide health, users, and revenue at a glance.",
  owner: "How the whole business is performing this quarter.",
  manager: "Track your team's pipeline and follow-ups.",
  rep: "Your active deals and today's follow-ups.",
  finance: "Invoices, receivables, and cash flow.",
  customer: "Your invoices, contacts and open items.",
};

function DashboardPage() {
  const { tenantSlug } = Route.useParams();
  const role = (useAppSelector((s) => s.auth.user?.role) ?? "admin") as UserRole;
  const userName = useAppSelector((s) => s.auth.user?.name) || "";
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>(`/${tenantSlug}/dashboard`);
      setData(res.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tenantSlug]);

  return (
    <div>
      <PageHeader
        title={roleTitle[role]}
        description={roleDesc[role]}
        actions={
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="capitalize">{role}</Badge>
            <span className="text-muted-foreground">Signed in as {userName}</span>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {loading && <KPISkeleton />}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}{" "}<button className="ml-2 underline" onClick={load}>Retry</button>
          </div>
        )}
        {data && (
          <>
            {role === "admin" && <AdminDashboard data={data} />}
            {role === "owner" && <OwnerDashboard data={data} />}
            {role === "manager" && <ManagerDashboard data={data} />}
            {role === "rep" && <RepDashboard data={data} />}
            {role === "finance" && <FinanceDashboard data={data} />}
            {role === "customer" && <CustomerDashboard data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Shared bits ---------- */
function KPICard({ label, value, icon, tone }: {
  label: string; value: string; icon?: React.ReactNode;
  tone?: "warning" | "success" | "primary";
}) {
  const toneClass =
    tone === "warning" ? "from-warning/15 to-transparent text-warning" :
    tone === "success" ? "from-success/15 to-transparent text-success" :
    tone === "primary" ? "from-primary/15 to-transparent text-primary" :
    "from-muted to-transparent text-muted-foreground";
  return (
    <Card className="overflow-hidden">
      <CardContent className={`bg-gradient-to-br p-5 ${toneClass}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span>{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function RevenueTrend({ trend }: { trend: Trend[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle className="text-sm font-medium">Revenue trend</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function StageBars({ byStage }: { byStage: ByStage[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Deals by stage</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ activity }: { activity: Activity[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Recent activity</CardTitle></CardHeader>
      <CardContent>
        <ul className="divide-y">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-medium uppercase text-accent-foreground">
                {a.kind[0]}
              </span>
              <span className="flex-1 truncate">{a.message}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ---------- Role variants ---------- */
function AdminDashboard({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Open deals" value={data.kpis.openDeals.toString()} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KPICard label="Pipeline value" value={fmtMoney(data.kpis.pipelineValue)} icon={<DollarSign className="h-4 w-4" />} tone="success" />
        <KPICard label="Overdue invoices" value={data.kpis.overdueInvoices.toString()} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
        <KPICard label="Total leads" value={data.kpis.totalLeads.toString()} icon={<Users className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueTrend trend={data.trend} />
        <StageBars byStage={data.byStage} />
      </div>
      <ActivityFeed activity={data.activity} />
    </>
  );
}

function OwnerDashboard({ data }: { data: DashboardData }) {
  const wonValue = data.byStage.find((s) => s.stage === "won")?.value || 0;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Quarterly pipeline" value={fmtMoney(data.kpis.pipelineValue)} icon={<Target className="h-4 w-4" />} tone="primary" />
        <KPICard label="Won revenue" value={fmtMoney(wonValue)} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <KPICard label="Active deals" value={data.kpis.openDeals.toString()} icon={<TrendingUp className="h-4 w-4" />} />
        <KPICard label="Overdue AR" value={data.kpis.overdueInvoices.toString()} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueTrend trend={data.trend} />
        <StageBars byStage={data.byStage} />
      </div>
    </>
  );
}

function ManagerDashboard({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Team open deals" value={data.kpis.openDeals.toString()} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KPICard label="Pipeline value" value={fmtMoney(data.kpis.pipelineValue)} icon={<DollarSign className="h-4 w-4" />} tone="success" />
        <KPICard label="New leads" value={data.kpis.totalLeads.toString()} icon={<Users className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StageBars byStage={data.byStage} />
        <ActivityFeed activity={data.activity} />
      </div>
    </>
  );
}

function RepDashboard({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="My open deals" value={data.kpis.openDeals.toString()} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KPICard label="Follow-ups due" value={data.activity.length.toString()} icon={<ClipboardList className="h-4 w-4" />} />
        <KPICard label="Leads assigned" value={data.kpis.totalLeads.toString()} icon={<Users className="h-4 w-4" />} tone="success" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StageBars byStage={data.byStage} />
        <ActivityFeed activity={data.activity} />
      </div>
    </>
  );
}

function FinanceDashboard({ data }: { data: DashboardData }) {
  const wonValue = data.byStage.find((s) => s.stage === "won")?.value || 0;
  const pieData = data.byStage.slice(0, 4);
  const COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--destructive)"];
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Cash collected" value={fmtMoney(wonValue)} icon={<Wallet className="h-4 w-4" />} tone="success" />
        <KPICard label="Overdue invoices" value={data.kpis.overdueInvoices.toString()} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
        <KPICard label="Pipeline forecast" value={fmtMoney(data.kpis.pipelineValue)} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KPICard label="Open invoices" value={(data.kpis.overdueInvoices + 6).toString()} icon={<FileText className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueTrend trend={data.trend} />
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Revenue mix</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="stage" innerRadius={40} outerRadius={80}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function CustomerDashboard({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Open invoices" value={(data.kpis.overdueInvoices + 3).toString()} icon={<FileText className="h-4 w-4" />} tone="primary" />
        <KPICard label="Overdue" value={data.kpis.overdueInvoices.toString()} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
        <KPICard label="Account status" value="Active" icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
      </div>
      <ActivityFeed activity={data.activity} />
    </>
  );
}
