import { defineStore } from "pinia";
import { ref } from "vue";
import { omsgAssignmentComplianceService } from "./omsgAssignmentCompliance.service";
import type { OmsgAssignmentComplianceItem } from "./omsgAssignmentCompliance.types";

const getCacheKey = (email: string, fecha: string): string =>
  `${email.trim().toLowerCase()}_${fecha}`;

export const useOmsgAssignmentComplianceStore = defineStore(
  "omsgAssignmentCompliance",
  () => {
    const cache = ref<Record<string, OmsgAssignmentComplianceItem[]>>({});

    const fetchCompliance = async (
      email: string,
      fecha: string,
      force = false,
    ): Promise<OmsgAssignmentComplianceItem[]> => {
      if (!email || !fecha) return [];

      const cacheKey = getCacheKey(email, fecha);
      const cachedItems = cache.value[cacheKey];

      if (cachedItems && !force) return cachedItems;

      const items = await omsgAssignmentComplianceService.fetch({
        fecha,
        email,
      });
      cache.value[cacheKey] = items;

      return items;
    };

    return {
      cache,
      fetchCompliance,
    };
  },
);
