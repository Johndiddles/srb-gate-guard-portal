"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Activity,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

type MovementData = {
  id: string;
  type: string;
  direction: "IN" | "OUT";
  guest_name?: string;
  reason?: string;
  timestamp: string;
};

export default function GuestMovementsPage() {
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  useEffect(() => {
    const eventSource = new EventSource("/api/movements/guests/stream");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const newMovement = JSON.parse(event.data);
        setMovements((prev) => [newMovement, ...prev]);
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus("disconnected");
      // EventSource automatically tries to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, []);

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

        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download size={18} /> Export History
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {movements.length === 0 ? (
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
                      movement.direction === "IN"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {movement.direction === "IN" ? (
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
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                          movement.direction === "IN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {movement.direction === "IN" ? "Entry" : "Exit"}
                      </span>
                    </div>
                    {movement.reason && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        Note: {movement.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(movement.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(movement.timestamp).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
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
