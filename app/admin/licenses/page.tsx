"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PlusCircle,
  Key,
  RefreshCw,
  Trash2,
  Eye,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { LICENSE_PERMISSION_OPTIONS } from "@/lib/licensePermissions";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";
import {
  licenseCreateFormSchema,
  type LicenseCreateFormValues,
} from "@/lib/schemas/portalForms";

export enum LicenseStatus {
  UNUSED = "UNUSED",
  USED = "USED",
}

type LicenseData = {
  id: string;
  key: string;
  device_name?: string;
  status: LicenseStatus;
  permissions: string[];
  createdAt: string;
};

function permissionLabel(value: string) {
  return (
    LICENSE_PERMISSION_OPTIONS.find((o) => o.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export default function LicensesPage() {
  const { can } = usePortalPermissions();
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseData | null>(
    null,
  );

  const [newlyCreatedLicense, setNewlyCreatedLicense] =
    useState<LicenseData | null>(null);
  const [success, setSuccess] = useState("");
  const [listActionError, setListActionError] = useState("");

  const licenseDefaults: LicenseCreateFormValues = {
    device_name: "",
    permissions: [],
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LicenseCreateFormValues>({
    resolver: zodResolver(licenseCreateFormSchema),
    defaultValues: licenseDefaults,
  });

  const selectedPerms = watch("permissions") ?? [];

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/licenses");
      if (res.ok) {
        const data = await res.json();
        setLicenses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const onCreateLicense = async (values: LicenseCreateFormValues) => {
    setSuccess("");
    setListActionError("");
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: values.permissions,
          device_name: values.device_name,
        }),
      });

      if (!res.ok) {
        setError("root", { message: "Failed to create license" });
        return;
      }

      const data = await res.json();
      setSuccess("License created successfully!");
      setNewlyCreatedLicense(data.license);
      setShowForm(false);
      reset(licenseDefaults);
      fetchLicenses();
    } catch {
      setError("root", { message: "Failed to create license" });
    }
  };

  const handleRegenerate = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to regenerate this license key? The old key will stop working.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" }),
      });
      if (res.ok) {
        setListActionError("");
        const data = await res.json();
        setSuccess("License regenerated successfully!");
        setNewlyCreatedLicense(data.license);
        fetchLicenses();
      } else {
        const errData = await res.json();
        setListActionError(errData.error || "Failed to regenerate license");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this license? This action cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("License deleted successfully!");
        if (selectedLicense?.id === id) setSelectedLicense(null);
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (perm: string) => {
    const next = selectedPerms.includes(perm)
      ? selectedPerms.filter((p) => p !== perm)
      : [...selectedPerms, perm];
    setValue("permissions", next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            App Licenses
          </h1>
          <p className="text-slate-500 mt-1">
            Manage mobile application access keys and permissions
          </p>
        </div>
        {can(PP.CREATE_LICENSE) && (
          <button
            type="button"
            onClick={() => {
              if (showForm) reset(licenseDefaults);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            {showForm ? (
              "Cancel"
            ) : (
              <>
                <PlusCircle size={18} /> Generate License
              </>
            )}
          </button>
        )}
      </div>

      {listActionError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
          {listActionError}
        </div>
      )}

      {showForm && can(PP.CREATE_LICENSE) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Key size={20} className="text-emerald-500" />
            Generate New License Key
          </h2>

          {errors.root && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {errors.root.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onCreateLicense)}
            className="space-y-0"
            noValidate
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Device Name
              </label>
              <input
                type="text"
                placeholder="e.g. Front Gate Tablet 1"
                className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                aria-invalid={!!errors.device_name}
                {...register("device_name")}
              />
              {errors.device_name && (
                <p className="text-red-600 text-sm mt-1" role="alert">
                  {errors.device_name.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Application Permissions
              </label>
              {errors.permissions && (
                <p className="text-red-600 text-sm mb-2" role="alert">
                  {errors.permissions.message}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {LICENSE_PERMISSION_OPTIONS.map(({ value, label }) => (
                  <div
                    key={value}
                    onClick={() => togglePermission(value)}
                    className={`cursor-pointer border rounded-lg p-3 flex items-start gap-3 transition-all ${
                      selectedPerms.includes(value)
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 rounded-full p-0.5 ${selectedPerms.includes(value) ? "bg-emerald-500 text-white" : "border border-slate-300 text-transparent"}`}
                    >
                      <ShieldCheck
                        size={14}
                        className={
                          selectedPerms.includes(value)
                            ? "opacity-100"
                            : "opacity-0"
                        }
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Generating..." : "Generate Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {success && !showForm && !newlyCreatedLicense && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 border border-emerald-200 flex items-center gap-2">
          <ShieldCheck size={18} /> {success}
        </div>
      )}

      {newlyCreatedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 w-full max-w-lg mb-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Key size={24} className="text-emerald-500" />
              License Successfully Generated
            </h2>
            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm mb-6 border border-amber-200">
              <p className="font-semibold mb-1">
                Important: Save this key now!
              </p>
              <p>
                For security, you will not be able to view the full license key
                again once you close this window.
              </p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                Bound Device
              </p>
              <p className="text-slate-900 font-semibold">
                {newlyCreatedLicense.device_name}
              </p>
            </div>

            <div className="mb-8">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                Full License Key
              </p>
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 font-mono text-center text-lg break-all text-slate-800 shadow-inner select-all">
                {newlyCreatedLicense.key}
              </div>
            </div>

            <button
              onClick={() => setNewlyCreatedLicense(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              I have saved the key, close this window
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Licenses List */}
        <div
          className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${selectedLicense ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Generated Licenses</h3>
            <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
              {licenses.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 size={32} className="text-emerald-500 animate-spin" />
              </div>
            ) : licenses.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No licenses found. Generate one above.
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">License Key</th>
                    <th className="px-5 py-3 font-medium">Device</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenses.map((license) => (
                    <tr
                      key={license.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedLicense?.id === license.id ? "bg-emerald-50/50" : ""}`}
                      onClick={() => setSelectedLicense(license)}
                    >
                      <td className="px-5 py-3">
                        <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-800 border border-slate-200">
                          {license.key.slice(0, 4)}••••{license.key.slice(-4)}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-slate-700 font-medium">
                        {license.device_name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        {license.status === LicenseStatus.USED ? (
                          <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-medium">
                            Used
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-medium">
                            Unused
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(license.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right space-x-2">
                        {can(PP.UPDATE_LICENSE) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerate(license.id);
                            }}
                            title="Regenerate Key"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {can(PP.DELETE_LICENSE) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(license.id);
                            }}
                            title="Delete License"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* License Details Panel */}
        {selectedLicense && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-right-4 duration-300 h-fit lg:col-span-1">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Eye size={20} className="text-emerald-500" />
                License Details
              </h3>
              <button
                onClick={() => setSelectedLicense(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                  Status
                </p>
                {selectedLicense.status === LicenseStatus.USED ? (
                  <div className="flex items-center gap-2 text-amber-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Currently In-Use
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Available for Activation
                  </div>
                )}
              </div>

              {selectedLicense.status === LicenseStatus.USED
                ? selectedLicense.device_name && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                        Activated Device
                      </p>
                      <p className="text-slate-900 font-medium">
                        {selectedLicense.device_name}
                      </p>
                    </div>
                  )
                : selectedLicense.device_name && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                        Bound Device
                      </p>
                      <p className="text-slate-900 font-medium">
                        {selectedLicense.device_name}
                      </p>
                    </div>
                  )}

              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                  Created At
                </p>
                <p className="text-slate-900">
                  {new Date(selectedLicense.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                  Assigned Permissions
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedLicense.permissions.map((p) => (
                    <span
                      key={p}
                      className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium"
                    >
                      {permissionLabel(p)}
                    </span>
                  ))}
                  {selectedLicense.permissions.length === 0 && (
                    <span className="text-slate-400 text-sm italic">
                      No permissions assigned.
                    </span>
                  )}
                </div>
              </div>

              {(can(PP.UPDATE_LICENSE) || can(PP.DELETE_LICENSE)) && (
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  {can(PP.UPDATE_LICENSE) && (
                    <button
                      onClick={() => handleRegenerate(selectedLicense.id)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  )}
                  {can(PP.DELETE_LICENSE) && (
                    <button
                      onClick={() => handleDelete(selectedLicense.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider pt-2 border-t border-slate-100 mt-4">
                Full License Key Is Hidden
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
