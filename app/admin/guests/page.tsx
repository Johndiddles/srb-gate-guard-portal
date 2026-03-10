"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  Calendar,
  FileType,
  FilterX,
  X,
  Eye,
} from "lucide-react";

type GuestEntryData = {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  status: string;
  arrivalDate: string;
  notes?: string;
};

type GuestListData = {
  id: string;
  list_date: string;
  uploader_name: string;
  uploaded_at: string;
  guests: GuestEntryData[];
};

export default function GuestsPage() {
  const [lists, setLists] = useState<GuestListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedList, setSelectedList] = useState<GuestListData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/guests/lists`);
      if (res.ok) {
        let data: GuestListData[] = await res.json();

        // Apply frontend filtering
        if (startDate || endDate) {
          data = data.filter((list) => {
            const lDate = new Date(list.list_date).getTime();
            const sDate = startDate ? new Date(startDate).getTime() : -Infinity;
            const eDate = endDate ? new Date(endDate).getTime() : Infinity;
            return lDate >= sDate && lDate <= eDate;
          });
        }

        setLists(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
      setError("Please select a valid .xlsx or .csv file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("override", "false");

    try {
      let res = await fetch("/api/admin/guests/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 409) {
        const confirmOverride = window.confirm(
          "WARNING: A guest list has already been uploaded today. Proceeding will override the existing records for the day. Do you want to continue?",
        );
        if (!confirmOverride) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          setUploading(false);
          return;
        }

        formData.set("override", "true");
        res = await fetch("/api/admin/guests/upload", {
          method: "POST",
          body: formData,
        });
      }

      if (!res.ok) {
        throw new Error("Failed to process file upload.");
      }

      const data = await res.json();
      setSuccess(`Successfully uploaded list with ${data.count} guests.`);
      fetchLists();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    window.location.href = "/api/export?type=guests";
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Guest Uploads
          </h1>
          <p className="text-slate-500 mt-1">
            Manage daily uploads of expected and in-house guests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            {uploading ? "Uploading..." : "Upload File"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download size={18} /> Export Latest
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 border border-emerald-200">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white text-slate-900 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white text-slate-900 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium pb-2"
            >
              <FilterX size={16} /> Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-16">
              <Loader2 size={32} className="text-emerald-500 animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-400">
                <FileSpreadsheet size={48} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                No Uploads Found
              </h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Upload a guest list spreadsheet to see the history here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">List Date</th>
                  <th className="px-6 py-3 font-semibold">Uploaded At</th>
                  <th className="px-6 py-3 font-semibold">Uploader</th>
                  <th className="px-6 py-3 font-semibold">Participant Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lists.map((list) => (
                  <tr
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      {new Date(list.list_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(list.uploaded_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {list.uploader_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full font-medium text-sm text-slate-700 w-fit">
                        <Eye size={14} /> {list.guests.length} Guests
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && lists.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium">
            Showing {lists.length} record(s). Click any row to view full
            details.
          </div>
        )}
      </div>

      {/* Guest List Detail Modal */}
      {selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Guest List Details
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Uploaded on{" "}
                  {new Date(selectedList.uploaded_at).toLocaleString()} by{" "}
                  {selectedList.uploader_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedList(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 bg-slate-50">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Room No.</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Arrival Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedList.guests.map((g, idx) => (
                      <tr
                        key={g.id || idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {g.firstName} {g.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {g.roomNumber}
                        </td>
                        <td className="px-4 py-3">
                          {g.status === "in-house" ? (
                            <span className="flex w-fit items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px] font-medium border border-blue-200">
                              <FileType size={12} /> In-House
                            </span>
                          ) : g.status === "arrival" ? (
                            <span className="flex w-fit items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] font-medium border border-amber-200">
                              <Calendar size={12} /> Arrival
                            </span>
                          ) : (
                            <span className="flex w-fit items-center gap-1.5 text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-300">
                              <Upload size={12} /> Checked Out
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {g.arrivalDate || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setSelectedList(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
