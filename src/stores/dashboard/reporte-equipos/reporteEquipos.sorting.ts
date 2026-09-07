import type {
  EquipmentListItem,
  EquipmentSortMode,
} from "./reporteEquipos.types";

export const DEFAULT_EQUIPMENT_SORT_MODE: EquipmentSortMode = "mostHours";

const equipmentNumberCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

export function sortEquipmentList(
  equipment: readonly EquipmentListItem[],
  sortMode: EquipmentSortMode,
): EquipmentListItem[] {
  return [...equipment].sort((first, second) => {
    if (sortMode === "mostHours") {
      const timeDifference =
        (second.totalSeconds ?? 0) - (first.totalSeconds ?? 0);
      if (timeDifference !== 0) return timeDifference;
    }

    return equipmentNumberCollator.compare(first.code, second.code);
  });
}
