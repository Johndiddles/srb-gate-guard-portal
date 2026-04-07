"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Car,
  Loader2,
  LogOut,
  RefreshCw,
  Ticket,
  Users,
  Warehouse,
  Waypoints,
} from "lucide-react";
import { HourlyBarChart } from "@/components/admin/OverviewCharts";
import type { DashboardOverviewResponse } from "@/lib/dashboard/overviewData";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";

function utcTodayInputValue(): string {
  const n = new Date();
  const y = n.getUTCFullYear();
  const m = String(n.getUTCMonth() + 1).padStart(2, "0");
  const d = String(n.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { can } = usePortalPermissions();
  const [authLoading, setAuthLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(
    null,
  );
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(utcTodayInputValue);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      if (session?.user?.requires_password_change) {
        router.push("/change-password");
      } else {
        setAuthLoading(false);
      }
    }
  }, [status, session, router]);

  const loadOverview = useCallback(async (date: string) => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch(
        `/api/admin/overview?date=${encodeURIComponent(date)}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load overview");
      }
      const data: DashboardOverviewResponse = await res.json();
      setOverview(data);
    } catch {
      setOverviewError("Could not load dashboard data. Try again shortly.");
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void loadOverview(selectedDate);
    }
  }, [authLoading, selectedDate, loadOverview]);

  const hasAnyMetric =
    overview &&
    (overview.guestMovements ||
      overview.staffParking ||
      overview.vehicularMovements ||
      overview.staffShifts ||
      overview.staffGatePasses);

  if (authLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            Welcome back, {session?.user?.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Day (UTC)</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadOverview(selectedDate)}
            disabled={overviewLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={overviewLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {overviewError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {overviewError}
        </div>
      )}

      {overviewLoading && !overview ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-emerald-600" />
          Loading overview…
        </div>
      ) : overview && !hasAnyMetric ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          <p className="font-medium text-slate-800">
            No analytics for your role
          </p>
          <p className="mt-2 text-sm">
            Your permissions do not include viewing movement or parking metrics.
            Contact an administrator if you need dashboard access.
          </p>
        </div>
      ) : overview ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overview.guestMovements && can(PP.VIEW_GUEST_MOVEMENT) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Guest gate activity
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                      {overview.guestMovements.totalToday}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Guest movement records on {overview.date}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <Ticket size={22} />
                  </div>
                </div>
              </div>
            )}

            {overview.staffParking && can(PP.VIEW_STAFF_PARKING) && (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Staff parking today
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                        {overview.staffParking.movementsToday}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Parking events logged on {overview.date}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                      <Car size={22} />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Vehicles in staff parking now
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                        {overview.staffParking.currentlyParked}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Open visits (no checkout time yet)
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                      <Warehouse size={22} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {overview.vehicularMovements && can(PP.VIEW_VEHICULAR_MOVEMENT) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Vehicular movements
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                      {overview.vehicularMovements.totalToday}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Records on {overview.date}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Waypoints size={22} />
                  </div>
                </div>
              </div>
            )}

            {overview.staffShifts && can(PP.VIEW_STAFF_MOVEMENT) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Staff shifts started
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                      {overview.staffShifts.shiftsStartedToday}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Clock-ins on {overview.date}
                    </p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                    <Users size={22} />
                  </div>
                </div>
              </div>
            )}

            {overview.staffGatePasses && can(PP.VIEW_STAFF_GATE_PASS) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Gate Passes
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                      {overview.staffGatePasses.exitEventsToday}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Exit events on {overview.date}
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                    <LogOut size={22} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {overview.guestMovements && can(PP.VIEW_GUEST_MOVEMENT) && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Guest movements per hour
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Volume of guest gate records by UTC hour — watch for spikes or
                  unusually quiet periods.
                </p>
                <HourlyBarChart
                  buckets={overview.guestMovements.byHour}
                  color="#10b981"
                  emptyLabel="No guest movements recorded for this day."
                />
              </section>
            )}

            {overview.staffParking && can(PP.VIEW_STAFF_PARKING) && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Staff parking activity per hour
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  When staff parking events were logged (UTC).
                </p>
                <HourlyBarChart
                  buckets={overview.staffParking.byHour}
                  color="#d97706"
                  emptyLabel="No staff parking activity for this day."
                />
              </section>
            )}

            {overview.staffShifts && can(PP.VIEW_STAFF_MOVEMENT) && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Staff shift clock-ins per hour
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  New shifts started by UTC hour.
                </p>
                <HourlyBarChart
                  buckets={overview.staffShifts.clockInByHour}
                  color="#7c3aed"
                  emptyLabel="No staff shifts started this day."
                />
              </section>
            )}

            {overview.staffGatePasses && can(PP.VIEW_STAFF_GATE_PASS) && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Gate Passes per hour
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Staff exit (gate pass) events by UTC hour.
                </p>
                <HourlyBarChart
                  buckets={overview.staffGatePasses.exitsByHour}
                  color="#e11d48"
                  emptyLabel="No staff exit events this day."
                />
              </section>
            )}

            {overview.vehicularMovements && can(PP.VIEW_VEHICULAR_MOVEMENT) && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Vehicular movements per hour
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Resort vehicle traffic records by UTC hour.
                </p>
                <HourlyBarChart
                  buckets={overview.vehicularMovements.byHour}
                  color="#2563eb"
                  emptyLabel="No vehicular movements this day."
                />
              </section>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
