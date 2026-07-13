"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Car } from "lucide-react";
import AdminFilters, { FilterState } from "@/components/AdminFilters";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";

type MovementData = {
  id: string;
  _id?: string;
  type: string;
  timeIn: string;
  timeOut?: string;
  plate_number?: string;
  name?: string;
  department?: string;
  deviceName?: string;
  staffName?: string; // fallback if mapped
};

export default function StaffParkingPage() {
  const { can } = usePortalPermissions();
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

    fetch(`/api/movements/staff-parking?${queryParams}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMovements(data);
      })
      .catch((err) =>
        console.error("Failed to fetch historical staff parking movements", err),
      );

    const eventSource = new EventSource(`/api/movements/staff-parking/stream?${queryParams}`);

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
    window.location.href = "/api/export?type=staff-parking";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Staff Parking
            </h1>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                connectionStatus === "connected"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : connectionStatus === "connecting"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-blue-500 animate-pulse"
                    : connectionStatus === "connecting"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              ></span>
              {connectionStatus}
            </div>
          </div>
          <p className="text-slate-500 mt-1">
            Real-time live feed of staff parking entries and exits
          </p>
        </div>

        {can(PP.VIEW_STAFF_PARKING) && (
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
        availableFilters={["search", "date", "name", "department", "licensePlate", "status"]}
        statusOptions={[
          { label: "Inside (Active)", value: "active" },
          { label: "Out (Completed)", value: "completed" },
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
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Fetching Network Data...
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              Applying constraints and downloading historical staff parking archives seamlessly...
            </p>
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center h-full">
            <div className="bg-slate-100 p-5 rounded-full mb-4 text-slate-400 relative">
              <Car
                size={48}
                className={
                  connectionStatus === "connected"
                    ? "animate-pulse text-blue-500"
                    : ""
                }
              />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              Waiting for events...
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md">
              The live stream is active. Staff parking logs will appear
              here automatically as they are recorded at the gate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    License Plate
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Exit Time
                  </th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                    Device
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((movement, index) => (
                  <tr
                    key={movement.id || index}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {movement.name || "Unknown Staff"}
                    </td>
                    <td className="px-6 py-4">
                      {movement.plate_number ? (
                        <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded border border-slate-200 uppercase font-semibold">
                          {movement.plate_number}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {movement.department || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {movement.timeOut ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Inside
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4">
                      {movement.timeOut ? (
                        <>
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
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {movement.deviceName || "—"}
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
