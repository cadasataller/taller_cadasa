import type { SeguimientoTracker } from "./tracker.types";

export type TrackerEquipmentType =
  | "tractor"
  | "vehicle"
  | "truck"
  | "fuel_truck"
  | "forklift"
  | "machinery"
  | "unknown";

export type TrackerEquipmentResolver = (
  tracker: Pick<SeguimientoTracker, "sourceId" | "label">,
) => TrackerEquipmentType;

// Este registro es el único acoplamiento actual con source_id. Cuando exista una
// columna o una regla por nombre, se puede reemplazar el resolver sin tocar el mapa.
const equipmentBySourceId: Readonly<Record<number, TrackerEquipmentType>> = {
  10303553: "tractor",
  10319800: "fuel_truck",
};

export const resolveTrackerEquipment: TrackerEquipmentResolver = (tracker) =>
  equipmentBySourceId[tracker.sourceId] ?? "machinery";
