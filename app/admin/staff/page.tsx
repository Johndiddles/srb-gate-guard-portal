"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import QRCode from "react-qr-code";
import { Plus, Upload, Filter, Search, X, QrCode, Edit, Trash2 } from "lucide-react";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";
import {
  staffRecordFormSchema,
  staffRecordFormDefaults,
  staffImportFormSchema,
  type StaffRecordFormValues,
  type StaffImportFormValues,
} from "@/lib/schemas/portalForms";

interface StaffData {
  _id: string;
  firstName: string;
  lastName: string;
  staffId: string;
  department: string;
  rank: string;
  status: string;
  createdBy?: { name: string };
  lastUpdatedBy?: { name: string };
  updatedAt?: string;
}

const commonInputClass = "bg-white text-slate-900 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70";

export default function StaffManagementPage() {
  const { can } = usePortalPermissions();
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [qrCodeStaff, setQrCodeStaff] = useState<StaffData | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const staffForm = useForm<StaffRecordFormValues>({
    resolver: zodResolver(staffRecordFormSchema),
    defaultValues: staffRecordFormDefaults,
  });

  const importForm = useForm<StaffImportFormValues>({
    resolver: zodResolver(staffImportFormSchema),
    defaultValues: { file: undefined },
  });

  const [filters, setFilters] = useState({
    name: "", staffId: "", department: "", status: ""
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append("name", filters.name);
      if (filters.staffId) query.append("staffId", filters.staffId);
      if (filters.department) query.append("department", filters.department);
      if (filters.status) query.append("status", filters.status);

      const res = await fetch(`/api/staff?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (error) {
      console.error("Failed to fetch staff", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const onStaffSubmit = async (values: StaffRecordFormValues) => {
    try {
      const url = isEditMode && editingStaffId ? `/api/staff/${editingStaffId}` : "/api/staff";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        staffForm.reset(staffRecordFormDefaults);
        setIsEditMode(false);
        setEditingStaffId(null);
        fetchStaff();
      } else {
        const err = await res.json();
        staffForm.setError("root", {
          message: err.error || "Failed to save staff",
        });
      }
    } catch {
      staffForm.setError("root", { message: "Failed to save staff" });
    }
  };

  const handleEditClick = (s: StaffData) => {
    staffForm.reset({
      firstName: s.firstName,
      lastName: s.lastName,
      staffId: s.staffId || "",
      department: s.department,
      rank: s.rank || "Regular",
      status: s.status || "Active",
    });
    setEditingStaffId(s._id);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchStaff();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to delete staff"}`);
      }
    } catch {
      alert("Failed to delete staff");
    }
  };

  const onImportSubmit = async (data: StaffImportFormValues) => {
    const file = data.file![0]!;
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/staff/import", {
        method: "POST",
        body,
      });
      if (res.ok) {
        setIsImportModalOpen(false);
        importForm.reset({ file: undefined });
        fetchStaff();
        alert("Import successful");
      } else {
        const err = await res.json();
        importForm.setError("root", {
          message: err.error || "Failed to import staff",
        });
      }
    } catch {
      importForm.setError("root", { message: "Failed to import file" });
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingStaffId(null);
    staffForm.reset(staffRecordFormDefaults);
    setIsAddModalOpen(true);
  };

  const openImportModal = () => {
    importForm.reset({ file: undefined });
    setIsImportModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 mt-1">Manage staff directory and access credentials</p>
        </div>
        <div className="flex space-x-3">
          {can(PP.CREATE_STAFF) && (
            <button
              type="button"
              onClick={openImportModal}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors border border-slate-200 shadow-sm"
            >
              <Upload size={18} />
              <span>Import</span>
            </button>
          )}
          {can(PP.CREATE_STAFF) && (
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-emerald-200"
            >
              <Plus size={18} />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <Filter size={18} />
          <span>Filters:</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Name..."
            className={`${commonInputClass} pl-9 text-sm w-48`}
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>

        <input
          type="text"
          placeholder="Staff ID"
          className={`${commonInputClass} text-sm w-36`}
          value={filters.staffId}
          onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
        />

        <select
          className={`${commonInputClass} text-sm cursor-pointer w-44`}
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {[
            "Front Desk", "Account", "Transport", "Butler", "Kitchen",
            "Food and Beverage", "Security", "Human Resource",
            "House Keeping", "Tours", "Island Routes", "Water Plant",
            "Water Sports", "Engineering", "Maintenance", "Other"
          ].map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          className={`${commonInputClass} text-sm cursor-pointer`}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center text-slate-400">Loading staff data...</div>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No staff members found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Staff Identity</th>
                  <th className="px-6 py-4 font-semibold">ID Code</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Rank</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Added by {s.createdBy?.name || 'System'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {s.staffId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {s.department}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {s.rank}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                          s.status === 'Inactive' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 
                          'bg-red-100 text-red-800 border border-red-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{s.lastUpdatedBy?.name || s.createdBy?.name || 'System'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {can(PP.VIEW_STAFF) && (
                        <button
                          type="button"
                          onClick={() => setQrCodeStaff(s)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                          title="View QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                      )}
                      {can(PP.UPDATE_STAFF) && (
                        <button
                          type="button"
                          onClick={() => handleEditClick(s)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                          title="Edit Staff"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {can(PP.DELETE_STAFF) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(s._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                          title="Delete Staff"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen &&
        (isEditMode ? can(PP.UPDATE_STAFF) : can(PP.CREATE_STAFF)) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{isEditMode ? "Edit Staff Details" : "Add New Staff"}</h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={staffForm.handleSubmit(onStaffSubmit)}
              className="p-6 space-y-4 text-sm"
              noValidate
            >
              {staffForm.formState.errors.root && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {staffForm.formState.errors.root.message}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                  <input
                    className={`${commonInputClass} w-full`}
                    placeholder="First Name"
                    aria-invalid={!!staffForm.formState.errors.firstName}
                    {...staffForm.register("firstName")}
                  />
                  {staffForm.formState.errors.firstName && (
                    <p className="text-red-600 text-xs">{staffForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                  <input
                    className={`${commonInputClass} w-full`}
                    placeholder="Last Name"
                    aria-invalid={!!staffForm.formState.errors.lastName}
                    {...staffForm.register("lastName")}
                  />
                  {staffForm.formState.errors.lastName && (
                    <p className="text-red-600 text-xs">{staffForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Staff ID Code <span className="text-slate-400 text-xs font-normal ml-1">(Optional)</span></label>
                <input
                  className={`${commonInputClass} w-full font-mono`}
                  placeholder="Leave blank to auto-generate"
                  {...staffForm.register("staffId")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Department <span className="text-red-500">*</span></label>
                <select
                  className={`${commonInputClass} w-full cursor-pointer`}
                  aria-invalid={!!staffForm.formState.errors.department}
                  {...staffForm.register("department")}
                >
                  <option value="" disabled>Select a department</option>
                  {[
                    "Front Desk", "Account", "Transport", "Butler", "Kitchen",
                    "Food and Beverage", "Security", "Human Resource",
                    "House Keeping", "Tours", "Island Routes", "Water Plant",
                    "Water Sports", "Engineering", "Maintenance", "Other"
                  ].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {staffForm.formState.errors.department && (
                  <p className="text-red-600 text-xs">{staffForm.formState.errors.department.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Rank/Position</label>
                <select className={`${commonInputClass} w-full`} {...staffForm.register("rank")}>
                  <option value="Regular">Regular</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Manager">Manager</option>
                  <option value="Executive">Executive</option>
                  <option value="Director">Director</option>
                  <option value="Other">Other</option>
                </select>
                {staffForm.formState.errors.rank && (
                  <p className="text-red-600 text-xs">{staffForm.formState.errors.rank.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Access Status</label>
                <select className={`${commonInputClass} w-full`} {...staffForm.register("status")}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
                {staffForm.formState.errors.status && (
                  <p className="text-red-600 text-xs">{staffForm.formState.errors.status.message}</p>
                )}
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={staffForm.formState.isSubmitting} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-emerald-200 disabled:opacity-70">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && can(PP.CREATE_STAFF) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Import Staff Roster</h2>
              <button type="button" onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={importForm.handleSubmit(onImportSubmit)}
              className="p-6 space-y-4"
              noValidate
            >
              <p className="text-sm text-slate-500 leading-relaxed">
                Upload a CSV or XLSX file containing exactly the following headers: <br/>
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs select-all">firstName</code>,
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs select-all ml-1">lastName</code>,
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs select-all ml-1">staffId</code> <span className="text-xs text-slate-400">(optional)</span>,
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs select-all ml-1">department</code>,
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs select-all ml-1">rank</code> <span className="text-xs text-slate-400">(optional)</span>,
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs select-all ml-1">status</code>.
              </p>

              {importForm.formState.errors.root && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {importForm.formState.errors.root.message}
                </div>
              )}

              <div className="relative mt-2 cursor-pointer group">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100 cursor-pointer
                "
                  aria-invalid={!!importForm.formState.errors.file}
                  {...importForm.register("file")}
                />
                {importForm.formState.errors.file && (
                  <p className="text-red-600 text-sm mt-1">{importForm.formState.errors.file.message}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={importForm.formState.isSubmitting} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-emerald-200 disabled:opacity-70">Upload Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrCodeStaff && can(PP.VIEW_STAFF) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-700">
              <button type="button" onClick={() => setQrCodeStaff(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors backdrop-blur-md">
                <X size={20} />
              </button>
            </div>
            <div className="px-8 pb-8 pt-0 flex flex-col items-center text-center -mt-16 relative z-10">
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 mb-6 flex-shrink-0">
                <QRCode
                  value={JSON.stringify({
                    staffId: qrCodeStaff.staffId,
                    firstName: qrCodeStaff.firstName,
                    lastName: qrCodeStaff.lastName,
                    department: qrCodeStaff.department,
                    rank: qrCodeStaff.rank
                  })}
                  size={160}
                  fgColor="#0f172a"
                  level="Q"
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{qrCodeStaff.firstName} {qrCodeStaff.lastName}</h3>
              <p className="text-slate-500 font-medium mt-1">{qrCodeStaff.department}</p>

              <div className="mt-6 w-full bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Identifier</span>
                <span className="font-mono font-bold text-slate-700">{qrCodeStaff.staffId}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
