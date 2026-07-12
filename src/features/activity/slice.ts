import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import { api } from "@/api/client";
import type { Contact, FollowUp, Task } from "@/lib/mockDb";
import type { RootState } from "@/store";

const contactsAdapter = createEntityAdapter<Contact>({
  sortComparer: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
});
const followUpsAdapter = createEntityAdapter<FollowUp>({
  sortComparer: (a, b) => (a.dueDate < b.dueDate ? -1 : 1),
});
const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => (a.dueDate < b.dueDate ? -1 : 1),
});

interface State {
  contacts: ReturnType<typeof contactsAdapter.getInitialState>;
  followUps: ReturnType<typeof followUpsAdapter.getInitialState>;
  tasks: ReturnType<typeof tasksAdapter.getInitialState>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ---- Contacts ----
export const fetchContacts = createAsyncThunk(
  "activity/contacts/fetch",
  async (tenantSlug: string) =>
    (await api.get<Contact[]>(`/${tenantSlug}/contacts`)).data,
);
export const createContact = createAsyncThunk(
  "activity/contacts/create",
  async (args: { tenantSlug: string; input: Partial<Contact> }) =>
    (await api.post<Contact>(`/${args.tenantSlug}/contacts`, args.input)).data,
);
export const updateContact = createAsyncThunk(
  "activity/contacts/update",
  async (args: { tenantSlug: string; id: string; changes: Partial<Contact> }) =>
    (await api.patch<Contact>(`/${args.tenantSlug}/contacts/${args.id}`, args.changes)).data,
);
export const deleteContact = createAsyncThunk(
  "activity/contacts/delete",
  async (args: { tenantSlug: string; id: string }) => {
    await api.delete(`/${args.tenantSlug}/contacts/${args.id}`);
    return args.id;
  },
);

// ---- Follow-ups ----
export const fetchFollowUps = createAsyncThunk(
  "activity/followups/fetch",
  async (tenantSlug: string) =>
    (await api.get<FollowUp[]>(`/${tenantSlug}/followups`)).data,
);
export const createFollowUp = createAsyncThunk(
  "activity/followups/create",
  async (args: { tenantSlug: string; input: Partial<FollowUp> }) =>
    (await api.post<FollowUp>(`/${args.tenantSlug}/followups`, args.input)).data,
);
export const updateFollowUp = createAsyncThunk(
  "activity/followups/update",
  async (args: { tenantSlug: string; id: string; changes: Partial<FollowUp> }) =>
    (await api.patch<FollowUp>(`/${args.tenantSlug}/followups/${args.id}`, args.changes)).data,
);
export const deleteFollowUp = createAsyncThunk(
  "activity/followups/delete",
  async (args: { tenantSlug: string; id: string }) => {
    await api.delete(`/${args.tenantSlug}/followups/${args.id}`);
    return args.id;
  },
);

// ---- Tasks ----
export const fetchTasks = createAsyncThunk(
  "activity/tasks/fetch",
  async (tenantSlug: string) =>
    (await api.get<Task[]>(`/${tenantSlug}/tasks`)).data,
);
export const createTask = createAsyncThunk(
  "activity/tasks/create",
  async (args: { tenantSlug: string; input: Partial<Task> }) =>
    (await api.post<Task>(`/${args.tenantSlug}/tasks`, args.input)).data,
);
export const updateTask = createAsyncThunk(
  "activity/tasks/update",
  async (args: { tenantSlug: string; id: string; changes: Partial<Task> }) =>
    (await api.patch<Task>(`/${args.tenantSlug}/tasks/${args.id}`, args.changes)).data,
);
export const deleteTask = createAsyncThunk(
  "activity/tasks/delete",
  async (args: { tenantSlug: string; id: string }) => {
    await api.delete(`/${args.tenantSlug}/tasks/${args.id}`);
    return args.id;
  },
);

const initialState: State = {
  contacts: contactsAdapter.getInitialState(),
  followUps: followUpsAdapter.getInitialState(),
  tasks: tasksAdapter.getInitialState(),
  status: "idle",
  error: null,
};

const slice = createSlice({
  name: "activity",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchContacts.fulfilled, (s, a) =>
      contactsAdapter.setAll(s.contacts, a.payload),
    );
    b.addCase(createContact.fulfilled, (s, a) =>
      contactsAdapter.addOne(s.contacts, a.payload),
    );
    b.addCase(updateContact.fulfilled, (s, a) =>
      contactsAdapter.upsertOne(s.contacts, a.payload),
    );
    b.addCase(deleteContact.fulfilled, (s, a) =>
      contactsAdapter.removeOne(s.contacts, a.payload),
    );

    b.addCase(fetchFollowUps.fulfilled, (s, a) =>
      followUpsAdapter.setAll(s.followUps, a.payload),
    );
    b.addCase(createFollowUp.fulfilled, (s, a) =>
      followUpsAdapter.addOne(s.followUps, a.payload),
    );
    b.addCase(updateFollowUp.fulfilled, (s, a) =>
      followUpsAdapter.upsertOne(s.followUps, a.payload),
    );
    b.addCase(deleteFollowUp.fulfilled, (s, a) =>
      followUpsAdapter.removeOne(s.followUps, a.payload),
    );

    b.addCase(fetchTasks.fulfilled, (s, a) =>
      tasksAdapter.setAll(s.tasks, a.payload),
    );
    b.addCase(createTask.fulfilled, (s, a) =>
      tasksAdapter.addOne(s.tasks, a.payload),
    );
    b.addCase(updateTask.fulfilled, (s, a) =>
      tasksAdapter.upsertOne(s.tasks, a.payload),
    );
    b.addCase(deleteTask.fulfilled, (s, a) =>
      tasksAdapter.removeOne(s.tasks, a.payload),
    );
  },
});

export default slice.reducer;

export const contactsSelectors = contactsAdapter.getSelectors<RootState>(
  (s) => s.activity.contacts,
);
export const followUpsSelectors = followUpsAdapter.getSelectors<RootState>(
  (s) => s.activity.followUps,
);
export const tasksSelectors = tasksAdapter.getSelectors<RootState>(
  (s) => s.activity.tasks,
);
