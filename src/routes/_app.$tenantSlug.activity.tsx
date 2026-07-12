import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchContacts,
  createContact,
  deleteContact,
  fetchFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  contactsSelectors,
  followUpsSelectors,
  tasksSelectors,
} from "@/features/activity/slice";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Phone,
  Mail,
  Users2,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/$tenantSlug/activity")({
  ssr: false,
  component: ActivityPage,
});

function ActivityPage() {
  const { tenantSlug } = Route.useParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchContacts(tenantSlug));
    dispatch(fetchFollowUps(tenantSlug));
    dispatch(fetchTasks(tenantSlug));
  }, [dispatch, tenantSlug]);

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Manage contacts, follow-ups and tasks in one place."
      />
      <div className="p-6">
        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts">
              <Users2 className="mr-2 h-4 w-4" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="followups">
              <Phone className="mr-2 h-4 w-4" /> Follow-ups
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ClipboardList className="mr-2 h-4 w-4" /> Tasks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contacts">
            <ContactsPanel tenantSlug={tenantSlug} />
          </TabsContent>
          <TabsContent value="followups">
            <FollowUpsPanel tenantSlug={tenantSlug} />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksPanel tenantSlug={tenantSlug} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- Contacts ---------------- */
function ContactsPanel({ tenantSlug }: { tenantSlug: string }) {
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(contactsSelectors.selectAll);
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      contacts.filter((c) =>
        `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [contacts, q],
  );

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Search contacts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <NewContactDialog tenantSlug={tenantSlug} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Company</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Phone</th>
              <th className="py-2 font-medium">Title</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="py-2 font-medium">{c.name}</td>
                <td className="py-2 text-muted-foreground">{c.company}</td>
                <td className="py-2 text-muted-foreground">{c.email}</td>
                <td className="py-2 text-muted-foreground">{c.phone}</td>
                <td className="py-2 text-muted-foreground">{c.title}</td>
                <td className="py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dispatch(deleteContact({ tenantSlug, id: c.id }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function NewContactDialog({ tenantSlug }: { tenantSlug: string }) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", title: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New contact</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {(["name", "company", "email", "phone", "title"] as const).map((k) => (
            <div key={k} className="grid gap-1">
              <Label htmlFor={k} className="capitalize">{k}</Label>
              <Input
                id={k}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!form.name) return toast.error("Name required");
              await dispatch(createContact({ tenantSlug, input: form }));
              toast.success("Contact added");
              setForm({ name: "", email: "", phone: "", company: "", title: "" });
              setOpen(false);
            }}
          >Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Follow-ups ---------------- */
function FollowUpsPanel({ tenantSlug }: { tenantSlug: string }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(followUpsSelectors.selectAll);
  const contacts = useAppSelector(contactsSelectors.selectAll);
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.filter((i) => i.status === "pending").length} pending
        </div>
        <NewFollowUpDialog tenantSlug={tenantSlug} contacts={contacts} />
      </div>
      <ul className="divide-y">
        {items.map((f) => {
          const c = contacts.find((x) => x.id === f.contactId);
          const overdue = f.status === "pending" && new Date(f.dueDate) < new Date();
          return (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <button
                onClick={() =>
                  dispatch(updateFollowUp({
                    tenantSlug, id: f.id,
                    changes: { status: f.status === "done" ? "pending" : "done" },
                  }))
                }
                className="text-muted-foreground hover:text-primary"
                aria-label="Toggle done"
              >
                <CheckCircle2 className={`h-5 w-5 ${f.status === "done" ? "text-success" : ""}`} />
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${f.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                  {f.subject}
                </div>
                <div className="text-xs text-muted-foreground">
                  {f.channel} · {c?.name || "—"} · due {format(new Date(f.dueDate), "MMM d")}
                </div>
              </div>
              {overdue && <Badge variant="destructive">Overdue</Badge>}
              <Badge variant="outline" className="capitalize">{f.status}</Badge>
              <Button variant="ghost" size="icon"
                onClick={() => dispatch(deleteFollowUp({ tenantSlug, id: f.id }))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">No follow-ups.</li>
        )}
      </ul>
    </Card>
  );
}

function NewFollowUpDialog({
  tenantSlug,
  contacts,
}: {
  tenantSlug: string;
  contacts: { id: string; name: string }[];
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    channel: "call" as "call" | "email" | "meeting",
    dueDate: new Date().toISOString().slice(0, 10),
    contactId: "" as string,
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New follow-up</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New follow-up</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as typeof form.channel })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Contact</Label>
            <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
              <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!form.subject) return toast.error("Subject required");
            await dispatch(createFollowUp({
              tenantSlug,
              input: { ...form, dueDate: new Date(form.dueDate).toISOString() },
            }));
            toast.success("Follow-up scheduled");
            setOpen(false);
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Tasks ---------------- */
function TasksPanel({ tenantSlug }: { tenantSlug: string }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(tasksSelectors.selectAll);
  const groups = {
    todo: items.filter((t) => t.status === "todo"),
    in_progress: items.filter((t) => t.status === "in_progress"),
    done: items.filter((t) => t.status === "done"),
  };
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {groups.todo.length} to do · {groups.in_progress.length} in progress · {groups.done.length} done
        </div>
        <NewTaskDialog tenantSlug={tenantSlug} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(["todo", "in_progress", "done"] as const).map((col) => (
          <div key={col} className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
              <span>{col.replace("_", " ")}</span>
              <span>{groups[col].length}</span>
            </div>
            <div className="space-y-2">
              {groups[col].map((t) => (
                <div key={t.id} className="rounded-md border bg-card p-3 shadow-sm">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={t.status === "done"}
                      onCheckedChange={(v) =>
                        dispatch(updateTask({
                          tenantSlug, id: t.id,
                          changes: { status: v ? "done" : "todo" },
                        }))
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>due {format(new Date(t.dueDate), "MMM d")}</span>
                        <PriorityBadge p={t.priority} />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon"
                      onClick={() => dispatch(deleteTask({ tenantSlug, id: t.id }))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {col !== "in_progress" && col !== "done" && (
                    <Button
                      size="sm" variant="outline" className="mt-2 h-7 w-full"
                      onClick={() => dispatch(updateTask({
                        tenantSlug, id: t.id, changes: { status: "in_progress" },
                      }))}
                    >Start</Button>
                  )}
                </div>
              ))}
              {groups[col].length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PriorityBadge({ p }: { p: "low" | "med" | "high" }) {
  const map = {
    low: "bg-muted text-muted-foreground",
    med: "bg-warning/20 text-warning-foreground",
    high: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${map[p]}`}>
      {p}
    </span>
  );
}

function NewTaskDialog({ tenantSlug }: { tenantSlug: string }) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    priority: "med" as "low" | "med" | "high",
    dueDate: new Date().toISOString().slice(0, 10),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="med">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!form.title) return toast.error("Title required");
            await dispatch(createTask({
              tenantSlug,
              input: { ...form, dueDate: new Date(form.dueDate).toISOString() },
            }));
            toast.success("Task added");
            setOpen(false);
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mark import as used (unused-suppress if Mail unused)
void Mail;
