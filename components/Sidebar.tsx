"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PP } from "@/lib/portalPermissionMatrix";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = () => signOut({ callbackUrl: "/" });

  const navLinks: {
    name: string;
    href: string;
    /** Minimum portal permission to show the link (matches route `view:*` gate). */
    permission: string | null;
  }[] = [
    { name: "Dashboard", href: "/admin", permission: null },
    { name: "Users", href: "/admin/users", permission: PP.VIEW_USER },
    { name: "Licenses", href: "/admin/licenses", permission: PP.VIEW_LICENSE },
    {
      name: "Guest List",
      href: "/admin/guests",
      permission: PP.VIEW_GUEST_LIST,
    },
    {
      name: "Guest Movements",
      href: "/admin/guests/movements",
      permission: PP.VIEW_GUEST_MOVEMENT,
    },
    {
      name: "Vehicular Movements",
      href: "/admin/vehicles/movements",
      permission: PP.VIEW_VEHICULAR_MOVEMENT,
    },
    {
      name: "Staff Management",
      href: "/admin/staff",
      permission: PP.VIEW_STAFF,
    },
    {
      name: "Staff Parking",
      href: "/admin/staff-parking",
      permission: PP.VIEW_STAFF_PARKING,
    },
    {
      name: "Staff Movement",
      href: "/admin/staff-movement",
      permission: PP.VIEW_STAFF_MOVEMENT,
    },
    {
      name: "Staff Gate Passes",
      href: "/admin/staff-exits",
      permission: PP.VIEW_STAFF_GATE_PASS,
    },
  ];

  const perms = session?.user?.permissions ?? [];

  const filteredLinks = navLinks.filter((link) => {
    if (link.permission === null) return true;
    return perms.includes(link.permission);
  });

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-hidden bg-slate-900 pt-6 text-slate-300">
      <div className="shrink-0 px-6 pb-6">
        <h1 className="text-xl font-bold text-white mb-1">SRB Gate Guard</h1>
        <p className="text-xs text-slate-400">
          Logged in as {session?.user?.name}
        </p>
        <p className="text-xs font-semibold text-emerald-400 mt-1">
          {session?.user?.role}
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 space-y-1">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`block px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
