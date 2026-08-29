import { supabaseRastreoTareas } from "@/lib/supabase";

export type MapsCredentialSlot = "primary" | "secondary";

export interface MapsKeyPayload {
  errokey?: boolean;
}

export interface MapsKeyResponse {
  apiKey: string;
  userId?: string;
}

interface MapsKeyInvocationResult {
  data: MapsKeyResponse | null;
  error: unknown;
}

const keys = new Map<MapsCredentialSlot, string>();
const requests = new Map<MapsCredentialSlot, Promise<string>>();

export const mapsCredentialsService = {
  async getKey(slot: MapsCredentialSlot): Promise<string> {
    const cached = keys.get(slot);
    if (cached) return cached;

    const pending = requests.get(slot);
    if (pending) return pending;

    const payload: MapsKeyPayload = { errokey: slot === "secondary" };
    const request = supabaseRastreoTareas.functions
      .invoke<MapsKeyResponse>("maps-key", {
        body: payload,
      })
      .then(({ data, error }: MapsKeyInvocationResult) => {
        if (error) throw error;
        const key = data?.apiKey;
        if (!key)
          throw new Error(
            "El servicio de credenciales de mapa no devolvió una clave.",
          );
        keys.set(slot, key);
        return key;
      })
      .finally(() => {
        requests.delete(slot);
      });

    requests.set(slot, request);
    return request;
  },

  clear(): void {
    keys.clear();
    requests.clear();
  },
};
