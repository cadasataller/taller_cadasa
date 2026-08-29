import { mapsCredentialsService, type MapsCredentialSlot } from './mapsCredentials.service';

export type MapsProviderStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface MapsProviderState {
  status: MapsProviderStatus;
  credential: MapsCredentialSlot | null;
  error: Error | null;
}

const GOOGLE_MAPS_SCRIPT_ID = 'seguimiento-google-maps';
let activeLoad: Promise<void> | null = null;
let state: MapsProviderState = { status: 'idle', credential: null, error: null };

const isGoogleMapsReady = (): boolean => Boolean((window as typeof window & { google?: { maps?: unknown } }).google?.maps);

const removeProviderScript = (): void => document.getElementById(GOOGLE_MAPS_SCRIPT_ID)?.remove();

const loadWith = async (credential: MapsCredentialSlot): Promise<void> => {
  if (isGoogleMapsReady()) return;
  const key = await mapsCredentialsService.getKey(credential);

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps.'));
    document.head.append(script);
  });

  if (!isGoogleMapsReady()) throw new Error('Google Maps no quedó disponible tras la carga.');
};

export const mapsProviderLoader = {
  getState: (): MapsProviderState => state,

  async load(): Promise<void> {
    if (isGoogleMapsReady()) {
      state = { status: 'ready', credential: state.credential, error: null };
      return;
    }
    if (activeLoad) return activeLoad;

    state = { status: 'loading', credential: 'primary', error: null };
    activeLoad = loadWith('primary').catch(async () => {
      removeProviderScript();
      state = { status: 'loading', credential: 'secondary', error: null };
      await loadWith('secondary');
    }).then(() => {
      state = { status: 'ready', credential: state.credential, error: null };
    }).catch((error: unknown) => {
      const normalized = error instanceof Error ? error : new Error('No se pudo inicializar el mapa.');
      state = { status: 'error', credential: state.credential, error: normalized };
      throw normalized;
    }).finally(() => {
      activeLoad = null;
    });

    return activeLoad;
  },

  reset(): void {
    removeProviderScript();
    activeLoad = null;
    state = { status: 'idle', credential: null, error: null };
  },
};
