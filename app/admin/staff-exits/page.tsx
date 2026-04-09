"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Download } from "lucide-react";
import AdminFilters, { FilterState } from "@/components/AdminFilters";

interface IStaffExit {
  shift_id: string;
  staffId: string;
  staffName: string;
  department: string;
  clockIn: string;
  location?: string;
  timeOut: string;
  timeIn?: string;
  reason?: string;
  app_log_id: string;
}

export default function StaffExitsPage() {
  const [exits, setExits] = useState<IStaffExit[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    startDate: "",
    endDate: "",
    name: "",
    department: "",
    licensePlate: "",
    staffId: "",
    status: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchExits = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/movements/staff-exits", window.location.origin);
      url.searchParams.set("limit", "50");

      Object.entries(filters).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.data) {
        setExits(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch Exits:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExits();
    // Auto-refresh every 15 seconds to keep up-to-date
    const interval = setInterval(fetchExits, 15000);
    return () => clearInterval(interval);
  }, [fetchExits]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff Gate Passes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aggregated log of all staff gate passes during active shifts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = "/api/export?type=staff-exits";
            }}
            className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download size={18} /> Export history
          </button>
          <button
            onClick={fetchExits}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <RefreshCw
              className={isLoading ? "w-4 h-4 animate-spin" : "w-4 h-4"}
            />
            <span className="text-sm font-semibold">Refresh</span>
          </button>
        </div>
      </div>

      <AdminFilters
        filters={filters}
        setFilters={setFilters}
        availableFilters={[
          "search",
          "date",
          "name",
          "department",
          "staffId",
          "status",
        ]}
        statusOptions={[
          { label: "Currently Out", value: "active" },
          { label: "Returned", value: "completed" },
        ]}
        onApply={fetchExits}
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-medium">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Time Out</th>
                <th className="px-6 py-4">Time In</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100"></div>
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                      </div>
                      <p className="text-slate-500 font-medium tracking-wide">
                        Fetching gate passes...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : exits.length > 0 ? (
                exits.map((exit) => (
                  <tr
                    key={exit.app_log_id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {exit.staffName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {exit.staffId} • {exit.department}
                      </p>
                    </td>
                    <td className="px-6 py-4">{exit.location || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded inline-block">
                        {new Date(exit.timeOut).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {exit.timeIn ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded inline-block">
                          {new Date(exit.timeIn).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {exit.reason ? (
                        exit.reason
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          !exit.timeIn
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {!exit.timeIn ? "Currently Out" : "Returned"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No outbound activities found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
