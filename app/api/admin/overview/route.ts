import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { buildDashboardOverview } from "@/lib/dashboard/overviewData";
import type { AdminRole } from "@/lib/enums";

/**
 * Single-call dashboard metrics for the selected UTC calendar day.
 * Each block is populated only if the user has the matching view permission.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  try {
    const overview = await buildDashboardOverview({
      date,
      location: session.user.location,
      permissions: session.user.permissions ?? [],
      role: session.user.role as AdminRole,
    });
    return NextResponse.json(overview);
  } catch (err) {
    console.error("Dashboard overview error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard overview" },
      { status: 500 },
    );
  }
}
