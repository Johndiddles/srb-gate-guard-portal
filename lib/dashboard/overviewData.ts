import type { PipelineStage } from "mongoose";
import dbConnect from "@/lib/db/mongodb";
import { MovementModel } from "@/lib/db/models/Movement";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";
import { MovementType, AdminRole } from "@/lib/enums";
import { PP } from "@/lib/portalPermissionMatrix";

export type HourBucket = { hour: number; count: number };

export type MovementHourlyBlock = {
  totalToday: number;
  byHour: HourBucket[];
};

export type StaffParkingBlock = {
  /** Movement records logged today (entries/updates). */
  movementsToday: number;
  /** Vehicles currently in staff parking (open visit, no checkout time). */
  currentlyParked: number;
  byHour: HourBucket[];
};

export type StaffShiftBlock = {
  shiftsStartedToday: number;
  clockInByHour: HourBucket[];
};

export type StaffGatePassBlock = {
  /** Staff exit events (gate pass outs) recorded today. */
  exitEventsToday: number;
  exitsByHour: HourBucket[];
};

export interface DashboardOverviewInput {
  /** YYYY-MM-DD or null for current UTC day */
  date: string | null;
  location?: string;
  permissions: string[];
  role: AdminRole;
}

export interface DashboardOverviewResponse {
  date: string;
  bucketTimezone: "UTC";
  guestMovements: MovementHourlyBlock | null;
  staffParking: StaffParkingBlock | null;
  vehicularMovements: MovementHourlyBlock | null;
  staffShifts: StaffShiftBlock | null;
  staffGatePasses: StaffGatePassBlock | null;
}

function parseUtcDay(dateStr: string | null | undefined): {
  start: Date;
  end: Date;
  label: string;
} {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
  let y: number;
  let m: number;
  let d: number;
  if (dateStr && iso.test(dateStr)) {
    const [, ys, ms, ds] = dateStr.match(iso)!;
    y = Number(ys);
    m = Number(ms);
    d = Number(ds);
  } else {
    const now = new Date();
    y = now.getUTCFullYear();
    m = now.getUTCMonth() + 1;
    d = now.getUTCDate();
  }
  const label = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return { start, end, label };
}

function fillHours(groups: { _id: number; count: number }[]): HourBucket[] {
  const map = new Map<number, number>();
  for (const g of groups) {
    if (typeof g._id === "number" && g._id >= 0 && g._id < 24) {
      map.set(g._id, g.count);
    }
  }
  const out: HourBucket[] = [];
  for (let h = 0; h < 24; h++) {
    out.push({ hour: h, count: map.get(h) ?? 0 });
  }
  return out;
}

function locationMatch(location: string | undefined): Record<string, unknown> {
  if (!location) return {};
  return { location };
}

