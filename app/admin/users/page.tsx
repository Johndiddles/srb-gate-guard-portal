"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminRole, ResortLocation } from "@/lib/enums";
import { PlusCircle, Shield, User, Loader2 } from "lucide-react";
import { usePortalPermissions } from "@/hooks/usePortalPermissions";
import { PP } from "@/lib/portalPermissionMatrix";
import {
  adminUserFormSchema,
  type AdminUserFormValues,
} from "@/lib/schemas/portalForms";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  location?: string;
  requires_password_change: boolean;
  createdAt: string;
};

const defaultUserForm: AdminUserFormValues = {
  name: "",
  email: "",
  role: AdminRole.FRONT_DESK,
  location: ResortLocation.BAHAMAS,
  password: "",
};

export default function UsersPage() {
  const { can } = usePortalPermissions();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserFormSchema),
    defaultValues: defaultUserForm,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onCreateUser = async (values: AdminUserFormValues) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        setError("root", {
          message: data.error || "Failed to create user",
        });
        return;
      }

      setSuccess("User created successfully!");
      setShowForm(false);
      reset(defaultUserForm);
      fetchUsers();
    } catch {
      setError("root", { message: "Failed to create user" });
    }
  };

  const roleColors: Record<AdminRole, string> = {
    [AdminRole.SUPER_ADMIN]: "bg-red-100 text-red-700 border-red-200",
    [AdminRole.RESORT_SECURITY]: "bg-amber-100 text-amber-700 border-amber-200",
    [AdminRole.FRONT_DESK]: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Admin Users
          </h1>
          <p className="text-slate-500 mt-1">Manage portal access and roles</p>
        </div>
        {can(PP.CREATE_USER) && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) reset(defaultUserForm);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            {showForm ? (
              "Cancel"
            ) : (
              <>
                <PlusCircle size={18} /> Add User
              </>
            )}
          </button>
        )}
      </div>

      {showForm && can(PP.CREATE_USER) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-emerald-500" />
            Create New Admin User
          </h2>

          {errors.root && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {errors.root.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onCreateUser)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            noValidate
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                aria-invalid={!!errors.role}
                {...register("role")}
              >
                <option value={AdminRole.FRONT_DESK}>Front Desk</option>
                <option value={AdminRole.RESORT_SECURITY}>
                  Resort Security
                </option>
                <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
              </select>
              {errors.role && (
                <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <select
                className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                aria-invalid={!!errors.location}
                {...register("location")}
              >
                {Object.values(ResortLocation).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Initial Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                User will be forced to change this on first login.
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {success && !showForm && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 border border-emerald-200 flex items-center gap-2">
          <Shield size={18} /> {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 size={32} className="text-emerald-500 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Location</th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                        <User size={16} />
                      </div>
                      <span className="font-medium text-slate-900">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}
                    >
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {user.location || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {user.requires_password_change ? (
                      <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-200">
                        Pending Setup
                      </span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
