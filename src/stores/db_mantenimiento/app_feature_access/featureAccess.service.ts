import { supabase } from "@/lib/supabase";
import type { ObtenerFuncionalidadesPermitidasResponse } from "./featureAccess.types";

const normalizarFuncionalidadesPermitidas = (
  data: unknown,
): ObtenerFuncionalidadesPermitidasResponse => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((item): item is string => typeof item === "string");
};

export const featureAccessService = {
  async obtenerFuncionalidadesPermitidas(): Promise<ObtenerFuncionalidadesPermitidasResponse> {
    const { data, error } = await supabase.rpc(
      "obtener_funcionalidades_permitidas",
    );

    if (error) {
      throw new Error(
        error.message ||
          "No se pudieron obtener las funcionalidades permitidas",
      );
    }

    return normalizarFuncionalidadesPermitidas(data);
  },
};
