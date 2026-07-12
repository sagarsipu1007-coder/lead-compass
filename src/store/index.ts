import { configureStore, combineReducers } from "@reduxjs/toolkit";
import auth from "@/features/auth/slice";
import tenant from "@/features/tenant/slice";
import leads from "@/features/leads/slice";
import deals from "@/features/deals/slice";
import invoices from "@/features/invoices/slice";
import notifications from "@/features/notifications/slice";
import activity from "@/features/activity/slice";
import ui from "@/features/ui/slice";

const appReducer = combineReducers({
  auth,
  tenant,
  leads,
  deals,
  invoices,
  notifications,
  activity,
  ui,
});

// Root reducer resets tenant-scoped slices on TENANT_RESET.
export const rootReducer: typeof appReducer = (state, action) => {
  if (action.type === "app/tenantReset" && state) {
    return appReducer(
      {
        ...state,
        leads: undefined as never,
        deals: undefined as never,
        invoices: undefined as never,
        notifications: undefined as never,
        activity: undefined as never,
      },
      action,
    );
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const tenantReset = () => ({ type: "app/tenantReset" as const });
