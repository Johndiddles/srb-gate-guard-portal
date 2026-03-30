"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Activity, ArrowRight, ArrowLeft } from "lucide-react";
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
    <div className="p-8 max-w-6xl mx-auto">
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
            <Download size={18} /> Export History
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
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
          <div className="divide-y divide-slate-100">
            {movements.map((movement, index) => (
              <div
                key={movement.id || index}
                className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      movement.timeIn
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {movement.timeIn ? (
                      <ArrowRight size={24} />
                    ) : (
                      <ArrowLeft size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 text-lg">
                        {movement.guest_name || "Unknown Guest"}
                      </h4>
                      {movement.room_number && (
                        <span className="text-sm font-medium text-slate-500">
                          (Rm {movement.room_number})
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                          movement.timeIn
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {movement.timeIn ? "Returned" : "Out"}
                      </span>
                    </div>
                    {movement.reason && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        To: {movement.reason}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {movement.mode && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          Mode: {movement.mode}
                        </p>
                      )}
                      {movement.plate_number && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          - {movement.plate_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    Out:{" "}
                    {new Date(movement.timeOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {movement.timeIn && (
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      In:{" "}
                      {new Date(movement.timeIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(movement.timeOut).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
