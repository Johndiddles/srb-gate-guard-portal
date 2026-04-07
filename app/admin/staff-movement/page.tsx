"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Info, X, Download } from "lucide-react";
import AdminFilters, { FilterState } from "@/components/AdminFilters";

interface IExit {
  timeOut: string;
  timeIn?: string;
  reason?: string;
  app_log_id: string;
}

interface IStaffShift {
  _id: string;
  staffId: string;
  staffName: string;
  department: string;
  clockIn: string;
  clockOut?: string;
  status: "active" | "completed";
  exits: IExit[];
}

export default function StaffMovementPage() {
  const [shifts, setShifts] = useState<IStaffShift[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "", startDate: "", endDate: "", name: "", department: "", licensePlate: "", staffId: "", status: ""
  });
  const [selectedShift, setSelectedShift] = useState<IStaffShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const establishStream = useCallback(() => {
    setTimeout(() => {
      setIsLoading(true);
      setShifts([]);
    }, 0);

    let url = "/api/movements/staff-shifts/stream?";
    Object.entries(filters).forEach(([key, value]) => {
      if (value) url += `&${key}=${encodeURIComponent(value)}`;
    });

    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setShifts(parsedData);
        setIsLoading(false);
      } catch (e) {
        console.error("Error parsing shifts stream", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };

    return eventSource;
  }, [filters]);

  useEffect(() => {
    const eventSource = establishStream();
    return () => {
      eventSource.close();
    };
  }, [establishStream]);  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Movement</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time tracking of staff clock-ins, clock-outs, and authorized exits.
          </p>
        </div>
        <button
          onClick={() => { window.location.href = "/api/export?type=staff-movement"; }}
          className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download size={18} /> Export history
        </button>
      </div>
      <AdminFilters
        filters={filters}
        setFilters={setFilters}
        availableFilters={["search", "date", "name", "department", "staffId", "status"]}
        statusOptions={[
          { label: "On Duty", value: "active" },
          { label: "Clocked Out", value: "completed" },
        ]}
        onApply={() => {
          // SSE stream automatically rebuilds due to dependency on `filters` 
        }}
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-medium">
              <tr>
                <th className="px-6 py-4">Staff Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Clock In</th>
                <th className="px-6 py-4">Clock Out</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.length > 0 ? (
                shifts.map((shift) => (
                  <tr
                    key={shift._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {shift.staffName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {shift.staffId} • {shift.department}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          shift.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {shift.status === "active" ? "On Duty" : "Shift Ended"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(shift.clockIn).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {shift.clockOut
                        ? new Date(shift.clockOut).toLocaleString()
                        : "---"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedShift(shift)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors inline-flex items-center gap-2"
                        title="View Detailed Logs"
                      >
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-semibold">Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-4 border-slate-100"></div>
                          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                        </div>
                        <p className="text-slate-500 font-medium tracking-wide">Fetching staff shifts...</p>
                      </div>
                    ) : (
                      "No staff shifts found matching your search."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Detailed Exits */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Shift Details: {selectedShift.staffName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedShift.department} • {selectedShift.staffId}
                </p>
              </div>
              <button
                onClick={() => setSelectedShift(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Clocked In
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedShift.clockIn).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Clocked Out
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedShift.clockOut
                      ? new Date(selectedShift.clockOut).toLocaleString()
                      : "Shift Active"}
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                Authorized Exits ({selectedShift.exits.length})
              </h4>

              {selectedShift.exits.length > 0 ? (
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {selectedShift.exits.map((exit, idx) => (
                    <div
                      key={exit.app_log_id || idx}
                      className="p-4 border border-slate-200 rounded-lg flex items-start gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                            OUT: {new Date(exit.timeOut).toLocaleTimeString()}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {exit.timeIn
                              ? "IN: " + new Date(exit.timeIn).toLocaleTimeString()
                              : "Currently Out"}
                          </span>
                        </div>
                        {exit.reason && (
                          <p className="text-sm text-slate-600 mt-2">
                            <span className="font-semibold text-slate-900">
                              Reason:
                            </span>{" "}
                            {exit.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic text-center py-6">
                  No intermediate exits recorded during this shift.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
