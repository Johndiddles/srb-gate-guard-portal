"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticate = () => {
      if (status === "unauthenticated") {
        router.push("/");
      } else if (status === "authenticated") {
        if (session?.user?.requires_password_change) {
          router.push("/change-password");
        } else {
          setLoading(false);
        }
      }
    };
    authenticate();
  }, [status, session, router]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
      <p className="text-slate-600 mb-8">
        Welcome back, {session?.user?.name}. Here is an overview of the SRB
        Cloud Portal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Users & Roles
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Manage admin accounts and their backend permissions.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            App Licenses
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Generate and manage unique license keys for the SRB mobile app.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Live Movements
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Monitor real-time guest and vehicular movements dynamically.
          </p>
        </div>
      </div>
    </div>
  );
}
