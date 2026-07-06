"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Grid,
  List,
  Unlock,
  Phone,
  User,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";

type PhoneBoothAssignment = {
  id?: string;
  _id?: string;
  staffId: string;
  staffName?: string;
  department?: string;
  slotNumber: number;
  assignedAt: string;
  retrievedAt?: string;
  status: "assigned" | "retrieved";
  app_log_id: string;
  deviceName?: string;
  location: string;
};

type StatusFilter = "all" | "assigned" | "retrieved";

export default function PhoneBoothPage() {
  const { can } = usePortalPermissions();

  const [assignments, setAssignments] = useState<PhoneBoothAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal / Selected Slot state
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<{
    slotNumber: number;
    assignment?: PhoneBoothAssignment;
  } | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSelectToggle = (appLogId: string) => {
    setSelectedIds((prev) =>
      prev.includes(appLogId)
        ? prev.filter((id) => id !== appLogId)
        : [...prev, appLogId],
    );
  };

  const fetchAssignments = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/phone-booth");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
        // Clean up selectedIds by removing any IDs that are no longer active/assigned
        const activeIds = data
          .filter((a: PhoneBoothAssignment) => a.status === "assigned")
          .map((a: PhoneBoothAssignment) => a.app_log_id);
        setSelectedIds((prev) => prev.filter((id) => activeIds.includes(id)));
      } else {
        setErrorMsg("Failed to load assignments from server.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error: Failed to fetch assignments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleRelease = async (appLogId: string) => {
    if (
      !confirm(
        "Are you sure you want to release this slot? This will mark the phone as retrieved.",
      )
    ) {
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/phone-booth/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_log_id: appLogId }),
      });
      if (res.ok) {
        setSuccessMsg("Phone slot released successfully!");
        setSelectedSlotDetails(null);
        setSelectedIds((prev) => prev.filter((id) => id !== appLogId));
        fetchAssignments();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to release slot.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error: Failed to release slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkRelease = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to release the ${selectedIds.length} selected slot(s)? This will mark their phones as retrieved.`,
      )
    ) {
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/phone-booth/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_log_ids: selectedIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || "Phone slots released successfully!");
        setSelectedIds([]);
        setSelectedSlotDetails(null);
        fetchAssignments();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to release slots.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error: Failed to release slots.");
    } finally {
      setActionLoading(false);
    }
  };

  // Compute slot occupancy map for range 41 to 294
  const occupiedSlotsMap = new Map<number, PhoneBoothAssignment>();
  assignments.forEach((a) => {
    if (a.status === "assigned") {
      occupiedSlotsMap.set(a.slotNumber, a);
    }
  });

  const slots: number[] = [];
  for (let i = 41; i <= 294; i++) {
    slots.push(i);
  }

  // Filter assignments for Table view
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.staffName &&
        a.staffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.department &&
        a.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.slotNumber.toString().includes(searchQuery);

    const matchesStatus = statusFilter === "all" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeFilteredAssignments = filteredAssignments.filter(
    (a) => a.status === "assigned",
  );

  const handleSelectAllToggle = () => {
    const activeFilteredIds = activeFilteredAssignments.map(
      (a) => a.app_log_id,
    );
    const allSelected =
      activeFilteredIds.length > 0 &&
      activeFilteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !activeFilteredIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) => {
        const next = [...prev];
        activeFilteredIds.forEach((id) => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Phone className="text-emerald-600" size={32} />
            Phone Booth Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Visual tracking, slot allocation grid, and administrative slot
            release
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Grid size={15} />
              Grid View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List size={15} />
              Logs Table
            </button>
          </div>

          <button
            onClick={fetchAssignments}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Message alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <ShieldCheck size={18} className="text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <div className="h-2 w-2 rounded-full bg-red-600"></div>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-3">
          <Loader2 size={40} className="text-emerald-600 animate-spin" />
          <span className="text-slate-500 text-sm font-medium">
            Loading phone booth data...
          </span>
        </div>
      ) : (
        <>
          {/* Counters row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                  Occupied Slots
                </p>
                <p className="text-4xl font-extrabold mt-1">
                  {occupiedSlotsMap.size}
                </p>
                <p className="text-emerald-100/80 text-xs mt-1">
                  Phones stored inside booth
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <Phone size={28} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Free Available Slots
                </p>
                <p className="text-4xl font-extrabold text-slate-800 mt-1">
                  {254 - occupiedSlotsMap.size}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Ready for phone storage
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <Unlock size={28} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Total Slots Range
                </p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">
                  41 - 294
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Total capacity: 254 slots
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <Layers size={28} />
              </div>
            </div>
          </div>

          {/* Main Panel views */}
          {viewMode === "grid" ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Interactive Slot Allocation Grid
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click on any slot to view active assignment details or
                    release it
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="h-3.5 w-3.5 rounded bg-emerald-500 border border-emerald-600 block"></span>
                    Free Slot
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="h-3.5 w-3.5 rounded bg-rose-500 border border-rose-600 block"></span>
                    Occupied Slot
                  </div>
                </div>
              </div>

              {/* Grid map */}
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-3">
                {slots.map((slot) => {
                  const assignment = occupiedSlotsMap.get(slot);
                  const isOccupied = !!assignment;

                  return (
                    <button
                      key={slot}
                      onClick={() =>
                        setSelectedSlotDetails({ slotNumber: slot, assignment })
                      }
                      className={`h-11 rounded-lg flex flex-col items-center justify-center font-bold text-sm shadow-sm transition-all border outline-none ${
                        isOccupied
                          ? "bg-rose-500 border-rose-600 text-white hover:bg-rose-600"
                          : "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600"
                      }`}
                      title={`Slot ${slot} - ${isOccupied ? `Occupied by Staff ID ${assignment.staffId}` : "Free"}`}
                    >
                      <span className="text-[10px] opacity-75 font-normal">
                        Slot
                      </span>
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Table search filters */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="relative w-full sm:max-w-md">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <input
                    type="text"
                    placeholder="Search Staff Name, ID or Slot number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StatusFilter)
                    }
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="all">All Assignments</option>
                    <option value="assigned">Occupied (Inside)</option>
                    <option value="retrieved">Retrieved (Released)</option>
                  </select>
                </div>
              </div>

              {/* Table rendering */}
              {selectedIds.length > 0 && (
                <div className="bg-rose-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                    <span className="text-sm font-semibold text-slate-700">
                      {selectedIds.length} slot
                      {selectedIds.length > 1 ? "s" : ""} selected for release
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-slate-500 hover:text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={handleBulkRelease}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Unlock size={13} />
                      )}
                      {actionLoading
                        ? "Releasing..."
                        : "Release Selected Slots"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      {can(PP.RELEASE_PHONE_BOOTH) && (
                        <th className="px-6 py-3 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                            disabled={activeFilteredAssignments.length === 0}
                            checked={
                              activeFilteredAssignments.length > 0 &&
                              activeFilteredAssignments.every((a) =>
                                selectedIds.includes(a.app_log_id),
                              )
                            }
                            onChange={handleSelectAllToggle}
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Slot
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Staff ID
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Staff Name
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Deposited Time
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                        Retrieved Time
                      </th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={can(PP.RELEASE_PHONE_BOOTH) ? 9 : 8}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No matching phone assignments found.
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((a) => (
                        <tr
                          key={a.app_log_id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          {can(PP.RELEASE_PHONE_BOOTH) && (
                            <td className="px-6 py-4 w-10">
                              {a.status === "assigned" ? (
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                                  checked={selectedIds.includes(a.app_log_id)}
                                  onChange={() =>
                                    handleSelectToggle(a.app_log_id)
                                  }
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-200 text-slate-300 cursor-not-allowed opacity-50 h-4 w-4"
                                  disabled
                                  checked={false}
                                />
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              Slot {a.slotNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                            {a.staffId}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {a.staffName || "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {a.department || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {a.status === "assigned" ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                Occupied
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                Retrieved
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(a.assignedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {a.retrievedAt
                              ? new Date(a.retrievedAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {a.status === "assigned" &&
                              can(PP.RELEASE_PHONE_BOOTH) && (
                                <button
                                  onClick={() => handleRelease(a.app_log_id)}
                                  className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 text-xs font-semibold bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
                                >
                                  <Unlock size={13} />
                                  Release
                                </button>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Slot Drawer/Modal */}
      {selectedSlotDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs px-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Layers className="text-emerald-600" size={20} />
                Slot {selectedSlotDetails.slotNumber} Details
              </h3>
              <button
                onClick={() => setSelectedSlotDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {selectedSlotDetails.assignment ? (
                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-600"></span>
                    Currently Occupied
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                      <User size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Staff ID
                        </p>
                        <p className="text-slate-900 font-bold font-mono mt-0.5">
                          {selectedSlotDetails.assignment.staffId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                      <User size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Staff Name
                        </p>
                        <p className="text-slate-900 font-semibold mt-0.5">
                          {selectedSlotDetails.assignment.staffName || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                      <Layers size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Department
                        </p>
                        <p className="text-slate-900 font-semibold mt-0.5">
                          {selectedSlotDetails.assignment.department || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Time Stored
                        </p>
                        <p className="text-slate-900 text-sm mt-0.5">
                          {new Date(
                            selectedSlotDetails.assignment.assignedAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {can(PP.RELEASE_PHONE_BOOTH) && (
                    <button
                      onClick={() =>
                        handleRelease(
                          selectedSlotDetails.assignment!.app_log_id,
                        )
                      }
                      disabled={actionLoading}
                      className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Unlock size={16} />
                      )}
                      {actionLoading ? "Releasing..." : "Release Slot"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-center py-6">
                  <div className="inline-flex bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium items-center gap-2 mx-auto">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    Slot is Currently Empty
                  </div>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Phones can only be deposited/registered using the offline
                    Gate Guard mobile app.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
