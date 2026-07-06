"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Key,
  ShieldCheck,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "next-auth/react";

type KeyCollection = {
  id?: string;
  _id?: string;
  keyTag: string;
  collectingStaffId: string;
  collectingStaffName?: string;
  collectingStaffDepartment?: string;
  collectedAt: string;
  returningStaffId?: string;
  returningStaffName?: string;
  returningStaffDepartment?: string;
  returnedAt?: string;
  status: "collected" | "returned" | "resolved";
  resolvedBy?: string;
  resolvedAt?: string;
  app_log_id: string;
  deviceName: string;
  location: string;
};

type StatusFilter = "all" | "collected" | "returned" | "resolved";

export default function KeysAdminPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [keyLogs, setKeyLogs] = useState<KeyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal/Resolution state
  const [selectedLog, setSelectedLog] = useState<KeyCollection | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchKeyLogs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeyLogs(data);
      } else {
        setErrorMsg("Failed to load key collections from server.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error: Failed to fetch key logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKeyLogs();
  }, []);

  const handleResolveKey = async (appLogId: string) => {
    if (!isSuperAdmin) {
      setErrorMsg("Unauthorized: Only Super Admins can resolve key logs.");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/keys/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_log_id: appLogId }),
      });
      if (res.ok) {
        setSuccessMsg(
          "Key collection resolved successfully by Admin! New key issued.",
        );
        setSelectedLog(null);
        fetchKeyLogs();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to resolve key collection.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error: Failed to resolve key collection.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter key logs for Table view
  const filteredLogs = keyLogs.filter((log) => {
    const matchesSearch =
      log.keyTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.collectingStaffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.collectingStaffName &&
        log.collectingStaffName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (log.collectingStaffDepartment &&
        log.collectingStaffDepartment
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (log.returningStaffId &&
        log.returningStaffId
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (log.returningStaffName &&
        log.returningStaffName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (log.returningStaffDepartment &&
        log.returningStaffDepartment
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats Counters
  const totalCollected = keyLogs.filter(
    (log) => log.status === "collected",
  ).length;
  const totalReturned = keyLogs.filter(
    (log) => log.status === "returned",
  ).length;
  const totalResolved = keyLogs.filter(
    (log) => log.status === "resolved",
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="text-emerald-600 animate-pulse" size={32} />
            Keys Tracking Portal
          </h1>
          <p className="text-slate-500 mt-1">
            Track key collections and returns, report lost keys, and perform
            admin-level resolutions
          </p>
        </div>

        <button
          onClick={fetchKeyLogs}
          disabled={refreshing}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
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
          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-3">
          <Loader2 size={40} className="text-emerald-600 animate-spin" />
          <span className="text-slate-500 text-sm font-medium">
            Loading keys tracking logs...
          </span>
        </div>
      ) : (
        <>
          {/* Counters row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                  Active Checked Out
                </p>
                <p className="text-4xl font-extrabold mt-1">{totalCollected}</p>
                <p className="text-emerald-100/80 text-xs mt-1">
                  Keys currently signed out by staff
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <Key size={28} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Successfully Returned
                </p>
                <p className="text-4xl font-extrabold text-slate-800 mt-1">
                  {totalReturned}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Keys returned to keys box
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <CheckCircle size={28} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Resolved by Admin
                </p>
                <p className="text-4xl font-extrabold text-slate-800 mt-1">
                  {totalResolved}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  New keys issued & logged
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <AlertTriangle size={28} />
              </div>
            </div>
          </div>

          {/* Main Logs Table */}
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
                  placeholder="Search Key Tag, Staff ID, Name, Department..."
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
                  <option value="all">All Keys Logs</option>
                  <option value="collected">Checked Out</option>
                  <option value="returned">Returned</option>
                  <option value="resolved">Resolved (Admin)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Key Tag Barcode
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Collecting Staff
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Collected Time
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Returning Staff
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Returned Time
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                      Device / Location
                    </th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No matching key tracking logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.app_log_id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded border border-slate-200 font-mono">
                            {log.keyTag}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.status === "collected" ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                              Checked Out
                            </span>
                          ) : log.status === "returned" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                              Returned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                              Resolved by Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-semibold text-sm">
                            {log.collectingStaffName || "—"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            ID: {log.collectingStaffId} |{" "}
                            {log.collectingStaffDepartment || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {new Date(log.collectedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {log.status === "returned" && log.returningStaffId ? (
                            <>
                              <div className="text-slate-800 font-semibold text-sm">
                                {log.returningStaffName || "—"}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                ID: {log.returningStaffId} |{" "}
                                {log.returningStaffDepartment || "—"}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {log.returnedAt
                            ? new Date(log.returnedAt).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800 text-xs font-semibold">
                            {log.deviceName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {log.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.status === "collected" && (
                            <>
                              {isSuperAdmin ? (
                                <button
                                  onClick={() => setSelectedLog(log)}
                                  className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                                >
                                  <ShieldCheck size={13} />
                                  Resolve
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title="Only Super Admins can resolve key logs"
                                  className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg cursor-not-allowed"
                                >
                                  <ShieldCheck size={13} />
                                  Resolve
                                </button>
                              )}
                            </>
                          )}
                          {log.status === "resolved" && (
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                              Resolved by Admin
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs px-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Key className="text-purple-600 animate-pulse" size={20} />
                Resolve Key Collection
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-100 text-purple-800 p-4 rounded-xl text-xs font-medium space-y-2">
                <p className="font-bold">⚠️ Warning / Confirmation Required</p>
                <p>
                  You are resolving the collection log for Key Tag:{" "}
                  <strong className="font-mono">{selectedLog.keyTag}</strong>.
                </p>
                <p>
                  Confirming this resolution means a new replacement key has
                  been issued. Once resolved, the mobile app will be blocked
                  from updating this log.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">
                    Collecting Staff ID:
                  </span>
                  <span className="text-slate-900 font-mono font-bold">
                    {selectedLog.collectingStaffId}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">
                    Staff Name:
                  </span>
                  <span className="text-slate-900 font-bold">
                    {selectedLog.collectingStaffName || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs pb-2">
                  <span className="text-slate-500 font-semibold">
                    Collected Time:
                  </span>
                  <span className="text-slate-900 font-medium">
                    {new Date(selectedLog.collectedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleResolveKey(selectedLog.app_log_id)}
                disabled={actionLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {actionLoading ? "Resolving..." : "Confirm & Resolve Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