async function aggregateMovementsByHour(
  type: MovementType,
  start: Date,
  end: Date,
  location: string | undefined,
): Promise<{ total: number; byHour: HourBucket[] }> {
  await dbConnect();
  const match: Record<string, unknown> = {
    type,
    timestamp: { $gte: start, $lte: end },
    ...locationMatch(location),
  };
  const [total, grouped] = await Promise.all([
    MovementModel.countDocuments(match),
    MovementModel.aggregate<{ _id: number; count: number }>([
      { $match: match },
      { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  return { total, byHour: fillHours(grouped.map((g) => ({ _id: g._id, count: g.count }))) };
}

export async function buildDashboardOverview(
  input: DashboardOverviewInput,
): Promise<DashboardOverviewResponse> {
  const { start, end, label } = parseUtcDay(input.date);
  const location =
    input.role === AdminRole.SUPER_ADMIN ? undefined : input.location;

  const p = new Set(input.permissions);

  const guestOk = p.has(PP.VIEW_GUEST_MOVEMENT);
  const parkingOk = p.has(PP.VIEW_STAFF_PARKING);
  const vehOk = p.has(PP.VIEW_VEHICULAR_MOVEMENT);
  const shiftOk = p.has(PP.VIEW_STAFF_MOVEMENT);
  const gateOk = p.has(PP.VIEW_STAFF_GATE_PASS);

  const tasks: Promise<void>[] = [];
  let guestMovements: MovementHourlyBlock | null = null;
  let staffParking: StaffParkingBlock | null = null;
  let vehicularMovements: MovementHourlyBlock | null = null;
  let staffShifts: StaffShiftBlock | null = null;
  let staffGatePasses: StaffGatePassBlock | null = null;

  if (guestOk) {
    tasks.push(
      (async () => {
        const { total, byHour } = await aggregateMovementsByHour(
          MovementType.GUEST,
          start,
          end,
          location,
        );
        guestMovements = { totalToday: total, byHour };
      })(),
    );
  }

  if (parkingOk) {
    tasks.push(
      (async () => {
        await dbConnect();
        const base = { type: MovementType.STAFF_PARKING, ...locationMatch(location) };
        const dayMatch = {
          ...base,
          timestamp: { $gte: start, $lte: end },
        };
        const [movementsToday, currentlyParked, grouped] = await Promise.all([
          MovementModel.countDocuments(dayMatch),
          MovementModel.countDocuments({
            ...base,
            $or: [{ timeOut: { $exists: false } }, { timeOut: null }],
          }),
          MovementModel.aggregate<{ _id: number; count: number }>([
            { $match: dayMatch },
            { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]),
        ]);
        staffParking = {
          movementsToday,
          currentlyParked,
          byHour: fillHours(
            grouped.map((g) => ({ _id: g._id, count: g.count })),
          ),
        };
      })(),
    );
  }

  if (vehOk) {
    tasks.push(
      (async () => {
        const { total, byHour } = await aggregateMovementsByHour(
          MovementType.VEHICULAR,
          start,
          end,
          location,
        );
        vehicularMovements = { totalToday: total, byHour };
      })(),
    );
  }

  if (shiftOk) {
    tasks.push(
      (async () => {
        await dbConnect();
        const match: Record<string, unknown> = {
          clockIn: { $gte: start, $lte: end },
          ...locationMatch(location),
        };
        const [shiftsStartedToday, grouped] = await Promise.all([
          StaffShiftModel.countDocuments(match),
          StaffShiftModel.aggregate<{ _id: number; count: number }>([
            { $match: match },
            { $group: { _id: { $hour: "$clockIn" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]),
        ]);
        staffShifts = {
          shiftsStartedToday,
          clockInByHour: fillHours(
            grouped.map((g) => ({ _id: g._id, count: g.count })),
          ),
        };
      })(),
    );
  }

  if (gateOk) {
    tasks.push(
      (async () => {
        await dbConnect();
        const initial: Record<string, unknown> = { ...locationMatch(location) };
        const pipeline: PipelineStage[] = [];
        if (Object.keys(initial).length) {
          pipeline.push({ $match: initial });
        }
        pipeline.push(
          { $unwind: "$exits" },
          {
            $match: {
              "exits.timeOut": { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: { $hour: "$exits.timeOut" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        );
        const countPipeline: PipelineStage[] = [];
        if (Object.keys(initial).length) {
          countPipeline.push({ $match: initial });
        }
        countPipeline.push(
          { $unwind: "$exits" },
          {
            $match: {
              "exits.timeOut": { $gte: start, $lte: end },
            },
          },
          { $count: "n" },
        );
        const [exitEventsToday, grouped] = await Promise.all([
          StaffShiftModel.aggregate<{ n: number }>(countPipeline).then(
            (r) => r[0]?.n ?? 0,
          ),
          StaffShiftModel.aggregate<{ _id: number; count: number }>(pipeline),
        ]);
        staffGatePasses = {
          exitEventsToday,
          exitsByHour: fillHours(
            grouped.map((g) => ({ _id: g._id, count: g.count })),
          ),
        };
      })(),
    );
  }

  await Promise.all(tasks);

  return {
    date: label,
    bucketTimezone: "UTC",
    guestMovements,
    staffParking,
    vehicularMovements,
    staffShifts,
    staffGatePasses,
  };
}
