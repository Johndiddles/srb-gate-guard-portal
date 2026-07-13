"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Activity } from "lucide-react";
import AdminFilters, { FilterState } from "@/components/AdminFilters";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";

type MovementData = {
  id: string;
  _id?: string;
  type: string;
  timeOut: string;
  timeIn?: string;
  guest_name?: string;
  room_number?: string;
  reason?: string;
  mode?: string;
  plate_number?: string;
};

export default function GuestMovementsPage() {
  const { canAny } = usePortalPermissions();
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [filters, setFilters] = useState<FilterState>({
    search: "", startDate: "", endDate: "", name: "", department: "", licensePlate: "", staffId: "", status: ""
  });

  const establishStream = useCallback(() => {
    let queryParams = "";
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams += `&${key}=${encodeURIComponent(value)}`;
    });

    setTimeout(() => {
      setMovements([]);
      setConnectionStatus("connecting");
    }, 0);

    fetch(`/api/movements/guests?${queryParams}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMovements(data);
      })
      .catch((err) =>
        console.error("Failed to fetch historical guest movements", err),
      );

    const eventSource = new EventSource(`/api/movements/guests/stream?${queryParams}`);

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const newMovement = JSON.parse(event.data);
        setMovements((prev) => {
          if (prev.some((m) => m.id === newMovement.id || m._id === newMovement._id)) {
            return prev;
          }
          return [newMovement, ...prev];
        });
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus("disconnected");
    };

    return eventSource;
  }, [filters]);

  useEffect(() => {
    const eventSource = establishStream();
    return () => {
      eventSource.close();
    };
  }, [establishStream]);

  const handleExport = () => {
    window.location.href = "/api/export?type=movements";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Guest Movements
            </h1>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                connectionStatus === "connected"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : connectionStatus === "connecting"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : connectionStatus === "connecting"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              ></span>
              {connectionStatus}
            </div>
          </div>
          <p className="text-slate-500 mt-1">
            Real-time live feed of guest entries and exits
          </p>
        </div>

        {canAny([PP.VIEW_GUEST_MOVEMENT, PP.VIEW_VEHICULAR_MOVEMENT]) && (
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download size={18} /> Export history
          </button>
        )}
      </div>

      <AdminFilters
        filters={filters}
        setFilters={setFilters}
        availableFilters={["search", "date", "name", "licensePlate", "status"]}
        statusOptions={[
          { label: "Out (Active)", value: "active" },
          { label: "Returned (Completed)", value: "completed" },
        ]}
        onApply={() => {
          // Hooks auto-restart stream
        }}
      />

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
        {connectionStatus === "connecting" && movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center h-full">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100"></div>
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Fetching Network Data...
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              Applying constraints and downloading historical guest movement archives seamlessly...
            </p>
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center h-full">
            <div className="bg-slate-100 p-5 rounded-full mb-4 text-slate-400 relative">
              <Activity
                size={48}
                className={
                  connectionStatus === "connected"
                    ? "animate-pulse text-emerald-500"
                    : ""
                }
              />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              Waiting for events...
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md">
              The live stream is active. Guest movement logs will appear here
              automatically as they happen at the resort.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Guest Identity
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Destination / Reason
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Time In / Returned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((movement, index) => (
                  <tr
                    key={movement.id || index}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {movement.guest_name || "Unknown Guest"}
                      </div>
                      {movement.room_number && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Rm {movement.room_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {movement.timeIn ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Out
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {movement.reason || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col gap-1">
                        {movement.mode && (
                          <div className="text-sm font-medium text-slate-700">
                            {movement.mode}
                          </div>
                        )}
                        {movement.plate_number ? (
                          <div>
                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">
                              {movement.plate_number}
                            </span>
                          </div>
                        ) : (
                          !movement.mode && <span>—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">
                        {new Date(movement.timeOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(movement.timeOut).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {movement.timeIn ? (
                        <>
                          <div className="text-slate-800 font-medium">
                            {new Date(movement.timeIn).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(movement.timeIn).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
