"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search, Filter } from "lucide-react";

export interface FilterState {
  search: string;
  startDate: string;
  endDate: string;
  name: string;
  department: string;
  licensePlate: string;
  staffId: string;
  status: string;
}

export type FilterField =
  | "search"
  | "date"
  | "name"
  | "department"
  | "licensePlate"
  | "staffId"
  | "status";

interface AdminFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableFilters: FilterField[];
  statusOptions?: { label: string; value: string }[];
  onApply: () => void;
}

const inputClassName =
  "w-full bg-white text-slate-900 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400";

export default function AdminFilters({
  filters,
  setFilters,
  availableFilters,
  statusOptions = [],
  onApply,
}: AdminFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Keep local state somewhat synced if parent enforces a hard switch remotely
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setFilters(localFilters);
    setTimeout(onApply, 50); // Ensure React flushes 'filters' state to parent before parent fetch hook/onApply runs
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      startDate: "",
      endDate: "",
      name: "",
      department: "",
      licensePlate: "",
      staffId: "",
      status: "",
    };
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
    setTimeout(onApply, 50);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Always visible Primary Search */}
        {availableFilters.includes("search") && (
          <div className="relative flex-1 min-w-[250px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Quick Search (Combined Fields)..."
              value={localFilters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              className={`${inputClassName} pl-9`}
            />
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Filter size={16} />
          {isExpanded ? "Hide Advanced Filters" : "Advanced Filters"}
        </button>

        <button
          onClick={handleApply}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          Apply Filters
        </button>

        <button
          onClick={clearFilters}
          className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
        >
          Clear
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
          {availableFilters.includes("date") && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Start Date
                </label>
                <DatePicker
                  selected={localFilters.startDate ? new Date(localFilters.startDate) : null}
                  onChange={(date: Date | null) =>
                    updateFilter("startDate", date ? date.toISOString() : "")
                  }
                  className={inputClassName}
                  placeholderText="Select Start Date"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  End Date
                </label>
                <DatePicker
                  selected={localFilters.endDate ? new Date(localFilters.endDate) : null}
                  onChange={(date: Date | null) =>
                    updateFilter("endDate", date ? date.toISOString() : "")
                  }
                  className={inputClassName}
                  placeholderText="Select End Date"
                  isClearable
                />
              </div>
            </>
          )}

          {availableFilters.includes("name") && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Exact Name
              </label>
              <input
                type="text"
                placeholder="Name..."
                value={localFilters.name}
                onChange={(e) => updateFilter("name", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className={inputClassName}
              />
            </div>
          )}

          {availableFilters.includes("department") && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Department
              </label>
              <input
                type="text"
                placeholder="Department..."
                value={localFilters.department}
                onChange={(e) => updateFilter("department", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className={inputClassName}
              />
            </div>
          )}

          {availableFilters.includes("staffId") && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Staff ID
              </label>
              <input
                type="text"
                placeholder="Staff ID..."
                value={localFilters.staffId}
                onChange={(e) => updateFilter("staffId", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className={inputClassName}
              />
            </div>
          )}

          {availableFilters.includes("licensePlate") && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                License Plate
              </label>
              <input
                type="text"
                placeholder="License Plate..."
                value={localFilters.licensePlate}
                onChange={(e) => updateFilter("licensePlate", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className={inputClassName}
              />
            </div>
          )}

          {availableFilters.includes("status") && statusOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Status
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => {
                  setLocalFilters((prev) => ({ ...prev, status: e.target.value }));
                  // Handle Apply automatically for select boxes to maintain nice UX?
                  // No, obey exactly the prompt!
                }}
                className={inputClassName}
              >
                <option value="">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
